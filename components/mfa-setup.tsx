"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function MfaSetup() {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function prepare() {
      const supabase = createSupabaseBrowserClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const existing = factors?.totp.find((factor) => factor.status === "verified");
      if (existing) { setFactorId(existing.id); setLoading(false); return; }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Administrador Sindicomar" });
      if (enrollError || !data) { setError(enrollError?.message ?? "Não foi possível iniciar o MFA."); setLoading(false); return; }
      setFactorId(data.id); setQrCode(data.totp.qr_code); setSecret(data.totp.secret); setLoading(false);
    }
    void prepare();
  }, []);
  async function verify() {
    setLoading(true); setError("");
    const supabase = createSupabaseBrowserClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) { setError(challengeError?.message ?? "Não foi possível validar o fator."); setLoading(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    if (verifyError) { setError("Código inválido ou expirado."); setLoading(false); return; }
    window.location.assign("/admin");
  }
  if (loading && !factorId) return <div className="admin-login-card"><Loader2 className="spin" /><p>Preparando autenticação segura…</p></div>;
  return <div className="admin-login-card mfa-card"><span className="admin-login-icon"><ShieldCheck /></span><span className="eyebrow">Segundo fator obrigatório</span><h1>Proteja o painel</h1>{qrCode ? <><p>Escaneie o QR Code em um aplicativo autenticador e informe o código de seis dígitos.</p><Image src={qrCode} alt="QR Code para configurar o autenticador" width={190} height={190} unoptimized /><details><summary>Inserir chave manualmente</summary><code>{secret}</code></details></> : <p>Informe o código atual do autenticador já configurado.</p>}<label><span>Código de seis dígitos</span><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" type="button" disabled={loading || code.length !== 6} onClick={verify}>{loading ? <><Loader2 className="spin" /> Validando…</> : "Validar e acessar"}</button></div>;
}
