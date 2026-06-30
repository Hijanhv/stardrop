"use client";

import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { Spinner } from "@/components/ui/Spinner";
import { shortAddr, explorerAccount } from "@/lib/stellar";

export function WalletButton() {
  const { address, ready, connecting, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!ready) {
    return <div className="skeleton h-10 w-36 rounded-full" aria-hidden="true" />;
  }

  if (!address) {
    return (
      <button type="button" className="btn btn-primary" onClick={connect} disabled={connecting}>
        {connecting ? (
          <>
            <Spinner /> Connecting…
          </>
        ) : (
          <>
            <WalletIcon /> Connect wallet
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-ghost text-sm"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
        <span className="font-mono">{shortAddr(address)}</span>
        <ChevronIcon open={menuOpen} />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="card absolute right-0 z-20 mt-2 w-60 overflow-hidden p-1.5 text-sm float-in"
          >
            <a
              role="menuitem"
              href={explorerAccount(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-ink-soft hover:bg-cream"
              onClick={() => setMenuOpen(false)}
            >
              <ExternalIcon /> View on explorer
            </a>
            <button
              role="menuitem"
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-danger hover:bg-danger-soft"
              onClick={() => {
                setMenuOpen(false);
                void disconnect();
              }}
            >
              <PowerIcon /> Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WalletIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="12.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 7a7 7 0 1 0 10 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
