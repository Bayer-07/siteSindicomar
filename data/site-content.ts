import type { AgendaItem, CollectiveDocument, Post, Service } from "@/types/content";

export const documentStatusLabels = {
  current: "Vigente",
  extended: "Prorrogado",
  negotiating: "Em negociação",
  superseded: "Substituído",
  expired: "Encerrado",
} as const;

export const documentTypeLabels = {
  cct: "CCT",
  act: "ACT",
  amendment: "Termo aditivo",
  minutes: "Ata",
  circular: "Circular",
  notice: "Comunicado",
} as const;

export const agendaStatusLabels = {
  confirmed: "Confirmado",
  pending: "Aguardando definição",
  cancelled: "Cancelado",
  informational: "Informativo",
} as const;

export const collectiveDocuments: CollectiveDocument[] = [
  {
    id: "demo-cct-varejo",
    slug: "modelo-cct-comercio-varejista",
    title: "Modelo de cadastro — Comércio varejista",
    summary: "Exemplo de como uma convenção validada será apresentada, com metadados, situação editorial e documentos relacionados.",
    municipality: "Marechal Cândido Rondon",
    category: "Comércio varejista",
    year: 2026,
    type: "cct",
    status: "negotiating",
    baseDate: "A confirmar",
    laborUnion: "Sindicato laboral a confirmar",
    lastReviewedAt: "2026-08-28",
    isDemo: true,
  },
  {
    id: "demo-ata-prorrogacao",
    slug: "modelo-ata-prorrogacao",
    title: "Modelo de vínculo — Ata de prorrogação",
    summary: "Demonstra o relacionamento entre uma CCT e uma ata, sem afirmar validade jurídica ou vigência real.",
    municipality: "Marechal Cândido Rondon",
    category: "Comércio varejista",
    year: 2026,
    type: "minutes",
    status: "extended",
    lastReviewedAt: "2026-08-28",
    isDemo: true,
  },
  {
    id: "demo-historico",
    slug: "modelo-documento-historico",
    title: "Modelo de acervo — Instrumento encerrado",
    summary: "Exemplo visual de documento histórico que nunca deve aparecer como instrumento vigente.",
    municipality: "Marechal Cândido Rondon",
    category: "Comércio varejista",
    year: 2025,
    type: "cct",
    status: "expired",
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    lastReviewedAt: "2026-08-28",
    isDemo: true,
  },
];

export const agendaItems: AgendaItem[] = [
  {
    id: "demo-data-especial",
    slug: "modelo-data-especial",
    title: "Modelo de data especial do comércio",
    description: "A orientação oficial será vinculada ao instrumento ou comunicado que lhe dá fundamento.",
    date: "2026-09-07T09:00:00-03:00",
    municipality: "Marechal Cândido Rondon",
    type: "special-hours",
    status: "pending",
    isDemo: true,
  },
  {
    id: "demo-curso",
    slug: "modelo-curso-empresarial",
    title: "Modelo de curso para empresários",
    description: "Espaço demonstrativo para cursos, eventos, assembleias e reuniões do Sindicomar.",
    date: "2026-09-18T19:00:00-03:00",
    municipality: "Marechal Cândido Rondon",
    type: "course",
    status: "informational",
    isDemo: true,
  },
  {
    id: "demo-feriado",
    slug: "modelo-feriado-municipal",
    title: "Modelo de feriado municipal",
    description: "Horários e condições só serão exibidos depois de conferência do documento aplicável.",
    date: "2026-10-28T00:00:00-03:00",
    municipality: "Marechal Cândido Rondon",
    type: "holiday",
    status: "pending",
    isDemo: true,
  },
];

export const services: Service[] = [
  {
    slug: "orientacao-relacoes-trabalho",
    title: "Orientação em relações do trabalho",
    excerpt: "Apoio para localizar instrumentos e encaminhar dúvidas que precisam de análise.",
    description: "Canal organizado para empresários, RH e contadores encaminharem dúvidas sobre instrumentos coletivos, funcionamento e relações do trabalho.",
    category: "labor",
    eligibility: "Condições de atendimento a confirmar com o Sindicomar.",
    exclusive: false,
    isDemo: true,
  },
  {
    slug: "capacitacao-empresarial",
    title: "Capacitação empresarial",
    excerpt: "Cursos, encontros e conteúdos voltados à gestão do comércio local.",
    description: "Agenda de capacitações próprias e de parceiros, com elegibilidade, inscrição e validade informadas em cada oportunidade.",
    category: "training",
    eligibility: "Programação e condições a confirmar.",
    exclusive: false,
    isDemo: true,
  },
  {
    slug: "beneficios-sistema-comercio",
    title: "Benefícios do Sistema Comércio",
    excerpt: "Caminhos para serviços e oportunidades do Sistema Fecomércio, Sesc e Senac.",
    description: "Página explicativa com links oficiais e regras aplicáveis a cada benefício aprovado para divulgação.",
    category: "commerce",
    eligibility: "Conforme regras de cada instituição parceira.",
    exclusive: false,
    partner: "Sistema Comércio",
    isDemo: true,
  },
  {
    slug: "solucoes-para-gestao",
    title: "Soluções para a gestão",
    excerpt: "Benefícios e parcerias apresentados pela necessidade da empresa.",
    description: "Catálogo objetivo de soluções vigentes, sempre com parceiro, validade, condição de uso e canal de solicitação.",
    category: "technology",
    eligibility: "Parcerias ainda em levantamento.",
    exclusive: true,
    isDemo: true,
  },
];

export const posts: Post[] = [
  {
    slug: "portal-sindicomar-em-homologacao",
    title: "Novo portal Sindicomar entra em fase de homologação",
    excerpt: "A estrutura digital está sendo preparada para centralizar convenções, agenda, serviços e atendimento ao comércio.",
    category: "Institucional",
    publishedAt: "2026-08-28",
    updatedAt: "2026-08-28",
    author: "Equipe Sindicomar",
    body: [
      "O novo portal foi estruturado para facilitar o acesso de empresários, gestores, profissionais de RH e contadores às informações do sindicato patronal.",
      "Nesta fase, os conteúdos demonstrativos não representam orientação trabalhista. Convenções, datas, serviços e dados institucionais serão substituídos somente após conferência e aprovação do Sindicomar.",
    ],
    isDemo: true,
  },
  {
    slug: "como-funcionara-biblioteca-convencoes",
    title: "Como funcionará a biblioteca de convenções",
    excerpt: "Filtros, situação controlada, documentos relacionados e histórico em um só lugar.",
    category: "Relações do trabalho",
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-28",
    author: "Equipe Sindicomar",
    body: [
      "Cada instrumento terá município, categoria, tipo, vigência, situação editorial, fonte e data da última conferência.",
      "A data de upload nunca será usada para determinar a vigência. A publicação dependerá da validação do responsável autorizado.",
    ],
    isDemo: true,
  },
  {
    slug: "agenda-do-comercio-em-preparacao",
    title: "Agenda do comércio será vinculada aos documentos oficiais",
    excerpt: "Datas especiais deixarão claro se a orientação está confirmada, pendente ou apenas informativa.",
    category: "Funcionamento do comércio",
    publishedAt: "2026-08-26",
    updatedAt: "2026-08-28",
    author: "Equipe Sindicomar",
    body: [
      "O calendário reunirá feriados, horários especiais, assembleias, cursos e eventos.",
      "Sempre que houver uma regra de funcionamento, a agenda apontará o documento que fundamenta a informação.",
    ],
    isDemo: true,
  },
];

export const navigation = [
  { href: "/o-sindicomar", label: "O Sindicomar" },
  { href: "/representatividade", label: "Representatividade" },
  { href: "/convencoes", label: "Convenções" },
  { href: "/servicos", label: "Serviços" },
  { href: "/agenda", label: "Agenda" },
  { href: "/noticias", label: "Notícias" },
];

export const publicContact = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "sindicomarmarechal@gmail.com",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "(45) 3284-1277",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  address: "Maripá, 577, Centro — Marechal Cândido Rondon/PR",
  note: "Dados públicos sujeitos à confirmação institucional antes da publicação.",
};
