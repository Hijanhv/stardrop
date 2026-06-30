"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import { useAccountSummary } from "@/lib/useAccountSummary";
import { FriendbotButton } from "@/components/FriendbotButton";
import { TxResult } from "@/components/TxResult";
import { Confetti } from "@/components/Confetti";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Logo } from "@/components/Logo";
import {
  buildClaimTx,
  getGift,
  isClaimant,
  parseStellarError,
  shortAddr,
  submitSignedXdr,
  formatXlm,
  explorerCb,
  type Gift,
} from "@/lib/stellar";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "notfound" }
  | { phase: "ready"; gift: Gift };

export function ClaimCard({ balanceId, message }: { balanceId: string; message?: string }) {
  const { address, ready, connecting, connect, sign } = useWallet();
  const { summary, refresh: refreshAccount } = useAccountSummary(address);

  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [claiming, setClaiming] = useState(false);
  const [claimedHash, setClaimedHash] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Claimable balance ids are 72 hex chars; bail early on obvious junk.
    if (!/^[0-9a-fA-F]{72}$/.test(balanceId)) {
      setState({ phase: "notfound" });
      return;
    }
    setState({ phase: "loading" });
    try {
      const gift = await getGift(balanceId);
      if (!gift) setState({ phase: "notfound" });
      else setState({ phase: "ready", gift });
    } catch (err) {
      setState({ phase: "error", message: parseStellarError(err) });
    }
  }, [balanceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleClaim() {
    if (!address) {
      await connect();
      return;
    }
    setClaiming(true);
    try {
      const { xdr } = await buildClaimTx(address, balanceId);
      const signedXdr = await sign(xdr);
      const { hash } = await submitSignedXdr(signedXdr);
      setClaimedHash(hash);
      toast.success("Claimed! The XLM is in your wallet.");
      void refreshAccount();
    } catch (err) {
      toast.error(parseStellarError(err));
      // Re-check the gift — it may have just been claimed by someone else.
      void load();
    } finally {
      setClaiming(false);
    }
  }

  /* ---- Claimed success ---------------------------------------------------- */
  if (claimedHash && state.phase === "ready") {
    return (
      <>
        <Confetti fire />
        <div className="card overflow-hidden float-in">
          <div className="brand-gradient px-6 py-8 text-center text-[#2a1300] sm:px-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/30">
              <CheckIcon />
            </div>
            <p className="font-display text-4xl font-semibold">
              +{formatXlm(state.gift.amount)} XLM
            </p>
            <p className="mt-1 text-sm opacity-90">landed in your wallet 🎉</p>
          </div>
          <div className="space-y-5 p-6 sm:p-8">
            <TxResult hash={claimedHash} label="Claim transaction" />
            <Link href="/" className="btn btn-primary w-full justify-center">
              View my balance
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* ---- Loading ------------------------------------------------------------ */
  if (state.phase === "loading") {
    return (
      <div className="card p-6 sm:p-8">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto mt-4 h-12 w-40" />
        <Skeleton className="mx-auto mt-3 h-4 w-32" />
        <Skeleton className="mt-8 h-12 w-full rounded-full" />
      </div>
    );
  }

  /* ---- Load error --------------------------------------------------------- */
  if (state.phase === "error") {
    return (
      <div className="card p-6 text-center sm:p-8">
        <p className="text-ink-soft">{state.message}</p>
        <button type="button" onClick={() => void load()} className="btn btn-ghost mt-4">
          Try again
        </button>
      </div>
    );
  }

  /* ---- Not found / already claimed --------------------------------------- */
  if (state.phase === "notfound") {
    return (
      <div className="card p-7 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-deep">
          <Logo size={28} />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Nothing to claim here</h2>
        <p className="mt-2 text-ink-soft">
          This Stardrop has already been claimed, or the link isn&apos;t valid anymore.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <a
            href={explorerCb(balanceId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-sm"
          >
            Check on explorer
          </a>
          <Link href="/create" className="btn btn-primary text-sm">
            Send your own gift
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Ready to claim ----------------------------------------------------- */
  const { gift } = state;
  const recipient = gift.claimants.find((c) => c.destination !== gift.sponsor)?.destination
    ?? gift.claimants[0]?.destination;
  const connectedIsClaimant = address ? isClaimant(gift, address) : true;
  const needsFunding = !!address && summary !== null && !summary.funded;

  return (
    <div className="card overflow-hidden">
      {/* gift-card visual */}
      <div className="relative brand-gradient px-6 py-9 text-center text-[#2a1300] sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fff 0 2px, transparent 3px), radial-gradient(circle at 80% 60%, #fff 0 2px, transparent 3px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
        <p className="relative text-sm font-medium uppercase tracking-wider opacity-80">
          A Stardrop for you
        </p>
        <p className="relative font-display text-5xl font-semibold">{formatXlm(gift.amount)} XLM</p>
        {gift.sponsor && (
          <p className="relative mt-2 text-sm opacity-90">
            from <span className="font-mono">{shortAddr(gift.sponsor, 5, 5)}</span>
          </p>
        )}
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        {message && (
          <p className="rounded-2xl border border-line bg-cream/60 p-4 text-center text-ink-soft">
            “{message}”
          </p>
        )}

        {/* Addressed-to mismatch */}
        {address && !connectedIsClaimant ? (
          <div className="rounded-2xl border border-line bg-cream/60 p-4 text-sm text-ink-soft">
            This gift is addressed to{" "}
            <span className="font-mono text-ink">{shortAddr(recipient, 5, 5)}</span>. Connect that
            wallet to claim it.
          </div>
        ) : needsFunding ? (
          <div className="rounded-2xl border border-line bg-cream/60 p-4">
            <p className="text-sm text-ink-soft">
              Your account needs to exist on testnet before you can claim. Fund it for free first.
            </p>
            <div className="mt-3">
              <FriendbotButton address={address!} onFunded={refreshAccount} />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="btn btn-primary w-full justify-center text-base"
          onClick={() => void handleClaim()}
          disabled={!ready || claiming || (!!address && (!connectedIsClaimant || needsFunding))}
        >
          {!address ? (
            connecting ? (
              <>
                <Spinner /> Connecting…
              </>
            ) : (
              "Connect & claim"
            )
          ) : claiming ? (
            <>
              <Spinner /> Claiming on testnet…
            </>
          ) : (
            `Claim ${formatXlm(gift.amount)} XLM`
          )}
        </button>

        <p className="text-center text-xs text-muted">
          You sign with your own wallet. Stardrop never holds your keys or your XLM.
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
