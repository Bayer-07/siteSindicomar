import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, FileCheck2, Handshake, Landmark, MessageCircle, Scale, SearchCheck, ShieldCheck } from "lucide-react";
import { PublicLink as Link } from "@/components/public-link";
import { PartnerSection } from "@/components/partner-section";
import { AgendaStatusBadge, DocumentStatusBadge } from "@/components/status-badge";
import { StructuredData } from "@/components/structured-data";
import { documentTypeLabels } from "@/data/site-content";
import { getPublicCollections } from "@/lib/content";

const shortcuts = [
  { href: "/convencoes", icon: FileCheck2, number: "01", title: "Convenções coletivas", description: "Encontre o instrumento por município, categoria, tipo e situação." },
  { href: "/agenda", icon: CalendarDays, number: "02", title: "Funcionamento do comércio", description: "Consulte feriados, datas especiais, eventos e orientações." },
  { href: "/representatividade", icon: SearchCheck, number: "03", title: "Enquadramento", description: "Solicite análise humana sobre a representatividade da empresa." },
  { href: "/contato", icon: MessageCircle, number: "04", title: "Atendimento", description: "Fale com a entidade pelo canal mais conveniente para sua empresa." },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const { agendaItems, collectiveDocuments, posts, services, partners } = await getPublicCollections();
  const featuredDocuments = collectiveDocuments.slice(0, 2);
  return (
    <main id="conteudo">
      <StructuredData />
      <section className="hero institutional-hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Marechal Cândido Rondon e microrregião</span>
            <h1>Uma instituição presente nas decisões do comércio.</h1>
            <p className="hero-lead">O Sindicomar representa o setor varejista, conduz relações coletivas e aproxima empresas de orientação, serviços e desenvolvimento.</p>
            <div className="hero-actions"><Link className="button button-gold" href="/convencoes">Acessar convenções <ArrowRight size={18} /></Link><Link className="hero-secondary-link" href="/o-sindicomar">Conheça o Sindicomar <ArrowRight size={16} /></Link></div>
          </div>
          <aside className="portal-directory" aria-label="Áreas do portal">
            <div className="directory-heading"><span>Central empresarial</span><strong>Acesso direto às áreas do Sindicomar</strong></div>
            <Link href="/convencoes"><span><FileCheck2 /></span><div><strong>Relações do trabalho</strong><small>Convenções, atas e comunicados</small></div><ArrowRight /></Link>
            <Link href="/representatividade"><span><SearchCheck /></span><div><strong>Representatividade</strong><small>Enquadramento e base sindical</small></div><ArrowRight /></Link>
            <Link href="/servicos"><span><BriefcaseBusiness /></span><div><strong>Serviços ao empresário</strong><small>Orientação e desenvolvimento</small></div><ArrowRight /></Link>
            <Link href="/contato"><span><MessageCircle /></span><div><strong>Atendimento institucional</strong><small>Fale diretamente com a entidade</small></div><ArrowRight /></Link>
          </aside>
        </div>
      </section>

      <section className="institution-strip">
        <div className="shell institution-strip-inner">
          <div><Building2 /><span><strong>Entidade patronal</strong>Representação do comércio varejista</span></div>
          <div><Landmark /><span><strong>Sistema Comércio</strong>Integrante da Fecomércio PR</span></div>
          <div><Handshake /><span><strong>Atuação regional</strong>Diálogo com empresas e instituições</span></div>
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
        <div className="shell"><div className="section-heading"><div><span className="eyebrow">Acervo documental</span><h2>Convenções, atas e comunicados com contexto.</h2></div><Link className="text-link" href="/convencoes">Consultar biblioteca completa</Link></div><div className="featured-documents">{featuredDocuments.map((document) => <Link className="featured-document" href={`/convencoes/${document.slug}`} key={document.id}><div className="featured-icon"><Scale size={25} /></div><div><div className="document-card-top"><span>{documentTypeLabels[document.type]} · {document.year}</span><DocumentStatusBadge status={document.status} /></div><h3>{document.title}</h3><p>{document.summary}</p><small>{document.municipality} · atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(`${document.lastReviewedAt}T12:00:00`))}</small></div><ArrowRight size={20} /></Link>)}</div></div>
      </section>

      <section className="content-section surface-section" id="servicos">
        <div className="shell"><div className="section-heading"><div><span className="eyebrow">Atuação empresarial</span><h2>Uma entidade organizada em torno das necessidades do comércio.</h2></div><Link className="text-link" href="/servicos">Conhecer todas as frentes</Link></div><div className="service-grid">{services.slice(0, 3).map((service, index) => <Link className="service-card" href={`/servicos/${service.slug}`} key={service.slug}><span className="service-icon">{index === 0 ? <Scale /> : index === 1 ? <BriefcaseBusiness /> : <ShieldCheck />}</span><small>{service.category === "labor" ? "Orientação" : service.category === "training" ? "Desenvolvimento" : "Sistema Comércio"}</small><h3>{service.title}</h3><p>{service.excerpt}</p><span className="text-link">Ver detalhes <ArrowRight size={15} /></span></Link>)}</div></div>
      </section>

      <section className="content-section" id="agenda">
        <div className="shell split-home"><div><div className="section-heading single"><div><span className="eyebrow">Agenda institucional</span><h2>Registros do comércio.</h2></div></div><div className="agenda-preview">{agendaItems.map((item) => <Link href="/agenda" key={item.id}><time dateTime={item.date}><strong>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(item.date))}</strong><span>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(item.date)).replace(".", "")}</span></time><div><AgendaStatusBadge status={item.status} /><h3>{item.title}</h3><p>{item.municipality}</p></div><ArrowRight size={18} /></Link>)}</div><Link className="text-link below-list" href="/agenda">Consultar agenda e comunicados <ArrowRight size={15} /></Link></div><div><div className="section-heading single"><div><span className="eyebrow">Conteúdo empresarial</span><h2>Informação para decidir melhor.</h2></div></div><div className="post-preview">{posts.map((post) => <Link href={`/noticias/${post.slug}`} key={post.slug}><small>{post.category} · {new Intl.DateTimeFormat("pt-BR").format(new Date(`${post.publishedAt}T12:00:00`))}</small><h3>{post.title}</h3><p>{post.excerpt}</p></Link>)}</div><Link className="text-link below-list" href="/noticias">Ver todas as publicações <ArrowRight size={15} /></Link></div></div>
      </section>

      <PartnerSection partners={partners} />

      <section className="membership-cta"><div className="shell membership-inner"><div><span className="eyebrow">Faça parte</span><h2>Uma entidade mais forte começa com empresas participando.</h2><p>Conheça a diferença entre representação e associação e solicite uma conversa com a equipe.</p></div><Link className="button button-gold" href="/associe-se">Quero conhecer a associação <ArrowRight size={18} /></Link></div></section>
    </main>
  );
}
