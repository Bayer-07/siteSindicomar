import type { MetadataRoute } from "next";
import { getPublicCollections } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sindicomar.com.br";
  const { collectiveDocuments, posts, services } = await getPublicCollections();
  const routes = ["", "/o-sindicomar", "/representatividade", "/convencoes", "/agenda", "/servicos", "/associe-se", "/noticias", "/contato", "/privacidade", "/cookies", "/termos", "/acessibilidade"];
  return [
    ...routes.map((route) => ({ url: `${origin}${route}`, lastModified: new Date(), changeFrequency: route === "" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : 0.7 })),
    ...collectiveDocuments.map((item) => ({ url: `${origin}/convencoes/${item.slug}`, lastModified: new Date(item.lastReviewedAt), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...services.map((item) => ({ url: `${origin}/servicos/${item.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((item) => ({ url: `${origin}/noticias/${item.slug}`, lastModified: new Date(item.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
