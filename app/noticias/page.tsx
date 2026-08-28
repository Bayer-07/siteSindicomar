import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DemoNotice } from "@/components/demo-notice";
import { PageHero } from "@/components/page-hero";
import { posts } from "@/data/site-content";

export const metadata = { title: "Notícias e comunicados", description: "Informações sobre relações do trabalho, funcionamento, gestão, cursos e atuação do Sindicomar." };

export default function NewsPage() {
  return <main id="conteudo"><PageHero eyebrow="Notícias e comunicados" title="Informação local para decisões empresariais." description="Conteúdos com fonte, responsável, data original, atualização e documentos relacionados." /><section className="content-section"><div className="shell"><DemoNotice /><div className="news-grid">{posts.map((post, index) => <Link className={`news-card${index === 0 ? " news-card-featured" : ""}`} href={`/noticias/${post.slug}`} key={post.slug}><div className="news-visual"><span>Sindicomar</span></div><div className="news-card-body"><small>{post.category} · {new Intl.DateTimeFormat("pt-BR").format(new Date(`${post.publishedAt}T12:00:00`))}</small><h2>{post.title}</h2><p>{post.excerpt}</p><span className="text-link">Ler publicação <ArrowRight size={15} /></span></div></Link>)}</div></div></section></main>;
}
