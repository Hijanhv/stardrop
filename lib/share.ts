/** Helpers for the shareable claim link `/<balanceId>?m=<encoded message>`. */

function toBase64Url(str: string): string {
  const b64 = typeof window === "undefined"
    ? Buffer.from(str, "utf-8").toString("base64")
    : window.btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): string {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = typeof window === "undefined"
    ? Buffer.from(b64, "base64").toString("utf-8")
    : decodeURIComponent(escape(window.atob(b64)));
  return decoded;
}

export function encodeMessage(message: string): string {
  return toBase64Url(message);
}

export function decodeMessage(param: string | null | undefined): string {
  if (!param) return "";
  try {
    return fromBase64Url(param);
  } catch {
    return "";
  }
}

/** Builds the absolute claim URL for a balance id (and optional message). */
export function buildClaimUrl(balanceId: string, message?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = `${origin}/${balanceId}`;
  if (message && message.trim().length > 0) {
    return `${base}?m=${encodeMessage(message.trim())}`;
  }
  return base;
}
