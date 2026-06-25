"use client";

import { saveHeroSlideAction } from "@/app/actions/hero";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type HeroSlide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  linkUrl: string | null;
  position: number;
  isActive: boolean;
};

export function HeroSlideForm({ slide }: { slide?: HeroSlide }) {
  return (
    <ActionForm
      action={saveHeroSlideAction}
      successMessage={slide ? "Slide updated." : "Slide added."}
      encType="multipart/form-data"
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-700 dark:bg-slate-900"
    >
      {slide && <input type="hidden" name="id" value={slide.id} />}
      <h2 className="text-lg font-bold dark:text-white">
        {slide ? "Edit Slide" : "Add Home Slide"}
      </h2>
      <div>
        <Label htmlFor={`hero-title-${slide?.id ?? "new"}`}>Title</Label>
        <Input
          id={`hero-title-${slide?.id ?? "new"}`}
          name="title"
          defaultValue={slide?.title ?? ""}
        />
      </div>
      <div>
        <Label htmlFor={`hero-subtitle-${slide?.id ?? "new"}`}>Subtitle</Label>
        <Input
          id={`hero-subtitle-${slide?.id ?? "new"}`}
          name="subtitle"
          defaultValue={slide?.subtitle ?? ""}
        />
      </div>
      <div>
        <Label htmlFor={`hero-link-${slide?.id ?? "new"}`}>Link URL (optional)</Label>
        <Input
          id={`hero-link-${slide?.id ?? "new"}`}
          name="linkUrl"
          placeholder="/products/example or https://..."
          defaultValue={slide?.linkUrl ?? ""}
        />
      </div>
      <div>
        <Label htmlFor={`hero-image-${slide?.id ?? "new"}`}>
          Image {slide ? "(upload to replace)" : "*"}
        </Label>
        <Input
          id={`hero-image-${slide?.id ?? "new"}`}
          name="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={!slide}
        />
        {slide?.image && (
          <p className="mt-1 text-xs text-slate-500">Current: {slide.image}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`hero-position-${slide?.id ?? "new"}`}>Position</Label>
          <Input
            id={`hero-position-${slide?.id ?? "new"}`}
            name="position"
            type="number"
            defaultValue={slide?.position ?? 0}
          />
        </div>
        <label className="flex items-center gap-2 self-end text-sm dark:text-slate-200">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={slide?.isActive ?? true}
            className="rounded"
          />
          Active
        </label>
      </div>
      <Button type="submit">{slide ? "Save changes" : "Add slide"}</Button>
    </ActionForm>
  );
}
