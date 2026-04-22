import crypto from "crypto";

const COOKIE_NAME = "jwt_auditor_access";
const ACCESS_DAYS = 30;

type AccessPayload = {
  email: string;
  exp: number;
};

function getSecret() {
  return (
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "local-dev-access-secret"
  );
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signSegment(segment: string) {
  return crypto.createHmac("sha256", getSecret()).update(segment).digest("base64url");
}

export function getAccessCookieName() {
  return COOKIE_NAME;
}

export function getAccessCookieMaxAge() {
  return ACCESS_DAYS * 24 * 60 * 60;
}

export function createAccessToken(email: string) {
  const payload: AccessPayload = {
    email: email.toLowerCase().trim(),
    exp: Date.now() + getAccessCookieMaxAge() * 1000,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signSegment(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string | undefined) {
  if (!token) {
    return { valid: false as const };
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return { valid: false as const };
  }

  const expectedSignature = signSegment(encodedPayload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false as const };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AccessPayload;
    if (!payload.email || typeof payload.exp !== "number") {
      return { valid: false as const };
    }

    if (payload.exp < Date.now()) {
      return { valid: false as const };
    }

    return {
      valid: true as const,
      email: payload.email,
      exp: payload.exp,
    };
  } catch {
    return { valid: false as const };
  }
}
