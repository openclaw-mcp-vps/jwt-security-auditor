import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE_NAME, createAccessGrant } from "@/lib/lemonsqueezy";

const accessSchema = z.object({
  orderId: z.string().trim().min(3, "Order ID is required"),
  email: z.string().trim().email().optional()
});

export async function POST(request: NextRequest) {
  const parsed = accessSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const token = createAccessGrant({
    orderId: parsed.data.orderId,
    email: parsed.data.email
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    maxAge: 60 * 60 * 24 * 31,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return response;
}
