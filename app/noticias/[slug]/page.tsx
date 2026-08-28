import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoNotice } from "@/components/demo-notice";
import { posts } from "@/data/site-content";
import { getPostBySlug } from "@/lib/content";

export function generateStaticParams() { return posts.map((post) => ({ slug: post.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const post = getPostBySlug((await params).slug); if (!post) return {}; return { title: post.title, description: post.excerpt, openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, images: [] }, twitter: { title: post.title, description: post.excerpt, images: [] } }; }

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPostBySlug((await params).slug); if (!post) notFound();
  return <main id="conteudo"><article><header className="article-hero"><div className="shell article-header"><Link className="back-link" href="/noticias">← Voltar para notícias</Link><span className="eyebrow">{post.category}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="article-meta"><span>Por {post.author}</span><span>Publicado em {new Intl.DateTimeFormat("pt-BR").format(new Date(`${post.publishedAt}T12:00:00`))}</span><span>Atualizado em {new Intl.DateTimeFormat("pt-BR").format(new Date(`${post.updatedAt}T12:00:00`))}</span></div></div></header><div className="shell article-body"><DemoNotice />{post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<aside><strong>Atenção</strong><p>Comunicados sobre funcionamento do comércio devem sempre apontar o instrumento oficial aplicável. Em caso de dúvida, fale com a equipe.</p></aside></div></article></main>;
}
