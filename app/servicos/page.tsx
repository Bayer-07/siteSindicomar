import { ArrowRight, BriefcaseBusiness, GraduationCap, HeartPulse, Landmark, Scale, Store } from "lucide-react";
import Link from "next/link";
import { DemoNotice } from "@/components/demo-notice";
import { PageHero } from "@/components/page-hero";
import { services } from "@/data/site-content";

export const metadata = { title: "Serviços e benefícios", description: "Soluções organizadas pela necessidade dos empresários do comércio." };
const icons = { labor: Scale, training: GraduationCap, health: HeartPulse, technology: BriefcaseBusiness, finance: Landmark, commerce: Store };

export default function ServicesPage() {
  return <main id="conteudo"><PageHero eyebrow="Serviços e benefícios" title="Soluções organizadas pela necessidade da empresa." description="Cada serviço apresentará elegibilidade, exclusividade, parceiro, validade e caminho de solicitação." /><section className="content-section"><div className="shell"><DemoNotice /><div className="service-list-grid">{services.map((service) => { const Icon = icons[service.category]; return <Link className="service-list-card" href={`/servicos/${service.slug}`} key={service.slug}><span className="service-icon"><Icon /></span><div className="service-card-label"><span>{service.exclusive ? "Associados" : "Empresas do comércio"}</span></div><h2>{service.title}</h2><p>{service.excerpt}</p><span className="text-link">Conhecer serviço <ArrowRight size={15} /></span></Link>; })}</div></div></section></main>;
}
