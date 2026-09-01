import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminModule } from "@/components/admin-module";
import { getVerifiedAdmin } from "@/lib/admin-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Módulo administrativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const sections = {
  documentos: { title: "CCTs e documentos", description: "Instrumentos, versões, relações e vigência.", table: "collective_documents" },
  agenda: { title: "Agenda", description: "Feriados, horários especiais, assembleias, cursos e eventos.", table: "agenda_items" },
  noticias: { title: "Notícias", description: "Rascunhos, pré-visualização, publicação e revisões editoriais.", table: "posts" },
  conteudo: { title: "Páginas, serviços e benefícios", description: "Conteúdo institucional e catálogo de soluções.", table: "pages" },
  servicos: { title: "Serviços e benefícios", description: "Elegibilidade, parceiros, exclusividade e validade.", table: "services" },
  institucional: { title: "Diretoria e parceiros", description: "Mandatos, cargos, instituições e validade das parcerias.", table: "directors" },
  parceiros: { title: "Parceiros", description: "Instituições, vigência e links autorizados.", table: "partners" },
  solicitacoes: { title: "Solicitações recebidas", description: "Contatos, enquadramentos, associações e histórico de atendimento.", table: "submissions" },
  configuracoes: { title: "Configurações do site", description: "Canais oficiais, SEO, retenção e parâmetros gerais.", table: "site_settings" },
} as const;

export function generateStaticParams() { return Object.keys(sections).map((section) => ({ section })); }
export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  if (!isSupabaseAdminConfigured()) redirect("/admin/login");
  const user = await getVerifiedAdmin();
  if (!user) redirect("/admin/login");
  const sectionKey = (await params).section as keyof typeof sections;
  const config = sections[sectionKey]; if (!config) notFound();
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from(config.table).select("*").order("created_at", { ascending: false }).limit(50);
  return <AdminModule email={user.email ?? "Administrador"} section={sectionKey} table={config.table} title={config.title} description={config.description} records={(data ?? []) as Record<string, unknown>[]} createEnabled={sectionKey !== "solicitacoes"} />;
}
