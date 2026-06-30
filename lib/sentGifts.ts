/**
 * Local record of gifts the user has sent.
 *
 * Claimable balances vanish from Horizon once claimed, so we can't reconstruct
 * "things I sent" from chain state alone. We persist a lightweight record per
 * sender address and derive claimed/unclaimed status by probing Horizon.
 */
export type SentGift = {
  balanceId: string;
  recipient: string;
  amount: string;
  message?: string;
  txHash: string;
  reclaimable?: boolean;
  createdAt: number;
};

const keyFor = (address: string) => `stardrop:sent:${address}`;

export function loadSentGifts(address: string): SentGift[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(address));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SentGift[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSentGift(address: string, gift: SentGift): void {
  if (typeof window === "undefined") return;
  const existing = loadSentGifts(address).filter((g) => g.balanceId !== gift.balanceId);
  const next = [gift, ...existing].slice(0, 50);
  window.localStorage.setItem(keyFor(address), JSON.stringify(next));
}
