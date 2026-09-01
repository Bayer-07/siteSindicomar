import type { Metadata } from "next";
import { CalendarRange, CheckCircle2, Download, ExternalLink, FileClock, MapPin, Scale } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicLink as Link } from "@/components/public-link";
import { DocumentStatusBadge } from "@/components/status-badge";
import { collectiveDocuments, documentTypeLabels } from "@/data/site-content";
import { getDocumentBySlug, getPublicDocuments } from "@/lib/content";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return collectiveDocuments.map((document) => ({ slug: document.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const document = await getDocumentBySlug((await params).slug); if (!document) return {}; return { title: document.title, description: document.summary, openGraph: { title: document.title, description: document.summary, images: [] }, twitter: { title: document.title, description: document.summary, images: [] } }; }
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`)) : "Não informado";

export default async function DocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const document = await getDocumentBySlug((await params).slug); if (!document) notFound();
  const documents = await getPublicDocuments();
  const related = documents.filter((item) => item.id !== document.id && (item.category === document.category || item.type === "minutes"));
  return <main id="conteudo"><section className="detail-hero"><div className="shell detail-hero-inner"><Link className="back-link" href="/convencoes">← Voltar para convenções</Link><div className="detail-title-row"><div><span className="eyebrow">{documentTypeLabels[document.type]} · {document.year}</span><h1>{document.title}</h1><p>{document.summary}</p></div><DocumentStatusBadge status={document.status} /></div></div></section>
    <section className="content-section"><div className="shell detail-layout"><article><section className="rich-section"><span className="eyebrow">Visão geral</span><h2>Informações do instrumento</h2><p>Este registro organiza os principais metadados do documento oficial. Para conhecer todas as condições, consulte o arquivo integral disponibilizado pela fonte.</p></section><section className="rich-section"><h2>Abrangência e registro</h2><div className="metadata-grid"><div><MapPin /><span>Município</span><strong>{document.municipality}</strong></div><div><Scale /><span>Categoria</span><strong>{document.category}</strong></div><div><CalendarRange /><span>Vigência</span><strong>{formatDate(document.validFrom)} a {formatDate(document.validUntil)}</strong></div><div><FileClock /><span>Data-base</span><strong>{document.baseDate ?? "Não informada"}</strong></div><div><CheckCircle2 /><span>Última atualização</span><strong>{formatDate(document.lastReviewedAt)}</strong></div><div><ExternalLink /><span>Registro MTE</span><strong>{document.mteRegistration ?? "Não aplicável"}</strong></div></div></section><section className="rich-section"><h2>Documentos relacionados</h2><div className="related-links">{related.slice(0, 3).map((item) => <Link href={`/convencoes/${item.slug}`} key={item.id}><span>{documentTypeLabels[item.type]} · {item.year}</span><strong>{item.title}</strong><small>Abrir registro →</small></Link>)}</div></section></article>
      <aside className="download-panel"><span className="eyebrow">Documento oficial</span><h2>Arquivo integral</h2><p>A leitura do PDF oficial é indispensável para verificar todas as cláusulas e condições.</p>{document.pdfUrl ? <a className="button button-primary" href={document.pdfUrl} target="_blank" rel="noreferrer"><Download size={18} /> Abrir PDF oficial</a> : null}<dl><div><dt>Tipo</dt><dd>{documentTypeLabels[document.type]}</dd></div><div><dt>Entidade laboral</dt><dd>{document.laborUnion ?? "Não informada"}</dd></div><div><dt>Fonte</dt><dd>{document.officialSource ?? "Documento das entidades"}</dd></div></dl><Link className="text-link" href="/contato">Precisa de orientação?</Link></aside></div></section>
  </main>;
}
