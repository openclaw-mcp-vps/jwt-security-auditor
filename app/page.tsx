import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldAlert, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const faqItems = [
  {
    question: "What does JWT Security Auditor test?",
    answer:
      "The tool checks both source code and live endpoints for high-impact JWT mistakes: algorithm confusion, missing expiration enforcement, weak secrets, claim validation gaps, and malformed-token handling issues.",
  },
  {
    question: "How fast can teams run an audit?",
    answer:
      "Most scans complete in under two minutes. Upload your auth code or point to a staging endpoint, then review prioritized findings with exact remediation steps.",
  },
  {
    question: "Is this a replacement for a full security review?",
    answer:
      "It is a pre-release validation layer that catches common and costly JWT flaws early. Use it before launches and compliance reviews to reduce security review churn.",
  },
  {
    question: "How does billing work?",
    answer:
      "One flat subscription at $15/month through Stripe hosted checkout. After purchase, unlock access in the app using your checkout email.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.12),transparent_45%),linear-gradient(300deg,rgba(56,189,248,0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-8">
        <header className="mb-16 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">JWT Security Auditor</p>
          <Link href="/audit" className="text-sm text-slate-300 hover:text-cyan-300">
            Open Audit Workspace
          </Link>
        </header>

        <section className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
              Audit JWT implementations for security vulnerabilities
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-100 md:text-6xl">
              Catch token flaws before one misconfigured claim leaks your users.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              JWT vulnerabilities hide in routine auth code and slip through review. This auditor scans your
              implementation and probes your endpoints for exploitable JWT mistakes, then delivers a practical security
              report with fixes your backend team can ship the same day.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
                <Button size="lg">
                  Buy Access - $15/mo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/audit">
                <Button variant="secondary" size="lg">
                  Go to Audit Workspace
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-cyan-900/40 bg-[#0e1624]/85">
            <CardHeader>
              <CardTitle className="text-2xl">Why teams pay</CardTitle>
              <CardDescription>
                Security audits are expensive and slow. Startup release cycles are not.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-300" />
                <p>JWT auth flaws can expose every account tied to your API.</p>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 text-cyan-300" />
                <p>Get immediate signal before launch, incident response, or compliance prep.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                <p>Spend $15/month instead of $10k+ for every ad-hoc external review cycle.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Upload auth code</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Analyze middleware, token helpers, and route guards to detect insecure signing, claim checks, and storage
              patterns.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. Test live endpoints</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Run attack probes against protected routes to verify unsigned, expired, and forged tokens are rejected.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">3. Ship fixes faster</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Use a ranked remediation list with line-level evidence and practical recommendations your team can apply
              quickly.
            </CardContent>
          </Card>
        </section>

        <section id="pricing" className="mt-24">
          <Card className="border-cyan-800/40 bg-cyan-500/5">
            <CardHeader>
              <CardTitle className="text-3xl">Pricing</CardTitle>
              <CardDescription>Built for backend teams shipping quickly without dedicated security engineers.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-4xl font-semibold text-slate-100">$15<span className="text-xl text-slate-400">/month</span></p>
                <p className="mt-2 text-sm text-slate-300">Unlimited JWT scans across code uploads and endpoint probes.</p>
              </div>
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
                <Button size="lg">
                  Buy with Stripe Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </section>

        <section className="mt-24">
          <h2 className="mb-6 text-3xl font-semibold text-slate-100">FAQ</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <Card key={item.question}>
                <CardHeader>
                  <CardTitle className="text-xl">{item.question}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-slate-300">{item.answer}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
