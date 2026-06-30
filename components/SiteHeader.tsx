"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Stardrop
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/create"
            className={`hidden rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:inline-flex ${
              pathname === "/create" ? "bg-cream-deep text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            Create a gift
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
