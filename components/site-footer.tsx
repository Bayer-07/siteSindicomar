import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { PublicLink as Link } from "@/components/public-link";
import { navigation, publicContact } from "@/data/site-content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <div className="footer-logo-card"><Image src="/sindicomar-logo-horizontal.png" alt="Sindicomar PR" width={800} height={287} /></div>
          <p>Representatividade, orientação e apoio prático para fortalecer o comércio de Marechal Cândido Rondon e região.</p>
        </div>
        <div><h2>Navegação</h2><nav>{navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></div>
        <div><h2>Institucional</h2><nav><Link href="/associe-se">Associe-se</Link><Link href="/contato">Contato</Link><Link href="/privacidade">Privacidade</Link><Link href="/acessibilidade">Acessibilidade</Link></nav></div>
        <div><h2>Atendimento</h2><address><a href={`tel:${publicContact.phone.replace(/\D/g, "")}`}><Phone size={17} />{publicContact.phone}</a><a href={`mailto:${publicContact.email}`}><Mail size={17} />{publicContact.email}</a><span><MapPin size={17} />{publicContact.address}</span></address></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} Sindicomar. Todos os direitos reservados.</span><div><Link href="/cookies">Cookies</Link><Link href="/termos">Termos de uso</Link></div></div>
    </footer>
  );
}
