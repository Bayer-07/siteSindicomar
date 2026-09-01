"use client";

import { Plus } from "lucide-react";
import { useRef } from "react";
import { AdminCrud, type AdminCrudHandle } from "@/components/admin-crud";
import { AdminShell } from "@/components/admin-shell";

type AdminRecord = Record<string, unknown>;

export function AdminModule({ email, section, table, title, description, records, createEnabled = true }: { email: string; section: string; table: string; title: string; description: string; records: AdminRecord[]; createEnabled?: boolean }) {
  const crudRef = useRef<AdminCrudHandle>(null);
  const entityLabels: Record<string, string> = { documentos: "documento", agenda: "item da agenda", noticias: "notícia", conteudo: "página", servicos: "serviço", institucional: "registro da diretoria", parceiros: "parceiro", configuracoes: "configuração" };
  const entityLabel = entityLabels[section] ?? "registro";

  return <AdminShell email={email}><div className="admin-content"><div className="admin-module-shell"><header><div className="admin-module-header-main"><span className="eyebrow">Administração</span><div className="admin-module-title-row"><h1>{title}</h1><div className="admin-module-actions"><span className="admin-record-count">{records.length} itens</span>{createEnabled && <button className="button button-primary" type="button" onClick={() => crudRef.current?.startCreate()}><Plus size={17} /> Novo {entityLabel}</button>}</div></div><p>{description}</p></div></header><section className="admin-panel"><AdminCrud ref={crudRef} section={section} table={table} initialRecords={records} createEnabled={createEnabled} showCreateButton={false} /></section></div></div></AdminShell>;
}
