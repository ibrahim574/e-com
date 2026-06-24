const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

/** Strip HTML tags and trim whitespace for safe plain-text storage. */
export function sanitizeText(value: string, maxLength = 5000): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(value: string): string {
  return sanitizeText(value, 254).toLowerCase();
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "smtpPassword",
  "smtpPasswordEnc",
  "smtp_pass",
  "token",
  "otpHash",
]);

export function redactForLog(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(redactForLog);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactForLog(val);
      }
    }
    return out;
  }
  return obj;
}
