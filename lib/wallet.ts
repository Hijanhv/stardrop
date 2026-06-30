/**
 * Stellar Wallets Kit (v2.5.x) wrapper.
 *
 * The kit (v2.5+) exposes a *static* API: `StellarWalletsKit.init(...)`,
 * `.authModal()`, `.signTransaction()`, `.disconnect()`. It also persists the
 * active address + selected module to localStorage itself, so a reload
 * automatically restores the connection.
 *
 * The package is browser-only (web components / preact signals), so we load it
 * with a guarded dynamic import and never touch it during SSR.
 */
import { NETWORK_PASSPHRASE } from "./stellar";

type KitModule = typeof import("@creit.tech/stellar-wallets-kit");

let kitPromise: Promise<KitModule> | null = null;
let initialized = false;

async function loadKit(): Promise<KitModule> {
  if (typeof window === "undefined") {
    throw new Error("The wallet is only available in the browser.");
  }
  if (!kitPromise) {
    kitPromise = import("@creit.tech/stellar-wallets-kit");
  }
  const mod = await kitPromise;
  if (!initialized) {
    // Wallet modules are exposed via dedicated subpath exports, not the root.
    const [freighter, xbull, albedo, lobstr] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/modules/freighter"),
      import("@creit.tech/stellar-wallets-kit/modules/xbull"),
      import("@creit.tech/stellar-wallets-kit/modules/albedo"),
      import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
    ]);
    mod.StellarWalletsKit.init({
      network: mod.Networks.TESTNET,
      modules: [
        new freighter.FreighterModule(),
        new xbull.xBullModule(),
        new albedo.AlbedoModule(),
        new lobstr.LobstrModule(),
      ],
    });
    initialized = true;
  }
  return mod;
}

/** Read the persisted address from the kit's memory (empty string if none). */
export async function restoreAddress(): Promise<string | null> {
  try {
    const { StellarWalletsKit } = await loadKit();
    const { address } = await StellarWalletsKit.getAddress();
    return address && address.length > 0 ? address : null;
  } catch {
    return null;
  }
}

/** Subscribe to address changes (connect / disconnect / wallet switch). */
export async function onAddressChange(cb: (address: string | undefined) => void): Promise<() => void> {
  const { StellarWalletsKit, KitEventType } = await loadKit();
  return StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
    cb(event.payload.address);
  });
}

/** Opens the kit's auth modal; resolves to the connected address. */
export async function connectWallet(): Promise<string> {
  const { StellarWalletsKit } = await loadKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectWallet(): Promise<void> {
  const { StellarWalletsKit } = await loadKit();
  await StellarWalletsKit.disconnect();
}

/** Sign a transaction XDR with the connected wallet; returns the signed XDR. */
export async function signXdr(xdr: string, address: string): Promise<string> {
  const { StellarWalletsKit } = await loadKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });
  return signedTxXdr;
}
