import Link from "next/link";
import {
  Radio,
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
} from "lucide-react";
import {
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE,
  PARENT_COMPANY,
  PARENT_COMPANY_URL,
  SITE_DOMAIN,
  SITE_ADDRESS_LINES,
  SITE_MAP_EMBED_URL,
  SITE_MAP_LINK_URL,
} from "@/lib/constants";
import { PaymentLogos } from "@/components/layout/payment-logos";

const socials = [
  {
    label: "Facebook",
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z",
  },
  {
    label: "Instagram",
    path: "M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.16.56.55.9 1.11 1.16 1.77.25.64.42 1.36.47 2.43.05 1.07.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.16 1.77c-.55.56-1.11.9-1.77 1.16-.64.25-1.36.42-2.43.47-1.07.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.25-.64-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.79.47-2.43.26-.66.6-1.22 1.16-1.77.55-.56 1.11-.9 1.77-1.16.64-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-8.4a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z",
  },
  {
    label: "X",
    path: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z",
  },
  {
    label: "YouTube",
    path: "M23.5 6.5a3 3 0 0 0-2.11-2.12C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.39.52A3 3 0 0 0 .5 6.5 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.5 3 3 0 0 0 2.11 2.12c1.89.52 9.39.52 9.39.52s7.5 0 9.39-.52a3 3 0 0 0 2.11-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z",
  },
];

export function Footer({
  dualCurrency = true,
  proudlyCanadianEnabled = true,
}: {
  dualCurrency?: boolean;
  proudlyCanadianEnabled?: boolean;
} = {}) {
  const trust = [
    { icon: Truck, label: "Fast Free Shipping" },
    { icon: ShieldCheck, label: "1-Year Warranty" },
    { icon: Headphones, label: "Expert Support" },
    { icon: CreditCard, label: "Secure Checkout" },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      {/* Trust strip */}
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <t.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-900">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
              <Radio className="h-6 w-6" />
            </span>
            <span className="text-lg">{SITE_NAME}</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
            Expert two-way radio solutions with fast shipping, professional
            programming, and industry-ready kits — trusted by teams across the US
            and Canada.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {SITE_DOMAIN}, owned and operated by{" "}
            <a
              href={PARENT_COMPANY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline"
            >
              {PARENT_COMPANY}
            </a>
            .
          </p>
          <div className="mt-6 flex gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-blue-600 hover:text-white hover:ring-blue-600"
                aria-label={s.label}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
            Shop
          </h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/categories/business-radios" className="transition hover:text-blue-600">Business Radios</Link></li>
            <li><Link href="/categories/commercial-radios" className="transition hover:text-blue-600">Commercial Radios</Link></li>
            <li><Link href="/categories/nationwide-radios" className="transition hover:text-blue-600">Nationwide Radios</Link></li>
            <li><Link href="/categories/accessories" className="transition hover:text-blue-600">Accessories</Link></li>
            <li><Link href="/search" className="transition hover:text-blue-600">All Products</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
            Support
          </h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/contact" className="transition hover:text-blue-600">Contact Us</Link></li>
            <li><Link href="/shipping" className="transition hover:text-blue-600">Shipping Policy</Link></li>
            <li><Link href="/about" className="transition hover:text-blue-600">About Us</Link></li>
            <li><Link href="/account" className="transition hover:text-blue-600">My Account</Link></li>
            <li><Link href="/account/orders" className="transition hover:text-blue-600">Order History</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
            Get in Touch
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <a href={`tel:${SITE_PHONE.replace(/[^\d+]/g, "")}`} className="transition hover:text-blue-600">
                {SITE_PHONE}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <a href={`mailto:${SITE_EMAIL}`} className="transition hover:text-blue-600">
                {SITE_EMAIL}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <a
                href={SITE_MAP_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="leading-relaxed transition hover:text-blue-600"
              >
                {SITE_ADDRESS_LINES.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </a>
            </li>
          </ul>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
            <iframe
              title={`${SITE_NAME} location`}
              src={SITE_MAP_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-40 w-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container-page py-6">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Secure Payments
          </p>
          <PaymentLogos />
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-500 sm:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
            {proudlyCanadianEnabled && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-100">
                <span aria-hidden>🍁</span> Proudly Canadian
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/shipping" className="transition hover:text-blue-600">Shipping</Link>
            <Link href="/contact" className="transition hover:text-blue-600">Contact</Link>
            <Link href="/stay-connected" className="transition hover:text-blue-600">Get a Quote</Link>
            <span>{dualCurrency ? "CAD / USD" : "CAD"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
