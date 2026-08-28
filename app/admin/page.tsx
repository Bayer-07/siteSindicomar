import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAuthorizedAdminEmail, isSupabaseAdminConfigured, isSupabasePublicConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Painel administrativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  if (!isSupabasePublicConfigured() || !isSupabaseAdminConfigured()) redirect("/admin/login");
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const authorized = getAuthorizedAdminEmail();
  if (!userData.user || !authorized || userData.user.email?.toLocaleLowerCase() !== authorized) redirect("/admin/login");
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!factors?.totp.some((factor) => factor.status === "verified") || assurance?.currentLevel !== "aal2") redirect("/admin/mfa");
  const admin = createSupabaseAdminClient();
  const { data: recent } = await admin.from("submissions").select("protocol,kind,requester_name,status,created_at").order("created_at", { ascending: false }).limit(8);
  return <AdminDashboard email={userData.user.email ?? authorized} recentSubmissions={recent ?? []} />;
}
