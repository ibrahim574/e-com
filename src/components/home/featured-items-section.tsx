import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type FeaturedItem = {
  id: string;
  title: string;
  image: string | null;
  altText: string | null;
  linkUrl: string | null;
};

export function FeaturedItemsSection({ items }: { items: FeaturedItem[] }) {
  if (!items.length) return null;

  return (
    <section className="container-page py-16 lg:py-20">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Highlights</p>
          <h2 className="section-title mt-2">Featured Items</h2>
        </div>
        <Link
          href="/featured"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
        >
          View all
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const card = (
            <article className="card-surface overflow-hidden transition hover:shadow-md">
              <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
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
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
              </div>
            </article>
          );

          return item.linkUrl ? (
            <Link key={item.id} href={item.linkUrl} className="block">
              {card}
            </Link>
          ) : (
            <div key={item.id}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}
