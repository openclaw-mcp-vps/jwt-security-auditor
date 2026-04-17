import { NextRequest, NextResponse } from "next/server";
import { verifyLemonWebhookSignature } from "@/lib/lemonsqueezy";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const isValid = verifyLemonWebhookSignature(rawBody, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
