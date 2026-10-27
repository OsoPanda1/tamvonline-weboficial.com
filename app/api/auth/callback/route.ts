import { NextResponse } from "next/server";
import {
  auth0Config, cookieOptions, openPayload, safeReturnTo, sealPayload, secureEquals,
  sessionCookieName, transactionCookieName, verifyAuth0IdToken, type OAuthTransaction,
} from "@/lib/auth0-native";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let baseUrl: string;
  try {
    baseUrl = auth0Config(request.url).appBaseUrl;
  } catch {
    return NextResponse.json({ error: "La autenticación no está configurada." }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  const clearTransaction = (response: NextResponse) => {
    response.cookies.set(transactionCookieName(), "", { ...cookieOptions(0), expires: new Date(0) });
    return response;
  };

  if (url.searchParams.has("error")) {
    return clearTransaction(NextResponse.redirect(new URL("/registro?error=login_cancelled", baseUrl)));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const encryptedTransaction = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(transactionCookieName() + "="))?.slice(transactionCookieName().length + 1);
  const transaction = openPayload<OAuthTransaction>(encryptedTransaction);

  if (!code || !state || !transaction || Date.now() - transaction.createdAt > 10 * 60 * 1000 || Date.now() < transaction.createdAt || !secureEquals(state, transaction.state)) {
    return clearTransaction(NextResponse.redirect(new URL("/registro?error=invalid_oauth_state", baseUrl)));
  }

  try {
    const config = auth0Config(request.url);
    const tokenResponse = await fetch(`https://${config.domain}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: `${config.appBaseUrl}/api/auth/callback`,
        code_verifier: transaction.verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!tokenResponse.ok) {
      return clearTransaction(NextResponse.redirect(new URL("/registro?error=token_exchange_failed", baseUrl)));
    }

    const tokenData = await tokenResponse.json() as { id_token?: string };
    if (!tokenData.id_token) {
      return clearTransaction(NextResponse.redirect(new URL("/registro?error=missing_identity_token", baseUrl)));
    }

    const session = await verifyAuth0IdToken(tokenData.id_token, config, transaction.nonce);
    const response = NextResponse.redirect(new URL(safeReturnTo(transaction.returnTo), baseUrl));
    response.cookies.set(sessionCookieName(), sealPayload(session), cookieOptions(8 * 60 * 60));
    response.cookies.set(transactionCookieName(), "", { ...cookieOptions(0), expires: new Date(0) });
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    return clearTransaction(NextResponse.redirect(new URL("/registro?error=authentication_failed", baseUrl)));
  }
}
