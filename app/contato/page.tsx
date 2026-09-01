import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SubmissionForm } from "@/components/submission-form";
import { SubmissionStatusLookup } from "@/components/submission-status-lookup";
import { publicContact } from "@/data/site-content";

export const metadata = { title: "Contato", description: "Fale com o Sindicomar por telefone, e-mail ou formulário." };

export default function ContactPage() {
  const phoneHref = `tel:${publicContact.phone.replace(/\D/g, "")}`;
  return <main id="conteudo"><PageHero eyebrow="Contato" title="O Sindicomar está à disposição da sua empresa." description="Escolha o canal de atendimento e encaminhe sua necessidade para a entidade." />
    <section className="content-section"><div className="shell"><div className="contact-options"><a href={phoneHref}><span><Phone /></span><small>Atendimento direto</small><h2>Telefone</h2><p>Converse com a equipe durante o horário de atendimento institucional.</p><strong>{publicContact.phone} →</strong></a><a href={`mailto:${publicContact.email}?subject=${encodeURIComponent("Atendimento pelo site Sindicomar")}`}><span><Mail /></span><small>Mensagem por e-mail</small><h2>E-mail</h2><p>Envie documentos, contextualize a solicitação e aguarde o retorno da equipe.</p><strong>{publicContact.email} →</strong></a><a href="#formulario"><span><Clock3 /></span><small>Solicitação organizada</small><h2>Formulário</h2><p>Informe o assunto e o canal preferido para que o atendimento seja direcionado.</p><strong>Preencher formulário →</strong></a></div><div className="contact-details"><span><Phone />{publicContact.phone}</span><span><Mail />{publicContact.email}</span><span><MapPin />{publicContact.address}</span></div></div></section>
    <section className="content-section status-lookup-section"><div className="shell"><SubmissionStatusLookup /></div></section>
    <section className="content-section surface-section" id="formulario"><div className="shell form-layout"><div><span className="eyebrow">Fale com a entidade</span><h2>Conte como podemos ajudar.</h2><p>Identifique a empresa, selecione o assunto e descreva a necessidade com as informações essenciais.</p><div className="worker-guidance"><strong>Atendimento patronal</strong><p>O Sindicomar representa empresas. Trabalhadores devem procurar o sindicato laboral competente para orientação individual.</p></div></div><div className="form-card"><SubmissionForm /></div></div></section>
  </main>;
}
