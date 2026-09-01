import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicLink as Link } from "@/components/public-link";
import { services } from "@/data/site-content";
import { getServiceBySlug } from "@/lib/content";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return services.map((service) => ({ slug: service.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const service = await getServiceBySlug((await params).slug); if (!service) return {}; return { title: service.title, description: service.excerpt, openGraph: { title: service.title, description: service.excerpt, images: [] }, twitter: { title: service.title, description: service.excerpt, images: [] } }; }

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const service = await getServiceBySlug((await params).slug); if (!service) notFound();
  return <main id="conteudo"><section className="detail-hero"><div className="shell detail-hero-inner"><Link className="back-link" href="/servicos">← Voltar para serviços</Link><span className="eyebrow">Serviços e atuação</span><h1>{service.title}</h1><p>{service.excerpt}</p></div></section><section className="content-section"><div className="shell detail-layout"><article><section className="rich-section"><span className="eyebrow">Sobre esta frente</span><h2>Como o Sindicomar atua</h2><p>{service.description}</p></section><section className="rich-section"><h2>Informações de atendimento</h2><ul className="benefit-list"><li><CheckCircle2 /><span><strong>Público</strong>{service.eligibility}</span></li><li><CheckCircle2 /><span><strong>Atendimento</strong>Solicitações são direcionadas conforme o assunto e o perfil da empresa.</span></li>{service.partner ? <li><CheckCircle2 /><span><strong>Rede relacionada</strong>{service.partner}</span></li> : null}</ul></section></article><aside className="download-panel"><span className="eyebrow">Próximo passo</span><h2>Fale com a equipe</h2><p>Encaminhe sua necessidade para receber as informações relacionadas a esta frente.</p><Link className="button button-primary" href={`/contato?assunto=beneficios&servico=${service.slug}`}>Solicitar atendimento <ArrowRight size={17} /></Link></aside></div></section></main>;
}
