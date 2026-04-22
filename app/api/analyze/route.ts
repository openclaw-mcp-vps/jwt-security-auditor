import { NextResponse } from "next/server";

import { saveReport } from "@/lib/database";
import { analyzeJwtImplementation } from "@/lib/jwt-analyzer";
import { generateCodeReport } from "@/lib/report-generator";
import { UploadedCodeFile } from "@/lib/types";

export const runtime = "nodejs";

function sanitizeFileInput(input: unknown): UploadedCodeFile[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((candidate) => {
      const file = candidate as { name?: unknown; content?: unknown };
      const name = typeof file.name === "string" ? file.name.trim() : "";
      const content = typeof file.content === "string" ? file.content : "";
      return {
        name,
        content,
      };
    })
    .filter((file) => file.name.length > 0 && file.content.length > 0)
    .slice(0, 40);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { files?: unknown };
    const files = sanitizeFileInput(payload.files);

    if (files.length === 0) {
      return NextResponse.json({ error: "No valid files were provided for analysis." }, { status: 400 });
    }

    const analysis = analyzeJwtImplementation(files);
    const report = generateCodeReport({
      target: `${files.length} uploaded file${files.length > 1 ? "s" : ""}`,
      analyzeResult: analysis,
    });

    await saveReport(report);

    return NextResponse.json({
      id: report.id,
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze files.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
