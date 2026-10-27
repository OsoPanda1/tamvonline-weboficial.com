import { NextResponse } from "next/server";
import { cookieOptions, readSessionFromCookie, sameOriginRequest, sessionCookieName } from "@/lib/auth0-native";
import { deleteTamvMember, getIdentifiers, getMemberByAuth0Sub, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(sessionCookieName() + "="))?.slice(sessionCookieName().length + 1);
  return readSessionFromCookie(cookie);
}

export async function GET(request: Request) {
  const session = sessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401, headers: { "cache-control": "no-store" } });
  try {
    const member = await getMemberByAuth0Sub(session.sub);
    if (!member) return NextResponse.json({ registered: false, identity: { name: session.name, email: session.email, emailVerified: session.emailVerified } }, { headers: { "cache-control": "no-store, private" } });
    const identifiers = await getIdentifiers(member.tamv_id);
    return NextResponse.json({
      registered: true,
      member: {
        tamvId: member.tamv_id, displayName: member.display_name, email: member.email,
        emailVerified: member.email_verified, bio: member.bio, affiliation: member.affiliation,
        countryCode: member.country_code, researchAreas: member.research_areas,
        profileVisibility: member.profile_visibility, publicProfileConsent: member.public_profile_consent,
        membershipStatus: member.membership_status, termsVersion: member.terms_version,
        privacyVersion: member.privacy_version, createdAt: member.created_at, updatedAt: member.updated_at,
        identifiers,
      },
    }, { headers: { "cache-control": "no-store, private" } });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
    console.error("TAMV member lookup failed");
    return NextResponse.json({ error: "No fue posible consultar tu ficha en este momento." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  const session = sessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  try {
    const tamvId = await deleteTamvMember(session.sub);
    const response = NextResponse.json({ ok: true, withdrawnTamvId: tamvId, note: "Se eliminaron los datos de perfil de TAMV y se retiraron los identificadores declarados. El proveedor de identidad Auth0 mantiene la cuenta hasta que se gestione por separado." }, { headers: { "cache-control": "no-store" } });
    response.cookies.set(sessionCookieName(), "", { ...cookieOptions(0), expires: new Date(0) });
    return response;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
    console.error("TAMV member deletion failed");
    return NextResponse.json({ error: "No fue posible completar la solicitud de supresión." }, { status: 500 });
  }
}
