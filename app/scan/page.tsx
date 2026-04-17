import Link from "next/link";
import { ScanForm } from "@/components/scan-form";
import { PricingTable } from "@/components/pricing-table";
import { hasActiveAccess } from "@/lib/lemonsqueezy";

export default async function ScanPage() {
  const accessGranted = await hasActiveAccess();

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">JWT Security Scan</h1>
          <p className="mt-2 text-sm text-[#9da7b3]">
            Analyze token structure and probe auth endpoints for validation weaknesses.
          </p>
        </div>
        <Link href="/" className="text-sm text-[#9da7b3] underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>

      {accessGranted ? (
        <ScanForm />
      ) : (
        <section className="space-y-4">
          <div className="rounded-lg border border-[#30363d] bg-[#111827]/70 p-4 text-sm text-[#9da7b3]">
            Full scanner access is behind the Pro paywall. Complete checkout to unlock this browser session.
          </div>
          <PricingTable compact />
        </section>
      )}
    </main>
  );
}
