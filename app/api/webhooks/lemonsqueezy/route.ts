import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { recordPurchase } from "@/lib/database";
import { normalizeCustomerEmail, verifyStripeWebhookSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

interface StripeEvent {
  type: string;
  data?: {
    object?: {
      id?: string;
      customer_email?: string;
      customer_details?: {
        email?: string;
      };
      metadata?: {
        email?: string;
      };
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const object = event.data?.object;
    const email = normalizeCustomerEmail(
      object?.customer_details?.email || object?.customer_email || object?.metadata?.email,
    );
    const paymentId = object?.id || randomUUID();

    if (email) {
      await recordPurchase({
        email,
        paymentId,
        source: "stripe",
        eventType: event.type,
      });
    }
  }

  return NextResponse.json({ received: true });
}
