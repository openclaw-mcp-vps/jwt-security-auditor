import { decodeProtectedHeader } from "jose";
import jwt from "jsonwebtoken";
import { JwtAnalysisResult, Vulnerability } from "@/lib/types";

interface AnalyzeOptions {
  expectedIssuer?: string;
  expectedAudience?: string;
  expectedAlgorithm?: string;
}

function addVulnerability(items: Vulnerability[], vuln: Vulnerability) {
  if (!items.find((item) => item.id === vuln.id)) {
    items.push(vuln);
  }
}

export function analyzeJwtToken(token: string, options: AnalyzeOptions = {}): JwtAnalysisResult {
  const vulnerabilities: Vulnerability[] = [];
  const now = Math.floor(Date.now() / 1000);

  let decodedPayload: jwt.JwtPayload | string | null = null;
  let protectedHeader: Record<string, unknown> = {};

  try {
    decodedPayload = jwt.decode(token);
  } catch {
    addVulnerability(vulnerabilities, {
      id: "malformed-token",
      title: "Malformed JWT",
      severity: "critical",
      description: "The provided token cannot be parsed as a valid JWT.",
      impact: "A malformed token can break auth logic and conceal parser edge-case vulnerabilities.",
      fix: "Ensure token generation uses RFC7519-compliant libraries and validate token shape before processing."
    });
  }

  try {
    protectedHeader = decodeProtectedHeader(token);
  } catch {
    addVulnerability(vulnerabilities, {
      id: "invalid-header",
      title: "Unreadable JWT Header",
      severity: "high",
      description: "The token header could not be decoded.",
      impact: "Header ambiguity can bypass algorithm checks in weak implementations.",
      fix: "Reject tokens that fail structured header decoding before signature validation."
    });
  }

  const alg = String(protectedHeader.alg ?? "unknown");
  if (alg === "none") {
    addVulnerability(vulnerabilities, {
      id: "alg-none",
      title: "Unsigned token algorithm (alg=none)",
      severity: "critical",
      description: "The token declares the 'none' algorithm, which disables signature verification.",
      impact: "Attackers can forge arbitrary claims and impersonate users.",
      fix: "Hardcode accepted algorithms and reject 'none' in verifier configuration."
    });
  }

  if (["HS256", "HS384"].includes(alg)) {
    addVulnerability(vulnerabilities, {
      id: "weak-hmac-choice",
      title: "Potentially weak shared-secret signing model",
      severity: "medium",
      description: `${alg} relies on a shared secret that is often leaked or reused in startup environments.`,
      impact: "A weak or reused secret enables token forgery.",
      fix: "Use RS256/ES256 with managed private keys, or enforce high-entropy HMAC secrets with rotation."
    });
  }

  if (options.expectedAlgorithm && alg !== options.expectedAlgorithm) {
    addVulnerability(vulnerabilities, {
      id: "alg-mismatch",
      title: "Unexpected signing algorithm",
      severity: "high",
      description: `Expected ${options.expectedAlgorithm} but found ${alg}.`,
      impact: "Algorithm confusion may allow bypass if verifiers accept multiple algorithms.",
      fix: "Pin exactly one allowed algorithm per issuer and reject all others."
    });
  }

  if (!decodedPayload || typeof decodedPayload === "string") {
    addVulnerability(vulnerabilities, {
      id: "payload-unavailable",
      title: "Payload claims unavailable",
      severity: "high",
      description: "Claims could not be decoded as an object payload.",
      impact: "Authorization decisions may run on incomplete or invalid claim sets.",
      fix: "Require payload object structure and reject non-object payload formats."
    });
  } else {
    if (!decodedPayload.exp) {
      addVulnerability(vulnerabilities, {
        id: "missing-exp",
        title: "Missing expiration claim",
        severity: "critical",
        description: "Token has no exp claim.",
        impact: "Tokens can remain valid indefinitely if revocation is absent.",
        fix: "Set short-lived exp values and enforce expiration validation in middleware."
      });
    } else if (decodedPayload.exp > now + 60 * 60 * 24 * 30) {
      addVulnerability(vulnerabilities, {
        id: "long-exp",
        title: "Excessive token lifetime",
        severity: "medium",
        description: "Token expiration is greater than 30 days.",
        impact: "Stolen tokens remain usable for long periods.",
        fix: "Use short access tokens (5-30 minutes) with rotating refresh tokens."
      });
    } else if (decodedPayload.exp <= now) {
      addVulnerability(vulnerabilities, {
        id: "expired-token",
        title: "Token already expired",
        severity: "high",
        description: "Provided token has expired.",
        impact: "Expired tokens may indicate missing expiration checks in consuming services.",
        fix: "Reject expired tokens and emit explicit auth errors."
      });
    }

    if (!decodedPayload.iat) {
      addVulnerability(vulnerabilities, {
        id: "missing-iat",
        title: "Missing issued-at claim",
        severity: "low",
        description: "Token does not include iat.",
        impact: "Forensics and replay detection become harder.",
        fix: "Add iat and optionally jti to support replay detection and traceability."
      });
    }

    if (decodedPayload.nbf && decodedPayload.nbf > now + 300) {
      addVulnerability(vulnerabilities, {
        id: "future-nbf",
        title: "Token not yet valid",
        severity: "medium",
        description: "Token nbf is far in the future.",
        impact: "Can cause auth failures and unpredictable rollout issues.",
        fix: "Keep clock skew tolerance small and ensure synchronized system clocks."
      });
    }

    if (!decodedPayload.iss) {
      addVulnerability(vulnerabilities, {
        id: "missing-issuer",
        title: "Missing issuer claim",
        severity: "medium",
        description: "Token does not define iss.",
        impact: "Cross-service confusion attacks become easier.",
        fix: "Set and validate a strict issuer per environment."
      });
    } else if (options.expectedIssuer && decodedPayload.iss !== options.expectedIssuer) {
      addVulnerability(vulnerabilities, {
        id: "issuer-mismatch",
        title: "Issuer mismatch",
        severity: "high",
        description: `Expected issuer ${options.expectedIssuer} but found ${decodedPayload.iss}.`,
        impact: "Tokens from untrusted systems might be accepted.",
        fix: "Enforce issuer allow-list at verification time."
      });
    }

    if (!decodedPayload.aud) {
      addVulnerability(vulnerabilities, {
        id: "missing-audience",
        title: "Missing audience claim",
        severity: "medium",
        description: "Token does not include aud.",
        impact: "A token issued for one service could be replayed against another.",
        fix: "Set and validate aud for each protected service."
      });
    } else if (options.expectedAudience) {
      const audiences = Array.isArray(decodedPayload.aud) ? decodedPayload.aud : [decodedPayload.aud];
      if (!audiences.includes(options.expectedAudience)) {
        addVulnerability(vulnerabilities, {
          id: "audience-mismatch",
          title: "Audience mismatch",
          severity: "high",
          description: `Expected audience ${options.expectedAudience} but token audience is ${audiences.join(", ")}.`,
          impact: "Token replay across services is possible if audience checks are skipped.",
          fix: "Reject tokens whose audience does not exactly match the API identifier."
        });
      }
    }
  }

  const summary = vulnerabilities.length === 0
    ? "No obvious JWT claim or header misconfigurations were detected in the provided token."
    : `Detected ${vulnerabilities.length} potential JWT security issue(s).`;

  return {
    summary,
    vulnerabilities,
    tokenMetadata: {
      algorithm: alg,
      header: protectedHeader,
      payload: decodedPayload
    }
  };
}
