"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { PublicSiteSettings } from "@/lib/content";

export function SiteChrome({ children, settings }: { children: ReactNode; settings: PublicSiteSettings }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/auth");
  if (isAdmin) return children;
  return <><SiteHeader contact={settings} />{children}<SiteFooter contact={settings} /></>;
}
