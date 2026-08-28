import { describe, expect, it } from "vitest";
import { collectiveDocuments } from "@/data/site-content";
import { getCurrentDocuments, searchPublishedContent } from "@/lib/content";

describe("biblioteca de documentos", () => {
  it("nunca inclui instrumentos encerrados como atuais", () => { expect(getCurrentDocuments().every((document) => document.status !== "expired" && document.status !== "superseded")).toBe(true); });
  it("mantém instrumentos encerrados no acervo histórico", () => { expect(collectiveDocuments.some((document) => document.status === "expired")).toBe(true); });
  it("pesquisa documentos e conteúdos publicados", () => { expect(searchPublishedContent("convenção").length).toBeGreaterThan(0); });
});
