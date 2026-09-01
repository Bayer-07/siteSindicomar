import { NextRequest, NextResponse } from "next/server";
import { sendSubmissionEmails } from "@/lib/email";
import { createProtocol } from "@/lib/protocol";
import { submissionSchema } from "@/lib/schemas";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isTurnstileConfigured, validateTurnstile } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ message: "Corpo da solicitação inválido." }, { status: 400 }); }
  const parsed = submissionSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Revise os dados informados.", issues: parsed.error.flatten() }, { status: 422 });

  // Bots that fill the hidden field are rejected before touching the database.
  if (parsed.data.website) return NextResponse.json({ message: "Não foi possível registrar a solicitação." }, { status: 400 });

  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (isTurnstileConfigured() && !(await validateTurnstile(parsed.data.turnstileToken, remoteIp))) return NextResponse.json({ message: "Não foi possível validar a proteção antispam. Atualize a página e tente novamente." }, { status: 400 });

  const protocol = createProtocol();
  let submissionId: string | null = null;
  if (isSupabaseAdminConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("submissions").insert({
      protocol,
      kind: parsed.data.kind,
      status: "new",
      requester_name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      preferred_channel: parsed.data.preferredChannel,
      subject: "subject" in parsed.data ? parsed.data.subject : parsed.data.kind,
      company_cnpj: "cnpj" in parsed.data ? parsed.data.cnpj : null,
      company_name: "companyName" in parsed.data ? parsed.data.companyName : null,
      municipality: "municipality" in parsed.data ? parsed.data.municipality : null,
      activity: "activity" in parsed.data ? parsed.data.activity : null,
      message: parsed.data.message,
      source_path: parsed.data.sourcePath,
      consent_at: new Date().toISOString(),
      email_notification_status: "pending",
    }).select("id").single();
    if (error || !data) return NextResponse.json({ message: "Não foi possível registrar a solicitação. Tente novamente em alguns minutos." }, { status: 503 });
    submissionId = data.id as string;
    await supabase.from("submission_events").insert({ submission_id: submissionId, event_type: "created", details: { source: "public_form" } });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "O formulário está temporariamente indisponível enquanto o ambiente de atendimento é configurado." }, { status: 503 });
  }

  const emailResult = await sendSubmissionEmails(parsed.data, protocol);
  if (submissionId && isSupabaseAdminConfigured()) {
    const supabase = createSupabaseAdminClient();
    await supabase.from("submissions").update({ email_notification_status: emailResult.sent ? "sent" : "failed", email_notification_error: emailResult.sent ? null : emailResult.reason }).eq("id", submissionId);
    await supabase.from("submission_events").insert({ submission_id: submissionId, event_type: emailResult.sent ? "email_sent" : "email_failed", details: emailResult.sent ? {} : { reason: emailResult.reason } });
  }

  return NextResponse.json({ protocol, persisted: Boolean(submissionId), emailSent: emailResult.sent }, { status: 201 });
}
