import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoNotice } from "@/components/demo-notice";
import { services } from "@/data/site-content";
import { getServiceBySlug } from "@/lib/content";

export function generateStaticParams() { return services.map((service) => ({ slug: service.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const service = getServiceBySlug((await params).slug); if (!service) return {}; return { title: service.title, description: service.excerpt, openGraph: { title: service.title, description: service.excerpt, images: [] }, twitter: { title: service.title, description: service.excerpt, images: [] } }; }

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const service = getServiceBySlug((await params).slug); if (!service) notFound();
  return <main id="conteudo"><section className="detail-hero"><div className="shell detail-hero-inner"><Link className="back-link" href="/servicos">← Voltar para serviços</Link><span className="eyebrow">Serviços e benefícios</span><h1>{service.title}</h1><p>{service.excerpt}</p></div></section><section className="content-section"><div className="shell detail-layout"><article><DemoNotice /><section className="rich-section"><h2>Como este serviço ajuda</h2><p>{service.description}</p></section><section className="rich-section"><h2>Condições</h2><ul className="benefit-list"><li><CheckCircle2 /> <span><strong>Elegibilidade</strong>{service.eligibility}</span></li><li><CheckCircle2 /> <span><strong>Exclusividade</strong>{service.exclusive ? "Previsto como benefício de associados." : "Não marcado como exclusivo."}</span></li><li><CheckCircle2 /> <span><strong>Parceiro</strong>{service.partner ?? "A confirmar"}</span></li><li><CheckCircle2 /> <span><strong>Validade</strong>{service.validity ?? "A confirmar"}</span></li></ul></section></article><aside className="download-panel"><span className="eyebrow">Próximo passo</span><h2>Solicite informações</h2><p>A equipe confirmará regras, disponibilidade e condições antes do atendimento.</p><Link className="button button-primary" href={`/contato?assunto=beneficios&servico=${service.slug}`}>Falar com o Sindicomar <ArrowRight size={17} /></Link></aside></div></section></main>;
}
