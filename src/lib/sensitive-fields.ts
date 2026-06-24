const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "smtpPassword",
  "smtpPasswordEnc",
  "smtp_pass",
  "otpHash",
]);

export function stripSensitive<T extends Record<string, unknown>>(obj: T): Omit<T, never> {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (SENSITIVE_KEYS.has(key)) {
      delete (out as Record<string, unknown>)[key];
    }
  }
  return out;
}

export function stripSensitiveList<T extends Record<string, unknown>>(items: T[]): T[] {
  return items.map((item) => stripSensitive(item) as T);
}
