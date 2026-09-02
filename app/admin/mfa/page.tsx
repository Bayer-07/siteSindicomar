import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { MfaSetup } from "@/components/mfa-setup";
import { getAdminSession, isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Autenticação em duas etapas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MfaPage() { if (!isDatabaseConfigured() || !isAuthConfigured() || !(await getAdminSession())) redirect("/admin/login"); return <main className="admin-login-page"><div className="admin-login-brand"><Image src="/sindicomar-logo-horizontal.png" width={2000} height={600} alt="Sindicomar PR" /></div><MfaSetup /></main>; }
