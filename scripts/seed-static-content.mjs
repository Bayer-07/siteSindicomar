import fs from "node:fs";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

const env = { ...process.env };
for (const filename of [".env.development.local", ".env.local"]) {
  const envFile = new URL(`../${filename}`, import.meta.url);
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const separator = trimmed.indexOf("=");
      const key = trimmed.slice(0, separator);
      env[key] ??= trimmed.slice(separator + 1).replace(/^['\"]|['\"]$/g, "");
    }
  }
}

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada.");
}

const db = await mysql.createConnection({ uri: env.DATABASE_URL, timezone: "Z" });
const published = { status: "published" };
const tiptap = (...paragraphs) => ({ type: "doc", content: paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })) });

const posts = [
  { slug: "papel-sindicato-patronal", title: "Qual é o papel de um sindicato patronal?", excerpt: "Entenda como a representação coletiva contribui para o ambiente empresarial e para o desenvolvimento do comércio.", category: "Institucional", author_name: "Equipe Sindicomar", content: tiptap("O sindicato patronal representa a categoria econômica nas relações coletivas e no diálogo com instituições públicas e privadas.", "Além da negociação coletiva, a entidade organiza informações, aproxima empresas de oportunidades e cria canais para que necessidades comuns do setor sejam tratadas de forma coordenada."), published_at: "2026-08-28T12:00:00-03:00", ...published },
  { slug: "como-consultar-convencao-coletiva", title: "Como consultar uma convenção coletiva com segurança", excerpt: "Categoria, município, vigência e documentos relacionados precisam ser analisados em conjunto.", category: "Relações do trabalho", author_name: "Equipe Sindicomar", content: tiptap("Antes de aplicar uma regra, identifique a atividade da empresa, a base territorial e o período de vigência do instrumento.", "Termos aditivos e atas podem alterar ou prorrogar condições. Por isso, a consulta deve considerar o conjunto de documentos e a situação indicada para cada registro."), published_at: "2026-08-27T12:00:00-03:00", ...published },
  { slug: "funcionamento-comercio-feriados", title: "Funcionamento do comércio em feriados: o que verificar", excerpt: "Aberturas em datas especiais devem considerar legislação, convenção e eventuais acordos aplicáveis.", category: "Funcionamento do comércio", author_name: "Equipe Sindicomar", content: tiptap("O funcionamento em feriados não deve ser definido apenas por um calendário genérico. É necessário verificar a regra aplicável à categoria e ao município.", "Comunicados e horários especiais devem ser lidos junto ao instrumento coletivo relacionado. Em caso de dúvida, a empresa deve buscar orientação antes de organizar a escala."), published_at: "2026-08-26T12:00:00-03:00", ...published },
];

const services = [
  { slug: "orientacao-relacoes-trabalho", title: "Relações do trabalho", excerpt: "Acesso organizado a instrumentos coletivos e atendimento para empresas, RH e contadores.", content: tiptap("O Sindicomar organiza o acesso às convenções coletivas, atas, comunicados e solicitações relacionadas às relações do trabalho no comércio."), category: "labor", eligibility: "Empresas do comércio e profissionais que atuam em sua gestão trabalhista.", is_exclusive: false, ...published },
  { slug: "capacitacao-empresarial", title: "Desenvolvimento empresarial", excerpt: "Conteúdo, capacitação e conexões voltados à evolução das empresas do comércio.", content: tiptap("A entidade aproxima empresários de agendas, cursos, encontros e iniciativas relevantes para a gestão e o desenvolvimento do varejo."), category: "training", eligibility: "Conforme a programação e as condições de cada iniciativa.", is_exclusive: false, ...published },
  { slug: "beneficios-sistema-comercio", title: "Conexão com o Sistema Comércio", excerpt: "Aproximação com iniciativas da Fecomércio PR, Sesc e Senac no Paraná.", content: tiptap("O Sindicomar integra a rede sindical filiada à Fecomércio PR e conecta o comércio local a informações e oportunidades do Sistema Comércio."), category: "commerce", eligibility: "Conforme regras de cada instituição parceira.", is_exclusive: false, partner_name: "Sistema Comércio", ...published },
  { slug: "solucoes-para-gestao", title: "Representação institucional", excerpt: "Articulação com instituições e defesa de pautas comuns ao comércio local.", content: tiptap("A atuação institucional leva as demandas coletivas do setor ao diálogo com o poder público, entidades empresariais e parceiros regionais."), category: "technology", eligibility: "Empresas integrantes da categoria econômica representada.", is_exclusive: false, ...published },
];

const documents = [
  { slug: "cct-comercio-marechal-candido-rondon-2025-2026", title: "CCT Comércio — Marechal Cândido Rondon 2025/2026", summary: "Convenção coletiva do comércio varejista registrada no MTE, com vigência original de junho de 2025 a maio de 2026.", municipality: "Marechal Cândido Rondon", category_label: "Comércio varejista", year: 2025, document_type: "cct", document_status: "expired", valid_from: "2025-06-01", valid_until: "2026-05-31", base_date: "1º de junho", labor_union: "Sindicato dos Empregados no Comércio de Toledo", mte_registration: "PR002755/2025", official_source: "Mediador/MTE", last_reviewed_at: "2026-08-28T12:00:00-03:00", ...published },
  { slug: "cct-mercados-marechal-candido-rondon-2025-2026", title: "CCT Mercados — Marechal Cândido Rondon 2025/2026", summary: "Instrumento registrado para mercados, minimercados, supermercados e hipermercados, com vigência original encerrada.", municipality: "Marechal Cândido Rondon", category_label: "Mercados e supermercados", year: 2025, document_type: "cct", document_status: "expired", valid_from: "2025-06-01", valid_until: "2026-05-31", base_date: "1º de junho", labor_union: "Sindicato dos Empregados no Comércio de Toledo", mte_registration: "PR002772/2025", official_source: "Mediador/MTE", last_reviewed_at: "2026-08-28T12:00:00-03:00", ...published },
  { slug: "ata-prorrogacao-ccts-maio-2026", title: "Ata de prorrogação das CCTs — maio de 2026", summary: "Ata que prorrogou temporariamente as convenções de Marechal Cândido Rondon até 31 de julho de 2026.", municipality: "Marechal Cândido Rondon", category_label: "Comércio varejista", year: 2026, document_type: "minutes", document_status: "expired", valid_from: "2026-06-01", valid_until: "2026-07-31", labor_union: "Sindicato dos Empregados no Comércio e Supermercados de Toledo e Região", official_source: "Ata assinada pelas entidades", last_reviewed_at: "2026-08-28T12:00:00-03:00", ...published },
];

const agenda = [
  { slug: "acordo-horarios-jogos-selecao-2026", title: "Acordo para horários nos jogos da Seleção Brasileira", description: "Comunicado publicado pelas entidades sobre o funcionamento do comércio durante os jogos da Seleção Brasileira.", starts_at: "2026-06-15T09:00:00-03:00", municipality: "Marechal Cândido Rondon", agenda_type: "special-hours", agenda_status: "informational", ...published },
  { slug: "reuniao-prorrogacao-ccts-2026", title: "Reunião de prorrogação das convenções coletivas", description: "Registro da reunião entre as entidades patronal e laboral sobre a continuidade das negociações coletivas.", starts_at: "2026-05-22T14:30:00-03:00", municipality: "Marechal Cândido Rondon", agenda_type: "assembly", agenda_status: "confirmed", ...published },
  { slug: "horarios-final-ano-2025-2026", title: "Horários especiais de final de ano 2025/2026", description: "Comunicado de referência sobre os horários especiais do comércio no período de fim de ano.", starts_at: "2025-10-06T09:00:00-03:00", municipality: "Marechal Cândido Rondon", agenda_type: "special-hours", agenda_status: "informational", ...published },
];

const pages = [
  { slug: "o-sindicomar", title: "O Sindicomar", excerpt: "Conheça a identidade, a atuação e a liderança do Sindicomar.", content: tiptap("O Sindicomar representa a categoria econômica patronal e atua para que os interesses comuns das empresas sejam tratados de forma organizada nas relações coletivas e institucionais.", "Sua presença aproxima empresários, gestores, profissionais de RH e contadores de informações, canais de atendimento e iniciativas voltadas ao desenvolvimento do comércio regional.", "Natureza: Entidade sindical patronal. CNPJ: 04.702.939/0001-59. Presidência: Ademar Bayer. Sede: Marechal Cândido Rondon — PR."), ...published },
  { slug: "representatividade", title: "Representatividade e enquadramento", excerpt: "Entenda a representação sindical patronal e solicite uma análise de enquadramento.", content: tiptap("A representação sindical está ligada ao enquadramento da atividade econômica dentro de uma base territorial. A associação é a participação voluntária da empresa na entidade, conforme suas condições e benefícios.", "Quando houver dúvida, o Sindicomar analisa as informações da empresa e orienta o próximo passo pelo canal escolhido.", "O enquadramento considera os dados da empresa, a atividade econômica e a base territorial. A análise é humana e individual."), ...published },
];

const directors = [{ name: "Ademar Bayer", role: "Presidente", bio: "Representante do Sindicomar junto à Fecomércio PR e às articulações institucionais do comércio local.", display_order: 1, ...published }];
const partners = [{ name: "Fecomércio PR", description: "Rede sindical do comércio de bens, serviços e turismo no Paraná.", website_url: "https://www.fecomercio.pr.gov.br", display_order: 1, ...published }];
const territories = [{ municipality: "Marechal Cândido Rondon", state: "PR", notes: "Sede e base territorial informada no portal.", confirmed_at: "2026-08-28T12:00:00-03:00", ...published }];
const categories = [
  { name: "Comércio varejista", description: "Categoria econômica patronal do comércio varejista.", cnaes: [], confirmed_at: "2026-08-28T12:00:00-03:00", ...published },
  { name: "Mercados e supermercados", description: "Mercados, minimercados, supermercados e hipermercados.", cnaes: [], confirmed_at: "2026-08-28T12:00:00-03:00", ...published },
];
const settings = [
  { key: "organization_name", value: "Sindicomar — Sindicato do Comércio Varejista de Marechal Cândido Rondon e região" },
  { key: "contact_email", value: "sindicomarmarechal@gmail.com" },
  { key: "contact_phone", value: "(45) 3284-1277" },
  { key: "address", value: "Avenida Maripá, 577, Centro — Marechal Cândido Rondon/PR" },
  { key: "contact_note", value: "Atendimento institucional ao comércio varejista de Marechal Cândido Rondon e microrregião." },
];

const dateTimeColumns = new Set(["published_at", "confirmed_at"]);
const dateColumns = new Set(["valid_from", "valid_until"]);

async function upsert(table, rows) {
  for (const original of rows) {
    const row = { id: randomUUID(), ...original };
    const columns = Object.keys(row);
    const values = columns.map((column) => serializeValue(column, row[column]));
    const updates = columns.filter((column) => column !== "id").map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");
    await db.execute(`INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) ON DUPLICATE KEY UPDATE ${updates}`, values);
  }
  console.log(`${table}: ${rows.length} registros sincronizados`);
}

async function upsertNamed(table, rows, matchKeys) {
  for (const row of rows) {
    const where = matchKeys.map((key) => `\`${key}\` = ?`).join(" AND ");
    const [found] = await db.execute(`SELECT id FROM \`${table}\` WHERE ${where} LIMIT 1`, matchKeys.map((key) => serializeValue(key, row[key])));
    const id = Array.isArray(found) && found[0]?.id ? found[0].id : randomUUID();
    const next = { id, ...row };
    const columns = Object.keys(next);
    const updates = columns.filter((column) => column !== "id").map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(", ");
    await db.execute(`INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) ON DUPLICATE KEY UPDATE ${updates}`, columns.map((column) => serializeValue(column, next[column])));
  }
  console.log(`${table}: ${rows.length} registros sincronizados`);
}

function serializeValue(column, value) {
  // site_settings.value is a MySQL JSON column even when the setting is a
  // plain text value. Encode primitives as valid JSON strings as well.
  if (column === "value" && value !== undefined && value !== null) return JSON.stringify(value);
  if (dateTimeColumns.has(column) && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 23).replace("T", " ");
  }
  if (dateColumns.has(column) && value) {
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value ?? null;
}

await upsert("posts", posts);
await upsert("services", services);
await upsert("collective_documents", documents);
await upsert("agenda_items", agenda);
await upsert("pages", pages);
await upsert("site_settings", settings);
await upsert("categories", categories);
await upsert("territories", territories);
await upsertNamed("directors", directors, ["name", "role"]);
await upsertNamed("partners", partners, ["name"]);
await db.end();
