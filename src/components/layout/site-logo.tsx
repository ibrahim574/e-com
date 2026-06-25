import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import {
  DEFAULT_SITE_LOGO,
  isSiteLogoUpload,
  resolveSiteLogoUrl,
} from "@/lib/site-logo";

type SiteLogoProps = {
  logoUrl?: string | null;
  size?: "sm" | "md";
  showName?: boolean;
  className?: string;
};

const SIZES = {
  sm: { box: "h-8 w-8", image: 32, text: "text-base" },
  md: { box: "h-10 w-10", image: 40, text: "text-lg sm:text-xl" },
} as const;

export function SiteLogo({
  logoUrl,
  size = "md",
  showName = true,
  className = "",
}: SiteLogoProps) {
  const src = resolveSiteLogoUrl(logoUrl);
  const dims = SIZES[size];

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-extrabold text-slate-900 dark:text-white ${className}`}
    >
      <span
        className={`relative shrink-0 overflow-hidden rounded-xl ${dims.box}`}
      >
        <Image
          src={src}
          alt={SITE_NAME}
          width={dims.image}
          height={dims.image}
          className="h-full w-full object-contain"
          unoptimized={isSiteLogoUpload(src) || src === DEFAULT_SITE_LOGO}
          priority
        />
      </span>
      {showName && (
        <span className={`leading-tight tracking-tight ${dims.text}`}>
          {SITE_NAME}
        </span>
      )}
    </Link>
  );
}
