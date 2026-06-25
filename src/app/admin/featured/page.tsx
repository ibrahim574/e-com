import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { FeaturedItemForm } from "@/components/admin/featured-item-form";
import { deleteFeaturedItemAction } from "@/app/actions/featured";
import { ActionForm } from "@/components/ui/action-form";
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
        <h1 className="text-3xl font-bold dark:text-white">Featured Items</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage highlights on the{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            homepage
          </Link>{" "}
          and{" "}
          <Link href="/featured" className="text-blue-600 hover:underline">
            /featured
          </Link>{" "}
          page.
        </p>
      </div>

      <FeaturedItemForm />

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="space-y-4">
            <div className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              {item.image && (
                <div className="relative h-24 w-32 overflow-hidden rounded-lg bg-slate-50">
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
              <ActionForm action={deleteFeaturedItemAction} successMessage="Featured item deleted.">
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
  );
}
