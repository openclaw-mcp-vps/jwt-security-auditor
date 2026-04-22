import { cookies } from "next/headers";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AuditConsole } from "@/components/audit-console";
import { UnlockAccessForm } from "@/components/unlock-access-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessCookieName, verifyAccessToken } from "@/lib/access";

export default async function AuditPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(getAccessCookieName())?.value;
  const access = verifyAccessToken(accessToken);

  if (!access.valid) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 md:px-8">
        <Card className="w-full border-cyan-900/35">
          <CardHeader>
            <CardTitle className="text-3xl">Unlock JWT Audit Workspace</CardTitle>
            <CardDescription>
              JWT analysis is available to paid subscribers. Complete Stripe checkout, then unlock this browser using the
              same checkout email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
                <Button>Buy Access - $15/mo</Button>
              </a>
              <Link href="/">
                <Button variant="secondary">Back to Product Page</Button>
              </Link>
            </div>

            <UnlockAccessForm />

            <p className="text-xs text-slate-500">
              Purchase unlocks are recorded via webhook. If your payment just completed, wait a few seconds and retry.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300">
            <ShieldCheck className="h-4 w-4" />
            Paid Workspace
          </p>
          <h1 className="text-3xl font-semibold text-slate-100 md:text-4xl">JWT Security Audit Console</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Run static and dynamic JWT security checks before shipping auth changes. Upload code to scan implementation
            risk, or test a protected endpoint to validate runtime enforcement.
          </p>
        </div>
      </header>

      <AuditConsole />
    </main>
  );
}
