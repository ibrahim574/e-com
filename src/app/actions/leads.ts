"use server";

import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";

export async function exportLeadsCsvAction(type?: string) {
  const actor = await getActorOrThrow();

  const where =
    type && type !== "ALL"
      ? { type: type as "QUOTE" | "PREORDER" | "STAY_CONNECTED" }
      : undefined;

  const rows = await prisma.quoteSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "id",
    "type",
    "name",
    "email",
    "phone",
    "productInterest",
    "quantity",
    "notes",
    "createdAt",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.type,
        csvEscape(r.name),
        csvEscape(r.email),
        csvEscape(r.phone ?? ""),
        csvEscape(r.productInterest ?? ""),
        csvEscape(r.quantity ?? ""),
        csvEscape(r.notes ?? ""),
        r.createdAt.toISOString(),
      ].join(","),
    ),
  ];

  return {
    csv: lines.join("\n"),
    filename: `leads-${type ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`,
    actorEmail: actor.email,
  };
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
