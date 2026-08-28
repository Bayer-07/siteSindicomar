import { ArrowRight, BriefcaseBusiness, CalendarDays, FileCheck2, MessageCircle, Scale, SearchCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AgendaStatusBadge, DocumentStatusBadge } from "@/components/status-badge";
import { StructuredData } from "@/components/structured-data";
import { agendaItems, collectiveDocuments, documentTypeLabels, posts, services } from "@/data/site-content";

const shortcuts = [
  { href: "/convencoes", icon: FileCheck2, number: "01", title: "Convenções coletivas", description: "Encontre o instrumento por município, categoria, tipo e situação." },
  { href: "/agenda", icon: CalendarDays, number: "02", title: "Funcionamento do comércio", description: "Consulte feriados, datas especiais, eventos e orientações." },
  { href: "/representatividade", icon: SearchCheck, number: "03", title: "Enquadramento", description: "Solicite análise humana sobre a representatividade da empresa." },
  { href: "/contato", icon: MessageCircle, number: "04", title: "Atendimento", description: "Escolha WhatsApp, e-mail direto ou formulário com protocolo." },
];

export default function Home() {
  const featuredDocuments = collectiveDocuments.filter((document) => ["current", "extended", "negotiating"].includes(document.status)).slice(0, 2);
  return (
    <main id="conteudo">
      <StructuredData />
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Sindicato patronal do comércio varejista</span>
            <h1>Orientação segura para quem movimenta o comércio.</h1>
            <p className="hero-lead">Representatividade, informação trabalhista e apoio prático para empresários, gestores, RH e contadores de Marechal Cândido Rondon e região.</p>
            <div className="hero-actions"><Link className="button button-primary" href="/convencoes">Consultar convenções <ArrowRight size={18} /></Link><Link className="text-link" href="/o-sindicomar">Entenda nossa atuação</Link></div>
            <div className="trust-row"><span>Documentos organizados</span><span>Orientação regional</span><span>Atendimento humano</span></div>
          </div>
          <aside className="cct-spotlight" aria-labelledby="cct-title">
            <div className="spotlight-topline"><span className="spotlight-kicker">Situação das convenções</span><span className="status-pill">Em validação</span></div>
            <h2 id="cct-title">Consulte antes de aplicar uma regra trabalhista</h2>
            <p>Os instrumentos atuais serão exibidos com vigência, categoria, abrangência, registro e última conferência.</p>
            <div className="document-preview"><span className="doc-mark">CCT</span><div><strong>Biblioteca em homologação</strong><small>Os dados atuais são exemplos e aguardam conteúdo oficial</small></div></div>
            <Link className="spotlight-link" href="/convencoes">Explorar biblioteca <ArrowRight size={15} /></Link>
          </aside>
        </div>
      </section>

      <section className="shortcut-section">
        <div className="shell">
          <div className="section-heading"><div><span className="eyebrow">Acesso rápido</span><h2>O que você precisa resolver hoje?</h2></div><p>Os principais caminhos do portal, organizados pela necessidade da empresa.</p></div>
          <div className="shortcut-grid">{shortcuts.map(({ icon: Icon, ...item }) => <Link className="shortcut-card" href={item.href} key={item.number}><div className="shortcut-meta"><span className="shortcut-number">{item.number}</span><Icon size={21} /></div><h3>{item.title}</h3><p>{item.description}</p><ArrowRight className="card-arrow" size={21} /></Link>)}</div>
        </div>
      </section>

      <section className="institutional-intro">
        <div className="shell intro-grid"><span className="eyebrow">Representação empresarial</span><div><h2>O Sindicomar fortalece as empresas que fazem a economia local acontecer.</h2><p>Como sindicato patronal, atua na defesa dos interesses do comércio, na negociação coletiva e no apoio a decisões mais seguras para cada negócio.</p><Link className="light-link" href="/representatividade">Conhecer a representatividade <ArrowRight size={17} /></Link></div></div>
      </section>

      <section className="content-section home-documents">
        <div className="shell"><div className="section-heading"><div><span className="eyebrow">Relações do trabalho</span><h2>Instrumentos atuais, sem misturar com o histórico.</h2></div><Link className="text-link" href="/convencoes">Ver todos os documentos</Link></div><div className="featured-documents">{featuredDocuments.map((document) => <Link className="featured-document" href={`/convencoes/${document.slug}`} key={document.id}><div className="featured-icon"><Scale size={25} /></div><div><div className="document-card-top"><span>{documentTypeLabels[document.type]} · {document.year}</span><DocumentStatusBadge status={document.status} /></div><h3>{document.title}</h3><p>{document.summary}</p><small>{document.municipality} · conferido em {new Intl.DateTimeFormat("pt-BR").format(new Date(`${document.lastReviewedAt}T12:00:00`))}</small></div><ArrowRight size={20} /></Link>)}</div></div>
      </section>

      <section className="content-section surface-section" id="servicos">
        <div className="shell"><div className="section-heading"><div><span className="eyebrow">Serviços e benefícios</span><h2>Apoio prático para diferentes momentos da empresa.</h2></div><Link className="text-link" href="/servicos">Conhecer todos os serviços</Link></div><div className="service-grid">{services.slice(0, 3).map((service, index) => <Link className="service-card" href={`/servicos/${service.slug}`} key={service.slug}><span className="service-icon">{index === 0 ? <Scale /> : index === 1 ? <BriefcaseBusiness /> : <ShieldCheck />}</span><small>{service.exclusive ? "Exclusivo para associado" : "Acesso conforme condições"}</small><h3>{service.title}</h3><p>{service.excerpt}</p><span className="text-link">Ver detalhes <ArrowRight size={15} /></span></Link>)}</div></div>
      </section>

      <section className="content-section" id="agenda">
        <div className="shell split-home"><div><div className="section-heading single"><div><span className="eyebrow">Próximas datas</span><h2>Agenda do comércio.</h2></div></div><div className="agenda-preview">{agendaItems.map((item) => <Link href="/agenda" key={item.id}><time dateTime={item.date}><strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(item.date))}</strong><span>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(item.date)).replace(".", "")}</span></time><div><AgendaStatusBadge status={item.status} /><h3>{item.title}</h3><p>{item.municipality}</p></div><ArrowRight size={18} /></Link>)}</div><Link className="text-link below-list" href="/agenda">Abrir agenda completa <ArrowRight size={15} /></Link></div><div><div className="section-heading single"><div><span className="eyebrow">Notícias e comunicados</span><h2>Informação para decidir melhor.</h2></div></div><div className="post-preview">{posts.map((post) => <Link href={`/noticias/${post.slug}`} key={post.slug}><small>{post.category} · {new Intl.DateTimeFormat("pt-BR").format(new Date(`${post.publishedAt}T12:00:00`))}</small><h3>{post.title}</h3><p>{post.excerpt}</p></Link>)}</div><Link className="text-link below-list" href="/noticias">Ver todas as notícias <ArrowRight size={15} /></Link></div></div>
      </section>

      <section className="membership-cta"><div className="shell membership-inner"><div><span className="eyebrow">Faça parte</span><h2>Uma entidade mais forte começa com empresas participando.</h2><p>Conheça a diferença entre representação e associação e solicite uma conversa com a equipe.</p></div><Link className="button button-gold" href="/associe-se">Quero conhecer a associação <ArrowRight size={18} /></Link></div></section>
    </main>
  );
}
