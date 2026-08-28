import type { Metadata } from "next";
import Image from "next/image";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAuthorizedAdminEmail, isSupabasePublicConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Acesso administrativo", robots: { index: false, follow: false } };
export default function AdminLoginPage() {
  const configured = isSupabasePublicConfigured() && Boolean(getAuthorizedAdminEmail());
  return <main className="admin-login-page"><div className="admin-login-brand"><Image src="/sindicomar-logo-horizontal.png" width={800} height={287} alt="Sindicomar PR" /></div>{configured ? <AdminLoginForm authorizedEmail={getAuthorizedAdminEmail()} /> : <div className="admin-login-card setup-card"><span className="eyebrow">Configuração necessária</span><h1>Painel preparado</h1><p>Para ativar o acesso, configure o projeto Supabase, o e-mail autorizado e as variáveis descritas no arquivo de ambiente.</p><code>NEXT_PUBLIC_SUPABASE_URL<br />NEXT_PUBLIC_SUPABASE_ANON_KEY<br />ADMIN_EMAIL</code></div>}</main>;
}
