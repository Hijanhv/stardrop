import Link from "next/link";
import { BalanceCard } from "@/components/BalanceCard";
import { SentGifts } from "@/components/SentGifts";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Stellar Testnet · Claimable Balances
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          Gift-wrap XLM into a <span className="brand-text">link</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          Lock a little XLM, share a link, and they claim it when they&apos;re ready. Trustless, no
          IOUs, and nobody ever holds anyone&apos;s keys.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/create" className="btn btn-primary text-base">
            Create a Stardrop
          </Link>
          <a
            href="https://developers.stellar.org/docs/build/guides/transactions/claimable-balances"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-base"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Balance + steps */}
      <div className="mt-12 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <BalanceCard />
        </div>
        <div className="card p-7 sm:p-8 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Three steps</h2>
          <ol className="mt-4 space-y-4">
            {[
              { t: "Connect", d: "Link your Freighter wallet on testnet." },
              { t: "Gift", d: "Lock XLM into a claimable balance and get a link." },
              { t: "They claim", d: "The recipient signs and the XLM lands in their wallet." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full brand-gradient text-sm font-semibold text-[#2a1300]">
                  {i + 1}
                </span>
                <span>
                  <span className="font-medium text-ink">{s.t}</span>
                  <span className="block text-sm text-muted">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Sent gifts */}
      <div className="mt-12">
        <SentGifts />
      </div>
    </div>
  );
}
