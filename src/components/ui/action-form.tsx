"use client";

import { useToast } from "@/components/ui/toast-provider";

type ActionResult = { message?: string; error?: string } | void;

export function ActionForm({
  action,
  successMessage = "Changes saved successfully.",
  children,
  className,
  encType,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
  encType?: string;
}) {
  const { showToast } = useToast();

  async function onSubmit(formData: FormData) {
    try {
      const result = await action(formData);
      if (result?.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(result?.message ?? successMessage);
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    }
  }

  return (
    <form action={onSubmit} className={className} encType={encType}>
      {children}
    </form>
  );
}
