import { DemoNotice } from "@/components/demo-notice";
import { DocumentFilters } from "@/components/document-filters";
import { PageHero } from "@/components/page-hero";
import { collectiveDocuments } from "@/data/site-content";

export const metadata = { title: "Convenções coletivas", description: "Consulte convenções, acordos, aditivos, atas, circulares e comunicados organizados por situação." };

export default function ConventionsPage() {
  return <main id="conteudo"><PageHero eyebrow="Convenções e relações do trabalho" title="O documento certo, com contexto e situação visível." description="Filtre por município, categoria, ano, tipo e situação. Instrumentos atuais ficam separados do acervo histórico." /><section className="content-section document-library"><div className="shell"><DemoNotice /><DocumentFilters documents={collectiveDocuments} /></div></section></main>;
}
