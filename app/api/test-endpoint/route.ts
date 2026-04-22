import { NextResponse } from "next/server";

import { saveReport } from "@/lib/database";
import { generateEndpointReport } from "@/lib/report-generator";
import { isSafePublicUrl, runEndpointSecurityTests } from "@/lib/security-tests";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      endpoint?: string;
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: unknown;
      headers?: Record<string, string>;
    };

    const endpoint = payload.endpoint?.trim() || "";
    const method = payload.method || "GET";

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint URL is required." }, { status: 400 });
    }

    if (!isSafePublicUrl(endpoint)) {
      return NextResponse.json(
        { error: "Endpoint must be a public HTTP/HTTPS URL. Local and private network targets are blocked." },
        { status: 400 },
      );
    }

    const endpointResult = await runEndpointSecurityTests({
      endpoint,
      method,
      body: payload.body,
      headers: payload.headers,
    });

    const report = generateEndpointReport({
      target: endpoint,
      method,
      endpointResult,
    });

    await saveReport(report);

    return NextResponse.json({
      id: report.id,
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to test endpoint.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
