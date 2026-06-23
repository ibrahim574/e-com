"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";

export async function updateSiteSettingsAction(formData: FormData) {
  const actor = await getActorOrThrow();

  const dualCurrencyEnabled = formData.get("dualCurrencyEnabled") === "on";

  const before = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
    select: { dualCurrencyEnabled: true },
  });

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { dualCurrencyEnabled },
    create: { id: "singleton", dualCurrencyEnabled },
  });

  if (before?.dualCurrencyEnabled !== dualCurrencyEnabled) {
    await recordAudit({
      actor,
      action: "SETTING",
      entityType: "SiteSettings",
      entityId: "singleton",
      summary: `Dual currency ${dualCurrencyEnabled ? "enabled" : "disabled"}`,
      metadata: { dualCurrencyEnabled, previous: before?.dualCurrencyEnabled ?? null },
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
