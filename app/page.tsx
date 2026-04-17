import Link from "next/link";
import { ArrowRight, Shield, Timer, CircleAlert } from "lucide-react";
import { PricingTable } from "@/components/pricing-table";

const faqs = [
  {
    q: "How is this different from generic API scanners?",
    a: "JWT Security Auditor runs auth-specific abuse tests: unsigned token acceptance, malformed parsing, expiration handling, and issuer/audience validation drift."
  },
  {
    q: "Will this break my production API?",
    a: "No destructive payloads are sent. The scanner performs read-like auth probes with intentionally invalid tokens to verify your rejection paths."
  },
  {
    q: "When should teams run this?",
    a: "Before every auth release, before penetration tests, and ahead of SOC2 or customer security reviews."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
      <section className="grid gap-8 pb-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-[#30363d] px-3 py-1 text-sm text-[#9da7b3]">
            Security Tools • Built for backend teams shipping fast
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Audit JWT implementations for security vulnerabilities
          </h1>
          <p className="max-w-xl text-lg text-[#9da7b3]">
            Run automated JWT abuse-case tests against your auth flow and get a report with clear remediation steps. Catch misconfigured token validation before attackers do.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/scan"
              className="inline-flex items-center justify-center rounded-md bg-[#3fb950] px-5 py-3 text-sm font-medium text-[#0d1117] hover:bg-[#36a346]"
            >
              Start Security Scan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-md border border-[#30363d] px-5 py-3 text-sm font-medium hover:bg-[#161b22]"
            >
              View Pricing
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-[#30363d] bg-[#111827]/80 p-6">
          <h2 className="mb-4 text-xl font-semibold">Why teams buy this at $15/mo</h2>
          <ul className="space-y-3 text-sm text-[#9da7b3]">
            <li className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 text-[#f85149]" />
              JWT mistakes rarely show in code review. One missed claim check can expose all accounts.
            </li>
            <li className="flex items-start gap-2">
              <Timer className="mt-0.5 h-4 w-4 text-[#3fb950]" />
              Security consultants are slow and expensive. Teams need launch-blocking validation this week.
            </li>
            <li className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 text-[#3fb950]" />
              This gives concrete pass/fail evidence for engineers and compliance stakeholders.
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 border-y border-[#30363d] py-12 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Problem</h3>
          <p className="text-sm text-[#9da7b3]">
            Most incidents come from token verification drift: algorithm confusion, stale issuer settings, and skipped expiration checks under edge paths.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold">Solution</h3>
          <p className="text-sm text-[#9da7b3]">
            Automated scanner that attacks your own auth endpoints with realistic JWT abuse cases and maps each finding to direct engineering fixes.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold">Outcome</h3>
          <p className="text-sm text-[#9da7b3]">
            Ship auth changes with confidence, avoid expensive emergency patches, and walk into security reviews with evidence.
          </p>
        </div>
      </section>

      <section id="pricing" className="py-12">
        <PricingTable />
      </section>

      <section className="space-y-4 border-t border-[#30363d] pt-12">
        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
        {faqs.map((faq) => (
          <div key={faq.q} className="rounded-lg border border-[#30363d] bg-[#111827]/70 p-4">
            <h3 className="font-medium">{faq.q}</h3>
            <p className="mt-2 text-sm text-[#9da7b3]">{faq.a}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
