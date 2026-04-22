"use client";

import Link from "next/link";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, CheckCircle2, CircleX, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecurityReport as SecurityReportType } from "@/lib/types";
import { VulnerabilityCard } from "@/components/vulnerability-card";

interface SecurityReportProps {
  report: SecurityReportType;
}

const colorBySeverity: Record<string, string> = {
  Critical: "#f43f5e",
  High: "#fb923c",
  Medium: "#f59e0b",
  Low: "#38bdf8",
  Info: "#2dd4bf",
};

export function SecurityReport({ report }: SecurityReportProps) {
  const metadataTests = Array.isArray((report.metadata as { tests?: unknown[] } | undefined)?.tests)
    ? ((report.metadata as { tests?: Array<{ title: string; passed: boolean; statusCode?: number; details: string }> })
        .tests ?? [])
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">JWT Security Report</p>
          <h1 className="text-3xl font-semibold text-slate-100 md:text-4xl">{report.target}</h1>
          <p className="mt-2 text-sm text-slate-400">Generated {new Date(report.createdAt).toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/audit" className="inline-flex">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Run Another Audit
            </Button>
          </Link>
          <Badge variant={report.score < 70 ? "high" : "low"}>Grade {report.grade}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Security Score</CardDescription>
            <CardTitle className="text-3xl text-cyan-300">{report.score}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">{report.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Checks</CardDescription>
            <CardTitle className="text-3xl">{report.checksRun}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400">Static and dynamic checks executed.</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Passed</CardDescription>
            <CardTitle className="text-3xl text-emerald-300">{report.passCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400">Controls that correctly blocked bypasses.</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-rose-300">{report.failCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400">Findings requiring remediation before release.</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>Severity breakdown across all detected vulnerabilities.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.chartData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} axisLine={{ stroke: "#334155" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#94a3b8" }} axisLine={{ stroke: "#334155" }} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(30,41,59,0.3)" }}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #334155",
                  backgroundColor: "#020617",
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {report.chartData.map((entry) => (
                  <Cell key={entry.name} fill={colorBySeverity[entry.name] || "#38bdf8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Fix Order</CardTitle>
          <CardDescription>Apply these remediations in order of exploitability and blast radius.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.recommendations.length === 0 ? (
            <p className="text-sm text-emerald-300">No active vulnerabilities were found in this run.</p>
          ) : (
            <ol className="space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <li key={recommendation} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
                  <span className="mr-2 text-cyan-300">{index + 1}.</span>
                  {recommendation}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {metadataTests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Probe Results</CardTitle>
            <CardDescription>Each probe attempts a JWT auth bypass pattern.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metadataTests.map((test) => (
              <div key={test.title} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-100">
                  {test.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <CircleX className="h-4 w-4 text-rose-300" />
                  )}
                  {test.title}
                </p>
                <p className="text-xs text-slate-400">{test.details}</p>
                {typeof test.statusCode === "number" ? (
                  <p className="mt-1 text-xs text-slate-500">HTTP status: {test.statusCode}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-slate-100">
          <Shield className="h-5 w-5 text-cyan-300" />
          Vulnerabilities
        </h2>

        {report.vulnerabilities.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-emerald-300">
              No vulnerabilities detected in this scan scope.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {report.vulnerabilities.map((vulnerability) => (
              <VulnerabilityCard key={vulnerability.id} vulnerability={vulnerability} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
