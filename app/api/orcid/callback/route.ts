import { NextResponse } from "next/server";
import {
  cookieOptions, getAppBaseUrl, openPayload, readSessionFromCookie,
  safeReturnTo, secureEquals, sealPayload, sessionCookieName,
} from "@/lib/auth0-native";
import { getMemberByAuth0Sub, linkVerifiedOrcidIdentity, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrcidTransaction = {
  state: string;
  auth0Sub: string | null;
  returnTo: string;
  createdAt: number;
  mode: "link" | "signup";
};
type PendingOrcid = { orcid: string; createdAt: number; returnTo: string };
type OrcidTokenResponse = { orcid?: string; name?: string; access_token?: string; token_type?: string; scope?: string; expires_in?: number };
const transactionCookieName = () => process.env.NODE_ENV === "production" ? "__Host-tamv_orcid_tx" : "tamv_orcid_tx";
export const pendingOrcidCookieName = () => process.env.NODE_ENV === "production" ? "__Host-tamv_orcid_pending" : "tamv_orcid_pending";

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map(item => item.trim())
    .find(item => item.startsWith(sessionCookieName() + "="))
    ?.slice(sessionCookieName().length + 1);
  return readSessionFromCookie(cookie);
}
function canonicalOrcid(value: string): string | null {
  const raw = value.trim().replace(/^https?:\/\/(www\.)?orcid\.org\//i, "").replace(/[\s-]/g, "").toUpperCase();
  if (!/^\d{15}[\dX]$/.test(raw)) return null;
  let total = 0;
  for (const digit of raw.slice(0, 15)) total = (total + Number(digit)) * 2;
  const result = (12 - (total % 11)) % 11;
  const check = result === 10 ? "X" : String(result);
  if (check !== raw[15]) return null;
  return "https://orcid.org/" + raw.slice(0, 4) + "-" + raw.slice(4, 8) + "-" + raw.slice(8, 12) + "-" + raw.slice(12);
}
function statusUrl(baseUrl: string, returnTo: string, key: "orcid" | "error", value: string) {
  const destination = new URL(safeReturnTo(returnTo), baseUrl);
  destination.searchParams.set(key, value);
  return destination;
}
function clearTransaction(response: NextResponse) {
  response.cookies.set(transactionCookieName(), "", { ...cookieOptions(0), expires: new Date(0) });
  response.headers.set("cache-control", "no-store");
  return response;
}

export async function GET(request: Request) {
  let baseUrl: string;
  try { baseUrl = getAppBaseUrl(request.url); }
  catch { return NextResponse.json({ error: "ORCID callback requires a configured HTTPS application base URL." }, { status: 503, headers: { "cache-control": "no-store" } }); }

  const url = new URL(request.url);
  const encrypted = request.headers.get("cookie")?.split(";").map(item => item.trim())
    .find(item => item.startsWith(transactionCookieName() + "="))
    ?.slice(transactionCookieName().length + 1);
  const transaction = openPayload<OrcidTransaction>(encrypted);
  const destination = transaction?.returnTo || "/registro";
  const redirectFailure = (error: string, returnTo = destination) => clearTransaction(NextResponse.redirect(statusUrl(baseUrl, returnTo, "error", error)));

  if (url.searchParams.has("error")) {
    const cancelled = url.searchParams.get("error") === "access_denied";
    return redirectFailure(cancelled ? (transaction?.mode === "signup" ? "orcid_signup_cancelled" : "cancelled") : "authorization_failed", transaction?.mode === "signup" ? "/registro" : "/cuenta");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !transaction || !["link", "signup"].includes(transaction.mode)
      || Date.now() - transaction.createdAt > 10 * 60 * 1000 || Date.now() < transaction.createdAt
      || !secureEquals(state, transaction.state)) {
    return redirectFailure("state_failed", "/registro");
  }

  const session = sessionFromRequest(request);
  if (transaction.mode === "link") {
    if (!session || !session.emailVerified || !transaction.auth0Sub || session.sub !== transaction.auth0Sub) {
      return redirectFailure("session_changed", transaction.returnTo);
    }
  }

  const clientId = process.env.ORCID_CLIENT_ID?.trim();
  const clientSecret = process.env.ORCID_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return redirectFailure("unconfigured", transaction.mode === "signup" ? "/registro" : transaction.returnTo);

  try {
    const tokenResponse = await fetch("https://orcid.org/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code,
        redirect_uri: baseUrl + "/api/orcid/callback",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenResponse.ok) return redirectFailure("exchange_failed", transaction.mode === "signup" ? "/registro" : transaction.returnTo);
    const token = await tokenResponse.json() as OrcidTokenResponse;
    // ORCID is authenticated by the OAuth code exchange. Its access token is never stored.
    const orcid = canonicalOrcid(token.orcid || "");
    if (!orcid) return redirectFailure("invalid_identity", transaction.mode === "signup" ? "/registro" : transaction.returnTo);

    if (transaction.mode === "signup") {
      const pending: PendingOrcid = { orcid, createdAt: Date.now(), returnTo: "/registro" };
      const response = clearTransaction(NextResponse.redirect(statusUrl(baseUrl, "/registro", "orcid", "pending")));
      response.cookies.set(pendingOrcidCookieName(), sealPayload(pending), cookieOptions(30 * 60));
      return response;
    }

    const member = await getMemberByAuth0Sub(session!.sub);
    if (!member) return redirectFailure("requires_tamv_id", transaction.returnTo);
    await linkVerifiedOrcidIdentity(session!.sub, orcid);
    return clearTransaction(NextResponse.redirect(statusUrl(baseUrl, transaction.returnTo, "orcid", "connected")));
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return redirectFailure("database_unconfigured", transaction.mode === "signup" ? "/registro" : transaction.returnTo);
    console.error("ORCID OAuth callback failed");
    return redirectFailure("link_failed", transaction.mode === "signup" ? "/registro" : transaction.returnTo);
  }
}
