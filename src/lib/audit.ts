import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type AuditActor = {
  id: string;
  email: string;
};

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS"
  | "PROMOTE"
  | "DEMOTE"
  | "PASSWORD"
  | "SETTING"
  | "LOGIN"
  | "REFUND"
  | "INVOICE"
  | "TAX"
  | "EXPENSE"
  | "STOCK";

export type AuditEntityType =
  | "Product"
  | "ProductVariant"
  | "ProductOption"
  | "Category"
  | "Industry"
  | "Order"
  | "User"
  | "SiteSettings"
  | "Expense"
  | "Refund"
  | "Invoice"
  | "TaxRule"
  | "PaymentRecord"
  | "Backup";

export type RecordAuditInput = {
  actor?: AuditActor | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  previousValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
};

export async function recordAudit({
  actor,
  action,
  entityType,
  entityId,
  summary,
  metadata,
  ipAddress,
  previousValue,
  newValue,
}: RecordAuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? "system",
        action,
        entityType,
        entityId: entityId ?? null,
        summary,
        metadata: metadata ?? Prisma.JsonNull,
        ipAddress: ipAddress ?? null,
        previousValue: previousValue ?? Prisma.JsonNull,
        newValue: newValue ?? Prisma.JsonNull,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to record audit log:", err);
  }
}
