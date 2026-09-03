import type { Metadata } from "next";
import Image from "next/image";
import { AdminLoginForm } from "@/components/admin-login-form";
import { isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Acesso administrativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return <main className="admin-login-page"><div className="admin-login-brand"><Image src="/sindicomar-logo-horizontal.png" width={2000} height={600} alt="Sindicomar PR" /></div>{isDatabaseConfigured() && isAuthConfigured() ? <AdminLoginForm /> : <div className="admin-login-card setup-card"><span className="eyebrow">Configuração necessária</span><h1>Painel preparado</h1><p>Configure o banco PostgreSQL e o administrador para ativar o acesso.</p><code>DATABASE_URL<br />ADMIN_EMAIL<br />AUTH_SESSION_SECRET<br />AUTH_ENCRYPTION_KEY</code></div>}</main>;
}
