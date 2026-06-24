import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { parseVideoEmbedUrl } from "@/lib/email-templates";
import { cacheGet, cacheSet } from "@/lib/cache";

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
      <p className="mt-2 text-slate-600">
        Highlights from our product lineup and industry solutions.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-slate-500">No featured items yet.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const embed = item.videoUrl ? parseVideoEmbedUrl(item.videoUrl) : null;
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-video bg-slate-100">
                  {embed ? (
                    <iframe
                      src={embed}
                      title={item.title}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : item.image ? (
                    <Image
                      src={item.image}
                      alt={item.altText ?? item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      No media
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-bold text-slate-900">{item.title}</h2>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
