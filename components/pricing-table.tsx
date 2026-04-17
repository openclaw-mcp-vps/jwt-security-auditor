"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import { ShieldCheck, LockKeyhole, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

export function PricingTable({ compact = false }: { compact?: boolean }) {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  const checkoutUrl = useMemo(() => {
    if (!productId) return "";
    return `https://checkout.lemonsqueezy.com/buy/${productId}?embed=1&media=0&logo=0`;
  }, [productId]);

  async function unlockAccess() {
    if (!orderId.trim()) {
      setStatus("Enter your Lemon Squeezy order ID to unlock access.");
      return;
    }

    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: orderId.trim(), email: email.trim() || undefined })
    });

    if (!response.ok) {
      setStatus("Could not verify your access yet. Confirm your order ID and try again.");
      return;
    }

    setStatus("Access activated. Refresh this page to start scanning.");
  }

  return (
    <div className="space-y-4">
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      <Card className={compact ? "max-w-xl" : "max-w-2xl"}>
        <CardHeader>
          <CardTitle className="text-2xl">JWT Security Auditor Pro - $15/month</CardTitle>
          <CardDescription>
            Unlimited endpoint scans, full vulnerability reports, and remediation guidance before you ship.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#30363d] p-3 text-sm">
              <ShieldCheck className="mb-2 h-4 w-4 text-[#3fb950]" />
              Automated checks for `alg=none`, expiry handling, and token parsing flaws.
            </div>
            <div className="rounded-lg border border-[#30363d] p-3 text-sm">
              <LockKeyhole className="mb-2 h-4 w-4 text-[#3fb950]" />
              Endpoint probes with malformed, unsigned, and expired token test cases.
            </div>
            <div className="rounded-lg border border-[#30363d] p-3 text-sm">
              <Wallet className="mb-2 h-4 w-4 text-[#3fb950]" />
              Flat pricing for engineering teams, cancel anytime, no annual lock-in.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => {
                if (!checkoutUrl) {
                  setStatus("Set NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID to enable checkout.");
                  return;
                }
                window.LemonSqueezy?.Url?.Open(checkoutUrl);
              }}
            >
              Open Secure Checkout
            </Button>
            <p className="text-sm text-[#9da7b3]">
              Complete payment, then paste your order ID below to activate this browser session.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              className="sm:col-span-1"
              placeholder="Order ID"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            />
            <Input
              className="sm:col-span-1"
              placeholder="Billing email (optional)"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button className="sm:col-span-1" variant="outline" onClick={unlockAccess}>
              Unlock Access
            </Button>
          </div>

          {status ? <p className="text-sm text-[#9da7b3]">{status}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
