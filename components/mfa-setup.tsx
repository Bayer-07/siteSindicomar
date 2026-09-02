"use client";

/* eslint-disable @next/next/no-img-element */
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type SetupState = { enabled: boolean; qrCode?: string; secret?: string };

export function MfaSetup() {
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    void fetch("/api/auth/mfa/setup", { cache: "no-store" }).then(async (response) => {
      const data = await response.json().catch(() => ({})) as SetupState & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Não foi possível preparar o MFA.");
      setSetup(data); setLoading(false);
    }).catch((caught) => { setError(caught instanceof Error ? caught.message : "Não foi possível preparar o MFA."); setLoading(false); });
  }, []);

  async function verifyCode() {
    setVerifying(true); setError("");
    try {
      const response = await fetch("/api/auth/mfa/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await response.json().catch(() => ({})) as { message?: string; recoveryCodes?: string[] };
      if (!response.ok) throw new Error(data.message ?? "Código inválido ou expirado.");
      setRecoveryCodes(data.recoveryCodes ?? []);
      if (!data.recoveryCodes?.length) window.location.assign("/admin");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível validar o código."); }
    finally { setVerifying(false); }
  }

  if (loading) return <div className="admin-login-card"><Loader2 className="spin" /><p>Preparando autenticação segura…</p></div>;
  if (recoveryCodes.length) return <div className="admin-login-card mfa-card"><span className="admin-login-icon"><ShieldCheck /></span><span className="eyebrow">MFA configurado</span><h1>Guarde seus códigos</h1><p>Salve estes códigos em local seguro. Cada um pode ser usado uma única vez caso perca o aplicativo autenticador.</p><pre className="recovery-codes">{recoveryCodes.join("\n")}</pre><button className="button button-primary" type="button" onClick={() => window.location.assign("/admin")}>Acessar painel</button></div>;
  const validInput = /^\d{6}$/.test(code) || /^[A-F0-9]{8}-[A-F0-9]{8}$/i.test(code);
  return <div className="admin-login-card mfa-card"><span className="admin-login-icon"><ShieldCheck /></span><span className="eyebrow">Segundo fator obrigatório</span><h1>{setup?.enabled ? "Confirme o autenticador" : "Proteja o painel"}</h1>{setup?.qrCode ? <><p>Escaneie o QR Code em um aplicativo autenticador e informe o código de seis dígitos.</p><img src={setup.qrCode} alt="QR Code para configurar o autenticador" width={220} height={220} /><details><summary>Inserir chave manualmente</summary><code>{setup.secret}</code></details></> : <p>Informe o código do autenticador ou um código de recuperação.</p>}<label><span>Código do autenticador ou recuperação</span><input value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9A-F-]/gi, "").slice(0, 17).toUpperCase())} inputMode="text" autoComplete="one-time-code" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" type="button" disabled={verifying || !validInput} onClick={() => void verifyCode()}>{verifying ? <><Loader2 className="spin" /> Validando…</> : "Validar e acessar"}</button></div>;
}
