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
    id: "cct-comercio-2025-2026",
    slug: "cct-comercio-marechal-candido-rondon-2025-2026",
    title: "CCT Comércio — Marechal Cândido Rondon 2025/2026",
    summary: "Convenção coletiva do comércio varejista registrada no MTE, com vigência original de junho de 2025 a maio de 2026.",
    municipality: "Marechal Cândido Rondon",
    category: "Comércio varejista",
    year: 2025,
    type: "cct",
    status: "expired",
    validFrom: "2025-06-01",
    validUntil: "2026-05-31",
    baseDate: "1º de junho",
    laborUnion: "Sindicato dos Empregados no Comércio de Toledo",
    mteRegistration: "PR002755/2025",
    officialSource: "Mediador/MTE",
    pdfUrl: "https://www.sindeto.com.br/site/uploads/rar/316bc8a97293c0aed1f6981829955730.pdf",
    lastReviewedAt: "2026-08-28",
  },
  {
    id: "cct-mercados-2025-2026",
    slug: "cct-mercados-marechal-candido-rondon-2025-2026",
    title: "CCT Mercados — Marechal Cândido Rondon 2025/2026",
    summary: "Instrumento registrado para mercados, minimercados, supermercados e hipermercados, com vigência original encerrada.",
    municipality: "Marechal Cândido Rondon",
    category: "Mercados e supermercados",
    year: 2025,
    type: "cct",
    status: "expired",
    validFrom: "2025-06-01",
    validUntil: "2026-05-31",
    baseDate: "1º de junho",
    laborUnion: "Sindicato dos Empregados no Comércio de Toledo",
    mteRegistration: "PR002772/2025",
    officialSource: "Mediador/MTE",
    pdfUrl: "https://www.sindeto.com.br/site/uploads/rar/8e0a6b828c68aa22e42438c627bb86b5.pdf",
    lastReviewedAt: "2026-08-28",
  },
  {
    id: "ata-prorrogacao-2026",
    slug: "ata-prorrogacao-ccts-maio-2026",
    title: "Ata de prorrogação das CCTs — maio de 2026",
    summary: "Ata que prorrogou temporariamente as convenções de Marechal Cândido Rondon até 31 de julho de 2026.",
    municipality: "Marechal Cândido Rondon",
    category: "Comércio varejista",
    year: 2026,
    type: "minutes",
    status: "expired",
    validFrom: "2026-06-01",
    validUntil: "2026-07-31",
    laborUnion: "Sindicato dos Empregados no Comércio e Supermercados de Toledo e Região",
    officialSource: "Ata assinada pelas entidades",
    pdfUrl: "https://www.sindeto.com.br/site/uploads/rar/78be9400cbb51ca7cb061850e3805c81.pdf",
    lastReviewedAt: "2026-08-28",
  },
];

export const agendaItems: AgendaItem[] = [
  {
    id: "acordo-jogos-selecao-2026",
    slug: "acordo-horarios-jogos-selecao-2026",
    title: "Acordo para horários nos jogos da Seleção Brasileira",
    description: "Comunicado publicado pelas entidades sobre o funcionamento do comércio durante os jogos da Seleção Brasileira.",
    date: "2026-06-15T09:00:00-03:00",
    municipality: "Marechal Cândido Rondon",
    type: "special-hours",
    status: "informational",
  },
  {
    id: "reuniao-prorrogacao-2026",
    slug: "reuniao-prorrogacao-ccts-2026",
    title: "Reunião de prorrogação das convenções coletivas",
    description: "Registro da reunião entre as entidades patronal e laboral sobre a continuidade das negociações coletivas.",
    date: "2026-05-22T14:30:00-03:00",
    municipality: "Marechal Cândido Rondon",
    type: "assembly",
    status: "confirmed",
  },
  {
    id: "horarios-final-ano-2025",
    slug: "horarios-final-ano-2025-2026",
    title: "Horários especiais de final de ano 2025/2026",
    description: "Comunicado de referência sobre os horários especiais do comércio no período de fim de ano.",
    date: "2025-10-06T09:00:00-03:00",
    municipality: "Marechal Cândido Rondon",
    type: "special-hours",
    status: "informational",
  },
];

export const services: Service[] = [
  {
    slug: "orientacao-relacoes-trabalho",
    title: "Relações do trabalho",
    excerpt: "Acesso organizado a instrumentos coletivos e atendimento para empresas, RH e contadores.",
    description: "O Sindicomar organiza o acesso às convenções coletivas, atas, comunicados e solicitações relacionadas às relações do trabalho no comércio.",
    category: "labor",
    eligibility: "Empresas do comércio e profissionais que atuam em sua gestão trabalhista.",
    exclusive: false,
  },
  {
    slug: "capacitacao-empresarial",
    title: "Desenvolvimento empresarial",
    excerpt: "Conteúdo, capacitação e conexões voltados à evolução das empresas do comércio.",
    description: "A entidade aproxima empresários de agendas, cursos, encontros e iniciativas relevantes para a gestão e o desenvolvimento do varejo.",
    category: "training",
    eligibility: "Conforme a programação e as condições de cada iniciativa.",
    exclusive: false,
  },
  {
    slug: "beneficios-sistema-comercio",
    title: "Conexão com o Sistema Comércio",
    excerpt: "Aproximação com iniciativas da Fecomércio PR, Sesc e Senac no Paraná.",
    description: "O Sindicomar integra a rede sindical filiada à Fecomércio PR e conecta o comércio local a informações e oportunidades do Sistema Comércio.",
    category: "commerce",
    eligibility: "Conforme regras de cada instituição parceira.",
    exclusive: false,
    partner: "Sistema Comércio",
  },
  {
    slug: "solucoes-para-gestao",
    title: "Representação institucional",
    excerpt: "Articulação com instituições e defesa de pautas comuns ao comércio local.",
    description: "A atuação institucional leva as demandas coletivas do setor ao diálogo com o poder público, entidades empresariais e parceiros regionais.",
    category: "technology",
    eligibility: "Empresas integrantes da categoria econômica representada.",
    exclusive: false,
  },
];

export const posts: Post[] = [
  {
    slug: "papel-sindicato-patronal",
    title: "Qual é o papel de um sindicato patronal?",
    excerpt: "Entenda como a representação coletiva contribui para o ambiente empresarial e para o desenvolvimento do comércio.",
    category: "Institucional",
    publishedAt: "2026-08-28",
    updatedAt: "2026-08-28",
    author: "Equipe Sindicomar",
    body: [
      "O sindicato patronal representa a categoria econômica nas relações coletivas e no diálogo com instituições públicas e privadas.",
      "Além da negociação coletiva, a entidade organiza informações, aproxima empresas de oportunidades e cria canais para que necessidades comuns do setor sejam tratadas de forma coordenada.",
    ],
  },
  {
    slug: "como-consultar-convencao-coletiva",
    title: "Como consultar uma convenção coletiva com segurança",
    excerpt: "Categoria, município, vigência e documentos relacionados precisam ser analisados em conjunto.",
    category: "Relações do trabalho",
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-28",
    author: "Equipe Sindicomar",
    body: [
      "Antes de aplicar uma regra, identifique a atividade da empresa, a base territorial e o período de vigência do instrumento.",
      "Termos aditivos e atas podem alterar ou prorrogar condições. Por isso, a consulta deve considerar o conjunto de documentos e a situação indicada para cada registro.",
    ],
  },
  {
    slug: "funcionamento-comercio-feriados",
    title: "Funcionamento do comércio em feriados: o que verificar",
    excerpt: "Aberturas em datas especiais devem considerar legislação, convenção e eventuais acordos aplicáveis.",
    category: "Funcionamento do comércio",
    publishedAt: "2026-08-26",
    updatedAt: "2026-08-28",
    author: "Equipe Sindicomar",
    body: [
      "O funcionamento em feriados não deve ser definido apenas por um calendário genérico. É necessário verificar a regra aplicável à categoria e ao município.",
      "Comunicados e horários especiais devem ser lidos junto ao instrumento coletivo relacionado. Em caso de dúvida, a empresa deve buscar orientação antes de organizar a escala.",
    ],
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
  address: "Avenida Maripá, 577, Centro — Marechal Cândido Rondon/PR",
  note: "Atendimento institucional ao comércio varejista de Marechal Cândido Rondon e microrregião.",
};
