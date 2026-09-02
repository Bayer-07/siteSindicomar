import { describe, expect, it } from "vitest";
import { hasAllowedExtension, hasExpectedSignature, safeStoragePath } from "@/lib/media";

describe("armazenamento local de arquivos", () => {
  it("bloqueia caminhos fora da pasta de uploads", () => {
    expect(() => safeStoragePath("../segredo.txt")).toThrow();
    expect(() => safeStoragePath("/etc/passwd")).toThrow();
    expect(() => safeStoragePath("images//arquivo.png")).toThrow();
  });

  it("exige extensão e assinatura compatíveis com o MIME", () => {
    expect(hasAllowedExtension("capa.exe", "image/png")).toBe(false);
    expect(hasAllowedExtension("capa.png", "image/png")).toBe(true);
    expect(hasExpectedSignature(Buffer.from("%PDF-1.7"), "application/pdf")).toBe(true);
    expect(hasExpectedSignature(Buffer.from("not a pdf"), "application/pdf")).toBe(false);
  });
});
