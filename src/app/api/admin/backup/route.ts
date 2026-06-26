import { readFile } from "fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminRole } from "@/lib/admin-guard";
import { createBackupArchive } from "@/lib/backup";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  // Re-fetch role from DB (do not trust the JWT alone for a sensitive export).
  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true },
      })
    : null;

  if (!dbUser || !isSuperAdminRole(dbUser.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const artifact = await createBackupArchive();
    try {
      const buffer = await readFile(artifact.filePath);

      await recordAudit({
        actor: dbUser,
        action: "SETTING",
        entityType: "Backup",
        entityId: artifact.fileName,
        summary: `Downloaded full backup ${artifact.fileName}`,
        ipAddress: await getRequestIp(),
      });

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": `attachment; filename="${artifact.fileName}"`,
          "Content-Length": String(buffer.length),
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    } finally {
      await artifact.cleanup();
    }
  } catch (err) {
    console.error("Backup failed", err);
    return new Response("Backup failed. Check server logs.", { status: 500 });
  }
}
