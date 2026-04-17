import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { FullScanReport, JwtAnalysisResult, SecurityTestResult } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const REPORT_FILE = path.join(DATA_DIR, "reports.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(REPORT_FILE);
  } catch {
    await fs.writeFile(REPORT_FILE, "[]", "utf8");
  }
}

async function loadReports(): Promise<FullScanReport[]> {
  await ensureStore();
  const raw = await fs.readFile(REPORT_FILE, "utf8");
  try {
    return JSON.parse(raw) as FullScanReport[];
  } catch {
    return [];
  }
}

async function saveReports(reports: FullScanReport[]) {
  await fs.writeFile(REPORT_FILE, JSON.stringify(reports, null, 2), "utf8");
}

function computeRiskScore(vulnCount: number, failedTests: number): number {
  const score = Math.min(100, vulnCount * 12 + failedTests * 10);
  return Math.max(0, score);
}

export async function createScanReport(params: {
  token?: string;
  endpoint?: string;
  analysis: JwtAnalysisResult;
  endpointTests: SecurityTestResult[];
}): Promise<FullScanReport> {
  const reports = await loadReports();
  const failedTests = params.endpointTests.filter((test) => !test.passed).length;
  const riskScore = computeRiskScore(params.analysis.vulnerabilities.length, failedTests);

  const recommendations = [
    ...params.analysis.vulnerabilities.map((vuln) => vuln.fix),
    ...params.endpointTests.filter((test) => !test.passed).map((test) => `Fix test failure: ${test.name}. ${test.detail}`)
  ].slice(0, 8);

  const report: FullScanReport = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input: {
      token: params.token,
      endpoint: params.endpoint
    },
    analysis: params.analysis,
    endpointTests: params.endpointTests,
    riskScore,
    recommendations: recommendations.length > 0
      ? recommendations
      : ["No immediate changes required, but continue periodic auth regression testing."]
  };

  reports.unshift(report);
  await saveReports(reports.slice(0, 200));

  return report;
}

export async function getScanReportById(id: string): Promise<FullScanReport | null> {
  const reports = await loadReports();
  return reports.find((report) => report.id === id) ?? null;
}
