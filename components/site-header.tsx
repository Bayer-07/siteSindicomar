"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Mail, Menu, Phone, Search, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { PublicLink as Link } from "@/components/public-link";
import { navigation, publicContact } from "@/data/site-content";

type SearchResult = { type: string; title: string; excerpt: string; href: string };

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const payload = (await response.json()) as { results?: SearchResult[] };
    setResults(payload.results ?? []);
    setSearching(false);
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <div className="utility-bar">
        <div className="shell utility-inner">
          <span>Sindicato Patronal do Comércio Varejista</span>
          <div>
            <a href={`tel:${publicContact.phone.replace(/\D/g, "")}`}><Phone size={13} />{publicContact.phone}</a>
            <a href={`mailto:${publicContact.email}`}><Mail size={13} />{publicContact.email}</a>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" aria-label="Sindicomar — página inicial">
            <Image className="brand-logo" src="/sindicomar-logo-horizontal.png" alt="Sindicomar PR — Marechal Cândido Rondon e região" width={2000} height={600} priority />
          </Link>
          <nav className="desktop-nav" aria-label="Navegação principal">
            {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <div className="header-actions">
            <Dialog.Root triggerId="site-search-trigger">
              <Dialog.Trigger id="site-search-trigger" className="icon-button" aria-label="Abrir busca"><Search size={19} /></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="dialog-backdrop" />
                <Dialog.Viewport className="dialog-viewport">
                  <Dialog.Popup className="search-dialog">
                    <div className="dialog-heading"><div><Dialog.Title>Buscar no portal</Dialog.Title><Dialog.Description>Pesquise documentos, serviços, notícias e agenda.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Fechar busca"><X size={20} /></Dialog.Close></div>
                    <form className="search-form" onSubmit={handleSearch}><Search size={20} aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: convenção, feriado, enquadramento" aria-label="Termo de busca" /><button className="button button-primary" type="submit">Buscar</button></form>
                    <div className="search-results" aria-live="polite">
                      {searching && <p>Buscando…</p>}
                      {!searching && results.map((result) => <Link href={result.href} key={`${result.type}-${result.href}`}><small>{result.type}</small><strong>{result.title}</strong><span>{result.excerpt}</span></Link>)}
                      {!searching && query.length >= 2 && results.length === 0 && <p>Nenhum resultado encontrado.</p>}
                    </div>
                  </Dialog.Popup>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog.Root>
            <Link className="button button-secondary header-cta" href="/convencoes">Consultar CCT</Link>
            <Link className="button button-primary membership-header-cta" href="/associe-se">Associe-se</Link>
            <Dialog.Root triggerId="site-menu-trigger">
              <Dialog.Trigger id="site-menu-trigger" className="icon-button mobile-trigger" aria-label="Abrir menu"><Menu size={22} /></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="dialog-backdrop" />
                <Dialog.Viewport className="mobile-menu-viewport">
                  <Dialog.Popup className="mobile-menu-dialog">
                    <div className="dialog-heading"><Image src="/sindicomar-logo-horizontal.png" alt="Sindicomar PR" width={2000} height={600} /><Dialog.Close className="icon-button" aria-label="Fechar menu"><X size={20} /></Dialog.Close></div>
                    <Dialog.Title className="sr-only">Menu principal</Dialog.Title>
                    <nav aria-label="Navegação móvel">{navigation.map((item) => <Dialog.Close key={item.href} render={<Link href={item.href} />}>{item.label}</Dialog.Close>)}<Dialog.Close render={<Link href="/associe-se" />}>Associe-se</Dialog.Close><Dialog.Close render={<Link href="/contato" />}>Contato</Dialog.Close></nav>
                    <Dialog.Close className="button button-primary" render={<Link href="/convencoes" />}>Consultar convenções</Dialog.Close>
                  </Dialog.Popup>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>
    </>
  );
}
