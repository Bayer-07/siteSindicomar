import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return <div className="admin-app"><AdminSidebar /><main className="admin-main"><header className="admin-topbar"><div><span>Painel administrativo</span><strong>{email}</strong></div><span className="status-badge status-current">MFA ativo</span></header>{children}</main></div>;
}
