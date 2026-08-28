"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginForm({ authorizedEmail }: { authorizedEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function login() {
    setLoading(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({ email: authorizedEmail, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`, shouldCreateUser: false } });
    setMessage(error ? "Não foi possível enviar o link. Confirme a configuração do administrador." : "Link seguro enviado. Verifique a caixa de entrada do e-mail autorizado.");
    setLoading(false);
  }
  return <div className="admin-login-card"><span className="admin-login-icon"><KeyRound /></span><span className="eyebrow">Acesso restrito</span><h1>Painel Sindicomar</h1><p>O acesso é permitido somente ao administrador previamente autorizado.</p><label><span>E-mail autorizado</span><input value={authorizedEmail} readOnly /></label><button className="button button-primary" type="button" onClick={login} disabled={loading}>{loading ? <><Loader2 className="spin" size={18} /> Enviando…</> : "Enviar link seguro"}</button>{message && <p className="admin-login-message" role="status">{message}</p>}<small>Depois do link, será exigido o segundo fator de autenticação.</small></div>;
}
