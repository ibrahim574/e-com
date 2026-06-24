import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { FeaturedItemForm } from "@/components/admin/featured-item-form";
import { deleteFeaturedItemAction } from "@/app/actions/featured";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  await requireAdmin();
  const items = await prisma.featuredItem.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Featured Items</h1>
        <p className="mt-1 text-slate-600">
          Manage images and videos shown on the{" "}
          <Link href="/featured" className="text-blue-600 hover:underline">
            /featured
          </Link>{" "}
          page.
        </p>
      </div>

      <FeaturedItemForm />

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            {item.image && (
              <div className="relative h-24 w-32 overflow-hidden rounded-lg bg-slate-50">
                <Image src={item.image} alt={item.altText ?? item.title} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-bold">{item.title}</p>
              {item.videoUrl && (
                <p className="text-xs text-slate-500 truncate">{item.videoUrl}</p>
              )}
              <p className="text-xs text-slate-400">
                Position {item.position} · {item.isActive ? "Active" : "Hidden"}
              </p>
            </div>
            <form action={deleteFeaturedItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" variant="ghost" className="text-red-600">
                Delete
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
