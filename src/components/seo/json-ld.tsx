type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

/**
 * Renders a JSON-LD structured-data script. The payload is escaped so that a
 * stray "<" cannot break out of the script tag (basic XSS hardening per the
 * Next.js JSON-LD guidance).
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
