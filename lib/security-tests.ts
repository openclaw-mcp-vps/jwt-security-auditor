import axios from "axios";
import jwt from "jsonwebtoken";

import { EndpointTestOutcome, EndpointTestResult, Vulnerability } from "@/lib/types";

export interface EndpointTestInput {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  authHeaderName?: string;
  timeoutMs?: number;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function createNoneAlgorithmToken() {
  const header = base64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({ sub: "attacker", role: "admin", iat: Math.floor(Date.now() / 1000) }),
  );
  return `${header}.${payload}.`;
}

function createExpiredToken() {
  return jwt.sign({ sub: "expired-user", role: "user" }, "audit-test-secret", {
    algorithm: "HS256",
    expiresIn: -300,
  });
}

function createWeakSecretToken() {
  return jwt.sign({ sub: "weak-secret-user", role: "admin" }, "secret", {
    algorithm: "HS256",
    expiresIn: "10m",
  });
}

export function isSafePublicUrl(input: string) {
  try {
    const parsed = new URL(input);

    if (!parsed.protocol.startsWith("http")) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    const blockedHosts = ["localhost", "0.0.0.0", "127.0.0.1", "::1"];
    if (blockedHosts.includes(host) || host.endsWith(".local")) {
      return false;
    }

    if (/^10\./.test(host)) {
      return false;
    }

    if (/^192\.168\./.test(host)) {
      return false;
    }

    const match172 = host.match(/^172\.(\d{1,3})\./);
    if (match172) {
      const segment = Number(match172[1]);
      if (segment >= 16 && segment <= 31) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function vulnerabilityFromFailure(base: {
  id: string;
  title: string;
  details: string;
  severity: Vulnerability["severity"];
  category: string;
  recommendation: string;
}) {
  return {
    id: base.id,
    source: "dynamic",
    title: base.title,
    severity: base.severity,
    category: base.category,
    description: base.details,
    impact: "Protected endpoint accepted a token/request that should have been rejected.",
    recommendation: base.recommendation,
    evidence: base.details,
  } satisfies Vulnerability;
}

async function executeProbe(
  input: EndpointTestInput,
  test: {
    id: string;
    title: string;
    description: string;
    token?: string;
    includeToken: boolean;
    severityOnFail: Vulnerability["severity"];
    category: string;
    recommendation: string;
  },
): Promise<EndpointTestOutcome> {
  const authHeader = input.authHeaderName || "Authorization";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(input.headers || {}),
  };

  if (test.includeToken && test.token) {
    headers[authHeader] = `Bearer ${test.token}`;
  }

  const response = await axios.request({
    url: input.endpoint,
    method: input.method,
    timeout: input.timeoutMs ?? 10000,
    data: input.body,
    headers,
    validateStatus: () => true,
  });

  const status = response.status;
  const wasAccepted = status >= 200 && status < 300;
  const passed = !wasAccepted;

  if (!passed) {
    const details = `${test.title} returned ${status}. Endpoint accepted a request that should fail.`;
    return {
      id: test.id,
      title: test.title,
      description: test.description,
      passed: false,
      statusCode: status,
      details,
      vulnerability: vulnerabilityFromFailure({
        id: `dynamic-${test.id}`,
        title: `${test.title} bypass detected`,
        details,
        severity: test.severityOnFail,
        category: test.category,
        recommendation: test.recommendation,
      }),
    };
  }

  const details = `${test.title} correctly rejected with status ${status}.`;
  return {
    id: test.id,
    title: test.title,
    description: test.description,
    passed: true,
    statusCode: status,
    details,
  };
}

export async function runEndpointSecurityTests(input: EndpointTestInput): Promise<EndpointTestResult> {
  const tests = [
    {
      id: "missing-token",
      title: "Missing token enforcement",
      description: "Protected endpoint should reject requests with no JWT.",
      includeToken: false,
      severityOnFail: "critical" as const,
      category: "authentication",
      recommendation: "Require JWT authentication middleware on this route before business logic executes.",
    },
    {
      id: "none-algorithm",
      title: "Unsigned token rejection",
      description: "Endpoint should reject a forged token using `alg: none`.",
      includeToken: true,
      token: createNoneAlgorithmToken(),
      severityOnFail: "critical" as const,
      category: "algorithm",
      recommendation:
        "Reject `none` algorithm tokens and pin verification algorithms to a strict allow-list.",
    },
    {
      id: "expired-token",
      title: "Expired token rejection",
      description: "Endpoint should reject tokens that are already expired.",
      includeToken: true,
      token: createExpiredToken(),
      severityOnFail: "high" as const,
      category: "expiration",
      recommendation: "Enforce expiration checks and remove any `ignoreExpiration` or equivalent bypass.",
    },
    {
      id: "weak-secret-token",
      title: "Weak secret forgery resistance",
      description:
        "Endpoint should reject a forged HS256 token signed with a common weak secret (`secret`).",
      includeToken: true,
      token: createWeakSecretToken(),
      severityOnFail: "high" as const,
      category: "key-management",
      recommendation:
        "Use high-entropy secrets or asymmetric signing keys and rotate compromised credentials immediately.",
    },
    {
      id: "malformed-token",
      title: "Malformed token handling",
      description: "Endpoint should reject malformed JWT structures and avoid treating them as anonymous success.",
      includeToken: true,
      token: "this-is-not-a-valid-jwt",
      severityOnFail: "medium" as const,
      category: "validation",
      recommendation: "Fail closed on parsing errors and return 401/403 for invalid JWT formats.",
    },
  ];

  const outcomes: EndpointTestOutcome[] = [];
  for (const test of tests) {
    outcomes.push(await executeProbe(input, test));
  }

  const vulnerabilities = outcomes
    .map((outcome) => outcome.vulnerability)
    .filter((vulnerability): vulnerability is Vulnerability => Boolean(vulnerability));

  return {
    vulnerabilities,
    tests: outcomes,
    checksRun: outcomes.length,
    passCount: outcomes.filter((outcome) => outcome.passed).length,
    failCount: outcomes.filter((outcome) => !outcome.passed).length,
  };
}
