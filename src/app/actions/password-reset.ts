"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { validatePassword } from "@/lib/password-policy";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/password-reset";
import { emailLayout } from "@/lib/email-templates";
import { escapeHtml } from "@/lib/sanitize";
import { EMAIL_BRAND_NAME } from "@/lib/constants";

function resetEmailHtml(resetUrl: string, companyName: string) {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Reset your password</h2>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
      Click the button below to reset your password. This link expires in 1 hour and can only be used once.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
    </p>
    <p style="margin:0;color:#94a3b8;font-size:12px;">If you did not request this, you can ignore this email.</p>`;
  return emailLayout({ companyName, bodyHtml });
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const isAdmin = formData.get("admin") === "true";
  const basePath = isAdmin ? "/admin/reset-password" : "/account/reset-password";

  if (!email) {
    return { error: "Email is required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  if (isAdmin && user.role === "CUSTOMER") {
    return { success: true };
  }

  if (!isAdmin && user.role !== "CUSTOMER") {
    return { success: true };
  }

  const token = await createPasswordResetToken(user.id);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${origin}${basePath}?token=${token}`;

  const html = resetEmailHtml(resetUrl, EMAIL_BRAND_NAME);
  const text = `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`;

  try {
    await sendEmail({
      to: email,
      subject: `Reset your ${EMAIL_BRAND_NAME} password`,
      html,
      text,
    });
  } catch {
    return { error: "Could not send reset email. Please try again later." };
  }

  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Invalid reset link." };
  }

  const validation = validatePassword(password);
  if (!validation.valid) {
    return { error: validation.errors[0] };
  }

  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const user = await consumePasswordResetToken(token);
  if (!user) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true };
}
