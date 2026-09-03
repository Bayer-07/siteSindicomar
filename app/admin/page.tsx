import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getVerifiedAdmin } from "@/lib/auth";
import { getDatabase, isDatabaseConfigured } from "@/lib/db";
import { collectiveDocuments, submissions } from "@/lib/db/schema";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

export const metadata: Metadata = { title: "Painel administrativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isDatabaseConfigured()) redirect("/admin/login");
  const user = await getVerifiedAdmin();
  if (!user) redirect("/admin/login");
  const db = getDatabase();
  const [rows, newRows, reviewRows, failedRows, membershipRows] = db ? await Promise.all([
    db.select({ protocol: submissions.protocol, kind: submissions.kind, requester_name: submissions.requesterName, status: submissions.status, created_at: submissions.createdAt }).from(submissions).orderBy(desc(submissions.createdAt)).limit(8),
    db.select({ value: count() }).from(submissions).where(eq(submissions.status, "new")),
    db.select({ value: count() }).from(collectiveDocuments).where(and(eq(collectiveDocuments.status, "published"), gte(collectiveDocuments.validUntil, sql`CURRENT_DATE`), lte(collectiveDocuments.validUntil, sql`CURRENT_DATE + INTERVAL '90 days'`))),
    db.select({ value: count() }).from(submissions).where(eq(submissions.emailNotificationStatus, "failed")),
    db.select({ value: count() }).from(submissions).where(eq(submissions.kind, "membership")),
  ]) : [[], [{ value: 0 }], [{ value: 0 }], [{ value: 0 }], [{ value: 0 }]];
  const recent = rows.map((row) => ({ ...row, created_at: row.created_at.toISOString() }));
  return <AdminDashboard email={user.email} recentSubmissions={recent} metrics={{ newSubmissions: Number(newRows[0]?.value ?? 0), documentsToReview: Number(reviewRows[0]?.value ?? 0), failedEmails: Number(failedRows[0]?.value ?? 0), memberships: Number(membershipRows[0]?.value ?? 0) }} />;
}
