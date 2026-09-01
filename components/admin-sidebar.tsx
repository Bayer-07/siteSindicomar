"use client";

import { BellRing, CalendarDays, FileText, Handshake, Inbox, LayoutDashboard, Newspaper, Settings, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const adminModules = [
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
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return <aside className="admin-sidebar"><Image src="/sindicomar-logo-horizontal.png" alt="Sindicomar PR" width={800} height={287} /><nav aria-label="Navegação do painel">{adminModules.map(({ label, icon: Icon, href }) => {
    const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
    return <Link className={isActive ? "active" : undefined} aria-current={isActive ? "page" : undefined} key={href} href={href}><Icon size={18} />{label}</Link>;
  })}</nav><form action="/auth/signout" method="post"><button type="submit">Sair do painel</button></form></aside>;
}
