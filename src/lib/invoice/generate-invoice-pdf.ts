import fs from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import type { Order, OrderItem } from "@prisma/client";
import type { InvoiceSettingsData } from "./invoice-settings";

type OrderWithItems = Order & { items: OrderItem[] };

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export async function generateInvoicePdf(
  order: OrderWithItems,
  settings: InvoiceSettingsData,
  invoiceNumber: string,
  outputPath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  const stream = (await import("fs")).createWriteStream(outputPath);
  doc.pipe(stream);

  if (settings.logoPath) {
    try {
      doc.image(settings.logoPath, 50, 45, { width: 80 });
    } catch {
      // logo missing
    }
  }

  doc
    .fontSize(18)
    .text(settings.companyName, settings.logoPath ? 150 : 50, 50);
  doc.fontSize(9).fillColor("#475569");
  settings.companyAddress.split("\n").forEach((line, i) => {
    doc.text(line, settings.logoPath ? 150 : 50, 72 + i * 12);
  });
  if (settings.phone) doc.text(`Phone: ${settings.phone}`, settings.logoPath ? 150 : 50, 110);
  if (settings.email) doc.text(`Email: ${settings.email}`, settings.logoPath ? 150 : 50, 122);
  if (settings.taxNumber) doc.text(settings.taxNumber, settings.logoPath ? 150 : 50, 134);

  doc.fillColor("#0f172a").fontSize(22).text("INVOICE", 400, 50, { align: "right" });
  doc.fontSize(10).fillColor("#475569");
  doc.text(`Invoice #: ${invoiceNumber}`, 400, 80, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 94, {
    align: "right",
  });
  doc.text(`Order #: ${order.orderNumber}`, 400, 108, { align: "right" });

  doc.fillColor("#0f172a").fontSize(11).text("Bill To", 50, 170);
  doc.fontSize(10).fillColor("#334155");
  doc.text(order.shippingName, 50, 188);
  doc.text(order.shippingLine1, 50, 202);
  if (order.shippingLine2) doc.text(order.shippingLine2, 50, 216);
  doc.text(
    `${order.shippingCity}, ${order.shippingState} ${order.shippingPostal}`,
    50,
    order.shippingLine2 ? 230 : 216,
  );
  doc.text(order.shippingCountry, 50, order.shippingLine2 ? 244 : 230);
  if (order.guestEmail) doc.text(order.guestEmail, 50, order.shippingLine2 ? 258 : 244);

  const tableTop = order.shippingLine2 ? 290 : 275;
  doc.fillColor("#1e293b").fontSize(9);
  doc.text("Product", 50, tableTop);
  doc.text("Qty", 320, tableTop);
  doc.text("Unit Price", 370, tableTop);
  doc.text("Total", 470, tableTop);
  doc
    .moveTo(50, tableTop + 14)
    .lineTo(550, tableTop + 14)
    .strokeColor("#e2e8f0")
    .stroke();

  let y = tableTop + 24;
  for (const item of order.items) {
    const name = item.variantLabel
      ? `${item.productName} (${item.variantLabel})`
      : item.productName;
    doc.fillColor("#334155").text(name.slice(0, 45), 50, y, { width: 260 });
    doc.text(String(item.quantity), 320, y);
    doc.text(formatMoney(item.unitPriceCents, order.currency), 370, y);
    doc.text(formatMoney(item.unitPriceCents * item.quantity, order.currency), 470, y);
    y += 20;
  }

  y += 10;
  const totalsX = 370;
  doc.fillColor("#475569");
  doc.text("Subtotal:", totalsX, y);
  doc.text(formatMoney(order.subtotalCents, order.currency), 470, y, { align: "right" });
  y += 16;

  if (order.adjustmentCents !== 0) {
    doc.text("Discount:", totalsX, y);
    doc.text(formatMoney(order.adjustmentCents, order.currency), 470, y, {
      align: "right",
    });
    y += 16;
  }

  doc.text("Shipping:", totalsX, y);
  doc.text(formatMoney(order.shippingCents, order.currency), 470, y, { align: "right" });
  y += 16;

  const taxLabel = order.taxLabel ?? "Tax";
  doc.text(`${taxLabel}:`, totalsX, y);
  doc.text(formatMoney(order.taxCents, order.currency), 470, y, { align: "right" });
  y += 20;

  doc.fillColor("#0f172a").fontSize(11).text("Grand Total:", totalsX, y);
  doc.text(formatMoney(order.totalCents, order.currency), 470, y, { align: "right" });
  y += 30;

  doc.fontSize(9).fillColor("#475569");
  doc.text(`Payment Method: PayPal`, 50, y);
  if (order.paypalCaptureId) {
    doc.text(`Transaction ID: ${order.paypalCaptureId}`, 50, y + 14);
  }

  doc.fontSize(9).fillColor("#64748b");
  const footerY = 700;
  doc.text(settings.footerMessage, 50, footerY, { width: 500, align: "center" });
  doc.text(settings.returnPolicy, 50, footerY + 30, { width: 500, align: "center" });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
