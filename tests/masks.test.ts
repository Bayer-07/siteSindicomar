import { describe, expect, it } from "vitest";
import { digitsOnly, formatCnpj, formatPhone } from "@/lib/masks";

describe("máscaras dos formulários", () => {
  it("formata CNPJ e limita a 14 dígitos", () => {
    expect(formatCnpj("0470293900015999")).toBe("04.702.939/0001-59");
  });

  it("formata telefone celular e fixo com DDD", () => {
    expect(formatPhone("45999999999")).toBe("(45) 99999-9999");
    expect(formatPhone("4532841277")).toBe("(45) 3284-1277");
  });

  it("remove a máscara antes do envio", () => {
    expect(digitsOnly("(45) 99999-9999")).toBe("45999999999");
    expect(digitsOnly("04.702.939/0001-59")).toBe("04702939000159");
  });
});
