import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { getPublicSiteSettings } from "@/lib/content";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sindicomar.com.br"),
  title: { default: "Sindicomar | Comércio forte, orientação segura", template: "%s | Sindicomar" },
  description: "Portal do Sindicomar para empresários, gestores, RH e contadores de Marechal Cândido Rondon e região.",
  icons: { icon: "/sindicomar-logo-quadrada.png", apple: "/sindicomar-logo-quadrada.png" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Sindicomar",
    title: "Sindicomar | Comércio forte, orientação segura",
    description: "Representatividade, informação trabalhista e apoio prático para o comércio de Marechal Cândido Rondon e região.",
    images: [{ url: "/sindicomar-logo-horizontal.png", width: 2000, height: 600, alt: "Sindicomar PR" }],
  },
  twitter: { card: "summary_large_image", title: "Sindicomar", description: "Comércio forte, orientação segura.", images: ["/sindicomar-logo-horizontal.png"] },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSiteSettings();
  return <html lang="pt-BR"><body className={`${inter.variable} ${manrope.variable}`}><SiteChrome settings={settings}>{children}</SiteChrome></body></html>;
}
