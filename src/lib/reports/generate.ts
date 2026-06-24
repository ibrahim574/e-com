import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import type { DateRange } from "@/lib/financial-dashboard";
import { prisma } from "@/lib/prisma";
import { PAID_STATUSES } from "@/lib/order-status";

export type ReportType =
  | "sales"
  | "tax"
  | "shipping"
  | "expenses"
  | "pnl"
  | "inventory"
  | "payments";

export type ReportFormat = "pdf" | "xlsx" | "csv";

export type ReportRow = Record<string, string | number>;

async function fetchReportData(
  type: ReportType,
  range: DateRange,
): Promise<{ headers: string[]; rows: ReportRow[]; title: string }> {
  switch (type) {
    case "sales": {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          deletedAt: null,
        },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });
      return {
        title: "Sales Report",
        headers: ["Order #", "Date", "Customer", "Status", "Total"],
        rows: orders.map((o) => ({
          "Order #": o.orderNumber,
          Date: o.createdAt.toLocaleDateString(),
          Customer: o.user?.email ?? o.guestEmail ?? "Guest",
          Status: o.status,
          Total: (o.totalCents / 100).toFixed(2),
        })),
      };
    }
    case "tax": {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: { in: PAID_STATUSES },
          deletedAt: null,
        },
      });
      return {
        title: "Tax Report",
        headers: ["Order #", "Region", "Tax Label", "Tax Amount"],
        rows: orders.map((o) => ({
          "Order #": o.orderNumber,
          Region: `${o.shippingCountry}/${o.shippingState}`,
          "Tax Label": o.taxLabel ?? "Tax",
          "Tax Amount": (o.taxCents / 100).toFixed(2),
        })),
      };
    }
    case "shipping": {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: { in: PAID_STATUSES },
          deletedAt: null,
        },
      });
      return {
        title: "Shipping Report",
        headers: ["Order #", "Shipping Charged", "Country"],
        rows: orders.map((o) => ({
          "Order #": o.orderNumber,
          "Shipping Charged": (o.shippingCents / 100).toFixed(2),
          Country: o.shippingCountry,
        })),
      };
    }
    case "expenses": {
      const expenses = await prisma.expense.findMany({
        where: { expenseDate: { gte: range.from, lte: range.to } },
        include: { category: true },
        orderBy: { expenseDate: "desc" },
      });
      return {
        title: "Expense Report",
        headers: ["Date", "Category", "Description", "Amount", "Status"],
        rows: expenses.map((e) => ({
          Date: e.expenseDate.toLocaleDateString(),
          Category: e.category.name,
          Description: e.description.slice(0, 80),
          Amount: (e.amountCents / 100).toFixed(2),
          Status: e.paymentStatus,
        })),
      };
    }
    case "payments": {
      const payments = await prisma.paymentRecord.findMany({
        where: { paymentDate: { gte: range.from, lte: range.to } },
        include: { order: true },
        orderBy: { paymentDate: "desc" },
      });
      return {
        title: "Payment Records",
        headers: ["Date", "Order #", "Customer", "Method", "Amount", "Status"],
        rows: payments.map((p) => ({
          Date: p.paymentDate.toLocaleDateString(),
          "Order #": p.order.orderNumber,
          Customer: p.customerName,
          Method: p.method,
          Amount: (p.amountPaidCents / 100).toFixed(2),
          Status: p.status,
        })),
      };
    }
    case "inventory": {
      const products = await prisma.product.findMany({
        where: { hasVariants: false },
        orderBy: { name: "asc" },
      });
      return {
        title: "Inventory Valuation",
        headers: ["Product", "Purchase Cost", "Selling Price", "Qty", "Stock Value"],
        rows: products.map((p) => {
          const cost = p.purchaseCostCents ?? 0;
          return {
            Product: p.name,
            "Purchase Cost": (cost / 100).toFixed(2),
            "Selling Price": (p.priceCadCents / 100).toFixed(2),
            Qty: p.stock,
            "Stock Value": ((cost * p.stock) / 100).toFixed(2),
          };
        }),
      };
    }
    case "pnl": {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: { in: PAID_STATUSES },
          deletedAt: null,
        },
      });
      const expenses = await prisma.expense.findMany({
        where: { expenseDate: { gte: range.from, lte: range.to } },
        include: { category: true },
      });

      const salesRevenue = orders.reduce((s, o) => s + o.subtotalCents, 0);
      const shippingIncome = orders.reduce((s, o) => s + o.shippingCents, 0);
      const discounts = orders.reduce(
        (s, o) => s + (o.adjustmentCents < 0 ? Math.abs(o.adjustmentCents) : 0),
        0,
      );
      const taxCollected = orders.reduce((s, o) => s + o.taxCents, 0);
      const grossRevenue = salesRevenue + shippingIncome - discounts;

      const cogs = expenses
        .filter((e) => e.category.name === "Inventory Purchases")
        .reduce((s, e) => s + e.amountCents, 0);
      const shippingExpenses = expenses
        .filter((e) => e.category.name === "Shipping Costs")
        .reduce((s, e) => s + e.amountCents, 0);
      const operating = expenses
        .filter(
          (e) =>
            e.category.name !== "Inventory Purchases" &&
            e.category.name !== "Shipping Costs",
        )
        .reduce((s, e) => s + e.amountCents, 0);
      const totalExpenses = cogs + shippingExpenses + operating;

      return {
        title: "Profit & Loss",
        headers: ["Line", "Amount"],
        rows: [
          { Line: "Total Sales Revenue", Amount: (salesRevenue / 100).toFixed(2) },
          { Line: "Shipping Income", Amount: (shippingIncome / 100).toFixed(2) },
          { Line: "Discount Given", Amount: (-discounts / 100).toFixed(2) },
          { Line: "Tax Collected", Amount: (taxCollected / 100).toFixed(2) },
          { Line: "Gross Revenue", Amount: (grossRevenue / 100).toFixed(2) },
          { Line: "COGS", Amount: (-cogs / 100).toFixed(2) },
          { Line: "Shipping Expenses", Amount: (-shippingExpenses / 100).toFixed(2) },
          { Line: "Operating Expenses", Amount: (-operating / 100).toFixed(2) },
          { Line: "Total Expenses", Amount: (-totalExpenses / 100).toFixed(2) },
          { Line: "Gross Profit", Amount: ((grossRevenue - cogs) / 100).toFixed(2) },
          { Line: "Net Profit", Amount: ((grossRevenue - totalExpenses) / 100).toFixed(2) },
        ],
      };
    }
  }
}

function rowsToCsv(headers: string[], rows: ReportRow[]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

async function rowsToXlsx(
  headers: string[],
  rows: ReportRow[],
  title: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(title.slice(0, 31));
  ws.addRow(headers);
  for (const row of rows) {
    ws.addRow(headers.map((h) => row[h] ?? ""));
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

async function rowsToPdf(
  headers: string[],
  rows: ReportRow[],
  title: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(8);

    const colWidth = 500 / headers.length;
    let y = doc.y;
    headers.forEach((h, i) => {
      doc.text(h, 50 + i * colWidth, y, { width: colWidth });
    });
    y += 14;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 6;

    for (const row of rows.slice(0, 100)) {
      headers.forEach((h, i) => {
        doc.text(String(row[h] ?? ""), 50 + i * colWidth, y, { width: colWidth });
      });
      y += 12;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    }

    doc.end();
  });
}

export async function generateReport(
  type: ReportType,
  range: DateRange,
  format: ReportFormat,
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const { headers, rows, title } = await fetchReportData(type, range);
  const dateSlug = `${range.from.toISOString().slice(0, 10)}_${range.to.toISOString().slice(0, 10)}`;

  if (format === "csv") {
    return {
      buffer: Buffer.from(rowsToCsv(headers, rows), "utf-8"),
      filename: `${type}-${dateSlug}.csv`,
      contentType: "text/csv",
    };
  }
  if (format === "xlsx") {
    return {
      buffer: await rowsToXlsx(headers, rows, title),
      filename: `${type}-${dateSlug}.xlsx`,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }
  return {
    buffer: await rowsToPdf(headers, rows, title),
    filename: `${type}-${dateSlug}.pdf`,
    contentType: "application/pdf",
  };
}

export async function getReportPreview(type: ReportType, range: DateRange) {
  return fetchReportData(type, range);
}
