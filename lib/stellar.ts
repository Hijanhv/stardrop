import * as StellarSdk from "@stellar/stellar-sdk";

/* ----------------------------------------------------------------------------
   Network configuration (Stellar Testnet)
---------------------------------------------------------------------------- */
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET; // "Test SDF Network ; September 2015"
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export const FRIENDBOT = (addr: string) => `https://friendbot.stellar.org/?addr=${addr}`;
export const explorerTx = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const explorerCb = (id: string) => `https://stellar.expert/explorer/testnet/claimable-balance/${id}`;
export const explorerAccount = (addr: string) => `https://stellar.expert/explorer/testnet/account/${addr}`;

/** Stellar protocol reserve constants (in XLM). */
export const BASE_RESERVE = 0.5; // per ledger entry
export const ACCOUNT_BASE_RESERVE = 1; // 2 × base reserve for the account itself
export const RECLAIM_WINDOW_SECONDS = "604800"; // 7 days

/* ----------------------------------------------------------------------------
   Small utilities
---------------------------------------------------------------------------- */
export function isValidAddress(addr: string): boolean {
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(addr);
  } catch {
    return false;
  }
}

export function shortAddr(addr?: string | null, lead = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function formatXlm(amount: string | number, dp = 4): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: dp });
}

/* ----------------------------------------------------------------------------
   Account / balance reads
---------------------------------------------------------------------------- */
export type AccountSummary = {
  funded: boolean;
  xlm: string;
  /** Spendable XLM after the account + entry reserves are subtracted. */
  available: number;
  subentryCount: number;
};

function isNotFound(err: unknown): boolean {
  const e = err as { response?: { status?: number }; name?: string };
  return e?.response?.status === 404 || e?.name === "NotFoundError";
}

export async function getAccountSummary(address: string): Promise<AccountSummary> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    const xlm = native?.balance ?? "0";
    const reserved = ACCOUNT_BASE_RESERVE + account.subentry_count * BASE_RESERVE;
    const available = Math.max(0, Number(xlm) - reserved);
    return { funded: true, xlm, available, subentryCount: account.subentry_count };
  } catch (err) {
    if (isNotFound(err)) {
      return { funded: false, xlm: "0", available: 0, subentryCount: 0 };
    }
    throw err;
  }
}

/* ----------------------------------------------------------------------------
   Friendbot (testnet funding)
---------------------------------------------------------------------------- */
export async function fundWithFriendbot(address: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(FRIENDBOT(address));
  } catch {
    throw new Error("Could not reach Friendbot. Check your connection and try again.");
  }
  if (res.ok) return;

  const body = await res.json().catch(() => ({}) as Record<string, unknown>);
  const raw = JSON.stringify(body);
  if (res.status === 400 && /already.*funded|op_already_exists|createAccountAlreadyExist/i.test(raw)) {
    // Not an error worth blocking on — the account already exists.
    throw new Error("This account is already funded on testnet.");
  }
  const detail = (body as { detail?: string; title?: string }).detail ?? (body as { title?: string }).title;
  throw new Error(detail || `Friendbot funding failed (HTTP ${res.status}).`);
}

/* ----------------------------------------------------------------------------
   Create gift — createClaimableBalance (sender signs)
---------------------------------------------------------------------------- */
export type BuildCreateGiftArgs = {
  sender: string;
  recipient: string;
  amount: string;
  /** When true, sender may reclaim the balance after the 7-day window. */
  reclaimable?: boolean;
};

export async function buildCreateGiftTx(
  args: BuildCreateGiftArgs,
): Promise<{ xdr: string; balanceId: string }> {
  const { sender, recipient, amount, reclaimable } = args;
  const account = await server.loadAccount(sender);

  const claimants = [
    new StellarSdk.Claimant(recipient, StellarSdk.Claimant.predicateUnconditional()),
  ];
  if (reclaimable) {
    // Sender can claim only *after* the relative time window elapses.
    claimants.push(
      new StellarSdk.Claimant(
        sender,
        StellarSdk.Claimant.predicateNot(
          StellarSdk.Claimant.predicateBeforeRelativeTime(RECLAIM_WINDOW_SECONDS),
        ),
      ),
    );
  }

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.createClaimableBalance({
        asset: StellarSdk.Asset.native(),
        amount,
        claimants,
      }),
    )
    .setTimeout(180)
    .build();

  // Predict the balance id so we can build the share link before submitting.
  const balanceId = tx.getClaimableBalanceId(0);
  return { xdr: tx.toXDR(), balanceId };
}

/* ----------------------------------------------------------------------------
   Claim gift — claimClaimableBalance (recipient signs)
---------------------------------------------------------------------------- */
export async function buildClaimTx(claimer: string, balanceId: string): Promise<{ xdr: string }> {
  const account = await server.loadAccount(claimer);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.claimClaimableBalance({ balanceId }))
    .setTimeout(180)
    .build();
  return { xdr: tx.toXDR() };
}

/* ----------------------------------------------------------------------------
   Submit a wallet-signed XDR
---------------------------------------------------------------------------- */
export async function submitSignedXdr(signedXdr: string): Promise<{ hash: string }> {
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const res = await server.submitTransaction(tx);
  return { hash: res.hash };
}

/* ----------------------------------------------------------------------------
   Claimable balance reads (via Horizon REST so 404 = claimed/missing)
---------------------------------------------------------------------------- */
export type GiftClaimant = { destination: string; predicate: Record<string, unknown> };
export type Gift = {
  id: string;
  amount: string;
  asset: string;
  sponsor?: string;
  claimants: GiftClaimant[];
};

/** Returns the on-chain gift, or null if it has been claimed / never existed. */
export async function getGift(id: string): Promise<Gift | null> {
  let res: Response;
  try {
    res = await fetch(`${HORIZON_URL}/claimable_balances/${id}`);
  } catch {
    throw new Error("Network error talking to Horizon. Check your connection and try again.");
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Horizon error (HTTP ${res.status}).`);
  const data = (await res.json()) as Gift;
  return data;
}

export type GiftStatus = "unclaimed" | "claimed";

/** A claimable balance disappears from Horizon once it is claimed/reclaimed. */
export async function getGiftStatus(id: string): Promise<GiftStatus> {
  const gift = await getGift(id);
  return gift ? "unclaimed" : "claimed";
}

/** True if `address` appears in the gift's claimant list. */
export function isClaimant(gift: Gift, address: string): boolean {
  return gift.claimants.some((c) => c.destination === address);
}

/* ----------------------------------------------------------------------------
   Friendly error messages — never surface a raw stack to the user
---------------------------------------------------------------------------- */
const RESULT_CODE_MESSAGES: Record<string, string> = {
  tx_insufficient_balance: "Not enough XLM to cover the amount, network fee, and reserves.",
  tx_bad_seq: "Your account sequence was out of date. Please try again.",
  tx_too_late: "The transaction expired before it could be submitted. Please try again.",
  tx_bad_auth: "The signature didn't match this account. Make sure you signed with the right wallet.",
  tx_no_source_account: "This account isn't funded on testnet yet. Fund it with Friendbot first.",
  op_underfunded: "Not enough XLM for this amount plus the network reserve.",
  op_low_reserve: "This would drop you below the network minimum reserve. Try a smaller amount.",
  op_no_destination: "The recipient account doesn't exist on testnet yet.",
  op_does_not_exist: "This gift no longer exists — it may already have been claimed.",
  op_not_authorized: "This wallet isn't allowed to claim this gift.",
  op_line_full: "The recipient can't receive this balance right now.",
};

export function parseStellarError(err: unknown): string {
  if (!err) return "Something went wrong. Please try again.";

  // Horizon submission errors carry result codes in extras.
  const extras = (err as { response?: { data?: { extras?: { result_codes?: Record<string, unknown> } } } })
    ?.response?.data?.extras;
  const codes = extras?.result_codes as
    | { transaction?: string; operations?: string[] }
    | undefined;
  if (codes) {
    const opCodes = Array.isArray(codes.operations) ? codes.operations : [];
    for (const op of opCodes) {
      if (op && op !== "op_success" && RESULT_CODE_MESSAGES[op]) return RESULT_CODE_MESSAGES[op];
    }
    if (codes.transaction && RESULT_CODE_MESSAGES[codes.transaction]) {
      return RESULT_CODE_MESSAGES[codes.transaction];
    }
    const firstOp = opCodes.find((o) => o && o !== "op_success");
    if (firstOp) return `Transaction failed (${firstOp}).`;
    if (codes.transaction) return `Transaction failed (${codes.transaction}).`;
  }

  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 404) return "Account not found on testnet. Fund it with Friendbot first.";

  const msg = (err as { message?: string })?.message ?? String(err);
  if (/reject|denied|declin|cancel|user closed|closed the popup/i.test(msg))
    return "Signature request was rejected.";
  if (/not installed|no wallet|extension not|unavailable|could not connect/i.test(msg))
    return "Wallet not found. Make sure Freighter is installed and set to Testnet.";
  if (/network error|failed to fetch|econn|timeout|networkerror/i.test(msg))
    return "Network error talking to Horizon. Check your connection and try again.";

  return msg.length > 0 && msg.length < 180 ? msg : "Unexpected error. Please try again.";
}
