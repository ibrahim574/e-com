import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export function isAdminRole(
  role: string | undefined | null,
): role is AdminRole {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdminRole(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN";
}

/** For server components / route handlers: require ADMIN or SUPER_ADMIN, else redirect. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin/login");
  }
  return session;
}

/** Stronger guard: SUPER_ADMIN only. */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || !isSuperAdminRole(session.user.role)) {
    redirect("/admin/login");
  }
  return session;
}

/** For server actions: re-fetch the user from the database before any mutation
 * so a stale JWT can't keep elevated privileges after a role change. */
export async function getActorOrThrow() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!user || !isAdminRole(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}

/** Re-fetch and require SUPER_ADMIN. */
export async function getSuperActorOrThrow() {
  const actor = await getActorOrThrow();
  if (!isSuperAdminRole(actor.role)) {
    throw new Error("Forbidden: super admin only");
  }
  return actor;
}
