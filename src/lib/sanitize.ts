import DOMPurify from "dompurify";

/**
 * Strip every tag/attribute — returns plain text only.
 * Use for any user-supplied value before it is reflected, logged or sent.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  return cleaned.replace(/\s+/g, " ").trim();
}

/** Collapse to a single safe line and clamp length (defense-in-depth). */
export function sanitizeLine(input: unknown, maxLength = 200): string {
  return sanitizeText(input).slice(0, maxLength);
}

/** Sanitize a free-text block but preserve line breaks. */
export function sanitizeBlock(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  return cleaned
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}
