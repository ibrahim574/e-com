"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerAvatarAction } from "@/app/actions/customer";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

export function AvatarUploader({
  avatarUrl,
  name,
  email,
}: {
  avatarUrl: string | null;
  name: string | null;
  email: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      const result = await updateCustomerAvatarAction(formData);
      if (result?.error) {
        showToast(result.error, "error");
        setPreview(null);
        return;
      }
      showToast("Profile photo updated.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Avatar
        src={preview ?? avatarUrl}
        name={name}
        email={email}
        size={72}
        className="h-[72px] w-[72px] border border-slate-200 dark:border-slate-700"
      />
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Profile photo
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          JPEG, PNG, or WebP. Up to 2 MB.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
        </Button>
      </div>
    </div>
  );
}
