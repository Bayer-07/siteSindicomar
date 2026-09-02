import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminModule } from "@/components/admin-module";
import { getVerifiedAdmin } from "@/lib/auth";
import { getDatabase, isDatabaseConfigured } from "@/lib/db";
import { agendaItems, collectiveDocuments, directors, pages, partners, posts, services, siteSettings, submissions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

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

const dbTables = { documentos: collectiveDocuments, agenda: agendaItems, noticias: posts, conteudo: pages, servicos: services, institucional: directors, parceiros: partners, solicitacoes: submissions, configuracoes: siteSettings } as const;

function toAdminRecord(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), value instanceof Date ? value.toISOString() : value]));
}

export function generateStaticParams() { return Object.keys(sections).map((section) => ({ section })); }

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  if (!isDatabaseConfigured()) redirect("/admin/login");
  const user = await getVerifiedAdmin();
  if (!user) redirect("/admin/login");
  const sectionKey = (await params).section as keyof typeof sections;
  const config = sections[sectionKey]; if (!config) notFound();
  const db = getDatabase();
  const dbTable = dbTables[sectionKey];
  const records = db ? await db.select().from(dbTable).orderBy(desc(dbTable.createdAt)).limit(50) : [];
  return <AdminModule email={user.email} section={sectionKey} table={config.table} title={config.title} description={config.description} records={(records as Record<string, unknown>[]).map(toAdminRecord)} createEnabled={sectionKey !== "solicitacoes"} />;
}
