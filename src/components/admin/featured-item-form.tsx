"use client";

import { saveFeaturedItemAction } from "@/app/actions/featured";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type FeaturedItem = {
  id: string;
  title: string;
  image: string | null;
  videoUrl: string | null;
  altText: string | null;
  position: number;
  isActive: boolean;
};

export function FeaturedItemForm({ item }: { item?: FeaturedItem }) {
  return (
    <form
      action={saveFeaturedItemAction}
      encType="multipart/form-data"
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <h2 className="text-lg font-bold">{item ? "Edit Featured Item" : "Add Featured Item"}</h2>
      <div>
        <Label htmlFor={`title-${item?.id ?? "new"}`}>Title *</Label>
        <Input id={`title-${item?.id ?? "new"}`} name="title" required defaultValue={item?.title ?? ""} />
      </div>
      <div>
        <Label htmlFor={`imageFile-${item?.id ?? "new"}`}>Image Upload</Label>
        <Input id={`imageFile-${item?.id ?? "new"}`} name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" />
        {item?.image && <p className="mt-1 text-xs text-slate-500">Current: {item.image}</p>}
      </div>
      <div>
        <Label htmlFor={`videoUrl-${item?.id ?? "new"}`}>Video URL (YouTube / Vimeo)</Label>
        <Input
          id={`videoUrl-${item?.id ?? "new"}`}
          name="videoUrl"
          placeholder="https://youtube.com/watch?v=..."
          defaultValue={item?.videoUrl ?? ""}
        />
      </div>
      <div>
        <Label htmlFor={`altText-${item?.id ?? "new"}`}>Alt Text</Label>
        <Input id={`altText-${item?.id ?? "new"}`} name="altText" defaultValue={item?.altText ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`position-${item?.id ?? "new"}`}>Position</Label>
          <Input
            id={`position-${item?.id ?? "new"}`}
            name="position"
            type="number"
            defaultValue={item?.position ?? 0}
          />
        </div>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="isActive" defaultChecked={item?.isActive ?? true} className="rounded" />
          Active
        </label>
      </div>
      <Button type="submit">{item ? "Save changes" : "Add Item"}</Button>
    </form>
  );
}
