import { z } from "zod";
import { digitsOnly } from "@/lib/masks";

const phoneSchema = z.string().trim().max(30).transform((value) => digitsOnly(value, 11)).refine((value) => value.length >= 10, "Informe um telefone com DDD");
const cnpjSchema = z.string().trim().max(20).transform((value) => digitsOnly(value, 14)).refine((value) => value.length === 14, "Informe os 14 dígitos do CNPJ");

const baseSubmission = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  email: z.string().trim().email("Informe um e-mail válido").max(180),
  phone: phoneSchema,
  message: z.string().trim().min(10, "Explique brevemente como podemos ajudar").max(3000),
  preferredChannel: z.enum(["email", "phone", "whatsapp"]),
  privacyAccepted: z.literal(true, { message: "É necessário aceitar o aviso de privacidade" }),
  turnstileToken: z.string().optional().default(""),
  // Honeypot used while Turnstile is unavailable and as a second signal when
  // Turnstile is enabled. It must remain empty for real visitors.
  website: z.string().max(200).optional().default(""),
  sourcePath: z.string().trim().max(300).optional().default("/"),
});

export const contactSubmissionSchema = baseSubmission.extend({
  kind: z.literal("contact"),
  subject: z.enum(["cct", "classification", "membership", "benefits", "guides", "press", "other"]),
});

export const classificationSubmissionSchema = baseSubmission.extend({
  kind: z.literal("classification"),
  cnpj: cnpjSchema,
  municipality: z.string().trim().min(2).max(120),
  activity: z.string().trim().min(3).max(300),
});

export const membershipSubmissionSchema = baseSubmission.extend({
  kind: z.literal("membership"),
  cnpj: cnpjSchema,
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
