"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fundWithFriendbot, parseStellarError } from "@/lib/stellar";
import { Spinner } from "@/components/ui/Spinner";

export function FriendbotButton({
  address,
  onFunded,
  variant = "primary",
}: {
  address: string;
  onFunded?: () => void;
  variant?: "primary" | "ghost";
}) {
  const [loading, setLoading] = useState(false);

  async function fund() {
    setLoading(true);
    const id = toast.loading("Asking Friendbot for 10,000 test XLM…");
    try {
      await fundWithFriendbot(address);
      toast.success("Funded with test XLM!", { id });
      onFunded?.();
    } catch (err) {
      const msg = parseStellarError(err);
      // "Already funded" isn't really a failure — refresh the balance anyway.
      if (/already funded/i.test(msg)) {
        toast.info(msg, { id });
        onFunded?.();
      } else {
        toast.error(msg, { id });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost"} text-sm`}
      onClick={fund}
      disabled={loading}
    >
      {loading ? (
        <>
          <Spinner /> Funding…
        </>
      ) : (
        <>
          <DropIcon /> Fund with Friendbot
        </>
      )}
    </button>
  );
}

function DropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
