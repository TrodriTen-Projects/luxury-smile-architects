import { z } from "zod";
// Same metadata set as the form (see Contact.tsx), so the validator and the
// input agree and the bundle carries one copy, not two.
import { isValidPhoneNumber } from "react-phone-number-input/min";

/**
 * Factory so error messages can be localised via i18next at call time.
 */
export function buildContactSchema(t: (key: string) => string) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(2, t("contact.form.required"))
      .max(60),
    lastName: z
      .string()
      .trim()
      .min(2, t("contact.form.required"))
      .max(60),
    phone: z
      .string()
      .trim()
      .refine((val) => isValidPhoneNumber(val), {
        message: t("contact.form.invalidPhone"),
      }),
    email: z
      .string()
      .trim()
      .email(t("contact.form.invalidEmail"))
      .max(120),
    treatment: z.string().trim().min(1, t("contact.form.required")).max(60),
    source: z.string().trim().min(1, t("contact.form.required")).max(60),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    // zod 4 cambió `errorMap` por `error`. Con la sintaxis anterior el mensaje
    // caía al texto por defecto en inglés ("Invalid input: expected true") sin
    // que TypeScript dijera nada, porque la opción sobrante se ignora.
    consent: z.literal(true, { error: t("contact.form.consentRequired") }),
    // Honeypot — must stay empty. Bots tend to fill every field.
    company: z.string().max(0).optional().or(z.literal("")),
  });
}

export type ContactValues = z.infer<ReturnType<typeof buildContactSchema>>;
