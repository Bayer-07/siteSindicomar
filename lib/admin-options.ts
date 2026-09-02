export const publicationOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
] as const;

export const documentTypeOptions = [
  { value: "cct", label: "CCT" },
  { value: "act", label: "ACT" },
  { value: "amendment", label: "Termo aditivo" },
  { value: "minutes", label: "Ata" },
  { value: "circular", label: "Circular" },
  { value: "notice", label: "Comunicado" },
] as const;

export const documentStatusOptions = [
  { value: "current", label: "Vigente" },
  { value: "extended", label: "Prorrogado" },
  { value: "negotiating", label: "Em negociação" },
  { value: "superseded", label: "Substituído" },
  { value: "expired", label: "Encerrado" },
] as const;

export const agendaTypeOptions = [
  { value: "holiday", label: "Feriado" },
  { value: "special-hours", label: "Horário especial" },
  { value: "assembly", label: "Assembleia" },
  { value: "course", label: "Curso" },
  { value: "event", label: "Evento" },
] as const;

export const agendaStatusOptions = [
  { value: "confirmed", label: "Confirmado" },
  { value: "pending", label: "Aguardando definição" },
  { value: "cancelled", label: "Cancelado" },
  { value: "informational", label: "Informativo" },
] as const;

export const serviceCategoryOptions = [
  { value: "labor", label: "Relações do trabalho" },
  { value: "training", label: "Capacitação" },
  { value: "health", label: "Saúde" },
  { value: "technology", label: "Tecnologia" },
  { value: "finance", label: "Finanças" },
  { value: "commerce", label: "Comércio" },
] as const;

export const submissionStatusOptions = [
  { value: "new", label: "Novo" },
  { value: "handling", label: "Em atendimento" },
  { value: "waiting", label: "Aguardando retorno" },
  { value: "completed", label: "Concluído" },
] as const;

export const booleanOptions = [
  { value: "false", label: "Não" },
  { value: "true", label: "Sim" },
] as const;

export const optionValues = {
  status: publicationOptions.map((option) => option.value),
  submissionStatus: submissionStatusOptions.map((option) => option.value),
  documentStatus: documentStatusOptions.map((option) => option.value),
  documentType: documentTypeOptions.map((option) => option.value),
  agendaType: agendaTypeOptions.map((option) => option.value),
  agendaStatus: agendaStatusOptions.map((option) => option.value),
  category: serviceCategoryOptions.map((option) => option.value),
} as const;
