import axios from "axios";
import { SecurityTestResult } from "@/lib/types";

function toBase64Url(value: string): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createNoneToken(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.`;
}

async function hitEndpoint(endpoint: string, token?: string) {
  return axios.get(endpoint, {
    timeout: 8000,
    validateStatus: () => true,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
}

export async function runEndpointSecurityTests(endpoint: string): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];
  const now = Math.floor(Date.now() / 1000);

  try {
    const noAuth = await hitEndpoint(endpoint);
    const passed = noAuth.status === 401 || noAuth.status === 403;
    results.push({
      id: "endpoint-requires-auth",
      name: "Endpoint rejects missing Authorization header",
      passed,
      detail: passed
        ? `Endpoint rejected unauthenticated call with status ${noAuth.status}.`
        : `Endpoint returned ${noAuth.status} without authentication.`,
      evidence: `HTTP ${noAuth.status}`
    });
  } catch (error) {
    results.push({
      id: "endpoint-requires-auth",
      name: "Endpoint rejects missing Authorization header",
      passed: false,
      detail: "Could not reach endpoint for unauthenticated test.",
      evidence: error instanceof Error ? error.message : "Unknown network error"
    });
  }

  const malformed = "not-a-jwt";
  try {
    const malformedResp = await hitEndpoint(endpoint, malformed);
    const passed = malformedResp.status >= 400;
    results.push({
      id: "rejects-malformed-jwt",
      name: "Endpoint rejects malformed JWT tokens",
      passed,
      detail: passed
        ? `Malformed token rejected with status ${malformedResp.status}.`
        : `Malformed token accepted with status ${malformedResp.status}.`,
      evidence: `HTTP ${malformedResp.status}`
    });
  } catch (error) {
    results.push({
      id: "rejects-malformed-jwt",
      name: "Endpoint rejects malformed JWT tokens",
      passed: false,
      detail: "Could not complete malformed token test.",
      evidence: error instanceof Error ? error.message : "Unknown network error"
    });
  }

  try {
    const noneToken = createNoneToken({ sub: "attacker", exp: now + 3600 });
    const noneResp = await hitEndpoint(endpoint, noneToken);
    const passed = noneResp.status >= 400;
    results.push({
      id: "rejects-alg-none",
      name: "Endpoint rejects unsigned alg=none tokens",
      passed,
      detail: passed
        ? `Unsigned token rejected with status ${noneResp.status}.`
        : `Unsigned token accepted with status ${noneResp.status}.`,
      evidence: `HTTP ${noneResp.status}`
    });
  } catch (error) {
    results.push({
      id: "rejects-alg-none",
      name: "Endpoint rejects unsigned alg=none tokens",
      passed: false,
      detail: "Could not complete unsigned token test.",
      evidence: error instanceof Error ? error.message : "Unknown network error"
    });
  }

  try {
    const expiredToken = createNoneToken({ sub: "expired-user", exp: now - 3600 });
    const expiredResp = await hitEndpoint(endpoint, expiredToken);
    const passed = expiredResp.status === 401 || expiredResp.status === 403;
    results.push({
      id: "rejects-expired",
      name: "Endpoint rejects expired tokens",
      passed,
      detail: passed
        ? `Expired token rejected with status ${expiredResp.status}.`
        : `Expired token accepted with status ${expiredResp.status}.`,
      evidence: `HTTP ${expiredResp.status}`
    });
  } catch (error) {
    results.push({
      id: "rejects-expired",
      name: "Endpoint rejects expired tokens",
      passed: false,
      detail: "Could not complete expired token test.",
      evidence: error instanceof Error ? error.message : "Unknown network error"
    });
  }

  return results;
}
