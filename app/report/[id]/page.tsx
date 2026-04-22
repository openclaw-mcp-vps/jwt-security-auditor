import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SecurityReport } from "@/components/security-report";
import { getReportById } from "@/lib/database";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    return {
      title: "Report Not Found | JWT Security Auditor",
    };
  }

  return {
    title: `${report.grade} Grade Report | JWT Security Auditor`,
    description: report.summary,
    openGraph: {
      title: `${report.grade} Grade Report | JWT Security Auditor`,
      description: report.summary,
    },
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  return <SecurityReport report={report} />;
}
