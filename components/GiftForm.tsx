"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import { useAccountSummary } from "@/lib/useAccountSummary";
import { FriendbotButton } from "@/components/FriendbotButton";
import { TxResult } from "@/components/TxResult";
import { QrLink } from "@/components/QrLink";
import { CopyButton } from "@/components/CopyButton";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/Logo";
import {
  buildCreateGiftTx,
  isValidAddress,
  parseStellarError,
  shortAddr,
  submitSignedXdr,
  formatXlm,
} from "@/lib/stellar";
import { saveSentGift } from "@/lib/sentGifts";
import { buildClaimUrl } from "@/lib/share";

type SuccessState = {
  hash: string;
  balanceId: string;
  url: string;
  amount: string;
  recipient: string;
  message: string;
};

const QUICK_AMOUNTS = ["5", "10", "25"];

export function GiftForm() {
  const { address, ready, connecting, connect, sign } = useWallet();
  const { summary, refresh } = useAccountSummary(address);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [reclaimable, setReclaimable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const available = summary?.available ?? 0;

  const recipientError = useMemo(() => {
    if (!recipient) return null;
    if (!isValidAddress(recipient)) return "That doesn't look like a Stellar address (starts with G).";
    if (address && recipient === address) return "That's your own address — pick a different recipient.";
    return null;
  }, [recipient, address]);

  const amountError = useMemo(() => {
    if (!amount) return null;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "Enter an amount greater than 0.";
    if (summary?.funded && n > available)
      return `That's more than your ~${formatXlm(available, 2)} XLM available after reserves.`;
    return null;
  }, [amount, available, summary]);

  const canSubmit =
    !!recipient &&
    !!amount &&
    !recipientError &&
    !amountError &&
    !submitting &&
    !connecting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      await connect();
      return;
    }
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const { xdr, balanceId } = await buildCreateGiftTx({
        sender: address,
        recipient,
        amount,
        reclaimable,
      });
      const signedXdr = await sign(xdr);
      const { hash } = await submitSignedXdr(signedXdr);

      const url = buildClaimUrl(balanceId, message);
      saveSentGift(address, {
        balanceId,
        recipient,
        amount,
        message: message.trim() || undefined,
        txHash: hash,
        reclaimable,
        createdAt: Date.now(),
      });

      setSuccess({ hash, balanceId, url, amount, recipient, message: message.trim() });
      toast.success("Stardrop created!");
      void refresh();
    } catch (err) {
      toast.error(parseStellarError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <CreatedCard success={success} onReset={() => resetForm()} />;
  }

  function resetForm() {
    setSuccess(null);
    setRecipient("");
    setAmount("");
    setMessage("");
    setReclaimable(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      {/* Recipient */}
      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Recipient address</span>
        <input
          className={`input mt-2 font-mono text-sm ${recipientError ? "input-error" : ""}`}
          placeholder="G…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          spellCheck={false}
          autoComplete="off"
        />
        {recipientError && <span className="mt-1.5 block text-sm text-danger">{recipientError}</span>}
      </label>

      {/* Amount */}
      <label className="mt-5 block">
        <span className="text-sm font-medium text-ink-soft">Amount (XLM)</span>
        <input
          className={`input mt-2 ${amountError ? "input-error" : ""}`}
          placeholder="0.00"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(q)}
              className="rounded-full border border-line-strong px-3 py-1 text-sm text-ink-soft transition-colors hover:bg-cream"
            >
              {q} XLM
            </button>
          ))}
          {summary?.funded && (
            <span className="ml-auto text-xs text-muted">
              ~{formatXlm(available, 2)} XLM available
            </span>
          )}
        </div>
        {amountError && <span className="mt-1.5 block text-sm text-danger">{amountError}</span>}
      </label>

      {/* Message */}
      <label className="mt-5 block">
        <span className="text-sm font-medium text-ink-soft">
          Message <span className="text-muted">(optional)</span>
        </span>
        <textarea
          className="input mt-2 resize-none"
          rows={2}
          maxLength={140}
          placeholder="Happy birthday! 🎉"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <span className="mt-1 block text-right text-xs text-muted">{message.length}/140</span>
      </label>

      {/* Reclaimable (stretch) */}
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-cream/50 p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-amber"
          checked={reclaimable}
          onChange={(e) => setReclaimable(e.target.checked)}
        />
        <span className="text-sm">
          <span className="font-medium text-ink">Let me reclaim it after 7 days</span>
          <span className="mt-0.5 block text-muted">
            If it&apos;s never claimed, you can take the XLM back. Holds an extra ~0.5 XLM reserve
            until claimed or reclaimed.
          </span>
        </span>
      </label>

      {/* Unfunded helper */}
      {address && summary && !summary.funded && (
        <div className="mt-5 rounded-2xl border border-line bg-cream/70 p-4">
          <p className="text-sm text-ink-soft">
            Your account isn&apos;t funded on testnet yet — you&apos;ll need test XLM to send a gift.
          </p>
          <div className="mt-3">
            <FriendbotButton address={address} onFunded={refresh} />
          </div>
        </div>
      )}

      {/* Submit */}
      <button type="submit" className="btn btn-primary mt-6 w-full text-base" disabled={!ready || (!!address && !canSubmit)}>
        {!address ? (
          connecting ? (
            <>
              <Spinner /> Connecting…
            </>
          ) : (
            "Connect wallet to gift"
          )
        ) : submitting ? (
          <>
            <Spinner /> Sending on testnet…
          </>
        ) : (
          <>
            <GiftIcon /> Gift-wrap {amount ? `${formatXlm(amount)} XLM` : "XLM"}
          </>
        )}
      </button>
      {address && (
        <p className="mt-3 text-center text-xs text-muted">
          Sending from <span className="font-mono">{shortAddr(address)}</span> · Freighter will ask
          you to sign.
        </p>
      )}
    </form>
  );
}

function CreatedCard({ success, onReset }: { success: SuccessState; onReset: () => void }) {
  return (
    <div className="card overflow-hidden float-in">
      <div className="brand-gradient px-6 py-7 text-center text-[#2a1300] sm:px-8">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/30">
          <Logo size={30} />
        </div>
        <p className="text-sm font-medium uppercase tracking-wider opacity-80">Stardrop created</p>
        <p className="font-display text-4xl font-semibold">{formatXlm(success.amount)} XLM</p>
        <p className="mt-1 text-sm opacity-90">
          gift-wrapped for <span className="font-mono">{shortAddr(success.recipient, 5, 5)}</span>
        </p>
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        {success.message && (
          <p className="rounded-2xl border border-line bg-cream/60 p-4 text-center text-ink-soft">
            “{success.message}”
          </p>
        )}

        <div>
          <p className="mb-3 text-center text-sm font-medium text-ink-soft">
            Share this link — they claim it when they&apos;re ready
          </p>
          <QrLink url={success.url} />
        </div>

        <TxResult hash={success.hash} label="Create transaction" />

        <div className="flex flex-col gap-2 sm:flex-row">
          <CopyButton value={success.url} label="Copy claim link" className="flex-1 justify-center" />
          <button type="button" onClick={onReset} className="btn btn-ghost flex-1 justify-center text-sm">
            Create another
          </button>
        </div>
      </div>
    </div>
  );
}

function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7.5h18V11H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 7.5v13M12 7.5S10.5 3 8 4.2 9.5 7.5 12 7.5Zm0 0s1.5-4.5 4-3.3S14.5 7.5 12 7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
