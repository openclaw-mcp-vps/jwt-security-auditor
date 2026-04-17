import crypto from "crypto";
import { cookies } from "next/headers";

export const ACCESS_COOKIE_NAME = "jwt_auditor_access";
const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 31;

export function getWebhookSecret() {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "";
}

export function verifyLemonWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = getWebhookSecret();
  if (!secret || !signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const provided = Buffer.from(signature, "utf8");

  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

function signValue(value: string): string {
  const secret = getWebhookSecret();
  const payload = Buffer.from(value, "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret || "dev-secret").update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function unsignValue(signed: string): string | null {
  const [payload, signature] = signed.split(".");
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", getWebhookSecret() || "dev-secret")
    .update(payload)
    .digest("base64url");

  if (expected !== signature) return null;

  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function createAccessGrant(input: { orderId: string; email?: string | null }): string {
  const payload = JSON.stringify({
    orderId: input.orderId,
    email: input.email ?? null,
    issuedAt: Date.now()
  });
  return signValue(payload);
}

export function validateAccessGrant(token: string | undefined): boolean {
  if (!token) return false;
  const raw = unsignValue(token);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as { issuedAt?: number };
    if (!parsed.issuedAt) return false;
    return Date.now() - parsed.issuedAt < ACCESS_MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}

export async function hasActiveAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  return validateAccessGrant(token);
}
