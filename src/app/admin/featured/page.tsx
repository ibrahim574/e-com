import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { HeroFeaturedPicker } from "@/components/admin/hero-featured-picker";
import { FeaturedItemForm } from "@/components/admin/featured-item-form";
import { deleteFeaturedItemAction } from "@/app/actions/featured";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  await requireAdmin();

  const [featuredProducts, allActiveProducts, highlightItems] = await Promise.all([
    prisma.heroFeaturedProduct.findMany({
      orderBy: { position: "asc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            status: true,
            images: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, brand: true },
    }),
    prisma.featuredItem.findMany({
      orderBy: { position: "asc" },
    }),
  ]);

  const featuredProductIds = new Set(featuredProducts.map((f) => f.productId));
  const availableProducts = allActiveProducts.filter((p) => !featuredProductIds.has(p.id));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Featured</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage the homepage hero featured product panel and optional highlight grid.
        </p>
      </div>

      <HeroFeaturedPicker featured={featuredProducts} availableProducts={availableProducts} />

      <details className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer px-6 py-4 font-semibold dark:text-white">
          Highlight grid (optional) — /featured page
        </summary>
        <div className="space-y-6 border-t border-slate-200 p-6 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manual image highlights shown in the{" "}
            <Link href="/featured" className="text-blue-600 hover:underline">
              /featured
            </Link>{" "}
            page and homepage highlights section — separate from the hero product panel above.
          </p>

          <FeaturedItemForm />

          <div className="space-y-6">
            {highlightItems.map((item) => (
              <div key={item.id} className="space-y-4">
                <div className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  {item.image && (
                    <div className="relative h-24 w-32 overflow-hidden rounded-lg bg-white">
                      <Image
                        src={item.image}
                        alt={item.altText ?? item.title}
                        fill
                        unoptimized={item.image.startsWith("/featured/uploads/")}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold dark:text-white">{item.title}</p>
                    {item.linkUrl && (
                      <p className="truncate text-xs text-slate-500">{item.linkUrl}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      Position {item.position} · {item.isActive ? "Active" : "Hidden"}
                    </p>
                  </div>
                  <ActionForm action={deleteFeaturedItemAction} successMessage="Highlight deleted.">
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="ghost" className="text-red-600">
                      Delete
                    </Button>
                  </ActionForm>
                </div>
                <FeaturedItemForm item={item} />
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
