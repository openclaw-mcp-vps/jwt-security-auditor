import CryptoJS from "crypto-js";
import { decodeProtectedHeader } from "jose";

import { AnalyzeResult, UploadedCodeFile, Vulnerability } from "@/lib/types";

function lineForIndex(content: string, index: number) {
  return content.slice(0, Math.max(index, 0)).split(/\r?\n/).length;
}

function evidenceAtLine(content: string, line: number) {
  const lines = content.split(/\r?\n/);
  return lines[Math.max(0, line - 1)]?.trim().slice(0, 220);
}

function pushVulnerability(
  list: Vulnerability[],
  file: string,
  content: string,
  index: number,
  vulnerability: Omit<Vulnerability, "id" | "source" | "filePath" | "line" | "evidence">,
) {
  const line = lineForIndex(content, index);
  list.push({
    id: `static-${CryptoJS.SHA1(`${file}:${line}:${vulnerability.title}`).toString().slice(0, 12)}`,
    source: "static",
    filePath: file,
    line,
    evidence: evidenceAtLine(content, line),
    ...vulnerability,
  });
}

function inspectVerifyOptions(content: string) {
  const results: Array<{ index: number; options: string }> = [];
  const verifyCallRegex = /jwt\.verify\(([^;\n]+)\)/g;
  let match: RegExpExecArray | null = null;

  while ((match = verifyCallRegex.exec(content))) {
    const rawArgs = match[1] || "";
    const parts = rawArgs.split(",");
    const optionsCandidate = parts.slice(2).join(",").trim();
    results.push({
      index: match.index,
      options: optionsCandidate,
    });
  }

  return results;
}

function inspectSignOptions(content: string) {
  const results: Array<{ index: number; options: string }> = [];
  const signCallRegex = /jwt\.sign\(([^;\n]+)\)/g;
  let match: RegExpExecArray | null = null;

  while ((match = signCallRegex.exec(content))) {
    const rawArgs = match[1] || "";
    const parts = rawArgs.split(",");
    const optionsCandidate = parts.slice(2).join(",").trim();
    results.push({
      index: match.index,
      options: optionsCandidate,
    });
  }

  return results;
}

function looksLikeHardcodedSecret(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }

  if (
    trimmed.includes("process.env") ||
    trimmed.includes("config") ||
    trimmed.includes("secrets") ||
    trimmed.includes("vault")
  ) {
    return false;
  }

  const stringLiteralMatch = trimmed.match(/^["'`](.+)["'`]$/);
  if (!stringLiteralMatch) {
    return false;
  }

  return stringLiteralMatch[1].length < 32;
}

function findJwtLiterals(content: string) {
  const tokenRegex = /[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
  return Array.from(content.matchAll(tokenRegex));
}

export function analyzeJwtImplementation(files: UploadedCodeFile[]): AnalyzeResult {
  const vulnerabilities: Vulnerability[] = [];

  const checks = [
    "reject-none-algorithm",
    "avoid-ignore-expiration",
    "avoid-decode-without-verify",
    "require-algorithm-pinning",
    "avoid-hardcoded-weak-secrets",
    "require-token-expiration",
    "require-issuer-audience-checks",
    "avoid-client-storage",
  ];

  for (const file of files) {
    const content = file.content;

    const noneRegex = /["'`]none["'`]/gi;
    let noneMatch: RegExpExecArray | null = null;
    while ((noneMatch = noneRegex.exec(content))) {
      pushVulnerability(vulnerabilities, file.name, content, noneMatch.index, {
        title: "Unsigned tokens (`alg: none`) referenced in auth logic",
        severity: "critical",
        category: "algorithm",
        description:
          "Your implementation references the `none` JWT algorithm. Attackers can forge tokens when unsigned JWTs are accepted.",
        impact: "Authentication bypass across any endpoint that accepts forged tokens.",
        recommendation:
          "Pin accepted algorithms to strong options only (for example RS256/ES256). Explicitly reject `none` everywhere.",
      });
    }

    const ignoreExpirationRegex = /ignoreExpiration\s*:\s*true/gi;
    let ignoreExpMatch: RegExpExecArray | null = null;
    while ((ignoreExpMatch = ignoreExpirationRegex.exec(content))) {
      pushVulnerability(vulnerabilities, file.name, content, ignoreExpMatch.index, {
        title: "Expiration validation disabled",
        severity: "high",
        category: "expiration",
        description:
          "`ignoreExpiration: true` disables expiry enforcement and allows replaying old tokens.",
        impact: "Compromised or stale tokens remain valid far longer than intended.",
        recommendation:
          "Remove `ignoreExpiration: true` and enforce strict expiration checks in every verification path.",
      });
    }

    const decodeRegex = /(jwt\.decode\(|decodeJwt\()/g;
    let decodeMatch: RegExpExecArray | null = null;
    while ((decodeMatch = decodeRegex.exec(content))) {
      pushVulnerability(vulnerabilities, file.name, content, decodeMatch.index, {
        title: "Token decoded without signature verification",
        severity: "high",
        category: "validation",
        description:
          "Decoding a token is not the same as verifying it. A decoded token payload may be attacker-controlled.",
        impact: "Privilege escalation if decoded claims are trusted without cryptographic verification.",
        recommendation:
          "Use `jwt.verify` or JOSE verification APIs before trusting any claim from the payload.",
      });
    }

    for (const verifyCall of inspectVerifyOptions(content)) {
      const options = verifyCall.options;
      if (!options.includes("algorithms")) {
        pushVulnerability(vulnerabilities, file.name, content, verifyCall.index, {
          title: "Verification without algorithm pinning",
          severity: "high",
          category: "algorithm",
          description:
            "`jwt.verify` appears to run without an explicit `algorithms` allow-list, increasing confusion-attack risk.",
          impact: "An attacker may exploit algorithm confusion if key handling is inconsistent.",
          recommendation:
            "Pass `algorithms: ['RS256']` or your exact approved list on every verification call.",
        });
      }

      if (!options.includes("issuer") || !options.includes("audience")) {
        pushVulnerability(vulnerabilities, file.name, content, verifyCall.index, {
          title: "Missing issuer/audience claim validation",
          severity: "medium",
          category: "claim-validation",
          description:
            "Verification appears to skip `issuer` and/or `audience` checks, so tokens minted for another service could be accepted.",
          impact: "Cross-service token reuse and privilege confusion in multi-service environments.",
          recommendation:
            "Enforce `issuer` and `audience` validation with exact expected values during verification.",
        });
      }
    }

    const weakSecretRegex = /jwt\.(sign|verify)\(([^,]+),\s*([^,\n\r)]+)/g;
    let weakSecretMatch: RegExpExecArray | null = null;
    while ((weakSecretMatch = weakSecretRegex.exec(content))) {
      const secretArg = weakSecretMatch[3] || "";
      if (looksLikeHardcodedSecret(secretArg)) {
        pushVulnerability(vulnerabilities, file.name, content, weakSecretMatch.index, {
          title: "Weak hardcoded JWT secret",
          severity: "critical",
          category: "key-management",
          description:
            "A short literal secret is used directly in signing or verification logic.",
          impact: "Attackers can brute-force or recover secrets and forge valid tokens.",
          recommendation:
            "Load a high-entropy secret from environment/secret manager. Use at least 256-bit random values.",
        });
      }
    }

    for (const signCall of inspectSignOptions(content)) {
      const options = signCall.options;
      if (!options || (!options.includes("expiresIn") && !options.includes("exp"))) {
        pushVulnerability(vulnerabilities, file.name, content, signCall.index, {
          title: "JWTs created without expiration",
          severity: "high",
          category: "expiration",
          description:
            "Token signing appears to omit `expiresIn`/`exp`, producing long-lived bearer tokens.",
          impact: "Stolen tokens remain usable indefinitely.",
          recommendation:
            "Issue short-lived access tokens and rotate refresh tokens with replay detection.",
        });
      }
    }

    const storageRegex = /(localStorage\.setItem\([^\n]*token|sessionStorage\.setItem\([^\n]*token)/gi;
    let storageMatch: RegExpExecArray | null = null;
    while ((storageMatch = storageRegex.exec(content))) {
      pushVulnerability(vulnerabilities, file.name, content, storageMatch.index, {
        title: "JWT stored in browser storage",
        severity: "medium",
        category: "token-storage",
        description:
          "Tokens in `localStorage`/`sessionStorage` are exposed to XSS and browser extension attacks.",
        impact: "Session takeover if frontend script execution is compromised.",
        recommendation:
          "Use secure, HttpOnly, SameSite cookies for session tokens and keep access tokens short-lived.",
      });
    }

    for (const candidate of findJwtLiterals(content)) {
      try {
        const token = candidate[0];
        const header = decodeProtectedHeader(token);
        if (header.alg === "none") {
          pushVulnerability(vulnerabilities, file.name, content, candidate.index ?? 0, {
            title: "Embedded token uses `alg: none`",
            severity: "critical",
            category: "algorithm",
            description:
              "A token literal in source code decodes to an unsigned algorithm header.",
            impact: "Unsafe fixtures can leak into production validation flows.",
            recommendation:
              "Remove unsigned token fixtures or isolate them to explicit negative-test suites only.",
          });
        }
      } catch {
        // Ignore non-JWT string matches.
      }
    }
  }

  const deduplicated = vulnerabilities.filter(
    (vulnerability, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.title === vulnerability.title &&
          candidate.filePath === vulnerability.filePath &&
          candidate.line === vulnerability.line,
      ) === index,
  );

  const checksRun = checks.length * Math.max(files.length, 1);
  const failCount = deduplicated.length;
  const passCount = Math.max(checksRun - failCount, 0);

  return {
    vulnerabilities: deduplicated,
    checksRun,
    passCount,
    failCount,
    fileFingerprints: files.map((file) => ({
      file: file.name,
      sha256: CryptoJS.SHA256(file.content).toString(),
    })),
  };
}
