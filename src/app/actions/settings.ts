"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow, getSuperActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto";
import { cacheInvalidate } from "@/lib/cache";
import { invalidateEmailTransporter, sendTestEmail } from "@/lib/email";
import { sanitizeText } from "@/lib/sanitize";
import {
  deleteSiteLogoFile,
  saveSiteLogoFile,
} from "@/lib/site-logo-server";

export async function updateSiteSettingsAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const section = String(formData.get("section") ?? "currency");

  const before = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });

  if (section === "currency") {
    const dualCurrencyEnabled = formData.get("dualCurrencyEnabled") === "on";
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
      });
    }
  } else if (section === "tax") {
    const taxLabel = sanitizeText(String(formData.get("taxLabel") ?? "HST"), 50);
    const taxRatePercent = Number(formData.get("taxRatePercent") ?? 13);
    if (Number.isNaN(taxRatePercent) || taxRatePercent < 0 || taxRatePercent > 100) {
      return { error: "Tax rate must be between 0 and 100." };
    }
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { taxLabel, taxRatePercent },
      create: { id: "singleton", taxLabel, taxRatePercent },
    });
    await recordAudit({
      actor,
      action: "SETTING",
      entityType: "SiteSettings",
      entityId: "singleton",
      summary: `Tax updated to ${taxLabel} ${taxRatePercent}%`,
    });
  } else if (section === "smtp") {
    const smtpHost = sanitizeText(String(formData.get("smtpHost") ?? ""), 200) || null;
    const smtpPortRaw = String(formData.get("smtpPort") ?? "").trim();
    const smtpPort = smtpPortRaw ? Number(smtpPortRaw) : null;
    const smtpSecure = formData.get("smtpSecure") === "on";
    const smtpUser = sanitizeText(String(formData.get("smtpUser") ?? ""), 200) || null;
    const smtpFrom = sanitizeText(String(formData.get("smtpFrom") ?? ""), 200) || null;
    const newPassword = String(formData.get("smtpPassword") ?? "");

    const update: Record<string, unknown> = {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpFrom,
    };

    if (newPassword.trim()) {
      update.smtpPasswordEnc = encryptSecret(newPassword);
    }

    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update,
      create: { id: "singleton", ...update },
    });
    invalidateEmailTransporter();
    await recordAudit({
      actor,
      action: "SETTING",
      entityType: "SiteSettings",
      entityId: "singleton",
      summary: "SMTP settings updated",
    });
  } else if (section === "quote") {
    const quoteRecipients = sanitizeText(
      String(formData.get("quoteRecipients") ?? ""),
      500,
    );
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { quoteRecipients },
      create: { id: "singleton", quoteRecipients },
    });
    await recordAudit({
      actor,
      action: "SETTING",
      entityType: "SiteSettings",
      entityId: "singleton",
      summary: "Quote notification recipients updated",
    });
  } else if (section === "session") {
    const sessionTimeoutMinutes = Number(formData.get("sessionTimeoutMinutes") ?? 30);
    if (Number.isNaN(sessionTimeoutMinutes) || sessionTimeoutMinutes < 5 || sessionTimeoutMinutes > 480) {
      return { error: "Session timeout must be between 5 and 480 minutes." };
    }
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { sessionTimeoutMinutes },
      create: { id: "singleton", sessionTimeoutMinutes },
    });
  } else if (section === "branding") {
    const resetLogo = formData.get("resetLogo") === "on";
    const update: Record<string, unknown> = {};

    if (resetLogo && before?.siteLogoUrl) {
      await deleteSiteLogoFile(before.siteLogoUrl);
      update.siteLogoUrl = null;
    }

    const logo = formData.get("siteLogo") as File | null;
    if (logo && logo.size > 0) {
      try {
        const siteLogoUrl = await saveSiteLogoFile(logo);
        if (before?.siteLogoUrl) {
          await deleteSiteLogoFile(before.siteLogoUrl);
        }
        update.siteLogoUrl = siteLogoUrl;
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Could not upload logo.",
        };
      }
    }

    if (!resetLogo && !(logo && logo.size > 0)) {
      return { error: "Choose a logo file to upload, or check reset to default." };
    }

    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update,
      create: { id: "singleton", ...update },
    });
    await recordAudit({
      actor,
      action: "SETTING",
      entityType: "SiteSettings",
      entityId: "singleton",
      summary: resetLogo ? "Site logo reset to default" : "Site logo updated",
    });
  } else if (section === "general") {
    const announcementText = sanitizeText(
      String(formData.get("announcementText") ?? ""),
      300,
    );
    const announcementEnabled = formData.get("announcementEnabled") === "on";
    const proudlyCanadianEnabled = formData.get("proudlyCanadianEnabled") === "on";

    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: { announcementText, announcementEnabled, proudlyCanadianEnabled },
      create: {
        id: "singleton",
        announcementText,
        announcementEnabled,
        proudlyCanadianEnabled,
      },
    });
    await recordAudit({
      actor,
      action: "SETTING",
      entityType: "SiteSettings",
      entityId: "singleton",
      summary: "Storefront display settings updated",
    });
  }

  cacheInvalidate("site-settings");
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function sendTestEmailAction(formData: FormData) {
  const actor = await getSuperActorOrThrow();
  const to = String(formData.get("testEmail") ?? actor.email).trim();
  if (!to) return { error: "Email is required." };
  try {
    await sendTestEmail(to);
    return { success: true };
  } catch {
    return { error: "Failed to send test email. Check SMTP settings." };
  }
}

export async function createSignalTypeAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const name = sanitizeText(String(formData.get("name") ?? ""), 100);
  if (!name) return;
  try {
    await prisma.signalType.create({ data: { name } });
    await recordAudit({
      actor,
      action: "CREATE",
      entityType: "SiteSettings",
      summary: `Created signal type: ${name}`,
    });
    revalidatePath("/admin/settings");
  } catch {
    // duplicate
  }
}

export async function deleteSignalTypeAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const count = await prisma.productSignalType.count({ where: { signalTypeId: id } });
  if (count > 0) return;
  await prisma.signalType.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "SiteSettings",
    entityId: id,
    summary: "Deleted signal type",
  });
  revalidatePath("/admin/settings");
}

export async function createFrequencyBandAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const name = sanitizeText(String(formData.get("name") ?? ""), 100);
  if (!name) return;
  try {
    await prisma.frequencyBand.create({ data: { name } });
    await recordAudit({
      actor,
      action: "CREATE",
      entityType: "SiteSettings",
      summary: `Created frequency band: ${name}`,
    });
    revalidatePath("/admin/settings");
  } catch {
    // duplicate
  }
}

export async function deleteFrequencyBandAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const count = await prisma.productFrequencyBand.count({ where: { frequencyBandId: id } });
  if (count > 0) return;
  await prisma.frequencyBand.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "SiteSettings",
    entityId: id,
    summary: "Deleted frequency band",
  });
  revalidatePath("/admin/settings");
}
