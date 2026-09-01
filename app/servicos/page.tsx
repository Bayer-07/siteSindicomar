import { ArrowRight, BriefcaseBusiness, GraduationCap, HeartPulse, Landmark, Scale, Store } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PublicLink as Link } from "@/components/public-link";
import { getPublicServices } from "@/lib/content";

export const metadata = { title: "Serviços e atuação", description: "Conheça as frentes de atuação do Sindicomar para o comércio." };
const icons = { labor: Scale, training: GraduationCap, health: HeartPulse, technology: BriefcaseBusiness, finance: Landmark, commerce: Store };

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getPublicServices();
  return <main id="conteudo"><PageHero eyebrow="Serviços e atuação" title="Apoio institucional para uma gestão mais conectada." description="Relações do trabalho, desenvolvimento empresarial, Sistema Comércio e representação institucional em um único portal." />
    <section className="content-section"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Frentes de atendimento</span><h2>Encontre o caminho adequado para sua necessidade.</h2></div><p>Cada área apresenta objetivo, público e forma de contato com a entidade.</p></div><div className="service-list-grid">{services.map((service) => { const Icon = icons[service.category]; return <Link className="service-list-card" href={`/servicos/${service.slug}`} key={service.slug}><span className="service-icon"><Icon /></span><div className="service-card-label"><span>{service.category === "labor" ? "Relações do trabalho" : service.category === "training" ? "Desenvolvimento" : service.category === "commerce" ? "Sistema Comércio" : "Institucional"}</span></div><h2>{service.title}</h2><p>{service.excerpt}</p><span className="text-link">Conhecer essa frente <ArrowRight size={15} /></span></Link>; })}</div></div></section>
    <section className="service-principles"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Forma de atuação</span><h2>Proximidade, responsabilidade e visão coletiva.</h2></div></div><div className="principles-row"><div><strong>01</strong><span>Escuta das necessidades do comércio local</span></div><div><strong>02</strong><span>Organização de informação relevante às empresas</span></div><div><strong>03</strong><span>Articulação com entidades e instituições parceiras</span></div></div></div></section>
  </main>;
}
