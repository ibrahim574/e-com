const BANNER = "/payment/payment-banner.png";
const SLICES = 4;

/** Show one logo from the 4-column payment banner (index 0–3; Amex at 2 is skipped). */
function BannerLogo({ index, label }: { index: number; label: string }) {
  const positionX = SLICES > 1 ? `${(index / (SLICES - 1)) * 100}%` : "0%";

  return (
    <div
      role="img"
      aria-label={label}
      className="h-12 w-[5.75rem] shrink-0 bg-contain bg-no-repeat sm:h-14 sm:w-[6.5rem]"
      style={{
        backgroundImage: `url(${BANNER})`,
        backgroundSize: `${SLICES * 100}% 100%`,
        backgroundPosition: `${positionX} center`,
      }}
    />
  );
}

export function PaymentLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
      <BannerLogo index={0} label="Visa" />
      <BannerLogo index={1} label="Mastercard" />
      <BannerLogo index={3} label="PayPal" />
    </div>
  );
}
