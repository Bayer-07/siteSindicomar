import { AdminCrud } from "@/components/admin-crud";
import { AdminShell } from "@/components/admin-shell";

type AdminRecord = Record<string, unknown>;

export function AdminModule({ email, section, table, title, description, records, createEnabled = true }: { email: string; section: string; table: string; title: string; description: string; records: AdminRecord[]; createEnabled?: boolean }) {
  return <AdminShell email={email}><div className="admin-content"><div className="admin-module-shell"><header><div><span className="eyebrow">Administração</span><h1>{title}</h1><p>{description}</p></div></header><section className="admin-panel"><div className="panel-heading"><div><h2>Registros</h2><p>Dados carregados do ambiente protegido.</p></div><span>{records.length} itens</span></div><AdminCrud section={section} table={table} initialRecords={records} createEnabled={createEnabled} /></section></div></div></AdminShell>;
}
