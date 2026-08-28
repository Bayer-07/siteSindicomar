"use client";

import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PublicLink as Link } from "@/components/public-link";
import { documentTypeLabels } from "@/data/site-content";
import type { CollectiveDocument, DocumentStatus, DocumentType } from "@/types/content";
import { DocumentStatusBadge } from "@/components/status-badge";

const activeStatuses: DocumentStatus[] = ["current", "extended", "negotiating"];

export function DocumentFilters({ documents }: { documents: CollectiveDocument[] }) {
  const [query, setQuery] = useState("");
  const [municipality, setMunicipality] = useState("all");
  const [category, setCategory] = useState("all");
  const [year, setYear] = useState("all");
  const [type, setType] = useState<DocumentType | "all">("all");
  const [status, setStatus] = useState<DocumentStatus | "all">("all");

  const options = useMemo(() => ({
    municipalities: [...new Set(documents.map((item) => item.municipality))],
    categories: [...new Set(documents.map((item) => item.category))],
    years: [...new Set(documents.map((item) => item.year))].sort((a, b) => b - a),
  }), [documents]);

  const filtered = useMemo(() => documents.filter((document) => {
    const matchesQuery = `${document.title} ${document.summary}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    return matchesQuery && (municipality === "all" || document.municipality === municipality) && (category === "all" || document.category === category) && (year === "all" || document.year === Number(year)) && (type === "all" || document.type === type) && (status === "all" || document.status === status);
  }), [documents, query, municipality, category, year, type, status]);

  const current = filtered.filter((item) => activeStatuses.includes(item.status));
  const historical = filtered.filter((item) => !activeStatuses.includes(item.status));

  return (
    <div>
      <form className="filter-panel" onSubmit={(event) => event.preventDefault()} aria-label="Filtros de documentos">
        <label className="search-field"><span>Buscar por palavra-chave</span><div><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: varejo, circular, feriado" /></div></label>
        <label><span>Município</span><select value={municipality} onChange={(event) => setMunicipality(event.target.value)}><option value="all">Todos</option>{options.municipalities.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Categoria</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas</option>{options.categories.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Ano</span><select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">Todos</option>{options.years.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Tipo</span><select value={type} onChange={(event) => setType(event.target.value as DocumentType | "all")}><option value="all">Todos</option>{Object.entries(documentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Situação</span><select value={status} onChange={(event) => setStatus(event.target.value as DocumentStatus | "all")}><option value="all">Todas</option><option value="current">Vigente</option><option value="extended">Prorrogado</option><option value="negotiating">Em negociação</option><option value="superseded">Substituído</option><option value="expired">Encerrado</option></select></label>
      </form>
      <div className="result-count" role="status">{filtered.length} {filtered.length === 1 ? "documento encontrado" : "documentos encontrados"}</div>
      <DocumentGroup title="Instrumentos atuais" description="Vigentes, prorrogados ou em negociação" documents={current} />
      <DocumentGroup title="Acervo histórico" description="Documentos substituídos ou encerrados" documents={historical} />
    </div>
  );
}

function DocumentGroup({ title, description, documents }: { title: string; description: string; documents: CollectiveDocument[] }) {
  if (documents.length === 0) return null;
  return <section className="document-group"><div className="group-heading"><div><h2>{title}</h2><p>{description}</p></div></div><div className="document-list">{documents.map((document) => <Link className="document-card" href={`/convencoes/${document.slug}`} key={document.id}><span className="document-icon"><FileText size={22} /></span><div className="document-main"><div className="document-card-top"><span>{documentTypeLabels[document.type]} · {document.year}</span><DocumentStatusBadge status={document.status} /></div><h3>{document.title}</h3><p>{document.summary}</p><dl><div><dt>Município</dt><dd>{document.municipality}</dd></div><div><dt>Categoria</dt><dd>{document.category}</dd></div><div><dt>Última conferência</dt><dd>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${document.lastReviewedAt}T12:00:00`))}</dd></div></dl></div><span className="document-arrow" aria-hidden="true">→</span></Link>)}</div></section>;
}
