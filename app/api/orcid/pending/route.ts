import { NextResponse } from "next/server";
import { cookieOptions, getAppBaseUrl } from "@/lib/auth0-native";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pendingOrcidCookieName = () => process.env.NODE_ENV === "production" ? "__Host-tamv_orcid_pending" : "tamv_orcid_pending";

export async function GET(request: Request) {
  let baseUrl: string;
  try { baseUrl = getAppBaseUrl(request.url); }
  catch { baseUrl = new URL(request.url).origin; }
  const response = NextResponse.redirect(new URL("/registro", baseUrl));
  response.cookies.set(pendingOrcidCookieName(), "", { ...cookieOptions(0), expires: new Date(0) });
  response.headers.set("cache-control", "no-store");
  return response;
}
