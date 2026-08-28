"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, MessageCircle, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { navigation, publicContact } from "@/data/site-content";

type SearchResult = { type: string; title: string; excerpt: string; href: string };

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const whatsappHref = publicContact.whatsapp
    ? `https://wa.me/${publicContact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Olá, acessei o portal do Sindicomar e preciso de atendimento.")}`
    : "/contato";

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
      <div className="urgent-bar">
        <div className="shell urgent-inner">
          <span className="urgent-label">Comunicado</span>
          <p>Portal em homologação — conteúdo trabalhista aguarda validação.</p>
          <Link href="/noticias/portal-sindicomar-em-homologacao">Saiba mais</Link>
        </div>
      </div>
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" aria-label="Sindicomar — página inicial">
            <Image className="brand-logo" src="/sindicomar-logo-horizontal.png" alt="Sindicomar PR — Marechal Cândido Rondon e região" width={800} height={287} priority />
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
            <a className="icon-button whatsapp-compact" href={whatsappHref} target={publicContact.whatsapp ? "_blank" : undefined} rel="noreferrer" aria-label="Atendimento pelo WhatsApp"><MessageCircle size={19} /></a>
            <Link className="button button-secondary header-cta" href="/convencoes">Consultar CCT</Link>
            <Dialog.Root triggerId="site-menu-trigger">
              <Dialog.Trigger id="site-menu-trigger" className="icon-button mobile-trigger" aria-label="Abrir menu"><Menu size={22} /></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="dialog-backdrop" />
                <Dialog.Viewport className="mobile-menu-viewport">
                  <Dialog.Popup className="mobile-menu-dialog">
                    <div className="dialog-heading"><Image src="/sindicomar-logo-horizontal.png" alt="Sindicomar PR" width={800} height={287} /><Dialog.Close className="icon-button" aria-label="Fechar menu"><X size={20} /></Dialog.Close></div>
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
