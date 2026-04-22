import crypto from "crypto";

export function getPaymentLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "";
}

export function normalizeCustomerEmail(email: string | null | undefined) {
  return (email || "").toLowerCase().trim();
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const entries = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );

  const timestamp = entries.t;
  const v1 = entries.v1;

  if (!timestamp || !v1) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(v1, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
