import Link from "next/link";
import { notFound } from "next/navigation";
import { VulnerabilityReport } from "@/components/vulnerability-report";
import { getScanReportById } from "@/lib/report-generator";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getScanReportById(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Report</h1>
        <Link href="/scan" className="text-sm text-[#9da7b3] underline-offset-4 hover:underline">
          Run another scan
        </Link>
      </div>
      <VulnerabilityReport report={report} />
    </main>
  );
}
