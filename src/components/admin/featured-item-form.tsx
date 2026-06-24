"use client";

import { saveFeaturedItemAction } from "@/app/actions/featured";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function FeaturedItemForm() {
  return (
    <form
      action={saveFeaturedItemAction}
      encType="multipart/form-data"
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
    >
      <h2 className="text-lg font-bold">Add Featured Item</h2>
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="imageFile">Image Upload</Label>
        <Input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <div>
        <Label htmlFor="videoUrl">Video URL (YouTube / Vimeo)</Label>
        <Input id="videoUrl" name="videoUrl" placeholder="https://youtube.com/watch?v=..." />
      </div>
      <div>
        <Label htmlFor="altText">Alt Text</Label>
        <Input id="altText" name="altText" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="position">Position</Label>
          <Input id="position" name="position" type="number" defaultValue={0} />
        </div>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="isActive" defaultChecked className="rounded" />
          Active
        </label>
      </div>
      <Button type="submit">Add Item</Button>
    </form>
  );
}
