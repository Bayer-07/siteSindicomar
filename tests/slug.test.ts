import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slug editorial", () => {
  it("gera um slug legível a partir de títulos em português", () => {
    expect(slugify("Funcionamento do comércio em feriados: o que verificar")).toBe("funcionamento-do-comercio-em-feriados-o-que-verificar");
  });

  it("remove separadores repetidos e limita o tamanho", () => {
    expect(slugify("  Título   com / separadores  ")).toBe("titulo-com-separadores");
    expect(slugify("a".repeat(120))).toHaveLength(96);
  });
});
