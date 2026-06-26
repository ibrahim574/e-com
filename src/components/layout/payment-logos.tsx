import type { ReactNode } from "react";

function Chip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex h-9 min-w-[58px] items-center justify-center rounded-md border border-slate-200 bg-white px-3 shadow-sm"
    >
      {children}
    </span>
  );
}

function VisaLogo() {
  return (
    <Chip label="Visa">
      <span
        className="text-[18px] font-extrabold italic leading-none tracking-tight"
        style={{ color: "#1434CB", fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        VISA
      </span>
    </Chip>
  );
}

function MastercardLogo() {
  return (
    <Chip label="Mastercard">
      <svg
        className="h-6 w-auto"
        viewBox="0 0 48 30"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="18" cy="15" r="11" fill="#EB001B" />
        <circle cx="30" cy="15" r="11" fill="#F79E1B" />
        <path fill="#FF5F00" d="M24 7.2a11 11 0 0 1 0 15.6 11 11 0 0 1 0-15.6z" />
      </svg>
    </Chip>
  );
}

function PayPalLogo() {
  return (
    <Chip label="PayPal">
      <span
        className="text-[16px] font-extrabold italic leading-none tracking-tight"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <span style={{ color: "#003087" }}>Pay</span>
        <span style={{ color: "#0070E0" }}>Pal</span>
      </span>
    </Chip>
  );
}

export function PaymentLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      <VisaLogo />
      <MastercardLogo />
      <PayPalLogo />
    </div>
  );
}
