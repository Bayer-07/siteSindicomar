import { Resend } from "resend";
import type { SubmissionInput } from "@/lib/schemas";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function sendSubmissionEmails(input: SubmissionInput, protocol: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.FORM_NOTIFICATION_EMAIL;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) return { sent: false, reason: "email_not_configured" };

  const resend = new Resend(apiKey);
  const details = [
    `<strong>Protocolo:</strong> ${escapeHtml(protocol)}`,
    `<strong>Tipo:</strong> ${escapeHtml(input.kind)}`,
    `<strong>Nome:</strong> ${escapeHtml(input.name)}`,
    `<strong>E-mail:</strong> ${escapeHtml(input.email)}`,
    `<strong>Telefone:</strong> ${escapeHtml(input.phone)}`,
    `<strong>Canal preferido:</strong> ${escapeHtml(input.preferredChannel)}`,
    "cnpj" in input ? `<strong>CNPJ:</strong> ${escapeHtml(input.cnpj)}` : "",
    "companyName" in input ? `<strong>Empresa:</strong> ${escapeHtml(input.companyName)}` : "",
    "municipality" in input ? `<strong>Município:</strong> ${escapeHtml(input.municipality)}` : "",
    "activity" in input ? `<strong>Atividade:</strong> ${escapeHtml(input.activity)}` : "",
    `<strong>Mensagem:</strong><br>${escapeHtml(input.message).replaceAll("\n", "<br>")}`,
  ].filter(Boolean).join("<br><br>");

  try {
    await resend.emails.send({ from: sender, to: recipient, replyTo: input.email, subject: `[${protocol}] Nova solicitação Sindicomar`, html: `<div style="font-family:Arial,sans-serif;color:#101828;line-height:1.5"><h1 style="color:#004A8D">Nova solicitação</h1>${details}</div>` });
    await resend.emails.send({ from: sender, to: input.email, subject: `Recebemos sua solicitação — ${protocol}`, html: `<div style="font-family:Arial,sans-serif;color:#101828;line-height:1.6"><h1 style="color:#004A8D">Solicitação recebida</h1><p>Olá, ${escapeHtml(input.name)}.</p><p>Seu contato foi registrado com o protocolo <strong>${escapeHtml(protocol)}</strong>.</p><p>A equipe do Sindicomar responderá pelo canal informado após a análise.</p></div>` });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "unknown_email_error" };
  }
}
