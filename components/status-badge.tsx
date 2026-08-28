import { agendaStatusLabels, documentStatusLabels } from "@/data/site-content";
import type { AgendaStatus, DocumentStatus } from "@/types/content";

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`status-badge status-${status}`}>{documentStatusLabels[status]}</span>;
}

export function AgendaStatusBadge({ status }: { status: AgendaStatus }) {
  return <span className={`status-badge status-${status}`}>{agendaStatusLabels[status]}</span>;
}
