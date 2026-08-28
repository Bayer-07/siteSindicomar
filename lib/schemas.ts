import { z } from "zod";

const baseSubmission = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  email: z.string().trim().email("Informe um e-mail válido").max(180),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(30),
  message: z.string().trim().min(10, "Explique brevemente como podemos ajudar").max(3000),
  preferredChannel: z.enum(["email", "phone", "whatsapp"]),
  privacyAccepted: z.literal(true, { message: "É necessário aceitar o aviso de privacidade" }),
  turnstileToken: z.string().optional().default(""),
  sourcePath: z.string().trim().max(300).optional().default("/"),
});

export const contactSubmissionSchema = baseSubmission.extend({
  kind: z.literal("contact"),
  subject: z.enum(["cct", "classification", "membership", "benefits", "guides", "press", "other"]),
});

export const classificationSubmissionSchema = baseSubmission.extend({
  kind: z.literal("classification"),
  cnpj: z.string().trim().min(14, "Informe o CNPJ").max(20),
  municipality: z.string().trim().min(2).max(120),
  activity: z.string().trim().min(3).max(300),
});

export const membershipSubmissionSchema = baseSubmission.extend({
  kind: z.literal("membership"),
  cnpj: z.string().trim().min(14, "Informe o CNPJ").max(20),
  companyName: z.string().trim().min(2).max(180),
  municipality: z.string().trim().min(2).max(120),
  activity: z.string().trim().min(3).max(300),
});

export const submissionSchema = z.discriminatedUnion("kind", [
  contactSubmissionSchema,
  classificationSubmissionSchema,
  membershipSubmissionSchema,
]);

export type SubmissionInput = z.infer<typeof submissionSchema>;
