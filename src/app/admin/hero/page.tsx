import Image from "next/image";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { deleteHeroSlideAction } from "@/app/actions/hero";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  await requireAdmin();
  const slides = await prisma.heroSlide.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Home Slides</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage the image slideshow at the top of the homepage.
        </p>
      </div>

      <HeroSlideForm />

      <div className="space-y-6">
        {slides.map((slide) => (
          <div key={slide.id} className="space-y-4">
            <div className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="relative h-20 w-36 overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={slide.image}
                  alt={slide.title ?? "Slide"}
                  fill
                  unoptimized={slide.image.startsWith("/hero/uploads/")}
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold dark:text-white">{slide.title ?? "Untitled"}</p>
                {slide.subtitle && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{slide.subtitle}</p>
                )}
                <p className="text-xs text-slate-400">
                  Position {slide.position} · {slide.isActive ? "Active" : "Hidden"}
                </p>
              </div>
              <ActionForm action={deleteHeroSlideAction} successMessage="Slide deleted.">
                <input type="hidden" name="id" value={slide.id} />
                <Button type="submit" variant="ghost" className="text-red-600">
                  Delete
                </Button>
              </ActionForm>
            </div>
            <HeroSlideForm slide={slide} />
          </div>
        ))}
      </div>
    </div>
  );
}
