"use server";

import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { revalidatePath } from "next/cache";

type ActionResult = { message?: string; error?: string };

function parse(formData: FormData):
  | { error: string }
  | { data: { label: string; source: string; key: string; position: number; enabled: boolean } } {
  const label = String(formData.get("label") ?? "").trim();
  const source = String(formData.get("source") ?? "spec").trim();
  const key = String(formData.get("key") ?? "").trim();
  const position = Math.round(Number(formData.get("position") ?? 0));
  const enabled = formData.get("enabled") !== "off";

  if (!label) return { error: "Label is required." };
  if (source !== "field" && source !== "spec") {
    return { error: "Source must be a field or specification." };
  }
  if (!key) return { error: "Key is required." };

  return {
    data: { label, source, key, position: Number.isFinite(position) ? position : 0, enabled },
  };
}

export async function createComparisonAttributeAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const created = await prisma.comparisonAttribute.create({ data: parsed.data });

  await recordAudit({
    actor,
    action: "CREATE",
    entityType: "ComparisonAttribute",
    entityId: created.id,
    summary: `Created comparison attribute ${created.label}`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath("/admin/compare");
  return { message: "Attribute added." };
}

export async function updateComparisonAttributeAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.comparisonAttribute.findUnique({ where: { id } });
  if (!existing) return { error: "Attribute not found." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.comparisonAttribute.update({ where: { id }, data: parsed.data });

  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "ComparisonAttribute",
    entityId: id,
    summary: `Updated comparison attribute ${parsed.data.label}`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath("/admin/compare");
  return { message: "Attribute updated." };
}

export async function toggleComparisonAttributeAction(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const updated = await prisma.comparisonAttribute.update({
    where: { id },
    data: { enabled },
  });
  await recordAudit({
    actor,
    action: "UPDATE",
    entityType: "ComparisonAttribute",
    entityId: id,
    summary: `${enabled ? "Enabled" : "Disabled"} attribute ${updated.label}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/compare");
  return { message: enabled ? "Attribute enabled." : "Attribute disabled." };
}

export async function deleteComparisonAttributeAction(
  id: string,
): Promise<ActionResult> {
  const actor = await getActorOrThrow();
  const existing = await prisma.comparisonAttribute.findUnique({ where: { id } });
  if (!existing) return { error: "Attribute not found." };
  await prisma.comparisonAttribute.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "DELETE",
    entityType: "ComparisonAttribute",
    entityId: id,
    summary: `Deleted comparison attribute ${existing.label}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/compare");
  return { message: "Attribute deleted." };
}
