import { NextResponse } from "next/server";
import { getPublicMember, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ tamvId: string }> }) {
  const { tamvId: rawId } = await context.params;
  const tamvId = rawId.toUpperCase();
  if (!/^TAMV-[0-9A-F]{26}$/.test(tamvId)) {
    return NextResponse.json({ error: "Identificador TAMV con formato inválido." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  try {
    const member = await getPublicMember(tamvId);
    if (!member) return NextResponse.json({ error: "No existe una ficha pública aprobada para ese identificador." }, { status: 404, headers: { "cache-control": "no-store" } });
    return NextResponse.json({ member }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
    console.error("TAMV public resolver failed");
    return NextResponse.json({ error: "No fue posible resolver este identificador en este momento." }, { status: 500 });
  }
}
