import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_COOKIE_NAME, validateAccessGrant } from "@/lib/lemonsqueezy";
import { analyzeJwtToken } from "@/lib/jwt-analyzer";

const payloadSchema = z.object({
  token: z.string().trim().min(10, "JWT token is required"),
  expectedIssuer: z.string().trim().optional(),
  expectedAudience: z.string().trim().optional(),
  expectedAlgorithm: z.string().trim().optional()
});

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!validateAccessGrant(accessCookie)) {
    return NextResponse.json({ error: "Pro access required." }, { status: 402 });
  }

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const result = analyzeJwtToken(parsed.data.token, {
    expectedIssuer: parsed.data.expectedIssuer,
    expectedAudience: parsed.data.expectedAudience,
    expectedAlgorithm: parsed.data.expectedAlgorithm
  });

  return NextResponse.json(result);
}
