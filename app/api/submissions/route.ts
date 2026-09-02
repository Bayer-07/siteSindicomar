import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { sendSubmissionEmails } from "@/lib/email";
import { getDatabase } from "@/lib/db";
import { submissions, submissionEvents } from "@/lib/db/schema";
import { createProtocol } from "@/lib/protocol";
import { submissionSchema } from "@/lib/schemas";
import { isTurnstileConfigured, validateTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ message: "Corpo da solicitação inválido." }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Revise os dados informados.", issues: parsed.error.flatten() }, { status: 422 });
  if (parsed.data.website) return NextResponse.json({ message: "Não foi possível registrar a solicitação." }, { status: 400 });
  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (isTurnstileConfigured() && !(await validateTurnstile(parsed.data.turnstileToken, remoteIp))) return NextResponse.json({ message: "Não foi possível validar a proteção antispam. Atualize a página e tente novamente." }, { status: 400 });

  const protocol = createProtocol();
  const db = getDatabase();
  let submissionId: string | null = null;
  if (db) {
    submissionId = randomUUID();
    try {
      await db.insert(submissions).values({ id: submissionId, protocol, kind: parsed.data.kind, status: "new", requesterName: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, preferredChannel: parsed.data.preferredChannel, subject: "subject" in parsed.data ? parsed.data.subject : parsed.data.kind, companyCnpj: "cnpj" in parsed.data ? parsed.data.cnpj : null, companyName: "companyName" in parsed.data ? parsed.data.companyName : null, municipality: "municipality" in parsed.data ? parsed.data.municipality : null, activity: "activity" in parsed.data ? parsed.data.activity : null, message: parsed.data.message, sourcePath: parsed.data.sourcePath, consentAt: new Date(), emailNotificationStatus: "pending" });
      await db.insert(submissionEvents).values({ id: randomUUID(), submissionId, eventType: "created", details: { source: "public_form" }, createdAt: new Date() });
    } catch { return NextResponse.json({ message: "Não foi possível registrar a solicitação. Tente novamente em alguns minutos." }, { status: 503 }); }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "O formulário está temporariamente indisponível enquanto o banco é configurado." }, { status: 503 });
  }

  const emailResult = await sendSubmissionEmails(parsed.data, protocol);
  if (submissionId && db) {
    await db.update(submissions).set({ emailNotificationStatus: emailResult.sent ? "sent" : "failed", emailNotificationError: emailResult.sent ? null : emailResult.reason }).where(eq(submissions.id, submissionId));
    await db.insert(submissionEvents).values({ id: randomUUID(), submissionId, eventType: emailResult.sent ? "email_sent" : "email_failed", details: { notificationSent: emailResult.notificationSent, confirmationSent: emailResult.confirmationSent, ...(emailResult.reason ? { reason: emailResult.reason } : {}) }, createdAt: new Date() });
  }
  return NextResponse.json({ protocol, persisted: Boolean(submissionId), emailSent: emailResult.sent, notificationEmailSent: emailResult.notificationSent, confirmationEmailSent: emailResult.confirmationSent }, { status: 201 });
}
