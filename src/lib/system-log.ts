import { prisma } from "@/lib/prisma";
import { Prisma, type SystemLogCategory } from "@prisma/client";

export type SystemLogLevel = "info" | "warn" | "error";

export type SystemLogInput = {
  category: SystemLogCategory;
  level?: SystemLogLevel;
  message: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userId?: string | null;
};

/**
 * Writes a structured log entry. Never throws — logging must not break the
 * primary request flow.
 */
export async function writeSystemLog(input: SystemLogInput): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        category: input.category,
        level: input.level ?? "info",
        message: input.message.slice(0, 2000),
        metadata:
          input.metadata == null
            ? Prisma.JsonNull
            : (input.metadata as Prisma.InputJsonValue),
        ip: input.ip ?? null,
        userId: input.userId ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to write system log:", err);
  }
}
