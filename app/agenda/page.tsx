import { Clock3, MapPin } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PublicLink as Link } from "@/components/public-link";
import { AgendaStatusBadge } from "@/components/status-badge";
import { getPublicAgendaItems } from "@/lib/content";
import type { AgendaItem } from "@/types/content";

export const metadata = { title: "Agenda do comércio", description: "Comunicados, reuniões, horários especiais e registros da agenda do comércio." };
const typeLabels = { holiday: "Feriado", "special-hours": "Horário especial", assembly: "Reunião", course: "Curso", event: "Evento" };

export const dynamic = "force-dynamic";

function AgendaCard({ item, featured = false }: { item: AgendaItem; featured?: boolean }) {
  return <article className={`agenda-card${featured ? " agenda-card-featured" : ""}`}>
    <time dateTime={item.date}>
      <strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(item.date))}</strong>
      <span>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(item.date)).replace(".", "")}</span>
      <small>{new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(new Date(item.date))}</small>
    </time>
    <div className="agenda-card-main">
      <div className="document-card-top"><span>{typeLabels[item.type]}</span><AgendaStatusBadge status={item.status} /></div>
      <h2 id={featured ? "next-event-title" : undefined}>{item.title}</h2>
      <p>{item.description}</p>
      <div className="agenda-meta"><span><MapPin size={16} />{item.municipality}</span><span><Clock3 size={16} />Registro institucional</span></div>
    </div>
    <Link className="button button-secondary" href="/contato">Solicitar orientação</Link>
  </article>;
}

export default async function AgendaPage() {
  const agendaItems = await getPublicAgendaItems();
  const orderedItems = [...agendaItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentTime = new Date().getTime();
  const nextEvent = orderedItems.find((item) => item.status !== "cancelled" && new Date(item.date).getTime() >= currentTime);
  const remainingItems = nextEvent ? orderedItems.filter((item) => item.id !== nextEvent.id) : orderedItems;

  return <main id="conteudo"><PageHero eyebrow="Agenda e comunicados" title="Acompanhe os registros que impactam o comércio." description="Horários especiais, reuniões, eventos e comunicados organizados em uma linha do tempo institucional." />
    <section className="content-section"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Próximo e histórico</span><h2>Agenda organizada por data.</h2></div><p>As condições aplicáveis devem ser verificadas no instrumento ou comunicado relacionado.</p></div>
      {nextEvent && <section className="agenda-next" aria-labelledby="next-event-title"><span className="eyebrow">Próximo evento</span><AgendaCard item={nextEvent} featured /></section>}
      {remainingItems.length > 0 && <section className="agenda-history" aria-labelledby="agenda-history-title"><div className="agenda-history-heading"><span className="eyebrow">Demais registros</span><h3 id="agenda-history-title">Do mais antigo ao mais recente.</h3></div><div className="agenda-list">{remainingItems.map((item) => <AgendaCard item={item} key={item.id} />)}</div></section>}
    </div></section>
    <section className="agenda-contact"><div className="shell agenda-contact-inner"><div><span className="eyebrow">Planejamento empresarial</span><h2>Tem dúvida sobre uma data específica?</h2><p>Encaminhe a situação da empresa para o atendimento do Sindicomar.</p></div><Link className="button button-gold" href="/contato">Falar com a entidade</Link></div></section>
  </main>;
}
