import { Clock3, MapPin } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PublicLink as Link } from "@/components/public-link";
import { AgendaStatusBadge } from "@/components/status-badge";
import { agendaItems } from "@/data/site-content";

export const metadata = { title: "Agenda do comércio", description: "Comunicados, reuniões, horários especiais e registros da agenda do comércio." };
const typeLabels = { holiday: "Feriado", "special-hours": "Horário especial", assembly: "Reunião", course: "Curso", event: "Evento" };

export default function AgendaPage() {
  return <main id="conteudo"><PageHero eyebrow="Agenda e comunicados" title="Acompanhe os registros que impactam o comércio." description="Horários especiais, reuniões, eventos e comunicados organizados em uma linha do tempo institucional." />
    <section className="content-section"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Registros recentes</span><h2>Histórico de agendas e orientações.</h2></div><p>As condições aplicáveis devem ser verificadas no instrumento ou comunicado relacionado.</p></div><div className="agenda-list">{agendaItems.map((item) => <article className="agenda-card" key={item.id}><time dateTime={item.date}><strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(item.date))}</strong><span>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(item.date)).replace(".", "")}</span><small>{new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(new Date(item.date))}</small></time><div className="agenda-card-main"><div className="document-card-top"><span>{typeLabels[item.type]}</span><AgendaStatusBadge status={item.status} /></div><h2>{item.title}</h2><p>{item.description}</p><div className="agenda-meta"><span><MapPin size={16} />{item.municipality}</span><span><Clock3 size={16} />Registro institucional</span></div></div><Link className="button button-secondary" href="/contato">Solicitar orientação</Link></article>)}</div></div></section>
    <section className="agenda-contact"><div className="shell agenda-contact-inner"><div><span className="eyebrow">Planejamento empresarial</span><h2>Tem dúvida sobre uma data específica?</h2><p>Encaminhe a situação da empresa para o atendimento do Sindicomar.</p></div><Link className="button button-gold" href="/contato">Falar com a entidade</Link></div></section>
  </main>;
}
