import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminCrud } from "@/components/admin-crud";

type AdminRecord = Record<string, unknown>;

export function AdminModule({ section, table, title, description, records, createEnabled = true }: { section: string; table: string; title: string; description: string; records: AdminRecord[]; createEnabled?: boolean }) {
  return <main className="admin-module-page"><div className="admin-module-shell"><Link className="back-link" href="/admin"><ArrowLeft size={16} /> Voltar ao painel</Link><header><div><span className="eyebrow">Administração</span><h1>{title}</h1><p>{description}</p></div></header><section className="admin-panel"><div className="panel-heading"><div><h2>Registros</h2><p>Dados carregados do ambiente protegido.</p></div><span>{records.length} itens</span></div><AdminCrud section={section} table={table} initialRecords={records} createEnabled={createEnabled} /></section></div></main>;
}
