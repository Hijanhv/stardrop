"use client";

import { useWallet } from "@/components/WalletProvider";
import { useAccountSummary } from "@/lib/useAccountSummary";
import { FriendbotButton } from "@/components/FriendbotButton";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatXlm, shortAddr, explorerAccount } from "@/lib/stellar";

export function BalanceCard() {
  const { address } = useWallet();
  const { summary, loading, error, refresh } = useAccountSummary(address);

  if (!address) {
    return (
      <div className="card p-7 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wider text-muted">Your balance</p>
        <p className="mt-3 text-ink-soft">
          Connect your Freighter wallet to see your testnet XLM balance.
        </p>
      </div>
    );
  }

  return (
    <div className="card relative overflow-hidden p-7 sm:p-8">
      {/* luminous accent */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-30 blur-2xl brand-gradient"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-muted">Your balance</p>
          <a
            href={explorerAccount(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex font-mono text-xs text-muted hover:text-ink-soft"
          >
            {shortAddr(address, 6, 6)}
          </a>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-full border border-line-strong p-2 text-ink-soft transition-colors hover:bg-cream"
          aria-label="Refresh balance"
          disabled={loading}
        >
          {loading ? <Spinner size={15} /> : <RefreshIcon />}
        </button>
      </div>

      <div className="mt-5">
        {loading && !summary ? (
          <Skeleton className="h-12 w-48" />
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <p className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
              {summary?.funded ? formatXlm(summary.xlm) : "0"}
            </span>
            <span className="text-lg font-medium text-muted">XLM</span>
          </p>
        )}

        {summary?.funded && (
          <p className="mt-2 text-sm text-muted">
            ~{formatXlm(summary.available, 2)} XLM available after reserves
          </p>
        )}
      </div>

      {summary && !summary.funded && (
        <div className="mt-6 rounded-2xl border border-line bg-cream/70 p-4">
          <p className="text-sm text-ink-soft">
            This account isn&apos;t on testnet yet. Fund it instantly with free test XLM.
          </p>
          <div className="mt-3">
            <FriendbotButton address={address} onFunded={refresh} />
          </div>
        </div>
      )}

      {summary?.funded && Number(summary.xlm) === 0 && (
        <div className="mt-6">
          <FriendbotButton address={address} onFunded={refresh} variant="ghost" />
        </div>
      )}
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 11a8 8 0 1 0-.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M20 5v6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
