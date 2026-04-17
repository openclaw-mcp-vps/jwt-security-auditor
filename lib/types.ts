export type Severity = "critical" | "high" | "medium" | "low";

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  impact: string;
  fix: string;
}

export interface SecurityTestResult {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
  evidence?: string;
}

export interface JwtAnalysisResult {
  summary: string;
  vulnerabilities: Vulnerability[];
  tokenMetadata: Record<string, unknown>;
}

export interface FullScanReport {
  id: string;
  createdAt: string;
  input: {
    token?: string;
    endpoint?: string;
  };
  analysis: JwtAnalysisResult;
  endpointTests: SecurityTestResult[];
  riskScore: number;
  recommendations: string[];
}
