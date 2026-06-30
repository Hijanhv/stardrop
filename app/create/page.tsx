import Link from "next/link";
import { GiftForm } from "@/components/GiftForm";

export default function CreatePage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
          Create a Stardrop
        </h1>
        <p className="mt-2 text-ink-soft">
          Choose who it&apos;s for and how much. You&apos;ll sign one transaction, then get a link to
          share.
        </p>
      </div>
      <GiftForm />
    </div>
  );
}
