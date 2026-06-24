import path from "path";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const INVOICES_DIR = path.join(UPLOADS_ROOT, "invoices");
export const EXPENSES_DIR = path.join(UPLOADS_ROOT, "expenses");
export const INVOICE_LOGOS_DIR = path.join(UPLOADS_ROOT, "invoice-logos");
