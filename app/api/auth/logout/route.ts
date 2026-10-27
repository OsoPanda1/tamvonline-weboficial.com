import { NextResponse } from "next/server";
import { auth0Config, cookieOptions, sessionCookieName } from "@/lib/auth0-native";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const responseTarget = "/";
  try {
    const config = auth0Config(request.url);
    const logoutUrl = new URL(`https://${config.domain}/v2/logout`);
    logoutUrl.searchParams.set("client_id", config.clientId);
    logoutUrl.searchParams.set("returnTo", `${config.appBaseUrl}${responseTarget}`);
    const response = NextResponse.redirect(logoutUrl);
    response.cookies.set(sessionCookieName(), "", { ...cookieOptions(0), expires: new Date(0) });
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    const fallback = new URL("/", request.url);
    const response = NextResponse.redirect(fallback);
    response.cookies.set(sessionCookieName(), "", { ...cookieOptions(0), expires: new Date(0) });
    return response;
  }
}
