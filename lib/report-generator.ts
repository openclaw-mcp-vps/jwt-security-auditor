import { randomUUID } from "crypto";

import { AnalyzeResult, EndpointTestResult, SecurityReport, Severity, Vulnerability } from "@/lib/types";

const severityWeight: Record<Severity, number> = {
  critical: 30,
  high: 18,
  medium: 10,
  low: 5,
  info: 2,
};

function gradeFromScore(score: number): SecurityReport["grade"] {
  if (score >= 90) {
    return "A";
  }
  if (score >= 80) {
    return "B";
  }
  if (score >= 70) {
    return "C";
  }
  if (score >= 60) {
    return "D";
  }
  return "F";
}

function scoreFromVulnerabilities(vulnerabilities: Vulnerability[]) {
  const penalty = vulnerabilities.reduce((total, vulnerability) => {
    return total + severityWeight[vulnerability.severity];
  }, 0);

  return Math.max(100 - Math.min(penalty, 95), 5);
}

function buildSummary(sourceType: SecurityReport["sourceType"], vulnerabilities: Vulnerability[]) {
  if (vulnerabilities.length === 0) {
    return sourceType === "code"
      ? "No critical JWT weaknesses were detected in the uploaded implementation. Continue with dependency and runtime hardening checks before release."
      : "Endpoint rejected all attack probes in this run. Keep regression tests in CI to prevent auth hardening drift.";
  }

  const criticalCount = vulnerabilities.filter((item) => item.severity === "critical").length;
  const highCount = vulnerabilities.filter((item) => item.severity === "high").length;

  if (criticalCount > 0) {
    return `Detected ${criticalCount} critical JWT vulnerability${criticalCount > 1 ? "ies" : "y"}. Fix these before shipping because they can enable immediate authentication bypass.`;
  }

  if (highCount > 0) {
    return `Detected ${highCount} high-severity issue${highCount > 1 ? "s" : ""} that materially increase account takeover risk if exploited.`;
  }

  return `Detected ${vulnerabilities.length} lower-severity weakness${vulnerabilities.length > 1 ? "es" : ""}. Addressing these will improve token integrity and incident resilience.`;
}

function buildChartData(vulnerabilities: Vulnerability[]) {
  const counts = vulnerabilities.reduce(
    (acc, vulnerability) => {
      acc[vulnerability.severity] += 1;
      return acc;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
  );

  return [
    { name: "Critical", value: counts.critical },
    { name: "High", value: counts.high },
    { name: "Medium", value: counts.medium },
    { name: "Low", value: counts.low },
    { name: "Info", value: counts.info },
  ];
}

function topRecommendations(vulnerabilities: Vulnerability[]) {
  const unique = Array.from(new Set(vulnerabilities.map((vulnerability) => vulnerability.recommendation)));
  return unique.slice(0, 8);
}

function buildReportBase(input: {
  sourceType: SecurityReport["sourceType"];
  target: string;
  vulnerabilities: Vulnerability[];
  checksRun: number;
  passCount: number;
  failCount: number;
  metadata?: Record<string, unknown>;
}) {
  const score = scoreFromVulnerabilities(input.vulnerabilities);

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    sourceType: input.sourceType,
    target: input.target,
    score,
    grade: gradeFromScore(score),
    summary: buildSummary(input.sourceType, input.vulnerabilities),
    checksRun: input.checksRun,
    passCount: input.passCount,
    failCount: input.failCount,
    vulnerabilities: input.vulnerabilities,
    recommendations: topRecommendations(input.vulnerabilities),
    chartData: buildChartData(input.vulnerabilities),
    metadata: input.metadata,
  } satisfies SecurityReport;
}

export function generateCodeReport(input: {
  target: string;
  analyzeResult: AnalyzeResult;
}): SecurityReport {
  return buildReportBase({
    sourceType: "code",
    target: input.target,
    vulnerabilities: input.analyzeResult.vulnerabilities,
    checksRun: input.analyzeResult.checksRun,
    passCount: input.analyzeResult.passCount,
    failCount: input.analyzeResult.failCount,
    metadata: {
      fileFingerprints: input.analyzeResult.fileFingerprints,
      filesScanned: input.analyzeResult.fileFingerprints.length,
    },
  });
}

export function generateEndpointReport(input: {
  target: string;
  endpointResult: EndpointTestResult;
  method: string;
}): SecurityReport {
  return buildReportBase({
    sourceType: "endpoint",
    target: input.target,
    vulnerabilities: input.endpointResult.vulnerabilities,
    checksRun: input.endpointResult.checksRun,
    passCount: input.endpointResult.passCount,
    failCount: input.endpointResult.failCount,
    metadata: {
      method: input.method,
      tests: input.endpointResult.tests,
    },
  });
}
