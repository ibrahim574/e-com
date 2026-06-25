import path from "path";
import { prisma } from "@/lib/prisma";
import { INVOICES_DIR } from "@/lib/storage-paths";
import { getInvoiceSettings } from "./invoice-settings";
import { generateInvoicePdf } from "./generate-invoice-pdf";
import { sendEmailWithAttachment } from "@/lib/email";
import { getSiteSettings } from "@/lib/site-settings";
import { invoiceEmail } from "@/lib/email-templates";
import { EMAIL_BRAND_NAME } from "@/lib/constants";

export async function createOrRegenerateInvoice(
  orderId: string,
  regenerate = false,
): Promise<{ invoiceId: string; invoiceNumber: string } | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (!order || order.status !== "PAID") return null;

  const existing = await prisma.invoice.findFirst({
    where: { orderId },
    orderBy: { version: "desc" },
  });

  if (existing && !regenerate) {
    return { invoiceId: existing.id, invoiceNumber: existing.invoiceNumber };
  }

  const settings = await getInvoiceSettings();
  const siteSettings = await getSiteSettings();

  const result = await prisma.$transaction(async (tx) => {
    const invSettings = await tx.invoiceSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!invSettings) throw new Error("Invoice settings missing");

    const invoiceNumber = `${invSettings.invoicePrefix}${invSettings.nextInvoiceNumber}`;
    await tx.invoiceSettings.update({
      where: { id: "singleton" },
      data: { nextInvoiceNumber: invSettings.nextInvoiceNumber + 1 },
    });

    const version = existing ? existing.version + 1 : 1;
    const archivedPaths = existing
      ? [
          ...((existing.archivedPaths as string[] | null) ?? []),
          existing.pdfPath,
        ]
      : undefined;

    const pdfPath = path.join(
      INVOICES_DIR,
      `${invoiceNumber}-v${version}.pdf`,
    );

    const invoice = await tx.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        pdfPath,
        version,
        archivedPaths: archivedPaths ?? undefined,
      },
    });

    return { invoice, invoiceNumber, pdfPath };
  });

  await generateInvoicePdf(order, settings, result.invoiceNumber, result.pdfPath);

  const customerEmail = order.user?.email ?? order.guestEmail;
  if (customerEmail && !regenerate) {
    const { html, text } = invoiceEmail({
      customerName: order.shippingName,
      orderNumber: order.orderNumber,
      invoiceNumber: result.invoiceNumber,
      companyName: EMAIL_BRAND_NAME,
    });
    try {
      await sendEmailWithAttachment({
        to: customerEmail,
        subject: `Invoice ${result.invoiceNumber} — ${EMAIL_BRAND_NAME}`,
        html,
        text,
        attachmentPath: result.pdfPath,
        attachmentName: `${result.invoiceNumber}.pdf`,
      });
    } catch (err) {
      console.error("[invoice] Failed to email invoice:", err);
    }
  }

  return { invoiceId: result.invoice.id, invoiceNumber: result.invoiceNumber };
}

export async function emailInvoiceToCustomer(invoiceId: string): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: { include: { user: true } } },
  });
  if (!invoice) return false;

  const email = invoice.order.user?.email ?? invoice.order.guestEmail;
  if (!email) return false;

  const { html, text } = invoiceEmail({
    customerName: invoice.order.shippingName,
    orderNumber: invoice.order.orderNumber,
    invoiceNumber: invoice.invoiceNumber,
    companyName: EMAIL_BRAND_NAME,
  });

  await sendEmailWithAttachment({
    to: email,
    subject: `Invoice ${invoice.invoiceNumber} — ${EMAIL_BRAND_NAME}`,
    html,
    text,
    attachmentPath: invoice.pdfPath,
    attachmentName: `${invoice.invoiceNumber}.pdf`,
  });
  return true;
}
