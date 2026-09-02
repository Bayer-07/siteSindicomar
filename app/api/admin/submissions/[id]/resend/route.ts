import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getVerifiedAdmin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { submissions, submissionEvents } from "@/lib/db/schema";
import { sendSubmissionEmails } from "@/lib/email";
import { submissionSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin || origin === new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  const admin = await getVerifiedAdmin();
  const db = getDatabase();
  if (!admin) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  if (!db) return NextResponse.json({ message: "Banco indisponível." }, { status: 503 });
  const id = (await params).id;
  const rows = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ message: "Solicitação não encontrada." }, { status: 404 });

  const base = { name: row.requesterName, email: row.email, phone: row.phone, message: row.message, preferredChannel: row.preferredChannel, privacyAccepted: true as const, turnstileToken: "", website: "", sourcePath: row.sourcePath ?? "/" };
  const input = row.kind === "contact"
    ? { ...base, kind: "contact" as const, subject: row.subject as "cct" | "classification" | "membership" | "benefits" | "guides" | "press" | "other" }
    : row.kind === "classification"
      ? { ...base, kind: "classification" as const, cnpj: row.companyCnpj ?? "", municipality: row.municipality ?? "", activity: row.activity ?? "" }
      : { ...base, kind: "membership" as const, cnpj: row.companyCnpj ?? "", companyName: row.companyName ?? "", municipality: row.municipality ?? "", activity: row.activity ?? "" };
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ message: "Os dados antigos não permitem reenviar esta notificação." }, { status: 422 });
  const result = await sendSubmissionEmails(parsed.data, row.protocol);
  await db.update(submissions).set({ emailNotificationStatus: result.sent ? "sent" : "failed", emailNotificationError: result.sent ? null : result.reason }).where(eq(submissions.id, id));
  await db.insert(submissionEvents).values({ id: randomUUID(), submissionId: id, eventType: result.sent ? "email_resent" : "email_failed", details: { notificationSent: result.notificationSent, confirmationSent: result.confirmationSent, ...(result.reason ? { reason: result.reason } : {}) }, actorEmail: admin.email, createdAt: new Date() });
  return NextResponse.json({ ok: result.sent, message: result.sent ? "Notificações reenviadas." : "Uma ou mais notificações não puderam ser enviadas.", notificationEmailSent: result.notificationSent, confirmationEmailSent: result.confirmationSent, reason: result.sent ? undefined : result.reason }, { status: result.sent ? 200 : 502 });
}
