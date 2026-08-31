import { describe, expect, it } from "vitest";
import { submissionSchema } from "@/lib/schemas";

const base = { name: "Gabriel Bayer", email: "gabriel@example.com", phone: "45999999999", preferredChannel: "whatsapp", message: "Preciso de informações sobre o atendimento.", privacyAccepted: true, sourcePath: "/contato", turnstileToken: "teste" };
describe("validação dos formulários", () => {
  it("aceita contato válido", () => { expect(submissionSchema.safeParse({ ...base, kind: "contact", subject: "cct" }).success).toBe(true); });
  it("normaliza telefone e CNPJ mascarados", () => {
    const parsed = submissionSchema.safeParse({ ...base, phone: "(45) 99999-9999", kind: "membership", cnpj: "04.702.939/0001-59", companyName: "Empresa", municipality: "Marechal Cândido Rondon", activity: "Varejo" });
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.kind === "membership") { expect(parsed.data.phone).toBe("45999999999"); expect(parsed.data.cnpj).toBe("04702939000159"); }
  });
  it("exige CNPJ na associação", () => { expect(submissionSchema.safeParse({ ...base, kind: "membership", companyName: "Empresa", municipality: "Marechal Cândido Rondon", activity: "Varejo" }).success).toBe(false); });
  it("exige consentimento", () => { expect(submissionSchema.safeParse({ ...base, privacyAccepted: false, kind: "contact", subject: "other" }).success).toBe(false); });
});
