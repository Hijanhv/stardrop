"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccountSummary, parseStellarError, type AccountSummary } from "./stellar";

export function useAccountSummary(address: string | null) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setSummary(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSummary(await getAccountSummary(address));
    } catch (err) {
      setError(parseStellarError(err));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
