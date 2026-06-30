"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ClaimCard } from "@/components/ClaimCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { decodeMessage } from "@/lib/share";

export default function ClaimPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 text-center">
        <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
          Stardrop
        </Link>
      </div>
      <Suspense fallback={<ClaimFallback />}>
        <ClaimRoute />
      </Suspense>
    </div>
  );
}

function ClaimRoute() {
  const params = useParams<{ balanceId: string }>();
  const searchParams = useSearchParams();

  const balanceId = Array.isArray(params.balanceId) ? params.balanceId[0] : params.balanceId;
  const message = decodeMessage(searchParams.get("m"));

  return <ClaimCard balanceId={balanceId ?? ""} message={message} />;
}

function ClaimFallback() {
  return (
    <div className="card p-6 sm:p-8">
      <Skeleton className="mx-auto h-4 w-24" />
      <Skeleton className="mx-auto mt-4 h-12 w-40" />
      <Skeleton className="mt-8 h-12 w-full rounded-full" />
    </div>
  );
}
