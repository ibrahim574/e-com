import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/cache";

export const metadata: Metadata = {
  title: "Featured",
  description: "Featured products and highlights from our two-way radio catalog.",
  alternates: { canonical: "/featured" },
  openGraph: { type: "website", title: "Featured", url: "/featured" },
};

async function getFeaturedItems() {
  const cached = cacheGet<Awaited<ReturnType<typeof fetchItems>>>("featured-items");
  if (cached) return cached;
  const items = await fetchItems();
  cacheSet("featured-items", items);
  return items;
}

async function fetchItems() {
  return prisma.featuredItem.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
}

export default async function FeaturedPage() {
  const items = await getFeaturedItems();

  return (
    <div className="container-page py-10">
      <h1 className="section-title">Featured</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Highlights from our product lineup and industry solutions.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-slate-500">No featured items yet.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const card = (
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.altText ?? item.title}
                      fill
                      unoptimized={item.image.startsWith("/featured/uploads/")}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-bold text-slate-900 dark:text-white">{item.title}</h2>
                </div>
              </article>
            );

            return item.linkUrl ? (
              <Link key={item.id} href={item.linkUrl}>
                {card}
              </Link>
            ) : (
              <div key={item.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
