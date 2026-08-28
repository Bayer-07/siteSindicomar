import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";

export function LegalPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <main id="conteudo"><PageHero eyebrow={eyebrow} title={title} description={description} /><section className="content-section"><article className="shell legal-content"><div className="legal-warning"><strong>Minuta para validação</strong><p>Este texto é uma base técnica e deve ser revisado pelo Sindicomar e, quando necessário, por assessoria jurídica antes da publicação.</p></div>{children}</article></section></main>;
}
