"use client";
/* eslint-disable @next/next/no-img-element */

import { Dialog } from "@base-ui/react/dialog";
import type { JSONContent } from "@tiptap/core";
import { Archive, Database, Eye, FileImage, FileUp, Loader2, MessageCircle, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { agendaStatusOptions, agendaTypeOptions, booleanOptions, documentStatusOptions, documentTypeOptions, publicationOptions, serviceCategoryOptions, submissionStatusOptions } from "@/lib/admin-options";
import { slugify } from "@/lib/slug";

type AdminRecord = Record<string, unknown>;
type FieldDefinition = { key: string; label: string; type?: "text" | "textarea" | "number" | "date" | "datetime-local" | "select" | "json" | "richtext"; required?: boolean; help?: string; placeholder?: string; options?: ReadonlyArray<{ value: string; label: string }> };
type UploadDefinition = { key: string; label: string; helper: string; bucket: "public-images" | "public-documents"; accept: string; maxBytes: number };
type ModuleConfig = { fields: FieldDefinition[]; titleKey: string; archive?: boolean; upload?: UploadDefinition };
type AssetUploadFieldProps = { upload: UploadDefinition; existingPath: string; existingPreview: string; selectedPreview: string; removeExisting: boolean; onSelect: (file: File | null) => void; onRemove: () => void; onUndoRemove: () => void };

const emptyRichText: JSONContent = { type: "doc", content: [] };
const publicationTimestampTables = new Set(["pages", "collective_documents", "agenda_items", "services", "posts"]);
const entityLabels: Record<string, string> = { documentos: "documento", agenda: "item da agenda", noticias: "notícia", conteudo: "página", servicos: "serviço", institucional: "registro da diretoria", parceiros: "parceiro", configuracoes: "configuração", solicitacoes: "solicitação" };
const configs: Record<string, ModuleConfig> = {
  documentos: { titleKey: "title", archive: true, fields: [
    { key: "title", label: "Título", required: true, placeholder: "Ex.: CCT do comércio varejista 2026" }, { key: "slug", label: "Endereço da página (slug)", required: true, help: "Gerado automaticamente pelo título. Você pode ajustar se necessário." }, { key: "summary", label: "Resumo", type: "textarea", help: "Texto curto exibido na biblioteca de documentos." },
    { key: "municipality", label: "Município", required: true }, { key: "category_label", label: "Categoria", required: true }, { key: "year", label: "Ano", type: "number", required: true },
    { key: "document_type", label: "Tipo", type: "select", required: true, options: documentTypeOptions },
    { key: "document_status", label: "Situação do instrumento", type: "select", required: true, options: documentStatusOptions },
    { key: "valid_from", label: "Início da vigência", type: "date" }, { key: "valid_until", label: "Fim da vigência", type: "date" }, { key: "base_date", label: "Data-base" }, { key: "labor_union", label: "Sindicato laboral" }, { key: "mte_registration", label: "Registro MTE" }, { key: "last_reviewed_at", label: "Última conferência", type: "datetime-local", required: true }, { key: "official_source", label: "Fonte oficial" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions },
  ] },
  agenda: { titleKey: "title", archive: true, fields: [
    { key: "title", label: "Título", required: true }, { key: "slug", label: "Endereço da página (slug)", required: true, help: "Gerado automaticamente pelo título." }, { key: "description", label: "Descrição", type: "textarea", help: "Explique o que acontece, para quem e onde." }, { key: "starts_at", label: "Início", type: "datetime-local", required: true }, { key: "ends_at", label: "Término", type: "datetime-local" }, { key: "municipality", label: "Município", required: true }, { key: "agenda_type", label: "Tipo", type: "select", required: true, options: agendaTypeOptions }, { key: "agenda_status", label: "Situação", type: "select", required: true, options: agendaStatusOptions }, { key: "status", label: "Publicação", type: "select", options: publicationOptions },
  ] },
  noticias: { titleKey: "title", archive: true, upload: { key: "cover_image_path", label: "Imagem de capa", helper: "JPG, PNG, WEBP ou AVIF até 10 MB. Essa imagem aparecerá nos cards e na notícia.", bucket: "public-images", accept: "image/jpeg,image/png,image/webp,image/avif", maxBytes: 10 * 1024 * 1024 }, fields: [{ key: "title", label: "Título", required: true, placeholder: "Ex.: Funcionamento do comércio em feriados" }, { key: "slug", label: "Endereço da notícia (slug)", required: true, help: "Preenchido automaticamente a partir do título. Evite alterar depois de publicar." }, { key: "excerpt", label: "Resumo da notícia", type: "textarea", required: true, help: "Uma ou duas frases para a listagem e para o compartilhamento." }, { key: "category", label: "Categoria", required: true, placeholder: "Ex.: Relações do trabalho" }, { key: "author_name", label: "Autor", required: true, placeholder: "Ex.: Equipe Sindicomar" }, { key: "content", label: "Conteúdo da notícia", type: "richtext", required: true, help: "Escreva o texto usando os botões de formatação. Não é necessário conhecer JSON." }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  conteudo: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "slug", label: "Endereço da página (slug)", required: true, help: "Gerado automaticamente pelo título." }, { key: "excerpt", label: "Resumo", type: "textarea" }, { key: "content", label: "Conteúdo da página", type: "richtext", help: "Edite visualmente o texto, títulos e listas." }, { key: "seo_title", label: "Título para buscadores", help: "Opcional. Se ficar vazio, o título da página será usado." }, { key: "seo_description", label: "Descrição para buscadores", type: "textarea" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  servicos: { titleKey: "title", archive: true, fields: [{ key: "title", label: "Título", required: true }, { key: "slug", label: "Endereço do serviço (slug)", required: true, help: "Gerado automaticamente pelo título." }, { key: "excerpt", label: "Resumo", type: "textarea", help: "Texto curto exibido na lista de serviços." }, { key: "content", label: "Descrição completa", type: "richtext", help: "Explique o serviço em linguagem clara, usando títulos e listas quando necessário." }, { key: "category", label: "Categoria", type: "select", required: true, options: serviceCategoryOptions }, { key: "eligibility", label: "Quem pode utilizar", type: "textarea" }, { key: "is_exclusive", label: "Benefício exclusivo", type: "select", options: booleanOptions }, { key: "partner_name", label: "Parceiro" }, { key: "valid_until", label: "Validade", type: "date" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  institucional: { titleKey: "name", archive: true, upload: { key: "photo_path", label: "Foto", helper: "JPG, PNG, WEBP ou AVIF até 10 MB.", bucket: "public-images", accept: "image/jpeg,image/png,image/webp,image/avif", maxBytes: 10 * 1024 * 1024 }, fields: [{ key: "name", label: "Nome", required: true }, { key: "role", label: "Cargo", required: true }, { key: "bio", label: "Biografia", type: "textarea" }, { key: "mandate_start", label: "Início do mandato", type: "date" }, { key: "mandate_end", label: "Fim do mandato", type: "date" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  parceiros: { titleKey: "name", archive: true, upload: { key: "logo_path", label: "Logo do parceiro", helper: "JPG, PNG, WEBP ou AVIF até 10 MB.", bucket: "public-images", accept: "image/jpeg,image/png,image/webp,image/avif", maxBytes: 10 * 1024 * 1024 }, fields: [{ key: "name", label: "Nome", required: true }, { key: "description", label: "Descrição", type: "textarea" }, { key: "website_url", label: "Site" }, { key: "valid_from", label: "Início", type: "date" }, { key: "valid_until", label: "Validade", type: "date" }, { key: "display_order", label: "Ordem", type: "number" }, { key: "status", label: "Publicação", type: "select", options: publicationOptions }] },
  configuracoes: { titleKey: "key", fields: [{ key: "key", label: "Chave", required: true }, { key: "value", label: "Valor técnico (JSON)", type: "json", required: true, help: "Campo avançado para configurações do sistema. Não é necessário para notícias, páginas ou serviços." }] },
  solicitacoes: { titleKey: "protocol", fields: [{ key: "status", label: "Situação", type: "select", options: submissionStatusOptions }] },
};

export type AdminCrudHandle = { startCreate: () => void };
type AdminCrudProps = { section: string; table: string; initialRecords: AdminRecord[]; createEnabled: boolean; showCreateButton?: boolean };

export const AdminCrud = forwardRef<AdminCrudHandle, AdminCrudProps>(function AdminCrud({ section, table, initialRecords, createEnabled, showCreateButton = true }: AdminCrudProps, ref) {
  const config = configs[section];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<AdminRecord>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [asset, setAsset] = useState<File | null>(null);
  const [removeAsset, setRemoveAsset] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AdminRecord | null>(null);
  const isEditing = Boolean(record.id);
  const fields = useMemo(() => config?.fields ?? [], [config]);
  const visibleFields = useMemo(() => fields.filter((field) => field.key !== "slug"), [fields]);
  const upload = config?.upload;
  const assetPreview = useMemo(() => asset ? URL.createObjectURL(asset) : "", [asset]);
  const pdfPreview = useMemo(() => pdf ? URL.createObjectURL(pdf) : "", [pdf]);
  const savedAssetPath = upload ? String(record[upload.key] ?? "") : "";
  const savedPdfPath = section === "documentos" ? String(record.storage_path ?? "") : "";
  const savedAssetPreview = useMemo(() => {
    if (!upload || !savedAssetPath || removeAsset || asset) return "";
    return `/media/${savedAssetPath.split("/").map(encodeURIComponent).join("/")}`;
  }, [asset, removeAsset, savedAssetPath, upload]);
  const savedPdfUrl = useMemo(() => {
    return savedPdfPath ? `/media/${savedPdfPath.split("/").map(encodeURIComponent).join("/")}` : "";
  }, [savedPdfPath]);

  useEffect(() => {
    if (assetPreview) return () => URL.revokeObjectURL(assetPreview);
  }, [assetPreview]);

  useEffect(() => {
    if (pdfPreview) return () => URL.revokeObjectURL(pdfPreview);
  }, [pdfPreview]);

  const startCreate = useCallback(() => { setRecord(defaultRecord(section)); setPdf(null); setAsset(null); setRemoveAsset(false); setSlugEdited(false); setError(""); setOpen(true); }, [section]);
  function startEdit(item: AdminRecord) { setRecord(normalizeForForm(item, fields)); setPdf(null); setAsset(null); setRemoveAsset(false); setSlugEdited(Boolean(item.slug)); setError(""); setOpen(true); }
  function startView(item: AdminRecord) { setDetailRecord(item); }
  useImperativeHandle(ref, () => ({ startCreate }), [startCreate]);
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
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try {
      const payload = serializeRecord(record, fields);
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      if (publicationTimestampTables.has(table) && payload.status === "published" && !payload.published_at) payload.published_at = new Date().toISOString();
      if (section === "documentos" && pdf) {
        if (pdf.type !== "application/pdf" || pdf.size > 20 * 1024 * 1024) throw new Error("O arquivo deve ser um PDF de até 20 MB.");
        const form = new FormData(); form.set("file", pdf); form.set("kind", "document");
        const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: form }); const uploaded = await uploadResponse.json().catch(() => ({})) as { message?: string; storageKey?: string };
        if (!uploadResponse.ok) throw new Error(uploaded.message ?? "Não foi possível enviar o PDF.");
        Object.assign(payload, { storage_path: uploaded.storageKey, original_filename: pdf.name, mime_type: pdf.type, file_size_bytes: pdf.size });
      }
      if (upload && asset) {
        const supportedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        if (!supportedImageTypes.includes(asset.type) || asset.size > upload.maxBytes) throw new Error("A imagem deve estar em JPG, PNG, WEBP ou AVIF e ter até 10 MB.");
        const form = new FormData(); form.set("file", asset); form.set("kind", "image");
        const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: form }); const uploaded = await uploadResponse.json().catch(() => ({})) as { message?: string; storageKey?: string };
        if (!uploadResponse.ok) throw new Error(uploaded.message ?? "Não foi possível enviar a imagem.");
        payload[upload.key] = uploaded.storageKey;
      } else if (upload && removeAsset) {
        payload[upload.key] = null;
      }
      // The API route is keyed by the Portuguese module identifier while
      // `table` is the underlying PostgreSQL table name used for date handling.
      const response = await fetch(`/api/admin/${section}`, { method: isEditing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(isEditing ? { ...payload, id: record.id } : payload) });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Não foi possível salvar o registro.");
      setOpen(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  async function archive(item: AdminRecord) {
    if (!config?.archive || !item.id) return;
    setSaving(true);
    const response = await fetch(`/api/admin/${section}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, status: "archived" }) });
    if (!response.ok) { const data = await response.json().catch(() => ({})) as { message?: string }; setError(data.message ?? "Não foi possível arquivar."); } else router.refresh();
    setSaving(false);
  }

  if (!config) return <div className="empty-admin">Configuração deste módulo não encontrada.</div>;
  const inputValue = (value: unknown, key?: string) => {
    if (key === "is_exclusive") return value === true || value === 1 || value === "true" ? "true" : "false";
    return value === null || value === undefined || typeof value === "object" ? "" : String(value);
  };
  const renderField = (field: FieldDefinition) => {
    const fieldValue = record[field.key];
    const isFullWidth = field.type === "textarea" || field.type === "json" || field.type === "richtext";
    if (field.type === "richtext") return <div className="field field-full" key={field.key}><span>{field.label}</span>{field.help && <small className="field-help">{field.help}</small>}<TiptapEditor value={toRichText(fieldValue)} onChange={(value) => updateValue(field.key, value)} /></div>;
    return <label className={isFullWidth ? "field field-full" : "field"} key={field.key}><span>{field.label}</span>{field.help && <small className="field-help">{field.help}</small>}{field.type === "textarea" || field.type === "json" ? <textarea rows={field.type === "json" ? 7 : 4} required={field.required} value={inputValue(fieldValue, field.key)} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} /> : field.type === "select" ? <select required={field.required} value={inputValue(fieldValue, field.key)} onChange={(event) => updateValue(field.key, event.target.value)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type ?? "text"} required={field.required} value={inputValue(fieldValue, field.key)} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} />}</label>;
  };
  const entityLabel = entityLabels[section] ?? "registro";
  return <>{createEnabled && showCreateButton && <div className="crud-actions"><button className="button button-primary" type="button" onClick={startCreate}><Plus size={17} /> Novo {entityLabel}</button></div>}{initialRecords.length ? <div className="admin-record-list">{initialRecords.map((item, index) => <article key={String(item.id ?? index)}><div><strong>{String(item[config.titleKey] ?? `Registro ${index + 1}`)}</strong><p>{String(item.summary ?? item.excerpt ?? item.requester_name ?? item.status ?? "Sem descrição")}</p></div><div>{section === "solicitacoes" && <button className="admin-view-button" type="button" onClick={() => startView(item)}><Eye size={15} /> Ver detalhes</button>}<span className="status-badge status-informational">{String(item.status ?? "cadastrado")}</span><button type="button" onClick={() => startEdit(item)}><Pencil size={15} /> Editar</button>{config.archive && item.status !== "archived" && <button type="button" onClick={() => void archive(item)} disabled={saving}><Archive size={15} /> Arquivar</button>}</div></article>)}</div> : <div className="empty-admin"><Database size={28} /><strong>Nenhum registro neste módulo</strong><p>Use “Novo {entityLabel}” para iniciar o conteúdo.</p></div>}
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Viewport className="crud-dialog-viewport"><Dialog.Popup className="crud-dialog"><div className="dialog-heading"><div><Dialog.Title>{isEditing ? `Editar ${entityLabel}` : `Novo ${entityLabel}`}</Dialog.Title><Dialog.Description>Preencha os campos e salve como rascunho. Publique somente depois da revisão.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Fechar"><X size={20} /></Dialog.Close></div><form onSubmit={save} className="crud-form">{visibleFields.map(renderField)}{upload && <AssetUploadField upload={upload} existingPath={savedAssetPath} existingPreview={savedAssetPreview} selectedPreview={assetPreview} removeExisting={removeAsset} onSelect={(file) => { setAsset(file); if (file) setRemoveAsset(false); }} onRemove={() => { setAsset(null); setRemoveAsset(true); }} onUndoRemove={() => setRemoveAsset(false)} />}{section === "documentos" && <DocumentUploadField allowUpload existingPath={savedPdfPath} existingUrl={savedPdfUrl} selectedFile={pdf} selectedUrl={pdfPreview} onSelect={setPdf} />}{error && <p className="form-error field-full">{error}</p>}<div className="form-actions field-full"><Dialog.Close className="button button-secondary">Cancelar</Dialog.Close><button className="button button-primary" type="submit" disabled={saving}>{saving ? <><Loader2 className="spin" size={17} /> Salvando…</> : "Salvar registro"}</button></div></form></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>
    {section === "solicitacoes" && <Dialog.Root open={Boolean(detailRecord)} onOpenChange={(nextOpen) => { if (!nextOpen) setDetailRecord(null); }}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Viewport className="crud-dialog-viewport"><Dialog.Popup className="crud-dialog submission-detail-dialog"><div className="dialog-heading"><div><Dialog.Title>Detalhes da solicitação</Dialog.Title><Dialog.Description>Protocolo e dados enviados pelo formulário.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Fechar"><X size={20} /></Dialog.Close></div>{detailRecord && <SubmissionDetails record={detailRecord} />}<div className="form-actions"><Dialog.Close className="button button-secondary">Fechar</Dialog.Close></div></Dialog.Popup></Dialog.Viewport></Dialog.Portal></Dialog.Root>}
  </>;
});

function AssetUploadField({ upload, existingPath, existingPreview, selectedPreview, removeExisting, onSelect, onRemove, onUndoRemove }: AssetUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasExistingAsset = Boolean(existingPath);

  function clearSelection() {
    onSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return <div className="upload-field field-full"><FileImage aria-hidden="true" /><div className="upload-field-content"><strong>{upload.label}</strong><small>{upload.helper}</small>{selectedPreview ? <div className="upload-preview-card"><img className="upload-preview" src={selectedPreview} alt="Pré-visualização da nova imagem" /><div className="upload-preview-actions"><small>Nova imagem selecionada</small><button className="upload-remove-button" type="button" onClick={clearSelection}>Remover seleção</button></div></div> : hasExistingAsset && !removeExisting ? <div className="upload-preview-card"><>{existingPreview && <img className="upload-preview" src={existingPreview} alt="Imagem atual cadastrada" />}</><div className="upload-preview-actions"><small>{existingPreview ? "Imagem atual" : "Imagem atual cadastrada"}</small><button className="upload-remove-button" type="button" onClick={onRemove}>Remover imagem atual</button></div></div> : removeExisting ? <div className="upload-removed-note"><small>A imagem atual será removida ao salvar.</small><button className="upload-undo-button" type="button" onClick={onUndoRemove}>Desfazer remoção</button></div> : null}<label className="upload-picker"><span>{hasExistingAsset ? "Escolher outra imagem" : "Escolher imagem"}</span><input ref={fileInputRef} type="file" accept={upload.accept} onChange={(event) => onSelect(event.target.files?.[0] ?? null)} /></label></div></div>;
}

function DocumentUploadField({ allowUpload, existingPath, existingUrl, selectedFile, selectedUrl, onSelect }: { allowUpload: boolean; existingPath: string; existingUrl: string; selectedFile: File | null; selectedUrl: string; onSelect: (file: File | null) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasExistingFile = Boolean(existingPath);
  const fileName = selectedFile?.name || existingPath.split("/").pop() || "PDF oficial";

  function clearSelection() {
    onSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewUrl = selectedUrl || existingUrl;
  return <div className="upload-field field-full"><FileUp aria-hidden="true" /><div className="upload-field-content"><strong>PDF oficial</strong><small>{allowUpload ? "application/pdf, até 20 MB. Ao trocar o arquivo, o documento atual será atualizado e o PDF anterior ficará indisponível." : "Arquivo oficial atualmente associado a este registro."}</small>{previewUrl ? <iframe className="document-upload-preview" src={previewUrl} title={`Prévia de ${fileName}`} /> : <div className="document-file-unavailable"><small>{hasExistingFile ? `Arquivo cadastrado: ${fileName}` : "Nenhum PDF anexado ainda."}</small></div>}<div className="document-file-actions">{previewUrl && <a className="document-file-link" href={previewUrl} target="_blank" rel="noreferrer">{selectedFile ? "Abrir PDF selecionado" : "Abrir PDF atual"}</a>}{selectedFile && <button className="upload-remove-button" type="button" onClick={clearSelection}>Cancelar novo arquivo</button>}</div>{allowUpload && <label className="upload-picker"><span>{hasExistingFile ? "Escolher outro PDF" : "Escolher PDF"}</span><input ref={fileInputRef} type="file" accept="application/pdf" onChange={(event) => onSelect(event.target.files?.[0] ?? null)} /></label>}</div></div>;
}

function SubmissionDetails({ record }: { record: AdminRecord }) {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const value = (key: string) => String(record[key] ?? "").trim();
  const createdAt = value("created_at");
  const date = createdAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(createdAt)) : "Não informado";
  const kindLabels: Record<string, string> = { contact: "Contato", classification: "Enquadramento", membership: "Associação" };
  const channelLabels: Record<string, string> = { email: "E-mail", phone: "Ligação", whatsapp: "WhatsApp" };
  const statusLabels: Record<string, string> = { new: "Novo", handling: "Em atendimento", waiting: "Aguardando retorno", completed: "Concluído" };
  const emailStatusLabels: Record<string, string> = { pending: "Pendente", sent: "Enviado", failed: "Falhou" };
  const phone = value("phone");
  const whatsappHref = buildWhatsappHref(phone, value("requester_name"), value("protocol"));
  async function resendNotification() {
    if (!value("id")) return;
    setResending(true); setResendMessage("");
    try {
      const response = await fetch(`/api/admin/submissions/${encodeURIComponent(value("id"))}/resend`, { method: "POST" });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Não foi possível reenviar a notificação.");
      setResendMessage(data.message ?? "Notificação reenviada.");
    } catch (error) { setResendMessage(error instanceof Error ? error.message : "Não foi possível reenviar a notificação."); }
    finally { setResending(false); }
  }

  const emailStatus = value("email_notification_status");
  return <div className="submission-details"><dl className="submission-detail-grid"><Detail label="Protocolo" value={value("protocol")} /><Detail label="Tipo" value={kindLabels[value("kind")] ?? value("kind")} /><Detail label="Situação" value={statusLabels[value("status")] ?? value("status")} /><Detail label="Recebido em" value={date} /><Detail label="Responsável" value={value("requester_name")} /><Detail label="Canal preferido" value={channelLabels[value("preferred_channel")] ?? value("preferred_channel")} /><Detail label="E-mail" value={value("email")} href={value("email") ? `mailto:${value("email")}` : undefined} /><div className="submission-detail-item"><dt>Telefone</dt><dd className="submission-phone-value"><a href={phone ? `tel:${phone}` : undefined}>{phone || "Não informado"}</a>{whatsappHref && <a className="button button-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer" aria-label={`Abrir conversa no WhatsApp com ${value("requester_name")}`}><MessageCircle size={15} /> WhatsApp</a>}</dd></div>{value("subject") && <Detail label="Assunto" value={value("subject")} />}{value("company_name") && <Detail label="Empresa" value={value("company_name")} />}{value("company_cnpj") && <Detail label="CNPJ" value={value("company_cnpj")} />}{value("municipality") && <Detail label="Município" value={value("municipality")} />}{value("activity") && <Detail label="Atividade" value={value("activity")} />}</dl><div className="submission-detail-message"><span>Mensagem</span><p>{value("message") || "Nenhuma mensagem informada."}</p></div><div className="submission-detail-notification"><span>Notificação por e-mail</span><strong>{emailStatusLabels[emailStatus] ?? "Não configurada"}</strong>{value("email_notification_error") && <small>{value("email_notification_error")}</small>}{emailStatus === "failed" && <button className="button button-secondary" type="button" onClick={() => void resendNotification()} disabled={resending}>{resending ? "Reenviando…" : "Reenviar notificação"}</button>}{resendMessage && <small role="status">{resendMessage}</small>}</div></div>;
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
