export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface UploadedCodeFile {
  name: string;
  content: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  description: string;
  impact: string;
  recommendation: string;
  source: "static" | "dynamic";
  filePath?: string;
  line?: number;
  evidence?: string;
}

export interface EndpointTestOutcome {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  statusCode?: number;
  details: string;
  vulnerability?: Vulnerability;
}

export interface SecurityReport {
  id: string;
  createdAt: string;
  sourceType: "code" | "endpoint";
  target: string;
  grade: "A" | "B" | "C" | "D" | "F";
  score: number;
  summary: string;
  checksRun: number;
  passCount: number;
  failCount: number;
  vulnerabilities: Vulnerability[];
  recommendations: string[];
  chartData: Array<{ name: string; value: number }>;
  metadata?: Record<string, unknown>;
}

export interface AnalyzeResult {
  vulnerabilities: Vulnerability[];
  checksRun: number;
  passCount: number;
  failCount: number;
  fileFingerprints: Array<{ file: string; sha256: string }>;
}

export interface EndpointTestResult {
  vulnerabilities: Vulnerability[];
  tests: EndpointTestOutcome[];
  checksRun: number;
  passCount: number;
  failCount: number;
}
