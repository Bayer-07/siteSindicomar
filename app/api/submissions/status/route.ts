import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const protocolPattern = /^SIN-\d{8}-[A-F0-9]{6}$/i;

export async function GET(request: Request) {
  const protocol = new URL(request.url).searchParams.get("protocol")?.trim().toUpperCase() ?? "";
  if (!protocolPattern.test(protocol)) return NextResponse.json({ message: "Informe um protocolo válido." }, { status: 400 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ message: "A consulta está temporariamente indisponível." }, { status: 503 });

  const { data, error } = await createSupabaseAdminClient()
    .from("submissions")
    .select("protocol,kind,status,created_at,updated_at")
    .eq("protocol", protocol)
    .maybeSingle();

  if (error) return NextResponse.json({ message: "Não foi possível consultar o protocolo agora." }, { status: 503 });
  if (!data) return NextResponse.json({ message: "Protocolo não encontrado. Confira os dados e tente novamente." }, { status: 404 });

  return NextResponse.json({
    protocol: data.protocol,
    kind: data.kind,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }, { headers: { "Cache-Control": "no-store" } });
}
