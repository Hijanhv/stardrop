"use client";

import { explorerTx, shortAddr } from "@/lib/stellar";
import { CopyButton } from "@/components/CopyButton";

/**
 * Surfaces a submitted transaction hash with an explorer link — used on both
 * the create and claim success states.
 */
export function TxResult({ hash, label = "Transaction" }: { hash: string; label?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-cream/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label} hash</p>
      <div className="mt-2 flex items-center gap-2">
        <a
          href={explorerTx(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate font-mono text-sm text-ink underline decoration-amber/60 underline-offset-2 hover:decoration-amber"
          title={hash}
        >
          {shortAddr(hash, 10, 10)}
        </a>
        <CopyButton value={hash} label="Copy" />
        <a
          href={explorerTx(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost text-sm"
        >
          <ExternalIcon /> Explorer
        </a>
      </div>
    </div>
  );
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
