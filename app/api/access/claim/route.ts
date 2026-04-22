import { NextResponse } from "next/server";

import { createAccessToken, getAccessCookieMaxAge, getAccessCookieName } from "@/lib/access";
import { hasPurchase } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string };
    const email = (payload.email || "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const purchased = await hasPurchase(email);
    if (!purchased) {
      return NextResponse.json(
        {
          error: "No paid subscription found for that email yet. Confirm checkout is complete, then retry.",
        },
        { status: 403 },
      );
    }

    const token = createAccessToken(email);
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: getAccessCookieName(),
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getAccessCookieMaxAge(),
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to claim access.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
