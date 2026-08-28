export function StructuredData() {
  const data = { "@context": "https://schema.org", "@type": "Organization", name: "Sindicomar PR", alternateName: "Sindicato do Comércio Varejista de Marechal Cândido Rondon e região", url: "https://www.sindicomar.com.br", logo: "https://www.sindicomar.com.br/sindicomar-logo-horizontal.png", email: "sindicomarmarechal@gmail.com", telephone: "+55 45 3284-1277", areaServed: { "@type": "City", name: "Marechal Cândido Rondon" } };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }} />;
}
