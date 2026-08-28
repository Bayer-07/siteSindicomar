import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PublicLink as Link } from "@/components/public-link";
import { posts } from "@/data/site-content";

export const metadata = { title: "Notícias e conteúdo", description: "Informações institucionais e orientações para o comércio." };

export default function NewsPage() {
  return <main id="conteudo"><PageHero eyebrow="Conteúdo empresarial" title="Informação que aproxima o comércio das decisões importantes." description="Publicações institucionais, relações do trabalho, funcionamento do comércio e desenvolvimento empresarial." />
    <section className="content-section"><div className="shell"><div className="section-heading"><div><span className="eyebrow">Publicações</span><h2>Conteúdo organizado por assunto.</h2></div><p>Leia os materiais produzidos para empresários, gestores, RH e contadores.</p></div><div className="news-grid">{posts.map((post, index) => <Link className={`news-card${index === 0 ? " news-card-featured" : ""}`} href={`/noticias/${post.slug}`} key={post.slug}><div className="news-visual"><span>{post.category}</span></div><div className="news-card-body"><small>{post.category} · {new Intl.DateTimeFormat("pt-BR").format(new Date(`${post.publishedAt}T12:00:00`))}</small><h2>{post.title}</h2><p>{post.excerpt}</p><span className="text-link">Ler publicação <ArrowRight size={15} /></span></div></Link>)}</div></div></section>
  </main>;
}
