import { CalendarPlus, Clock3, MapPin } from "lucide-react";
import { DemoNotice } from "@/components/demo-notice";
import { PageHero } from "@/components/page-hero";
import { AgendaStatusBadge } from "@/components/status-badge";
import { agendaItems } from "@/data/site-content";

export const metadata = { title: "Agenda do comércio", description: "Feriados, horários especiais, assembleias, cursos e eventos do comércio." };

const typeLabels = { holiday: "Feriado", "special-hours": "Horário especial", assembly: "Assembleia", course: "Curso", event: "Evento" };

export default function AgendaPage() {
  return <main id="conteudo"><PageHero eyebrow="Funcionamento e eventos" title="Agenda do comércio, com a situação de cada orientação." description="Consulte feriados, horários especiais, assembleias, cursos e eventos. Regras de funcionamento serão vinculadas ao documento aplicável." /><section className="content-section"><div className="shell"><DemoNotice /><div className="agenda-list">{agendaItems.map((item) => <article className="agenda-card" key={item.id}><time dateTime={item.date}><strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(item.date))}</strong><span>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(item.date)).replace(".", "")}</span><small>{new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(new Date(item.date))}</small></time><div className="agenda-card-main"><div className="document-card-top"><span>{typeLabels[item.type]}</span><AgendaStatusBadge status={item.status} /></div><h2>{item.title}</h2><p>{item.description}</p><div className="agenda-meta"><span><MapPin size={16} />{item.municipality}</span><span><Clock3 size={16} />{item.type === "holiday" ? "Dia inteiro" : "Horário a confirmar"}</span></div></div><a className="button button-secondary" href={`/api/agenda/${item.slug}/ics`}><CalendarPlus size={17} />Adicionar</a></article>)}</div></div></section></main>;
}
