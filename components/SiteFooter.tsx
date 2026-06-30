export function SiteFooter() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
        <p>
          Built on <span className="text-ink-soft">Stellar Testnet</span> with Claimable Balances.
        </p>
        <p className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
          No custody. No keys held. Just a link.
        </p>
      </div>
    </footer>
  );
}
