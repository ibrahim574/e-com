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
  | "LOGIN";

export type AuditEntityType =
  | "Product"
  | "ProductVariant"
  | "ProductOption"
  | "Category"
  | "Industry"
  | "Order"
  | "User"
  | "SiteSettings";

export type RecordAuditInput = {
  actor: AuditActor;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

/** Write an audit log entry. Fire-and-forget safe: errors are logged but never
 * thrown — auditing failures must not break user-visible flows. */
export async function recordAudit({
  actor,
  action,
  entityType,
  entityId,
  summary,
  metadata,
}: RecordAuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action,
        entityType,
        entityId: entityId ?? null,
        summary,
        metadata: metadata ?? Prisma.JsonNull,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to record audit log:", err);
  }
}
