"use client";

import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { FormEvent, useState } from "react";

type LookupResult = {
  protocol: string;
  kind: "contact" | "classification" | "membership";
  status: "new" | "handling" | "waiting" | "completed";
  createdAt: string;
  updatedAt: string;
};

const statusCopy: Record<LookupResult["status"], { label: string; description: string }> = {
  new: { label: "Recebida", description: "Sua solicitação foi registrada e aguarda a triagem da equipe." },
  handling: { label: "Em atendimento", description: "A equipe do Sindicomar já está analisando sua solicitação." },
  waiting: { label: "Aguardando retorno", description: "Precisamos de um retorno ou informação complementar para continuar." },
  completed: { label: "Concluída", description: "O atendimento foi finalizado. Se precisar, inicie uma nova solicitação." },
};

const kindLabels: Record<LookupResult["kind"], string> = {
  contact: "Contato",
  classification: "Enquadramento",
  membership: "Associação",
};

export function SubmissionStatusLookup() {
  const [protocol, setProtocol] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function formatProtocol(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19);
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    const normalized = formatProtocol(protocol);
    setProtocol(normalized);
    setResult(null);
    setError("");
    if (!/^SIN-\d{8}-[A-F0-9]{6}$/.test(normalized)) {
      setError("Informe o protocolo no formato SIN-AAAAMMDD-XXXXXX.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/submissions/status?protocol=${encodeURIComponent(normalized)}`, { cache: "no-store" });
      const payload = (await response.json()) as LookupResult & { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Não foi possível consultar o protocolo agora.");
        return;
      }
      setResult(payload);
    } catch {
      setError("Não foi possível consultar o protocolo agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const status = result ? statusCopy[result.status] : null;
  const date = result ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(result.updatedAt || result.createdAt)) : "";

  return <div className="status-lookup-card"><div className="status-lookup-heading"><div><span className="eyebrow">Acompanhe sua solicitação</span><h2>Consulte o andamento pelo protocolo.</h2><p>Digite o número recebido após enviar o formulário. A consulta exibe somente a situação do atendimento.</p></div><span className="status-lookup-icon"><Search size={23} /></span></div><form className="status-lookup-form" onSubmit={search}><label htmlFor="submission-protocol"><span className="sr-only">Número do protocolo</span><input id="submission-protocol" value={protocol} onChange={(event) => setProtocol(formatProtocol(event.target.value))} placeholder="SIN-20260901-ABC123" maxLength={19} autoComplete="off" /></label><button className="button button-primary" type="submit" disabled={loading}>{loading ? <><Loader2 className="spin" size={17} /> Consultando…</> : <><Search size={17} /> Consultar</>}</button></form>{error && <p className="status-lookup-error" role="alert"><AlertCircle size={17} />{error}</p>}{result && status && <div className="status-lookup-result" role="status"><div className="status-lookup-result-top"><span className="status-lookup-check"><CheckCircle2 size={19} /></span><div><small>{kindLabels[result.kind]} · {result.protocol}</small><strong>{status.label}</strong></div><span className="status-badge status-informational">{status.label}</span></div><p>{status.description}</p><small>Última atualização: {date}</small></div>}</div>;
}
