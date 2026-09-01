"use client";
/* eslint-disable @next/next/no-img-element */

import { Dialog } from "@base-ui/react/dialog";
import type { JSONContent } from "@tiptap/core";
import { Archive, Database, Eye, FileImage, FileUp, Loader2, MessageCircle, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { slugify } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminRecord = Record<string, unknown>;
type FieldDefinition = { key: string; label: string; type?: "text" | "textarea" | "number" | "date" | "datetime-local" | "select" | "json" | "richtext"; required?: boolean; help?: string; placeholder?: string; options?: Array<{ value: string; label: string }> };
type UploadDefinition = { key: string; label: string; helper: string; bucket: "public-images" | "public-documents"; accept: string; maxBytes: number };
type ModuleConfig = { fields: FieldDefinition[]; titleKey: string; archive?: boolean; upload?: UploadDefinition };

const publicationOptions = [{ value: "draft", label: "Rascunho" }, { value: "published", label: "Publicado" }, { value: "archived", label: "Arquivado" }];
const categoryOptions = [{ value: "labor", label: "Relações do trabalho" }, { value: "training", label: "Capacitação" }, { value: "health", label: "Saúde" }, { value: "technology", label: "Tecnologia" }, { value: "finance", label: "Finanças" }, { value: "commerce", label: "Comércio" }];
const emptyRichText: JSONContent = { type: "doc", content: [] };
const entityLabels: Record<string, string> = { documentos: "documento", agenda: "item da agenda", noticias: "notícia", conteudo: "página", servicos: "serviço", institucional: "registro da diretoria", parceiros: "parceiro", alertas: "alerta", configuracoes: "configuração", solicitacoes: "solicitação" };
const configs: Record<string, ModuleConfig> = {
  documentos: { titleKey: "title", archive: true, fields: [
    { key: "title", label: "Título", required: true, placeholder: "Ex.: CCT do comércio varejista 2026" }, { key: "slug", label: "Endereço da página (slug)", required: true, help: "Gerado automaticamente pelo título. Você pode ajustar se necessário." }, { key: "summary", label: "Resumo", type: "textarea", help: "Texto curto exibido na biblioteca de documentos." },
    { key: "municipality", label: "Município", required: true }, { key: "category_label", label: "Categoria", required: true }, { key: "year", label: "Ano", type: "number", required: true },
    { key: "document_type", label: "Tipo", type: "select", required: true, options: [{ value: "cct", label: "CCT" }, { value: "act", label: "ACT" }, { value: "amendment", label: "Termo aditivo" }, { value: "minutes", label: "Ata" }, { value: "circular", label: "Circular" }, { value: "notice", label: "Comunicado" }] },
    { key: "document_status", label: "Situação do instrumento", type: "select", required: true, options: [{ value: "current", label: "Vigente" }, { value: "extended", label: "Prorrogado" }, { value: "negotiating", label: "Em negociação" }, { value: "superseded", label: "Substituído" }, { value: "expired", label: "Encerrado" }] },
    { key: "valid_from", label: "Início da vigência", type: "date" }, { key: "valid_until", label: "Fim da vigência", type: "date" }, { key: "base_date", label: "Data-base" }, { key: "labor_union", label: "Sindicato laboral" }, { key: "mte_registration", label: "Registro MTE" }, { key: "last_reviewed_at", label: "Última conferência", type: "datetime-local", required: true }, { key: "official_source", label: "Fonte oficial" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions },
  ] },
  agenda: { titleKey: "title", archive: true, fields: [
    { key: "title", label: "Título", required: true }, { key: "slug", label: "Endereço da página (slug)", required: true, help: "Gerado automaticamente pelo título." }, { key: "description", label: "Descrição", type: "textarea", help: "Explique o que acontece, para quem e onde." }, { key: "starts_at", label: "Início", type: "datetime-local", required: true }, { key: "ends_at", label: "Término", type: "datetime-local" }, { key: "municipality", label: "Município", required: true }, { key: "agenda_type", label: "Tipo", type: "select", required: true, options: [{ value: "holiday", label: "Feriado" }, { value: "special-hours", label: "Horário especial" }, { value: "assembly", label: "Assembleia" }, { value: "course", label: "Curso" }, { value: "event", label: "Evento" }] }, { key: "agenda_status", label: "Situação", type: "select", required: true, options: [{ value: "confirmed", label: "Confirmado" }, { value: "pending", label: "Aguardando definição" }, { value: "cancelled", label: "Cancelado" }, { value: "informational", label: "Informativo" }] }, { key: "status", label: "Publicação", type: "select", options: publicationOptions },
  ] },
  noticias: { titleKey: "title", archive: true, upload: { key: "cover_image_path", label: "Imagem de capa", helper: "JPG, PNG, WEBP ou AVIF até 10 MB. Essa imagem aparecerá nos cards e na notícia.", bucket: "public-images", accept: "image/jpeg,image/png,image/webp,image/avif", maxBytes: 10 * 1024 * 1024 }, fields: [{ key: "title", label: "Título", required: true, placeholder: "Ex.: Funcionamento do comércio em feriados" }, { key: "slug", label: "Endereço da notícia (slug)", required: true, help: "Preenchido automaticamente a partir do título. Evite alterar depois de publicar." }, { key: "excerpt", label: "Resumo da notícia", type: "textarea", required: true, help: "Uma ou duas frases para a listagem e para o compartilhamento." }, { key: "category", label: "Categoria", required: true, placeholder: "Ex.: Relações do trabalho" }, { key: "author_name", label: "Autor", required: true, placeholder: "Ex.: Equipe Sindicomar" }, { key: "content", label: "Conteúdo da notícia", type: "richtext", required: true, help: "Escreva o texto usando os botões de formatação. Não é necessário conhecer JSON." }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  conteudo: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "slug", label: "Endereço da página (slug)", required: true, help: "Gerado automaticamente pelo título." }, { key: "excerpt", label: "Resumo", type: "textarea" }, { key: "content", label: "Conteúdo da página", type: "richtext", help: "Edite visualmente o texto, títulos e listas." }, { key: "seo_title", label: "Título para buscadores", help: "Opcional. Se ficar vazio, o título da página será usado." }, { key: "seo_description", label: "Descrição para buscadores", type: "textarea" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  servicos: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "slug", label: "Endereço do serviço (slug)", required: true, help: "Gerado automaticamente pelo título." }, { key: "excerpt", label: "Resumo", type: "textarea", help: "Texto curto exibido na lista de serviços." }, { key: "content", label: "Descrição completa", type: "richtext", help: "Explique o serviço em linguagem clara, usando títulos e listas quando necessário." }, { key: "category", label: "Categoria", type: "select", required: true, options: categoryOptions }, { key: "eligibility", label: "Quem pode utilizar", type: "textarea" }, { key: "is_exclusive", label: "Benefício exclusivo", type: "select", options: [{ value: "false", label: "Não" }, { value: "true", label: "Sim" }] }, { key: "partner_name", label: "Parceiro" }, { key: "valid_until", label: "Validade", type: "date" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  institucional: { titleKey: "name", archive: true, upload: { key: "photo_path", label: "Foto", helper: "JPG, PNG, WEBP ou AVIF até 10 MB.", bucket: "public-images", accept: "image/jpeg,image/png,image/webp,image/avif", maxBytes: 10 * 1024 * 1024 }, fields: [{ key: "name", label: "Nome", required: true }, { key: "role", label: "Cargo", required: true }, { key: "bio", label: "Biografia", type: "textarea" }, { key: "mandate_start", label: "Início do mandato", type: "date" }, { key: "mandate_end", label: "Fim do mandato", type: "date" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  parceiros: { titleKey: "name", archive: true, upload: { key: "logo_path", label: "Logo do parceiro", helper: "JPG, PNG, WEBP ou AVIF até 10 MB.", bucket: "public-images", accept: "image/jpeg,image/png,image/webp,image/avif", maxBytes: 10 * 1024 * 1024 }, fields: [{ key: "name", label: "Nome", required: true }, { key: "description", label: "Descrição", type: "textarea" }, { key: "website_url", label: "Site" }, { key: "valid_from", label: "Início", type: "date" }, { key: "valid_until", label: "Validade", type: "date" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  alertas: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "body", label: "Mensagem", type: "textarea", required: true }, { key: "link_url", label: "Link" }, { key: "priority", label: "Prioridade", type: "number" }, { key: "starts_at", label: "Início", type: "datetime-local" }, { key: "ends_at", label: "Término", type: "datetime-local" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  configuracoes: { titleKey: "key", fields: [{ key: "key", label: "Chave", required: true }, { key: "value", label: "Valor técnico (JSON)", type: "json", required: true, help: "Campo avançado para configurações do sistema. Não é necessário para notícias, páginas ou serviços." }] },
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
  const [asset, setAsset] = useState<File | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AdminRecord | null>(null);
  const isEditing = Boolean(record.id);
  const fields = useMemo(() => config?.fields ?? [], [config]);
  const upload = config?.upload;
  const assetPreview = useMemo(() => asset ? URL.createObjectURL(asset) : "", [asset]);

  useEffect(() => {
    if (assetPreview) return () => URL.revokeObjectURL(assetPreview);
  }, [assetPreview]);

  function startCreate() { setRecord(defaultRecord(section)); setPdf(null); setAsset(null); setSlugEdited(false); setError(""); setOpen(true); }
  function startEdit(item: AdminRecord) { setRecord(normalizeForForm(item, fields)); setPdf(null); setAsset(null); setSlugEdited(Boolean(item.slug)); setError(""); setOpen(true); }
  function startView(item: AdminRecord) { setDetailRecord(item); }
  function updateValue(key: string, value: unknown) {
    if (key === "slug") setSlugEdited(true);
    setRecord((current) => {
      const next = { ...current, [key]: value };
      const canGenerateSlug = fields.some((field) => field.key === "slug");
      if ((key === "title" || key === "name") && canGenerateSlug && (!slugEdited || !current.slug)) next.slug = slugify(String(value));
      return next;
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const payload = serializeRecord(record, fields);
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      if (payload.status === "published" && !payload.published_at) payload.published_at = new Date().toISOString();
      if (section === "documentos" && pdf) {
        if (pdf.type !== "application/pdf" || pdf.size > 20 * 1024 * 1024) throw new Error("O arquivo deve ser um PDF de até 20 MB.");
        const safeName = pdf.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
        const path = `${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("public-documents").upload(path, pdf, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
        Object.assign(payload, { storage_path: path, original_filename: pdf.name, mime_type: pdf.type, file_size_bytes: pdf.size });
      }
      if (upload && asset) {
        const supportedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        if (!supportedImageTypes.includes(asset.type) || asset.size > upload.maxBytes) throw new Error("A imagem deve estar em JPG, PNG, WEBP ou AVIF e ter até 10 MB.");
        const safeName = asset.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
        const path = `${section}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(upload.bucket).upload(path, asset, { contentType: asset.type, upsert: false });
        if (uploadError) throw uploadError;
        payload[upload.key] = path;
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
  const autoSlug = fields.some((field) => field.key === "slug");
  const inputValue = (value: unknown) => value === null || value === undefined || typeof value === "object" ? "" : String(value);
  const renderField = (field: FieldDefinition) => {
    const fieldValue = record[field.key];
    const isFullWidth = field.type === "textarea" || field.type === "json" || field.type === "richtext";
    const isSlug = field.key === "slug";
    if (field.type === "richtext") return <div className="field field-full" key={field.key}><span>{field.label}</span>{field.help && <small className="field-help">{field.help}</small>}<TiptapEditor value={toRichText(fieldValue)} onChange={(value) => updateValue(field.key, value)} /></div>;
    return <label className={isFullWidth ? "field field-full" : "field"} key={field.key}><span>{field.label}</span>{field.help && <small className="field-help">{field.help}</small>}{field.type === "textarea" || field.type === "json" ? <textarea rows={field.type === "json" ? 7 : 4} required={field.required} value={inputValue(fieldValue)} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} /> : field.type === "select" ? <select required={field.required} value={inputValue(fieldValue)} onChange={(event) => updateValue(field.key, event.target.value)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type ?? "text"} required={field.required} value={inputValue(fieldValue)} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} autoComplete={isSlug ? "off" : undefined} />}{isSlug && autoSlug && <small className="field-help slug-preview">Endereço: /{section === "noticias" ? "noticias" : section === "servicos" ? "servicos" : section}/{inputValue(fieldValue) || "seu-endereco"}</small>}</label>;
  };
  const entityLabel = entityLabels[section] ?? "registro";
  return <><div className="crud-actions">{createEnabled && <button className="button button-primary" type="button" onClick={startCreate}><Plus size={17} /> Novo {entityLabel}</button>}</div>{initialRecords.length ? <div className="admin-record-list">{initialRecords.map((item, index) => <article key={String(item.id ?? index)}><div><strong>{String(item[config.titleKey] ?? `Registro ${index + 1}`)}</strong><p>{String(item.summary ?? item.excerpt ?? item.requester_name ?? item.status ?? "Sem descrição")}</p></div><div>{section === "solicitacoes" && <button className="admin-view-button" type="button" onClick={() => startView(item)}><Eye size={15} /> Ver detalhes</button>}<span className="status-badge status-informational">{String(item.status ?? "cadastrado")}</span><button type="button" onClick={() => startEdit(item)}><Pencil size={15} /> Editar</button>{config.archive && item.status !== "archived" && <button type="button" onClick={() => void archive(item)} disabled={saving}><Archive size={15} /> Arquivar</button>}</div></article>)}</div> : <div className="empty-admin"><Database size={28} /><strong>Nenhum registro neste módulo</strong><p>Use “Novo {entityLabel}” para iniciar o conteúdo.</p></div>}
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Viewport className="crud-dialog-viewport"><Dialog.Popup className="crud-dialog"><div className="dialog-heading"><div><Dialog.Title>{isEditing ? `Editar ${entityLabel}` : `Novo ${entityLabel}`}</Dialog.Title><Dialog.Description>Preencha os campos e salve como rascunho. Publique somente depois da revisão.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Fechar"><X size={20} /></Dialog.Close></div><form onSubmit={save} className="crud-form">{fields.map(renderField)}{upload && <label className="upload-field field-full"><FileImage /><span><strong>{upload.label}</strong><small>{upload.helper}</small>{Boolean(record[upload.key]) && <small>Já existe um arquivo salvo. Selecione outro somente se quiser substituí-lo.</small>}</span>{assetPreview && <img className="upload-preview" src={assetPreview} alt="Pré-visualização do arquivo selecionado" /> }<input type="file" accept={upload.accept} onChange={(event) => setAsset(event.target.files?.[0] ?? null)} /></label>}{section === "documentos" && !isEditing && <label className="upload-field field-full"><FileUp /><span><strong>PDF oficial</strong><small>application/pdf, até 20 MB; um novo arquivo sempre cria um caminho imutável.</small></span><input type="file" accept="application/pdf" onChange={(event) => setPdf(event.target.files?.[0] ?? null)} /></label>}{error && <p className="form-error field-full">{error}</p>}<div className="form-actions field-full"><Dialog.Close className="button button-secondary">Cancelar</Dialog.Close><button className="button button-primary" type="submit" disabled={saving}>{saving ? <><Loader2 className="spin" size={17} /> Salvando…</> : "Salvar registro"}</button></div></form></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>
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
  if (section === "servicos") Object.assign(defaults, { category: "labor", is_exclusive: "false" });
  if (section === "noticias" || section === "conteudo" || section === "servicos") defaults.content = { ...emptyRichText };
  if (section === "configuracoes") { delete defaults.status; defaults.value = "{}"; }
  return defaults;
}

function normalizeForForm(item: AdminRecord, fields: FieldDefinition[]) {
  const copy = { ...item };
  Object.entries(copy).forEach(([key, value]) => {
    if (value && (key.endsWith("_at") || key === "starts_at" || key === "ends_at") && typeof value === "string") copy[key] = value.slice(0, 16);
    else if (fields.some((field) => field.key === key && field.type === "richtext")) copy[key] = toRichText(value);
    else if (typeof value === "object" && value !== null) copy[key] = JSON.stringify(value, null, 2);
  });
  return copy;
}

function serializeRecord(record: AdminRecord, fields: FieldDefinition[]) {
  const result: AdminRecord = { ...record };
  for (const field of fields) {
    const value = result[field.key];
    if (field.type === "richtext") {
      if (field.required && !hasRichTextContent(value)) throw new Error(`Preencha o campo “${field.label}”.`);
      result[field.key] = toRichText(value);
      continue;
    }
    if (value === "") result[field.key] = null;
    if (field.type === "number" && value !== null && value !== "") result[field.key] = Number(value);
    if (field.type === "json" && typeof value === "string") {
      try { result[field.key] = JSON.parse(value || "{}"); } catch { throw new Error(`Corrija o campo “${field.label}”: o JSON informado não é válido.`); }
    }
    if (field.key === "is_exclusive" && typeof value === "string") result[field.key] = value === "true";
    if (field.type === "datetime-local" && typeof value === "string" && value) result[field.key] = new Date(value).toISOString();
  }
  return result;
}

function toRichText(value: unknown): JSONContent {
  if (typeof value === "string") {
    try { return toRichText(JSON.parse(value)); } catch { return { ...emptyRichText }; }
  }
  if (value && typeof value === "object" && typeof (value as JSONContent).type === "string") return value as JSONContent;
  return { ...emptyRichText };
}

function hasRichTextContent(value: unknown): boolean {
  const content = toRichText(value);
  return collectText(content).trim().length > 0;
}

function collectText(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(collectText).join(" ");
}
