import Image from "next/image";
import { cn } from "@/lib/utils";
import { avatarInitials } from "@/lib/avatar";

export function Avatar({
  src,
  name,
  email,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "Profile photo"}
        width={size}
        height={size}
        unoptimized
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }}
    >
      {avatarInitials(name, email)}
    </span>
  );
}
