import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sindicomar.com.br"; return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/auth", "/api/admin"] }, sitemap: `${origin}/sitemap.xml`, host: origin }; }
