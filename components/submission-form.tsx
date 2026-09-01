"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { digitsOnly, formatCnpj, formatPhone } from "@/lib/masks";

declare global {
  interface Window {
    turnstile?: { render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => string; remove: (id: string) => void };
  }
}

const formSchema = z.object({
  kind: z.enum(["contact", "classification", "membership"]),
  name: z.string().trim().min(3, "Informe seu nome completo"),
  email: z.string().trim().email("Informe um e-mail válido"),
  phone: z.string().trim().transform((value) => digitsOnly(value, 11)).refine((value) => value.length >= 10, "Informe um telefone com DDD"),
  preferredChannel: z.enum(["email", "phone", "whatsapp"]),
  subject: z.enum(["cct", "classification", "membership", "benefits", "guides", "press", "other"]).optional(),
  cnpj: z.string().trim().transform((value) => digitsOnly(value, 14)).optional(),
  companyName: z.string().trim().optional(),
  municipality: z.string().trim().optional(),
  activity: z.string().trim().optional(),
  message: z.string().trim().min(10, "Explique brevemente como podemos ajudar"),
  privacyAccepted: z.boolean().refine((value) => value, { message: "Aceite o aviso de privacidade para continuar" }),
  turnstileToken: z.string().default(""),
  website: z.string().max(200).default(""),
  sourcePath: z.string().default("/"),
}).superRefine((data, context) => {
  if (data.kind !== "contact") {
    if (!data.cnpj || data.cnpj.length !== 14) context.addIssue({ code: "custom", path: ["cnpj"], message: "Informe os 14 dígitos do CNPJ" });
    if (!data.municipality || data.municipality.length < 2) context.addIssue({ code: "custom", path: ["municipality"], message: "Informe o município" });
    if (!data.activity || data.activity.length < 3) context.addIssue({ code: "custom", path: ["activity"], message: "Informe a atividade" });
  }
  if (data.kind === "membership" && (!data.companyName || data.companyName.length < 2)) context.addIssue({ code: "custom", path: ["companyName"], message: "Informe a empresa" });
});

type FormValues = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

export function SubmissionForm({ kind = "contact" }: { kind?: "contact" | "classification" | "membership" }) {
  const [protocol, setProtocol] = useState("");
  const [serverError, setServerError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { kind, preferredChannel: "whatsapp", privacyAccepted: false, subject: kind === "contact" ? "cct" : kind, turnstileToken: "", website: "", sourcePath: typeof window === "undefined" ? "/" : window.location.pathname },
  });
  const cnpjRegistration = register("cnpj");
  const phoneRegistration = register("phone");

  useEffect(() => {
    if (!siteKey || !scriptReady || !widgetRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, { sitekey: siteKey, callback: (token) => setValue("turnstileToken", token), "expired-callback": () => setValue("turnstileToken", "") });
    return () => { if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current); widgetId.current = null; };
  }, [scriptReady, setValue, siteKey]);

  async function onSubmit(values: FormOutput) {
    setServerError("");
    const response = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const payload = (await response.json()) as { protocol?: string; message?: string };
    if (!response.ok) { setServerError(payload.message ?? "Não foi possível registrar a solicitação."); return; }
    setProtocol(payload.protocol ?? "");
  }

  if (protocol) return <div className="form-success" role="status"><CheckCircle2 size={38} /><span className="eyebrow">Solicitação recebida</span><h2>Protocolo {protocol}</h2><p>Guarde este número. A solicitação foi registrada e será encaminhada pelo canal informado.</p></div>;

  const companyFields = kind !== "contact";
  return (
    <form className="submission-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />}
      <input type="hidden" {...register("kind")} /><input type="hidden" {...register("sourcePath")} /><input type="hidden" {...register("turnstileToken")} />
      <label className="field-honeypot" aria-hidden="true"><span>Website</span><input tabIndex={-1} autoComplete="off" {...register("website")} /></label>
      {kind === "contact" && <label className="field field-full"><span>Assunto</span><select {...register("subject")}><option value="cct">Convenções e relações do trabalho</option><option value="classification">Enquadramento</option><option value="membership">Associação</option><option value="benefits">Serviços e benefícios</option><option value="guides">Contribuições e guias</option><option value="press">Imprensa</option><option value="other">Outro assunto</option></select></label>}
      {kind === "membership" && <Field label="Razão social ou nome da empresa" error={errors.companyName?.message}><input {...register("companyName")} autoComplete="organization" /></Field>}
      {companyFields && <Field label="CNPJ" error={errors.cnpj?.message}><input {...cnpjRegistration} inputMode="numeric" autoComplete="off" maxLength={18} placeholder="00.000.000/0000-00" onChange={(event) => { event.currentTarget.value = formatCnpj(event.currentTarget.value); cnpjRegistration.onChange(event); }} /></Field>}
      <Field label="Nome do responsável" error={errors.name?.message}><input {...register("name")} autoComplete="name" /></Field>
      <Field label="E-mail" error={errors.email?.message}><input {...register("email")} type="email" autoComplete="email" /></Field>
      <Field label="Telefone" error={errors.phone?.message}><input {...phoneRegistration} type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(45) 99999-9999" onChange={(event) => { event.currentTarget.value = formatPhone(event.currentTarget.value); phoneRegistration.onChange(event); }} /></Field>
      {companyFields && <Field label="Município" error={errors.municipality?.message}><input {...register("municipality")} /></Field>}
      {companyFields && <label className="field field-full"><span>Atividade principal</span><input {...register("activity")} />{errors.activity && <small className="field-error">{errors.activity.message}</small>}</label>}
      <label className="field field-full"><span>Como prefere receber o retorno?</span><select {...register("preferredChannel")}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="phone">Ligação</option></select></label>
      <label className="field field-full"><span>{kind === "contact" ? "Mensagem" : "Conte um pouco sobre sua solicitação"}</span><textarea rows={5} {...register("message")} />{errors.message && <small className="field-error">{errors.message.message}</small>}</label>
      <label className="checkbox-field field-full"><input type="checkbox" {...register("privacyAccepted")} /><span>Li o aviso de privacidade e concordo com o uso dos dados para responder esta solicitação.</span></label>
      {errors.privacyAccepted && <small className="field-error field-full">{errors.privacyAccepted.message}</small>}
      {siteKey && <div ref={widgetRef} className="field-full" />}
      {serverError && <p className="form-error field-full" role="alert">{serverError}</p>}
      <div className="form-actions field-full"><button className="button button-primary" disabled={isSubmitting} type="submit">{isSubmitting ? <><Loader2 className="spin" size={18} /> Enviando…</> : "Enviar solicitação"}</button></div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{error && <small className="field-error">{error}</small>}</label>;
}
