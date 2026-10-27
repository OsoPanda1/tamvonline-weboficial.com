import { NextResponse } from "next/server";
import { readSessionFromCookie, sessionCookieName } from "@/lib/auth0-native";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(sessionCookieName() + "="))?.slice(sessionCookieName().length + 1);
  const session = readSessionFromCookie(cookie);
  return NextResponse.json({
    authenticated: Boolean(session),
    user: session ? {
      name: session.name,
      email: session.email,
      emailVerified: session.emailVerified,
    } : null,
  }, { headers: { "cache-control": "no-store, private" } });
}
