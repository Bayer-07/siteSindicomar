"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";

export function AdminLoginForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  async function login() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Não foi possível entrar no painel.");
      window.location.assign("/admin/mfa");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível entrar no painel."); setLoading(false); }
  }
  return <div className="admin-login-card"><span className="admin-login-icon"><KeyRound /></span><span className="eyebrow">Acesso restrito</span><h1>Painel Sindicomar</h1><p>O acesso é permitido somente ao administrador previamente autorizado.</p><label><span>Senha de acesso</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label><button className="button button-primary admin-login-submit" type="button" onClick={() => void login()} disabled={loading || password.length < 8}>{loading ? <><Loader2 className="spin" size={18} /> Entrando…</> : "Entrar no painel"}</button>{message && <p className="admin-login-message" role="alert">{message}</p>}<small>Depois da senha, será exigido o segundo fator de autenticação.</small></div>;
}
