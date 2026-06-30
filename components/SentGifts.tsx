"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/CopyButton";
import { loadSentGifts, type SentGift } from "@/lib/sentGifts";
import { buildClaimUrl } from "@/lib/share";
import {
  buildClaimTx,
  explorerCb,
  explorerTx,
  formatXlm,
  getGiftStatus,
  parseStellarError,
  shortAddr,
  submitSignedXdr,
  type GiftStatus,
} from "@/lib/stellar";

type Status = GiftStatus | "loading" | "unknown";

export function SentGifts() {
  const { address, sign } = useWallet();
  const [gifts, setGifts] = useState<SentGift[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [reclaiming, setReclaiming] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setGifts([]);
      setStatuses({});
      return;
    }
    const list = loadSentGifts(address);
    setGifts(list);
    setHydrated(true);
    setStatuses(Object.fromEntries(list.map((g) => [g.balanceId, "loading" as Status])));

    await Promise.all(
      list.map(async (g) => {
        try {
          const status = await getGiftStatus(g.balanceId);
          setStatuses((prev) => ({ ...prev, [g.balanceId]: status }));
        } catch {
          setStatuses((prev) => ({ ...prev, [g.balanceId]: "unknown" }));
        }
      }),
    );
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function reclaim(g: SentGift) {
    if (!address) return;
    setReclaiming(g.balanceId);
    try {
      const { xdr } = await buildClaimTx(address, g.balanceId);
      const signedXdr = await sign(xdr);
      const { hash } = await submitSignedXdr(signedXdr);
      toast.success(`Reclaimed ${formatXlm(g.amount)} XLM`);
      void hash;
      setStatuses((prev) => ({ ...prev, [g.balanceId]: "claimed" }));
    } catch (err) {
      const msg = parseStellarError(err);
      // The reclaim predicate isn't satisfied until the 7-day window passes.
      toast.error(/op_not_authorized|predicate/i.test(msg) ? "You can only reclaim after 7 days." : msg);
    } finally {
      setReclaiming(null);
    }
  }

  if (!address) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">Gifts you&apos;ve sent</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          Refresh
        </button>
      </div>

      {!hydrated ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : gifts.length === 0 ? (
        <div className="card p-7 text-center text-ink-soft">
          <p>You haven&apos;t sent any Stardrops yet.</p>
          <p className="mt-1 text-sm text-muted">Create one and the link will show up here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {gifts.map((g) => {
            const status = statuses[g.balanceId] ?? "loading";
            return (
              <li key={g.balanceId} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="font-display text-xl font-semibold text-ink">
                        {formatXlm(g.amount)} XLM
                      </span>
                      <StatusBadge status={status} />
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      to <span className="font-mono">{shortAddr(g.recipient, 5, 5)}</span> ·{" "}
                      {timeAgo(g.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {status === "unclaimed" && (
                      <CopyButton value={buildClaimUrl(g.balanceId, g.message)} label="Copy link" />
                    )}
                    <a
                      href={explorerTx(g.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost text-sm"
                    >
                      Create tx
                    </a>
                    <a
                      href={explorerCb(g.balanceId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost text-sm"
                    >
                      Balance
                    </a>
                    {g.reclaimable && status === "unclaimed" && (
                      <button
                        type="button"
                        className="btn btn-ghost text-sm"
                        onClick={() => void reclaim(g)}
                        disabled={reclaiming === g.balanceId}
                      >
                        {reclaiming === g.balanceId ? <Spinner size={14} /> : "Reclaim"}
                      </button>
                    )}
                  </div>
                </div>

                {g.message && (
                  <p className="mt-3 truncate rounded-xl bg-cream/70 px-3 py-2 text-sm text-ink-soft">
                    “{g.message}”
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "loading") {
    return <span className="skeleton inline-block h-5 w-20 rounded-full" aria-hidden="true" />;
  }
  if (status === "claimed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Claimed
      </span>
    );
  }
  if (status === "unclaimed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3e0] px-2.5 py-0.5 text-xs font-medium text-amber">
        <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Unclaimed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-cream-deep px-2.5 py-0.5 text-xs font-medium text-muted">
      Unknown
    </span>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
