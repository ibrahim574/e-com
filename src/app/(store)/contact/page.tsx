import type { Metadata } from "next";
import {
  SITE_EMAIL,
  SITE_PHONE,
  SITE_ADDRESS_LINES,
  SITE_MAP_EMBED_URL,
  SITE_MAP_LINK_URL,
  PAYMENT_METHODS,
  SITE_NAME,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${SITE_NAME} for sales, support, and quotes on professional two-way radios.`,
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", title: "Contact Us", url: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page py-10">
      <h1 className="section-title">Contact Us</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="prose-store max-w-2xl">
          <p>
            Need help choosing the right two-way radio for your team? Our experts are
            ready to help with product selection, programming, and deployment.
          </p>
          <ul className="mt-6 space-y-2">
            <li>
              <strong>Phone:</strong> {SITE_PHONE}
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a className="text-blue-600 hover:underline" href={`mailto:${SITE_EMAIL}`}>
                {SITE_EMAIL}
              </a>
            </li>
            <li>
              <strong>Address:</strong>
              <a
                className="ml-1 text-blue-600 hover:underline"
                href={SITE_MAP_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {SITE_ADDRESS_LINES.join(", ")}
              </a>
            </li>
            <li>
              <strong>Payments:</strong> We accept {PAYMENT_METHODS.join(", ")}.
            </li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <iframe
            title={`${SITE_NAME} location`}
            src={SITE_MAP_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
