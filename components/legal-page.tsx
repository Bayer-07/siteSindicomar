import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";

export function LegalPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <main id="conteudo"><PageHero eyebrow={eyebrow} title={title} description={description} /><section className="content-section"><article className="shell legal-content"><div className="legal-meta"><span>Portal Sindicomar</span><strong>Última atualização: 28 de agosto de 2026</strong></div>{children}</article></section></main>;
}
