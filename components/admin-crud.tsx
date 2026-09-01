"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Archive, Database, Eye, FileUp, Loader2, MessageCircle, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminRecord = Record<string, unknown>;
type FieldDefinition = { key: string; label: string; type?: "text" | "textarea" | "number" | "date" | "datetime-local" | "select" | "json"; required?: boolean; options?: Array<{ value: string; label: string }> };

const publicationOptions = [{ value: "draft", label: "Rascunho" }, { value: "published", label: "Publicado" }, { value: "archived", label: "Arquivado" }];
const configs: Record<string, { fields: FieldDefinition[]; titleKey: string; archive?: boolean }> = {
  documentos: { titleKey: "title", archive: true, fields: [
    { key: "title", label: "Título", required: true }, { key: "slug", label: "Slug", required: true }, { key: "summary", label: "Resumo", type: "textarea" },
    { key: "municipality", label: "Município", required: true }, { key: "category_label", label: "Categoria", required: true }, { key: "year", label: "Ano", type: "number", required: true },
    { key: "document_type", label: "Tipo", type: "select", required: true, options: [{ value: "cct", label: "CCT" }, { value: "act", label: "ACT" }, { value: "amendment", label: "Termo aditivo" }, { value: "minutes", label: "Ata" }, { value: "circular", label: "Circular" }, { value: "notice", label: "Comunicado" }] },
    { key: "document_status", label: "Situação do instrumento", type: "select", required: true, options: [{ value: "current", label: "Vigente" }, { value: "extended", label: "Prorrogado" }, { value: "negotiating", label: "Em negociação" }, { value: "superseded", label: "Substituído" }, { value: "expired", label: "Encerrado" }] },
    { key: "valid_from", label: "Início da vigência", type: "date" }, { key: "valid_until", label: "Fim da vigência", type: "date" }, { key: "base_date", label: "Data-base" }, { key: "labor_union", label: "Sindicato laboral" }, { key: "mte_registration", label: "Registro MTE" }, { key: "last_reviewed_at", label: "Última conferência", type: "datetime-local", required: true }, { key: "official_source", label: "Fonte oficial" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions },
  ] },
  agenda: { titleKey: "title", archive: true, fields: [
    { key: "title", label: "Título", required: true }, { key: "slug", label: "Slug", required: true }, { key: "description", label: "Descrição", type: "textarea" }, { key: "starts_at", label: "Início", type: "datetime-local", required: true }, { key: "ends_at", label: "Término", type: "datetime-local" }, { key: "municipality", label: "Município", required: true }, { key: "agenda_type", label: "Tipo", type: "select", required: true, options: [{ value: "holiday", label: "Feriado" }, { value: "special-hours", label: "Horário especial" }, { value: "assembly", label: "Assembleia" }, { value: "course", label: "Curso" }, { value: "event", label: "Evento" }] }, { key: "agenda_status", label: "Situação", type: "select", required: true, options: [{ value: "confirmed", label: "Confirmado" }, { value: "pending", label: "Aguardando definição" }, { value: "cancelled", label: "Cancelado" }, { value: "informational", label: "Informativo" }] }, { key: "status", label: "Publicação", type: "select", options: publicationOptions },
  ] },
  noticias: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "slug", label: "Slug", required: true }, { key: "excerpt", label: "Resumo", type: "textarea" }, { key: "category", label: "Categoria", required: true }, { key: "author_name", label: "Autor", required: true }, { key: "content", label: "Conteúdo estruturado (JSON)", type: "json" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  conteudo: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "slug", label: "Slug", required: true }, { key: "excerpt", label: "Resumo", type: "textarea" }, { key: "content", label: "Conteúdo estruturado (JSON)", type: "json" }, { key: "seo_title", label: "Título SEO" }, { key: "seo_description", label: "Descrição SEO", type: "textarea" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  servicos: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "slug", label: "Slug", required: true }, { key: "excerpt", label: "Resumo", type: "textarea" }, { key: "category", label: "Categoria", required: true }, { key: "eligibility", label: "Elegibilidade", type: "textarea" }, { key: "partner_name", label: "Parceiro" }, { key: "valid_until", label: "Validade", type: "date" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  institucional: { titleKey: "name", archive: true, fields: [{ key: "name", label: "Nome", required: true }, { key: "role", label: "Cargo", required: true }, { key: "bio", label: "Biografia", type: "textarea" }, { key: "mandate_start", label: "Início do mandato", type: "date" }, { key: "mandate_end", label: "Fim do mandato", type: "date" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  parceiros: { titleKey: "name", archive: true, fields: [{ key: "name", label: "Nome", required: true }, { key: "description", label: "Descrição", type: "textarea" }, { key: "website_url", label: "Site" }, { key: "valid_from", label: "Início", type: "date" }, { key: "valid_until", label: "Validade", type: "date" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  alertas: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "body", label: "Mensagem", type: "textarea", required: true }, { key: "link_url", label: "Link" }, { key: "priority", label: "Prioridade", type: "number" }, { key: "starts_at", label: "Início", type: "datetime-local" }, { key: "ends_at", label: "Término", type: "datetime-local" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  configuracoes: { titleKey: "key", fields: [{ key: "key", label: "Chave", required: true }, { key: "value", label: "Valor (JSON)", type: "json", required: true }] },
  solicitacoes: { titleKey: "protocol", fields: [{ key: "status", label: "Situação", type: "select", options: [{ value: "new", label: "Novo" }, { value: "handling", label: "Em atendimento" }, { value: "waiting", label: "Aguardando retorno" }, { value: "completed", label: "Concluído" }] }] },
};

export function AdminCrud({ section, table, initialRecords, createEnabled }: { section: string; table: string; initialRecords: AdminRecord[]; createEnabled: boolean }) {
  const config = configs[section];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<AdminRecord>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [detailRecord, setDetailRecord] = useState<AdminRecord | null>(null);
  const isEditing = Boolean(record.id);
  const fields = useMemo(() => config?.fields ?? [], [config]);

  function startCreate() { setRecord(defaultRecord(section)); setPdf(null); setError(""); setOpen(true); }
  function startEdit(item: AdminRecord) { setRecord(normalizeForForm(item)); setPdf(null); setError(""); setOpen(true); }
  function startView(item: AdminRecord) { setDetailRecord(item); }
  function updateValue(key: string, value: string) { setRecord((current) => ({ ...current, [key]: value })); }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const payload = serializeRecord(record, fields);
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      if (section === "documentos" && pdf) {
        if (pdf.type !== "application/pdf" || pdf.size > 20 * 1024 * 1024) throw new Error("O arquivo deve ser um PDF de até 20 MB.");
        const safeName = pdf.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
        const path = `${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("public-documents").upload(path, pdf, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
        Object.assign(payload, { storage_path: path, original_filename: pdf.name, mime_type: pdf.type, file_size_bytes: pdf.size });
      }
      const mutation = isEditing ? supabase.from(table).update(payload).eq("id", record.id).select().single() : supabase.from(table).insert(payload).select().single();
      const { data, error: mutationError } = await mutation;
      if (mutationError) throw mutationError;
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("audit_log").insert({ actor_email: user?.email ?? "admin", action: isEditing ? "update" : "create", entity_type: table, entity_id: String(data?.id ?? ""), before_data: isEditing ? record : null, after_data: data });
      setOpen(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  async function archive(item: AdminRecord) {
    if (!config?.archive || !item.id) return;
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { error: archiveError } = await supabase.from(table).update({ status: "archived" }).eq("id", item.id);
    if (archiveError) setError(archiveError.message); else router.refresh();
    setSaving(false);
  }

  if (!config) return <div className="empty-admin">Configuração deste módulo não encontrada.</div>;
  return <><div className="crud-actions">{createEnabled && <button className="button button-primary" type="button" onClick={startCreate}><Plus size={17} /> Novo registro</button>}</div>{initialRecords.length ? <div className="admin-record-list">{initialRecords.map((item, index) => <article key={String(item.id ?? index)}><div><strong>{String(item[config.titleKey] ?? `Registro ${index + 1}`)}</strong><p>{String(item.summary ?? item.excerpt ?? item.requester_name ?? item.status ?? "Sem descrição")}</p></div><div>{section === "solicitacoes" && <button className="admin-view-button" type="button" onClick={() => startView(item)}><Eye size={15} /> Ver detalhes</button>}<span className="status-badge status-informational">{String(item.status ?? "cadastrado")}</span><button type="button" onClick={() => startEdit(item)}><Pencil size={15} /> Editar</button>{config.archive && item.status !== "archived" && <button type="button" onClick={() => void archive(item)} disabled={saving}><Archive size={15} /> Arquivar</button>}</div></article>)}</div> : <div className="empty-admin"><Database size={28} /><strong>Nenhum registro neste módulo</strong><p>Use “Novo registro” para iniciar o conteúdo.</p></div>}
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Viewport className="crud-dialog-viewport"><Dialog.Popup className="crud-dialog"><div className="dialog-heading"><div><Dialog.Title>{isEditing ? "Editar registro" : "Novo registro"}</Dialog.Title><Dialog.Description>Salve como rascunho e publique somente depois da validação.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Fechar"><X size={20} /></Dialog.Close></div><form onSubmit={save} className="crud-form">{fields.map((field) => <label className={field.type === "textarea" || field.type === "json" ? "field field-full" : "field"} key={field.key}><span>{field.label}</span>{field.type === "textarea" || field.type === "json" ? <textarea rows={field.type === "json" ? 7 : 4} required={field.required} value={String(record[field.key] ?? "")} onChange={(event) => updateValue(field.key, event.target.value)} /> : field.type === "select" ? <select required={field.required} value={String(record[field.key] ?? "")} onChange={(event) => updateValue(field.key, event.target.value)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type ?? "text"} required={field.required} value={String(record[field.key] ?? "")} onChange={(event) => updateValue(field.key, event.target.value)} />}</label>)}{section === "documentos" && !isEditing && <label className="upload-field field-full"><FileUp /><span><strong>PDF oficial</strong><small>application/pdf, até 20 MB; um novo arquivo sempre cria um caminho imutável.</small></span><input type="file" accept="application/pdf" onChange={(event) => setPdf(event.target.files?.[0] ?? null)} /></label>}{error && <p className="form-error field-full">{error}</p>}<div className="form-actions field-full"><Dialog.Close className="button button-secondary">Cancelar</Dialog.Close><button className="button button-primary" type="submit" disabled={saving}>{saving ? <><Loader2 className="spin" size={17} /> Salvando…</> : "Salvar registro"}</button></div></form></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>
    {section === "solicitacoes" && <Dialog.Root open={Boolean(detailRecord)} onOpenChange={(nextOpen) => { if (!nextOpen) setDetailRecord(null); }}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Viewport className="crud-dialog-viewport"><Dialog.Popup className="crud-dialog submission-detail-dialog"><div className="dialog-heading"><div><Dialog.Title>Detalhes da solicitação</Dialog.Title><Dialog.Description>Protocolo e dados enviados pelo formulário.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Fechar"><X size={20} /></Dialog.Close></div>{detailRecord && <SubmissionDetails record={detailRecord} />}<div className="form-actions"><Dialog.Close className="button button-secondary">Fechar</Dialog.Close></div></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>}
  </>;
}

function SubmissionDetails({ record }: { record: AdminRecord }) {
  const value = (key: string) => String(record[key] ?? "").trim();
  const createdAt = value("created_at");
  const date = createdAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(createdAt)) : "Não informado";
  const kindLabels: Record<string, string> = { contact: "Contato", classification: "Enquadramento", membership: "Associação" };
  const channelLabels: Record<string, string> = { email: "E-mail", phone: "Ligação", whatsapp: "WhatsApp" };
  const statusLabels: Record<string, string> = { new: "Novo", handling: "Em atendimento", waiting: "Aguardando retorno", completed: "Concluído" };
  const emailStatusLabels: Record<string, string> = { pending: "Pendente", sent: "Enviado", failed: "Falhou" };
  const phone = value("phone");
  const whatsappHref = buildWhatsappHref(phone, value("requester_name"), value("protocol"));
  return <div className="submission-details"><dl className="submission-detail-grid"><Detail label="Protocolo" value={value("protocol")} /><Detail label="Tipo" value={kindLabels[value("kind")] ?? value("kind")} /><Detail label="Situação" value={statusLabels[value("status")] ?? value("status")} /><Detail label="Recebido em" value={date} /><Detail label="Responsável" value={value("requester_name")} /><Detail label="Canal preferido" value={channelLabels[value("preferred_channel")] ?? value("preferred_channel")} /><Detail label="E-mail" value={value("email")} href={value("email") ? `mailto:${value("email")}` : undefined} /><div className="submission-detail-item"><dt>Telefone</dt><dd className="submission-phone-value"><a href={phone ? `tel:${phone}` : undefined}>{phone || "Não informado"}</a>{whatsappHref && <a className="button button-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer" aria-label={`Abrir conversa no WhatsApp com ${value("requester_name")}`}><MessageCircle size={15} /> WhatsApp</a>}</dd></div>{value("subject") && <Detail label="Assunto" value={value("subject")} />}{value("company_name") && <Detail label="Empresa" value={value("company_name")} />}{value("company_cnpj") && <Detail label="CNPJ" value={value("company_cnpj")} />}{value("municipality") && <Detail label="Município" value={value("municipality")} />}{value("activity") && <Detail label="Atividade" value={value("activity")} />}</dl><div className="submission-detail-message"><span>Mensagem</span><p>{value("message") || "Nenhuma mensagem informada."}</p></div><div className="submission-detail-notification"><span>Notificação por e-mail</span><strong>{emailStatusLabels[value("email_notification_status")] ?? "Não configurada"}</strong>{value("email_notification_error") && <small>{value("email_notification_error")}</small>}</div></div>;
}

function buildWhatsappHref(phone: string, name: string, protocol: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  const internationalPhone = digits.startsWith("55") ? digits : `55${digits}`;
  const message = `Olá, ${name || "tudo bem"}! Aqui é do Sindicomar. Estamos entrando em contato sobre a sua solicitação ${protocol || "enviada pelo site"}.`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return <div className="submission-detail-item"><dt>{label}</dt><dd>{href ? <a href={href}>{value}</a> : value || "Não informado"}</dd></div>;
}

function defaultRecord(section: string): AdminRecord {
  const now = new Date().toISOString().slice(0, 16);
  const defaults: AdminRecord = { status: "draft" };
  if (section === "documentos") Object.assign(defaults, { year: new Date().getFullYear(), document_type: "cct", document_status: "negotiating", last_reviewed_at: now });
  if (section === "agenda") Object.assign(defaults, { agenda_type: "event", agenda_status: "informational", starts_at: now });
  if (section === "noticias" || section === "conteudo") defaults.content = JSON.stringify({ type: "doc", content: [] }, null, 2);
  if (section === "configuracoes") { delete defaults.status; defaults.value = "{}"; }
  return defaults;
}

function normalizeForForm(item: AdminRecord) {
  const copy = { ...item };
  Object.entries(copy).forEach(([key, value]) => { if (value && (key.endsWith("_at") || key === "starts_at" || key === "ends_at") && typeof value === "string") copy[key] = value.slice(0, 16); else if (typeof value === "object" && value !== null) copy[key] = JSON.stringify(value, null, 2); });
  return copy;
}

function serializeRecord(record: AdminRecord, fields: FieldDefinition[]) {
  const result: AdminRecord = { ...record };
  for (const field of fields) {
    const value = result[field.key];
    if (value === "") result[field.key] = null;
    if (field.type === "number" && value !== null && value !== "") result[field.key] = Number(value);
    if (field.type === "json" && typeof value === "string") result[field.key] = JSON.parse(value || "{}");
    if (field.type === "datetime-local" && typeof value === "string" && value) result[field.key] = new Date(value).toISOString();
  }
  return result;
}
