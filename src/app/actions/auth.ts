"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { sendOtpEmail } from "@/lib/email";
import { isLoginLocked, recordLoginAttempt } from "@/lib/login-lockout";
import { getRequestIp } from "@/lib/request-ip";
import { validatePassword } from "@/lib/password-policy";
import {
  compareOtp,
  generateOtp,
  hashOtp,
  MAX_OTP_ATTEMPTS,
  otpExpiry,
  resendCooldownRemaining,
} from "@/lib/otp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1 of signup: validate details, store a pending registration, email an OTP. */
export async function startRegistrationAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return { error: pwCheck.errors.join(" ") };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const existingPending = await prisma.pendingRegistration.findUnique({
    where: { email },
  });
  if (existingPending) {
    const cooldown = resendCooldownRemaining(existingPending.lastSentAt);
    if (cooldown > 0) {
      return {
        error: `Please wait ${cooldown}s before requesting another code.`,
      };
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const code = generateOtp();
  const otpHash = await hashOtp(code);

  await prisma.pendingRegistration.upsert({
    where: { email },
    create: {
      email,
      name: name || null,
      passwordHash,
      otpHash,
      expiresAt: otpExpiry(),
      attempts: 0,
      lastSentAt: new Date(),
    },
    update: {
      name: name || null,
      passwordHash,
      otpHash,
      expiresAt: otpExpiry(),
      attempts: 0,
      lastSentAt: new Date(),
    },
  });

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    console.error("Failed to send OTP email", err);
    return { error: "Could not send the verification email. Please try again." };
  }

  return { success: true, email };
}

/** Step 1 (resend): re-issue an OTP for an existing pending registration. */
export async function resendOtpAction(email: string) {
  const normalized = email.toLowerCase().trim();
  const pending = await prisma.pendingRegistration.findUnique({
    where: { email: normalized },
  });

  if (!pending) {
    return { error: "Start the signup again to receive a code." };
  }

  const cooldown = resendCooldownRemaining(pending.lastSentAt);
  if (cooldown > 0) {
    return { error: `Please wait ${cooldown}s before requesting another code.` };
  }

  const code = generateOtp();
  const otpHash = await hashOtp(code);

  await prisma.pendingRegistration.update({
    where: { email: normalized },
    data: {
      otpHash,
      expiresAt: otpExpiry(),
      attempts: 0,
      lastSentAt: new Date(),
    },
  });

  try {
    await sendOtpEmail(normalized, code);
  } catch (err) {
    console.error("Failed to resend OTP email", err);
    return { error: "Could not send the verification email. Please try again." };
  }

  return { success: true };
}

/** Step 2 of signup: verify the OTP, create the account, sign in, merge cart. */
export async function verifyOtpAction(email: string, code: string) {
  const normalized = email.toLowerCase().trim();
  const submitted = code.trim();

  const pending = await prisma.pendingRegistration.findUnique({
    where: { email: normalized },
  });

  if (!pending) {
    return { error: "Your session expired. Please start the signup again." };
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.pendingRegistration.delete({ where: { email: normalized } });
    return { error: "This code has expired. Please request a new one." };
  }

  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.pendingRegistration.delete({ where: { email: normalized } });
    return { error: "Too many attempts. Please start the signup again." };
  }

  const valid = await compareOtp(submitted, pending.otpHash);
  if (!valid) {
    await prisma.pendingRegistration.update({
      where: { email: normalized },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_OTP_ATTEMPTS - (pending.attempts + 1);
    return {
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
          : "Too many attempts. Please start the signup again.",
    };
  }

  await prisma.user.create({
    data: {
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      role: "CUSTOMER",
    },
  });

  await prisma.pendingRegistration.delete({ where: { email: normalized } });

  // Account is created; the client signs in via loginAction (it still holds
  // the password from step 1), which also merges the guest cart.
  return { success: true };
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");
  const ip = (await getRequestIp()) ?? "unknown";

  if (await isLoginLocked(email, ip)) {
    return { error: "Too many failed attempts. Please try again in 15 minutes." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    await recordLoginAttempt(email, ip, false);
    return { error: "Invalid email or password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordLoginAttempt(email, ip, false);
    return { error: "Invalid email or password." };
  }

  await recordLoginAttempt(email, ip, true);
  await mergeGuestCart(user.id);

  redirect(callbackUrl);
}

export async function newsletterAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!email) {
    return { error: "Email is required." };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  revalidatePath("/");
  return { success: true };
}
