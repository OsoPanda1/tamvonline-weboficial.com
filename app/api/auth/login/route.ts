import { NextResponse } from "next/server";
import {
  auth0Config, cookieOptions, pkceChallenge, randomToken, safeReturnTo,
  sealPayload, transactionCookieName, type OAuthTransaction,
} from "@/lib/auth0-native";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const config = auth0Config(request.url);
    const incoming = new URL(request.url);
    const state = randomToken(32);
    const nonce = randomToken(32);
    const verifier = randomToken(48);
    const transaction: OAuthTransaction = {
      state, nonce, verifier,
      returnTo: safeReturnTo(incoming.searchParams.get("returnTo")),
      createdAt: Date.now(),
    };

    const authorization = new URL(`https://${config.domain}/authorize`);
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("client_id", config.clientId);
    authorization.searchParams.set("redirect_uri", `${config.appBaseUrl}/api/auth/callback`);
    authorization.searchParams.set("scope", "openid profile email");
    authorization.searchParams.set("state", state);
    authorization.searchParams.set("nonce", nonce);
    authorization.searchParams.set("code_challenge", pkceChallenge(verifier));
    authorization.searchParams.set("code_challenge_method", "S256");
    if (incoming.searchParams.get("screen_hint") === "signup") authorization.searchParams.set("screen_hint", "signup");

    const response = NextResponse.redirect(authorization);
    response.cookies.set(transactionCookieName(), sealPayload(transaction), cookieOptions(600));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Auth0 todavía no está configurado por completo. Verifica las variables del proyecto." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
