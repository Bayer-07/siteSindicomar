import { ArrowLeft, Home } from "lucide-react";
import { PublicLink as Link } from "@/components/public-link";

export default function NotFound() {
  return (
    <main id="conteudo">
      <section className="not-found-page" aria-labelledby="not-found-title">
        <div className="shell not-found-inner">
          <div className="not-found-copy">
            <span className="eyebrow">Erro 404</span>
            <h1 id="not-found-title">Esta página não está disponível.</h1>
            <p>O endereço pode ter sido alterado ou não existe mais. Volte ao início para continuar sua consulta no portal Sindicomar.</p>
            <div className="not-found-actions">
              <Link className="button button-primary" href="/"><Home size={17} /> Voltar para a página inicial</Link>
              <Link className="not-found-back-link" href="/convencoes"><ArrowLeft size={16} /> Consultar convenções</Link>
            </div>
          </div>
          <div className="not-found-mark" aria-hidden="true"><span>404</span><i /></div>
        </div>
      </section>
    </main>
  );
}
