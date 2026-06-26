"use server";

import { prisma } from "@/lib/prisma";
import { getSuperActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { normalizeRedirectPath } from "@/lib/redirects";
import { revalidatePath } from "next/cache";

type ActionResult = { message?: string; error?: string };

const ALLOWED_STATUS = [301, 302, 307, 308];

function normalizeDestination(raw: string): string {
  const v = raw.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (!v.startsWith("/")) return `/${v}`;
  return v.replace(/\/+$/, "") || "/";
}

export async function createRedirectAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getSuperActorOrThrow();

  const source = normalizeRedirectPath(String(formData.get("source") ?? ""));
  const destination = normalizeDestination(String(formData.get("destination") ?? ""));
  const statusCode = Number(formData.get("statusCode") ?? 308);

  if (!source || source === "/") {
    return { error: "Source path is required (e.g. /old-page)." };
  }
  if (!destination) return { error: "Destination is required." };
  if (source === destination) {
    return { error: "Source and destination cannot be the same." };
  }
  if (!ALLOWED_STATUS.includes(statusCode)) {
    return { error: "Status code must be 301, 302, 307, or 308." };
  }

  const existing = await prisma.redirect.findUnique({ where: { source } });
  if (existing) {
    return { error: "A redirect for that source path already exists." };
  }

  const created = await prisma.redirect.create({
    data: { source, destination, statusCode },
  });

  await recordAudit({
    actor,
    action: "CREATE",
    entityType: "Redirect",
    entityId: created.id,
    summary: `Created redirect ${source} -> ${destination} (${statusCode})`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath("/admin/redirects");
  return { message: "Redirect created." };
}

export async function toggleRedirectAction(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  const actor = await getSuperActorOrThrow();
  const updated = await prisma.redirect.update({
    where: { id },
    data: { enabled },
  });
  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "Redirect",
    entityId: id,
    summary: `${enabled ? "Enabled" : "Disabled"} redirect ${updated.source}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/redirects");
  return { message: enabled ? "Redirect enabled." : "Redirect disabled." };
}

export async function deleteRedirectAction(id: string): Promise<ActionResult> {
  const actor = await getSuperActorOrThrow();
  const existing = await prisma.redirect.findUnique({ where: { id } });
  if (!existing) return { error: "Redirect not found." };
  await prisma.redirect.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "Redirect",
    entityId: id,
    summary: `Deleted redirect ${existing.source}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/redirects");
  return { message: "Redirect deleted." };
}
