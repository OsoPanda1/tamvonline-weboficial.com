import { NextResponse } from "next/server";
import {
  cookieOptions, getAppBaseUrl, randomToken, readSessionFromCookie,
  safeReturnTo, sealPayload, sessionCookieName,
} from "@/lib/auth0-native";
import { getMemberByAuth0Sub, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrcidTransaction = {
  state: string;
  auth0Sub: string | null;
  returnTo: string;
  createdAt: number;
  mode: "link" | "signup";
};
const transactionCookieName = () => process.env.NODE_ENV === "production" ? "__Host-tamv_orcid_tx" : "tamv_orcid_tx";

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map(item => item.trim())
    .find(item => item.startsWith(sessionCookieName() + "="))
    ?.slice(sessionCookieName().length + 1);
  return readSessionFromCookie(cookie);
}

export async function GET(request: Request) {
  let baseUrl: string;
  try {
    baseUrl = getAppBaseUrl(request.url);
  } catch {
    return NextResponse.json({ error: "Configura APP_BASE_URL HTTPS para enlazar ORCID." }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  const incoming = new URL(request.url);
  const mode = incoming.searchParams.get("mode") === "signup" ? "signup" : "link";
  const clientId = process.env.ORCID_CLIENT_ID?.trim();
  const clientSecret = process.env.ORCID_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(mode === "signup" ? "/registro?error=orcid_unconfigured" : "/cuenta?orcid=unconfigured", baseUrl));
  }

  const session = sessionFromRequest(request);
  let auth0Sub: string | null = null;
  if (mode === "link") {
    if (!session || !session.email || !session.emailVerified) return NextResponse.redirect(new URL("/registro?error=orcid_link_requires_verified_account", baseUrl));
    try {
      const member = await getMemberByAuth0Sub(session.sub);
      if (!member) return NextResponse.redirect(new URL("/registro?error=orcid_link_requires_tamv_id", baseUrl));
      auth0Sub = session.sub;
    } catch (error) {
      if (error instanceof SupabaseConfigurationError) return NextResponse.redirect(new URL("/cuenta?orcid=database_unconfigured", baseUrl));
      console.error("ORCID link account lookup failed");
      return NextResponse.redirect(new URL("/cuenta?orcid=start_failed", baseUrl));
    }
  }

  const state = randomToken(32);
  const returnTo = safeReturnTo(incoming.searchParams.get("returnTo") || (mode === "signup" ? "/registro" : "/cuenta"));
  const transaction: OrcidTransaction = { state, auth0Sub, returnTo, createdAt: Date.now(), mode };
  const authorization = new URL("https://orcid.org/oauth/authorize");
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", "/authenticate");
  authorization.searchParams.set("redirect_uri", baseUrl + "/api/orcid/callback");
  authorization.searchParams.set("state", state);
  const response = NextResponse.redirect(authorization);
  response.cookies.set(transactionCookieName(), sealPayload(transaction), cookieOptions(600));
  response.headers.set("cache-control", "no-store");
  return response;
}
