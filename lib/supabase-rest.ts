import "server-only";

export type TamvMember = {
  id: string;
  tamv_id: string;
  auth0_sub: string;
  email: string;
  email_verified: boolean;
  display_name: string;
  bio: string | null;
  affiliation: string | null;
  country_code: string | null;
  research_areas: string[];
  profile_visibility: "private" | "public";
  public_profile_consent: boolean;
  membership_status: "pending_review" | "approved" | "suspended" | "rejected";
  terms_version: string;
  terms_accepted_at: string;
  privacy_version: string;
  privacy_accepted_at: string;
  created_at: string;
  updated_at: string;
};

export type TamvMemberIdentifier = {
  scheme: "ORCID" | "ISNI" | "GITHUB" | "WEBSITE";
  value: string;
  normalized_value: string;
  verification_status: "declared" | "pending" | "verified" | "rejected";
  verified_at: string | null;
};

export type RegisterMemberInput = {
  auth0Sub: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  bio: string | null;
  affiliation: string | null;
  countryCode: string | null;
  researchAreas: string[];
  profileVisibility: "private" | "public";
  publicProfileConsent: boolean;
  termsVersion: string;
  privacyVersion: string;
  identifiers: Array<{ scheme: TamvMemberIdentifier["scheme"]; value: string; normalized_value: string }>;
};

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server configuration is missing.");
    this.name = "SupabaseConfigurationError";
  }
}

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
  if (!url || !key) throw new SupabaseConfigurationError();
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") throw new SupabaseConfigurationError();
  return { url: parsed.origin, key };
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`Supabase request failed with status ${response.status}.`);
    Object.assign(error, { status: response.status, detail: body.slice(0, 1000) });
    throw error;
  }
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

export async function registerTamvMember(input: RegisterMemberInput) {
  const rows = await supabaseFetch<Array<Pick<TamvMember, "tamv_id" | "display_name" | "membership_status" | "profile_visibility" | "created_at" | "updated_at">>>(
    "rpc/tamv_register_member",
    { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({
      p_auth0_sub: input.auth0Sub,
      p_email: input.email,
      p_email_verified: input.emailVerified,
      p_display_name: input.displayName,
      p_bio: input.bio,
      p_affiliation: input.affiliation,
      p_country_code: input.countryCode,
      p_research_areas: input.researchAreas,
      p_profile_visibility: input.profileVisibility,
      p_public_profile_consent: input.publicProfileConsent,
      p_terms_version: input.termsVersion,
      p_privacy_version: input.privacyVersion,
      p_identifiers: input.identifiers,
    }) },
  );
  if (!Array.isArray(rows) || !rows[0]?.tamv_id) throw new Error("Supabase did not return the registered TAMV ID.");
  return rows[0];
}

export async function getMemberByAuth0Sub(sub: string): Promise<TamvMember | null> {
  const rows = await supabaseFetch<TamvMember[]>(
    `tamv_members?select=id,tamv_id,auth0_sub,email,email_verified,display_name,bio,affiliation,country_code,research_areas,profile_visibility,public_profile_consent,membership_status,terms_version,terms_accepted_at,privacy_version,privacy_accepted_at,created_at,updated_at&auth0_sub=eq.${encodeURIComponent(sub)}&limit=1`,
  );
  return rows[0] || null;
}

export async function getPublicMember(tamvId: string) {
  const rows = await supabaseFetch<Array<Pick<TamvMember, "tamv_id" | "display_name" | "bio" | "affiliation" | "country_code" | "research_areas" | "created_at" | "updated_at">>>(
    `tamv_members?select=tamv_id,display_name,bio,affiliation,country_code,research_areas,created_at,updated_at&tamv_id=eq.${encodeURIComponent(tamvId)}&membership_status=eq.approved&profile_visibility=eq.public&public_profile_consent=eq.true&limit=1`,
  );
  if (!rows[0]) return null;
  const identifiers = await supabaseFetch<TamvMemberIdentifier[]>(
    `tamv_member_identifiers?select=scheme,value,normalized_value,verification_status,verified_at&tamv_id=eq.${encodeURIComponent(tamvId)}&scheme=in.(ORCID,ISNI,GITHUB,WEBSITE)&limit=20`,
  );
  return { ...rows[0], identifiers: identifiers || [] };
}

export async function getIdentifiers(tamvId: string): Promise<TamvMemberIdentifier[]> {
  return supabaseFetch<TamvMemberIdentifier[]>(
    `tamv_member_identifiers?select=scheme,value,normalized_value,verification_status,verified_at&tamv_id=eq.${encodeURIComponent(tamvId)}&order=scheme.asc&limit=20`,
  );
}

export async function deleteTamvMember(auth0Sub: string): Promise<string | null> {
  const rows = await supabaseFetch<Array<{ tamv_id: string }>>("rpc/tamv_delete_member", {
    method: "POST",
    body: JSON.stringify({ p_auth0_sub: auth0Sub }),
  });
  return rows[0]?.tamv_id || null;
}
