import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { SubmissionInput } from "@/lib/schemas";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function sendSubmissionEmails(input: SubmissionInput, protocol: string) {
  const recipient = process.env.FORM_NOTIFICATION_EMAIL?.trim() || "sindicomarmarechal@gmail.com";
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

  const notificationHtml = `<div style="font-family:Arial,sans-serif;color:#101828;line-height:1.5"><h1 style="color:#004A8D">Nova solicitação</h1>${details}</div>`;
  const confirmationHtml = `<div style="font-family:Arial,sans-serif;color:#101828;line-height:1.6"><h1 style="color:#004A8D">Solicitação recebida</h1><p>Olá, ${escapeHtml(input.name)}.</p><p>Seu contato foi registrado com o protocolo <strong>${escapeHtml(protocol)}</strong>.</p><p>A equipe do Sindicomar responderá pelo canal informado após a análise.</p></div>`;
  const transport = process.env.EMAIL_TRANSPORT?.trim().toLowerCase();

  type Delivery = { sent: boolean; reason?: string };
  const summarize = (notification: Delivery, confirmation: Delivery) => {
    const errors = [
      !notification.sent && `notificação ao Sindicomar: ${notification.reason ?? "erro desconhecido"}`,
      !confirmation.sent && `confirmação ao solicitante: ${confirmation.reason ?? "erro desconhecido"}`,
    ].filter(Boolean) as string[];
    return {
      sent: notification.sent && confirmation.sent,
      notificationSent: notification.sent,
      confirmationSent: confirmation.sent,
      reason: errors.length ? errors.join("; ") : undefined,
    };
  };

  if (transport === "gmail" || transport === "smtp") {
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
    if (!smtpUser || !smtpPass || !recipient) return { sent: false, notificationSent: false, confirmationSent: false, reason: "email_not_configured" };
    const smtpPort = Number(process.env.SMTP_PORT ?? 465);
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) return { sent: false, notificationSent: false, confirmationSent: false, reason: "smtp_port_invalid" };
    const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== "false" : smtpPort === 465;
    const sender = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser;
    try {
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com", port: smtpPort, secure: smtpSecure, auth: { user: smtpUser, pass: smtpPass } });
      const [notification, confirmation] = await Promise.all([
        transporter.sendMail({ from: sender, to: recipient, replyTo: input.email, subject: `[${protocol}] Nova solicitação Sindicomar`, html: notificationHtml })
          .then<Delivery>(() => ({ sent: true }))
          .catch<Delivery>((error) => ({ sent: false, reason: error instanceof Error ? error.message : "unknown_email_error" })),
        transporter.sendMail({ from: sender, to: input.email, subject: `Recebemos sua solicitação — ${protocol}`, html: confirmationHtml })
          .then<Delivery>(() => ({ sent: true }))
          .catch<Delivery>((error) => ({ sent: false, reason: error instanceof Error ? error.message : "unknown_email_error" })),
      ]);
      return summarize(notification, confirmation);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown_email_error";
      return { sent: false, notificationSent: false, confirmationSent: false, reason };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) return { sent: false, notificationSent: false, confirmationSent: false, reason: "email_not_configured" };

  const resend = new Resend(apiKey);

  try {
    const [notification, confirmation] = await Promise.all([
      resend.emails.send({ from: sender, to: recipient, replyTo: input.email, subject: `[${protocol}] Nova solicitação Sindicomar`, html: notificationHtml })
        .then<Delivery>((result) => result.error ? { sent: false, reason: result.error.message } : { sent: true })
        .catch<Delivery>((error) => ({ sent: false, reason: error instanceof Error ? error.message : "unknown_email_error" })),
      resend.emails.send({ from: sender, to: input.email, subject: `Recebemos sua solicitação — ${protocol}`, html: confirmationHtml })
        .then<Delivery>((result) => result.error ? { sent: false, reason: result.error.message } : { sent: true })
        .catch<Delivery>((error) => ({ sent: false, reason: error instanceof Error ? error.message : "unknown_email_error" })),
    ]);
    return summarize(notification, confirmation);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_email_error";
    return { sent: false, notificationSent: false, confirmationSent: false, reason };
  }
}
