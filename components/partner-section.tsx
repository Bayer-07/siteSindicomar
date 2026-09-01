/* eslint-disable @next/next/no-img-element */

import { ExternalLink, Handshake } from "lucide-react";
import type { Partner } from "@/types/content";

export function PartnerSection({ partners }: { partners: Partner[] }) {
  if (!partners.length) return null;
  return <section className="content-section surface-section partners-section"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Rede parceira</span><h2>Conexões que ampliam o apoio ao comércio.</h2></div><p>Instituições e empresas que caminham com o Sindicomar em iniciativas relevantes para o desenvolvimento regional.</p></div><div className="partner-grid">{partners.map((partner) => {
    const content = <><div className="partner-card-logo">{partner.logoUrl ? <img src={partner.logoUrl} alt={`Logo de ${partner.name}`} loading="lazy" /> : <Handshake size={30} aria-hidden="true" />}</div><h3>{partner.name}</h3>{partner.description && <p>{partner.description}</p>}{partner.websiteUrl && <span className="partner-card-link">Conhecer parceiro <ExternalLink size={15} /></span>}</>;
    return partner.websiteUrl ? <a className="partner-card" href={partner.websiteUrl} target="_blank" rel="noreferrer" key={partner.id}>{content}</a> : <article className="partner-card" key={partner.id}>{content}</article>;
  })}</div></div></section>;
}
