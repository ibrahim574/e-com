import Image, { type ImageProps } from "next/image";
import { isManagedUploadPath } from "@/lib/product-image-paths";

export function ProductImage({ src, ...props }: ImageProps) {
  const unoptimized =
    typeof src === "string" ? isManagedUploadPath(src) : false;

  return <Image src={src} unoptimized={unoptimized} {...props} />;
}
