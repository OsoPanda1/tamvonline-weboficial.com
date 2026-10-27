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
    const provider = incoming.searchParams.get("provider") || "email";
    if (!["email", "github", "orcid"].includes(provider)) {
      return NextResponse.json({ error: "Proveedor de identidad no permitido." }, { status: 400, headers: { "cache-control": "no-store" } });
    }
    const providerEnv = provider === "github" ? "AUTH0_GITHUB_CONNECTION" : provider === "orcid" ? "AUTH0_ORCID_CONNECTION" : null;
    const connection = providerEnv ? process.env[providerEnv]?.trim() : "";
    if (providerEnv && !connection) {
      const message = provider === "github" ? "GitHub aún no está conectado al tenant Auth0. Configura AUTH0_GITHUB_CONNECTION después de habilitar y probar la conexión en Auth0." : "ORCID aún no está conectado al tenant Auth0. Configura AUTH0_ORCID_CONNECTION después de habilitar y probar la conexión OIDC en Auth0.";
      return NextResponse.redirect(new URL("/registro?error=" + (provider === "github" ? "github_provider_unconfigured" : "orcid_provider_unconfigured"), config.appBaseUrl));
    }
    if (connection && !/^[A-Za-z0-9_.-]{1,128}$/.test(connection)) {
      return NextResponse.json({ error: "La conexión social no cumple el formato permitido." }, { status: 503, headers: { "cache-control": "no-store" } });
    }
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
    if (connection) authorization.searchParams.set("connection", connection);
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
