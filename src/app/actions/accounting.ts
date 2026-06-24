"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActorOrThrow } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { sanitizeText } from "@/lib/sanitize";
import { cacheInvalidate, cacheInvalidatePrefix } from "@/lib/cache";
import { createOrRegenerateInvoice } from "@/lib/invoice/invoice-service";
import { sendEmail } from "@/lib/email";
import { refundEmail } from "@/lib/email-templates";
import { getSiteSettings } from "@/lib/site-settings";
import { formatPrice } from "@/lib/utils";
import { generateReport, getReportPreview } from "@/lib/reports/generate";
import type { ReportFormat, ReportType } from "@/lib/reports/generate";
import { EXPENSES_DIR, INVOICE_LOGOS_DIR } from "@/lib/storage-paths";
import type { ExpensePaymentStatus, RefundType } from "@prisma/client";

function parseDateRange(formData: FormData) {
  const fromStr = String(formData.get("from") ?? "");
  const toStr = String(formData.get("to") ?? "");
  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), 0, 1);
  const to = toStr ? new Date(toStr) : new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

// --- Tax Rules ---

export async function createTaxRuleAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const ip = await getRequestIp();
  const country = sanitizeText(String(formData.get("country") ?? ""), 2).toUpperCase();
  const province = sanitizeText(String(formData.get("province") ?? ""), 10) || null;
  const label = sanitizeText(String(formData.get("label") ?? "HST"), 50);
  const rate = Number(formData.get("rate") ?? 0);
  const isDefault = formData.get("isDefault") === "on";

  if (!country || Number.isNaN(rate)) return;

  if (isDefault) {
    await prisma.taxRule.updateMany({ data: { isDefault: false } });
  }

  const rule = await prisma.taxRule.create({
    data: { country, province, label, rate, isDefault, isEnabled: true },
  });

  await recordAudit({
    actor,
    action: "TAX",
    entityType: "TaxRule",
    entityId: rule.id,
    summary: `Created tax rule ${label} ${rate}% for ${country}`,
    ipAddress: ip,
    newValue: { country, province, label, rate },
  });

  cacheInvalidatePrefix("site-settings");
  revalidatePath("/admin/settings");
}

export async function deleteTaxRuleAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const before = await prisma.taxRule.findUnique({ where: { id } });
  await prisma.taxRule.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "TAX",
    entityType: "TaxRule",
    entityId: id,
    summary: "Deleted tax rule",
    previousValue: before ?? undefined,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/settings");
}

export async function toggleTaxRuleAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const rule = await prisma.taxRule.findUnique({ where: { id } });
  if (!rule) return;
  await prisma.taxRule.update({
    where: { id },
    data: { isEnabled: !rule.isEnabled },
  });
  await recordAudit({
    actor,
    action: "TAX",
    entityType: "TaxRule",
    entityId: id,
    summary: `Tax rule ${rule.isEnabled ? "disabled" : "enabled"}`,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/settings");
}

// --- Shipping Regions ---

export async function updateShippingRegionAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const freeShippingEnabled = formData.get("freeShippingEnabled") === "on";
  const thresholdCents = Math.round(Number(formData.get("thresholdDollars") ?? 0) * 100);
  const flatRateCents = Math.round(Number(formData.get("flatRateDollars") ?? 0) * 100);
  const displayMessage = sanitizeText(String(formData.get("displayMessage") ?? ""), 300) || null;

  await prisma.shippingRegion.update({
    where: { id },
    data: { freeShippingEnabled, thresholdCents, flatRateCents, displayMessage },
  });

  await recordAudit({
    actor,
    action: "SETTING",
    entityType: "SiteSettings",
    summary: `Updated shipping region ${id}`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath("/admin/settings");
  revalidatePath("/shipping");
}

// --- Invoice Settings ---

export async function updateInvoiceSettingsAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const before = await prisma.invoiceSettings.findUnique({
    where: { id: "singleton" },
  });

  const data = {
    companyName: sanitizeText(String(formData.get("companyName") ?? ""), 200),
    companyAddress: sanitizeText(String(formData.get("companyAddress") ?? ""), 1000),
    taxNumber: sanitizeText(String(formData.get("taxNumber") ?? ""), 100) || null,
    phone: sanitizeText(String(formData.get("phone") ?? ""), 50) || null,
    email: sanitizeText(String(formData.get("email") ?? ""), 200) || null,
    footerMessage: sanitizeText(String(formData.get("footerMessage") ?? ""), 500),
    returnPolicy: sanitizeText(String(formData.get("returnPolicy") ?? ""), 500),
    invoicePrefix: sanitizeText(String(formData.get("invoicePrefix") ?? "INV-"), 20),
    nextInvoiceNumber: Math.max(1, Number(formData.get("nextInvoiceNumber") ?? 1001)),
  };

  await prisma.invoiceSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    await fs.mkdir(INVOICE_LOGOS_DIR, { recursive: true });
    const ext = path.extname(logo.name) || ".png";
    const logoPath = path.join(INVOICE_LOGOS_DIR, `logo${ext}`);
    const buf = Buffer.from(await logo.arrayBuffer());
    await fs.writeFile(logoPath, buf);
    await prisma.invoiceSettings.update({
      where: { id: "singleton" },
      data: { logoPath },
    });
  }

  await recordAudit({
    actor,
    action: "SETTING",
    entityType: "Invoice",
    entityId: "singleton",
    summary: "Invoice settings updated",
    ipAddress: await getRequestIp(),
    previousValue: before ?? undefined,
    newValue: data,
  });

  revalidatePath("/admin/settings");
}

export async function regenerateInvoiceAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const orderId = String(formData.get("orderId") ?? "");
  const result = await createOrRegenerateInvoice(orderId, true);
  if (!result) return { error: "Cannot generate invoice for this order." };

  await recordAudit({
    actor,
    action: "INVOICE",
    entityType: "Invoice",
    entityId: result.invoiceId,
    summary: `Regenerated invoice ${result.invoiceNumber}`,
    ipAddress: await getRequestIp(),
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, invoiceNumber: result.invoiceNumber };
}

// --- Expenses ---

export async function createExpenseAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const expenseDate = new Date(String(formData.get("expenseDate") ?? ""));
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = sanitizeText(String(formData.get("description") ?? ""), 2000);
  const amountCents = Math.round(Number(formData.get("amountDollars") ?? 0) * 100);
  const paymentStatus = String(
    formData.get("paymentStatus") ?? "PAID",
  ) as ExpensePaymentStatus;

  if (!categoryId || !description || amountCents <= 0) {
    return;
  }

  let attachmentPath: string | null = null;
  const file = formData.get("attachment") as File | null;
  if (file && file.size > 0) {
    await fs.mkdir(EXPENSES_DIR, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    attachmentPath = path.join(EXPENSES_DIR, safeName);
    await fs.writeFile(attachmentPath, Buffer.from(await file.arrayBuffer()));
  }

  const expense = await prisma.expense.create({
    data: {
      expenseDate,
      categoryId,
      description,
      amountCents,
      paymentStatus,
      attachmentPath,
      createdById: actor.id,
    },
    include: { category: true },
  });

  await recordAudit({
    actor,
    action: "EXPENSE",
    entityType: "Expense",
    entityId: expense.id,
    summary: `New expense: ${expense.category.name} - $${(amountCents / 100).toFixed(2)}`,
    ipAddress: await getRequestIp(),
    newValue: { description, amountCents, category: expense.category.name },
  });

  revalidatePath("/admin/accounting/expenses");
}

export async function deleteExpenseAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const id = String(formData.get("id") ?? "");
  const before = await prisma.expense.findUnique({ where: { id } });
  await prisma.expense.delete({ where: { id } });
  await recordAudit({
    actor,
    action: "EXPENSE",
    entityType: "Expense",
    entityId: id,
    summary: "Deleted expense",
    previousValue: before ?? undefined,
    ipAddress: await getRequestIp(),
  });
  revalidatePath("/admin/accounting/expenses");
}

export async function createExpenseCategoryAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const name = sanitizeText(String(formData.get("name") ?? ""), 100);
  if (!name) return;
  try {
    await prisma.expenseCategory.create({ data: { name } });
    await recordAudit({
      actor,
      action: "CREATE",
      entityType: "Expense",
      summary: `Created expense category: ${name}`,
      ipAddress: await getRequestIp(),
    });
    revalidatePath("/admin/accounting/expenses");
  } catch {
    // duplicate
  }
}

// --- Refunds ---

export async function issueRefundAction(formData: FormData) {
  const actor = await getActorOrThrow();
  const orderId = String(formData.get("orderId") ?? "");
  const type = String(formData.get("type") ?? "FULL") as RefundType;
  const amountDollars = Number(formData.get("amountDollars") ?? 0);
  const reason = sanitizeText(String(formData.get("reason") ?? ""), 1000) || null;
  const transactionReference =
    sanitizeText(String(formData.get("transactionReference") ?? ""), 200) || null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order) return { error: "Order not found." };

  const amountCents =
    type === "FULL"
      ? order.totalCents
      : Math.round(amountDollars * 100);

  if (amountCents <= 0 || amountCents > order.totalCents) {
    return { error: "Invalid refund amount." };
  }

  const refund = await prisma.refund.create({
    data: {
      orderId,
      customerName: order.shippingName,
      amountCents,
      type,
      reason,
      transactionReference,
      processedById: actor.id,
      status: "PROCESSED",
    },
  });

  if (type === "FULL") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED" },
    });
    await prisma.paymentRecord.updateMany({
      where: { orderId },
      data: { status: "REFUNDED" },
    });
  }

  const customerEmail = order.user?.email ?? order.guestEmail;
  if (customerEmail) {
    const settings = await getSiteSettings();
    const { html, text } = refundEmail({
      customerName: order.shippingName,
      orderNumber: order.orderNumber,
      refundAmount: formatPrice(amountCents, order.currency),
      companyName: settings.companyName,
    });
    await sendEmail({
      to: customerEmail,
      subject: `Your refund has been processed — ${settings.companyName}`,
      html,
      text,
    });
  }

  await recordAudit({
    actor,
    action: "REFUND",
    entityType: "Refund",
    entityId: refund.id,
    summary: `$${(amountCents / 100).toFixed(2)} ${type.toLowerCase()} refund on ${order.orderNumber}`,
    ipAddress: await getRequestIp(),
    newValue: { amountCents, type, reason },
  });

  cacheInvalidatePrefix("financial-kpis");
  revalidatePath("/admin/accounting/refunds");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { success: true };
}

// --- Reports ---

export async function previewReportAction(formData: FormData) {
  await getActorOrThrow();
  const type = String(formData.get("type") ?? "sales") as ReportType;
  const range = parseDateRange(formData);
  return getReportPreview(type, range);
}

export async function downloadReportAction(formData: FormData) {
  await getActorOrThrow();
  const type = String(formData.get("type") ?? "sales") as ReportType;
  const format = String(formData.get("format") ?? "csv") as ReportFormat;
  const range = parseDateRange(formData);
  return generateReport(type, range, format);
}

export async function exportLedgerAction(formData: FormData) {
  await getActorOrThrow();
  const format = String(formData.get("format") ?? "csv") as ReportFormat;
  const range = parseDateRange(formData);
  return generateReport("sales", range, format);
}

export async function exportAuditLogAction() {
  await getActorOrThrow();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const headers = [
    "Timestamp",
    "User",
    "Action",
    "Entity",
    "Entity ID",
    "Summary",
    "IP",
  ];
  const rows = logs.map((l) => ({
    Timestamp: l.createdAt.toISOString(),
    User: l.actorEmail,
    Action: l.action,
    Entity: l.entityType,
    "Entity ID": l.entityId ?? "",
    Summary: l.summary,
    IP: l.ipAddress ?? "",
  }));
  const escape = (v: string) =>
    v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v;
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => escape(String(r[h as keyof typeof r] ?? ""))).join(","),
    ),
  ].join("\n");
  return {
    buffer: Buffer.from(csv, "utf-8"),
    filename: `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
    contentType: "text/csv",
  };
}
