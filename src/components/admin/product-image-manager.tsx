"use client";

import { ProductImage } from "@/components/products/product-image";
import { useRef, useState } from "react";
import {
  deleteProductImageAction,
  uploadProductImageAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

type ProductImageManagerProps = {
  defaultImages?: string[];
};

export function ProductImageManager({
  defaultImages = [],
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(
    defaultImages.filter((url) => url !== "/placeholder-product.svg"),
  );
  const [uploading, setUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setError(null);
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadProductImageAction(formData);
      if (!result.ok) {
        setError(result.error);
        break;
      }
      uploaded.push(result.url);
    }

    if (uploaded.length) {
      setImages((prev) => [...prev, ...uploaded]);
    }
    setUploading(false);
  }

  async function handleRemove(url: string) {
    setError(null);
    setRemovingUrl(url);

    const result = await deleteProductImageAction(
      (() => {
        const formData = new FormData();
        formData.set("url", url);
        return formData;
      })(),
    );

    if (!result.ok) {
      setError(result.error);
      setRemovingUrl(null);
      return;
    }

    setImages((prev) => prev.filter((item) => item !== url));
    setRemovingUrl(null);
  }

  return (
    <div>
      <Label>Product images</Label>
      <p className="mt-1 text-xs text-slate-500">
        JPEG, PNG, or WebP up to 5 MB. The first image is the listing thumbnail.
      </p>

      <input
        type="hidden"
        name="images"
        value={images.join("\n")}
        readOnly
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Add images"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <li
              key={url}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="relative aspect-square">
                <ProductImage
                  src={url}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 50vw, 200px"
                />
              </div>
              {index === 0 && (
                <span className="absolute left-2 top-2 z-10 rounded bg-slate-900/75 px-2 py-0.5 text-xs text-white">
                  Primary
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                className="absolute right-2 top-2 z-10 h-8 min-h-8 px-2 text-xs"
                disabled={removingUrl === url || uploading}
                onClick={() => handleRemove(url)}
              >
                {removingUrl === url ? "…" : "Remove"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No images yet. A placeholder will be used on the storefront until you
          add one.
        </p>
      )}
    </div>
  );
}
