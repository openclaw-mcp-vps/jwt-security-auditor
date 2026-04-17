import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_COOKIE_NAME, validateAccessGrant } from "@/lib/lemonsqueezy";
import { analyzeJwtToken } from "@/lib/jwt-analyzer";
import { createScanReport } from "@/lib/report-generator";
import { runEndpointSecurityTests } from "@/lib/security-tests";

const scanPayloadSchema = z
  .object({
    token: z.string().trim().optional(),
    endpoint: z.string().trim().url().optional(),
    expectedIssuer: z.string().trim().optional(),
    expectedAudience: z.string().trim().optional(),
    expectedAlgorithm: z.string().trim().optional()
  })
  .refine((payload) => Boolean(payload.token || payload.endpoint), {
    message: "Provide a token or endpoint to scan."
  });

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!validateAccessGrant(accessCookie)) {
    return NextResponse.json({ error: "Purchase required before scanning." }, { status: 402 });
  }

  const payloadResult = scanPayloadSchema.safeParse(await request.json());
  if (!payloadResult.success) {
    return NextResponse.json({ error: payloadResult.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const payload = payloadResult.data;
  const analysis = payload.token
    ? analyzeJwtToken(payload.token, {
        expectedIssuer: payload.expectedIssuer,
        expectedAudience: payload.expectedAudience,
        expectedAlgorithm: payload.expectedAlgorithm
      })
    : {
        summary: "No token was provided, so token-claim analysis was skipped.",
        vulnerabilities: [],
        tokenMetadata: {}
      };

  const endpointTests = payload.endpoint ? await runEndpointSecurityTests(payload.endpoint) : [];

  const report = await createScanReport({
    token: payload.token,
    endpoint: payload.endpoint,
    analysis,
    endpointTests
  });

  return NextResponse.json({ reportId: report.id });
}
