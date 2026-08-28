import { Archive, FileCheck2, Filter } from "lucide-react";
import { DocumentFilters } from "@/components/document-filters";
import { PageHero } from "@/components/page-hero";
import { collectiveDocuments } from "@/data/site-content";

export const metadata = { title: "Convenções coletivas", description: "Consulte convenções, atas e comunicados por categoria, período e situação." };

export default function ConventionsPage() {
  return <main id="conteudo"><PageHero eyebrow="Relações do trabalho" title="Biblioteca de convenções e instrumentos coletivos." description="Consulte os documentos por município, categoria, ano, tipo e situação. Cada registro apresenta vigência, fonte e arquivo oficial." />
    <section className="library-summary"><div className="shell library-summary-grid"><div><FileCheck2 /><span><strong>Documentos identificados</strong>Instrumentos com título e categoria padronizados.</span></div><div><Filter /><span><strong>Consulta estruturada</strong>Filtros para localizar o registro correto.</span></div><div><Archive /><span><strong>Histórico preservado</strong>Instrumentos encerrados permanecem no acervo.</span></div></div></section>
    <section className="content-section document-library"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Consulta documental</span><h2>Encontre o instrumento relacionado à sua empresa.</h2></div><p>Verifique sempre a situação, a vigência e os documentos relacionados antes de utilizar o conteúdo.</p></div><DocumentFilters documents={collectiveDocuments} /></div></section>
  </main>;
}
