import { createCipheriv, createDecipheriv, createHash, createPublicKey, randomBytes, timingSafeEqual, verify } from "node:crypto";

export type TamvAuthSession = {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  issuedAt: number;
  expiresAt: number;
};

export type OAuthTransaction = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  createdAt: number;
};

type Auth0Config = { domain: string; clientId: string; clientSecret: string; appBaseUrl: string };
type JwtHeader = { alg?: string; kid?: string; typ?: string };
type IdTokenClaims = {
  iss?: string; aud?: string | string[]; azp?: string; sub?: string; exp?: number; iat?: number;
  nbf?: number; nonce?: string; email?: string; email_verified?: boolean; name?: string; picture?: string;
};

let jwksCache: { expiresAt: number; keys: Array<Record<string, unknown>> } | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getAuth0Domain(): string {
  const raw = requiredEnv("AUTH0_DOMAIN").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!/^[a-zA-Z0-9.-]+(?::\d+)?$/.test(raw) || raw.includes("..")) throw new Error("AUTH0_DOMAIN must be a hostname, without a path.");
  return raw;
}

export function getAppBaseUrl(requestUrl?: string): string {
  const env = process.env.VERCEL_ENV;
  const previewHost = process.env.VERCEL_URL?.trim();
  if (env === "preview" && previewHost) return new URL(`https://${previewHost}`).origin;
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("APP_BASE_URL must use HTTPS in production.");
    return parsed.origin;
  }
  if (process.env.NODE_ENV === "production") {
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (productionHost) return new URL(`https://${productionHost}`).origin;
    throw new Error("Set APP_BASE_URL to the canonical HTTPS domain.");
  }
  return requestUrl ? new URL(requestUrl).origin : "http://localhost:3000";
}

export function auth0Config(requestUrl?: string): Auth0Config {
  return {
    domain: getAuth0Domain(),
    clientId: requiredEnv("AUTH0_CLIENT_ID"),
    clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),
    appBaseUrl: getAppBaseUrl(requestUrl),
  };
}

function secretKey(): Buffer {
  const secret = requiredEnv("AUTH0_SECRET");
  if (Buffer.byteLength(secret, "utf8") < 32) throw new Error("AUTH0_SECRET must contain at least 32 bytes.");
  return createHash("sha256").update(secret, "utf8").digest();
}

export function sealPayload(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function openPayload<T>(value: string | undefined | null): T | null {
  if (!value || value.length > 16_384) return null;
  const pieces = value.split(".");
  if (pieces.length !== 3) return null;
  try {
    const iv = Buffer.from(pieces[0], "base64url");
    const tag = Buffer.from(pieces[1], "base64url");
    const ciphertext = Buffer.from(pieces[2], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) return null;
    const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    return JSON.parse(plaintext) as T;
  } catch {
    return null;
  }
}

export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-tamv_session" : "tamv_session";
}

export function transactionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-tamv_tx" : "tamv_tx";
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function safeReturnTo(value: string | null | undefined): string {
  const candidate = (value || "/cuenta").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\") || candidate.length > 512) return "/cuenta";
  try {
    const parsed = new URL(candidate, "https://tamv.invalid");
    if (parsed.origin !== "https://tamv.invalid") return "/cuenta";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/cuenta";
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function secureEquals(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function decodeJwtPart<T>(value: string): T {
  if (!value || value.length > 24_000) throw new Error("Invalid ID token.");
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

async function getSigningKey(kid: string, domain: string): Promise<Record<string, unknown>> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) {
    const cached = jwksCache.keys.find((key) => key.kid === kid && key.kty === "RSA" && key.use === "sig");
    if (cached) return cached;
  }
  const response = await fetch(`https://${domain}/.well-known/jwks.json`, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Could not retrieve the identity provider signing keys.");
  const json = await response.json() as { keys?: Array<Record<string, unknown>> };
  if (!Array.isArray(json.keys) || json.keys.length > 30) throw new Error("Invalid identity provider key set.");
  jwksCache = { keys: json.keys, expiresAt: Date.now() + 60 * 60 * 1000 };
  const key = json.keys.find((candidate) => candidate.kid === kid && candidate.kty === "RSA" && candidate.use === "sig");
  if (!key) throw new Error("The signing key was not found.");
  return key;
}

export async function verifyAuth0IdToken(
  token: string,
  config: Auth0Config,
  expectedNonce: string,
): Promise<TamvAuthSession> {
  const segments = token.split(".");
  if (segments.length !== 3) throw new Error("Invalid identity token.");
  const header = decodeJwtPart<JwtHeader>(segments[0]);
  const claims = decodeJwtPart<IdTokenClaims>(segments[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported identity token signing algorithm.");
  const signingKey = await getSigningKey(header.kid, config.domain);
  const publicKey = createPublicKey({ key: signingKey as never, format: "jwk" });
  const validSignature = verify(
    "RSA-SHA256",
    Buffer.from(`${segments[0]}.${segments[1]}`, "utf8"),
    publicKey,
    Buffer.from(segments[2], "base64url"),
  );
  if (!validSignature) throw new Error("Invalid identity token signature.");

  const now = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://${config.domain}/`;
  const audiences = Array.isArray(claims.aud) ? claims.audiences ?? claims.aud : [claims.aud];
  if (claims.iss !== expectedIssuer) throw new Error("Invalid identity token issuer.");
  if (!audiences.includes(config.clientId)) throw new Error("Invalid identity token audience.");
  if (audiences.length > 1 && claims.azp !== config.clientId) throw new Error("Invalid authorized party.");
  if (!Number.isFinite(claims.exp) || Number(claims.exp) <= now) throw new Error("Identity token has expired.");
  if (!Number.isFinite(claims.iat) || Number(claims.iat) > now + 300) throw new Error("Invalid identity token issue time.");
  if (claims.nbf !== undefined && Number(claims.nbf) > now + 30) throw new Error("Identity token is not yet valid.");
  if (!claims.sub || claims.sub.length > 255) throw new Error("Identity token has no valid subject.");
  if (!claims.nonce || !secureEquals(claims.nonce, expectedNonce)) throw new Error("Identity token nonce mismatch.");

  return {
    sub: claims.sub,
    email: typeof claims.email === "string" ? claims.email.slice(0, 320) : null,
    emailVerified: claims.email_verified === true,
    name: typeof claims.name === "string" ? claims.name.slice(0, 200) : null,
    picture: typeof claims.picture === "string" && claims.picture.startsWith("https://") ? claims.picture.slice(0, 1000) : null,
    issuedAt: now,
    expiresAt: now + 8 * 60 * 60,
  };
}

export function readSessionFromCookie(value: string | undefined | null): TamvAuthSession | null {
  const session = openPayload<TamvAuthSession>(value);
  if (!session || typeof session.sub !== "string" || !session.sub || !Number.isFinite(session.expiresAt)) return null;
  if (session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
  if (typeof session.emailVerified !== "boolean") return null;
  return session;
}

export async function currentServerSession(): Promise<TamvAuthSession | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return readSessionFromCookie(jar.get(sessionCookieName())?.value);
}

export function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
