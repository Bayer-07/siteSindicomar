import { AlertTriangle, BellRing, CalendarDays, FileText, Handshake, Inbox, LayoutDashboard, Newspaper, Settings, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TiptapEditor } from "@/components/tiptap-editor";

const modules = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/admin" },
  { label: "Documentos", icon: FileText, href: "/admin/documentos" },
  { label: "Agenda", icon: CalendarDays, href: "/admin/agenda" },
  { label: "Notícias", icon: Newspaper, href: "/admin/noticias" },
  { label: "Páginas", icon: LayoutDashboard, href: "/admin/conteudo" },
  { label: "Serviços", icon: Handshake, href: "/admin/servicos" },
  { label: "Diretoria", icon: Users, href: "/admin/institucional" },
  { label: "Parceiros", icon: Handshake, href: "/admin/parceiros" },
  { label: "Alertas", icon: BellRing, href: "/admin/alertas" },
  { label: "Solicitações", icon: Inbox, href: "/admin/solicitacoes" },
  { label: "Configurações", icon: Settings, href: "/admin/configuracoes" },
];

export function AdminDashboard({ email, recentSubmissions = [] }: { email: string; recentSubmissions?: Array<{ protocol: string; kind: string; requester_name: string; status: string; created_at: string }> }) {
  return <div className="admin-app"><aside className="admin-sidebar"><Image src="/sindicomar-logo-horizontal.png" alt="Sindicomar PR" width={800} height={287} /><nav>{modules.map(({ label, icon: Icon, href }) => <Link key={href} href={href}><Icon size={18} />{label}</Link>)}</nav><form action="/auth/signout" method="post"><button type="submit">Sair do painel</button></form></aside><main className="admin-main"><header className="admin-topbar"><div><span>Painel administrativo</span><strong>{email}</strong></div><span className="status-badge status-current">MFA ativo</span></header><div className="admin-content"><div className="admin-heading"><div><span className="eyebrow">Visão geral</span><h1>Conteúdo e atendimento</h1></div><button className="button button-primary" type="button">Novo conteúdo</button></div><div className="metric-grid"><article><Inbox /><span>Solicitações novas</span><strong>{recentSubmissions.filter((item) => item.status === "new").length}</strong><small>Demandas aguardando triagem</small></article><article><FileText /><span>Documentos a revisar</span><strong>0</strong><small>Alertas dependem da carga oficial</small></article><article><AlertTriangle /><span>E-mails com falha</span><strong>0</strong><small>Reenvio disponível no histórico</small></article><article><Handshake /><span>Associações</span><strong>{recentSubmissions.filter((item) => item.kind === "membership").length}</strong><small>Solicitações recentes</small></article></div><div className="admin-grid"><section className="admin-panel"><div className="panel-heading"><div><h2>Solicitações recentes</h2><p>Histórico preservado independentemente da notificação.</p></div><Link href="/admin/solicitacoes">Ver todas</Link></div>{recentSubmissions.length ? <div className="submission-table">{recentSubmissions.map((item) => <div key={item.protocol}><strong>{item.protocol}</strong><span>{item.requester_name}</span><small>{item.kind} · {item.status}</small></div>)}</div> : <div className="empty-admin">Nenhuma solicitação registrada neste ambiente.</div>}</section><section className="admin-panel"><div className="panel-heading"><div><h2>Próximas revisões</h2><p>Documentos próximos do fim da vigência.</p></div></div><div className="empty-admin">Os alertas serão calculados depois da carga dos instrumentos oficiais.</div></section></div><section className="admin-panel editor-panel"><div className="panel-heading"><div><h2>Editor de conteúdo</h2><p>Demonstração do editor estruturado em JSON para páginas e notícias.</p></div><span className="status-badge status-pending">Rascunho</span></div><TiptapEditor /></section></div></main></div>;
}
