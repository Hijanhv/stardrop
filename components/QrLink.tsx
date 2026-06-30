"use client";

import { QRCodeSVG } from "qrcode.react";
import { CopyButton } from "@/components/CopyButton";

export function QrLink({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <QRCodeSVG
          value={url}
          size={184}
          level="M"
          marginSize={0}
          fgColor="#1b1a17"
          bgColor="#ffffff"
        />
      </div>

      <div className="flex w-full items-center gap-2 rounded-xl border border-line-strong bg-cream/60 p-1.5 pl-3.5">
        <span className="flex-1 truncate font-mono text-xs text-ink-soft" title={url}>
          {url}
        </span>
        <CopyButton value={url} label="Copy link" />
      </div>
    </div>
  );
}
