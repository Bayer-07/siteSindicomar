import { ShieldCheck } from "lucide-react";

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return <aside className={`demo-notice${compact ? " demo-notice-compact" : ""}`}><ShieldCheck size={21} aria-hidden="true" /><div><strong>Conteúdo demonstrativo</strong><p>Esta informação ilustra o funcionamento do portal e não constitui orientação trabalhista. A publicação final depende de validação do Sindicomar.</p></div></aside>;
}
