import { prisma } from "./prisma";

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export async function isLoginLocked(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const failures = await prisma.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      ip,
      success: false,
      createdAt: { gte: since },
    },
  });
  return failures >= MAX_FAILED_ATTEMPTS;
}

export async function recordLoginAttempt(
  email: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { email: email.toLowerCase(), ip, success },
  });
}

export { MAX_FAILED_ATTEMPTS, LOCKOUT_WINDOW_MS };
