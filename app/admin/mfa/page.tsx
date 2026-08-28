import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { MfaSetup } from "@/components/mfa-setup";
import { isSupabasePublicConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Autenticação em duas etapas", robots: { index: false, follow: false } };
export default async function MfaPage() { if (!isSupabasePublicConfigured()) redirect("/admin/login"); const supabase = await createSupabaseServerClient(); const { data } = await supabase.auth.getUser(); if (!data.user) redirect("/admin/login"); return <main className="admin-login-page"><div className="admin-login-brand"><Image src="/sindicomar-logo-horizontal.png" width={800} height={287} alt="Sindicomar PR" /></div><MfaSetup /></main>; }
