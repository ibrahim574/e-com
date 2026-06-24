-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED');
CREATE TYPE "RefundType" AS ENUM ('FULL', 'PARTIAL');
CREATE TYPE "RefundStatus" AS ENUM ('PROCESSED', 'PENDING', 'FAILED');
CREATE TYPE "ExpensePaymentStatus" AS ENUM ('PAID', 'PENDING', 'PARTIALLY_PAID');
CREATE TYPE "InventoryChangeType" AS ENUM ('SALE', 'MANUAL_ADJUSTMENT', 'RESTOCK', 'RETURN', 'DELETED_VARIANT');

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "purchaseCostCents" INTEGER;
ALTER TABLE "Product" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "taxLabel" TEXT;
ALTER TABLE "Order" ADD COLUMN "taxRatePercent" DOUBLE PRECISION;

-- AlterTable AuditLog
ALTER TABLE "AuditLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "previousValue" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "newValue" JSONB;
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateTable InvoiceSettings
CREATE TABLE "InvoiceSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "logoPath" TEXT,
    "companyName" TEXT NOT NULL DEFAULT 'WirelessCom.Ca Inc.',
    "companyAddress" TEXT NOT NULL DEFAULT '97 White Oak Drive East
Sault Ste. Marie, ON P6B 4J7',
    "taxNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "footerMessage" TEXT NOT NULL DEFAULT 'Thank you for your business!',
    "returnPolicy" TEXT NOT NULL DEFAULT 'Returns accepted within 30 days of purchase.',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1001,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "InvoiceSettings" ("id", "updatedAt") VALUES ('singleton', CURRENT_TIMESTAMP);

-- CreateTable Invoice
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "pdfPath" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "archivedPaths" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateTable TaxRule
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "province" TEXT,
    "label" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "stackGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaxRule_country_province_idx" ON "TaxRule"("country", "province");

-- Seed default tax rules from SiteSettings
INSERT INTO "TaxRule" ("id", "country", "province", "label", "rate", "isDefault", "isEnabled", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'CA', 'ON', 'HST', 13, false, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CA', NULL, 'HST', 13, true, true, CURRENT_TIMESTAMP);

-- CreateTable ShippingRegion
CREATE TABLE "ShippingRegion" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "freeShippingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "thresholdCents" INTEGER NOT NULL DEFAULT 12500,
    "flatRateCents" INTEGER NOT NULL DEFAULT 1500,
    "displayMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRegion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShippingRegion_country_key" ON "ShippingRegion"("country");

INSERT INTO "ShippingRegion" ("id", "country", "freeShippingEnabled", "thresholdCents", "flatRateCents", "displayMessage", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'CA', true, 12500, 1500, 'Free shipping on orders over $125.00 (Canada).', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'US', true, 10000, 1200, 'Free shipping on orders over $100.00 (US).', CURRENT_TIMESTAMP);

-- CreateTable IncomeLedgerEntry
CREATE TABLE "IncomeLedgerEntry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT NOT NULL,
    "revenueAmount" INTEGER NOT NULL,
    "shippingIncome" INTEGER NOT NULL,
    "taxCollected" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "netRevenue" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncomeLedgerEntry_orderId_key" ON "IncomeLedgerEntry"("orderId");
CREATE INDEX "IncomeLedgerEntry_orderDate_idx" ON "IncomeLedgerEntry"("orderDate");

-- CreateTable ExpenseCategory
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

INSERT INTO "ExpenseCategory" ("id", "name") VALUES
  (gen_random_uuid()::text, 'Inventory Purchases'),
  (gen_random_uuid()::text, 'Shipping Costs'),
  (gen_random_uuid()::text, 'Advertising & Marketing'),
  (gen_random_uuid()::text, 'Employee Salaries'),
  (gen_random_uuid()::text, 'Office Expenses'),
  (gen_random_uuid()::text, 'Hosting & Software'),
  (gen_random_uuid()::text, 'Other');

-- CreateTable Expense
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "attachmentPath" TEXT,
    "paymentStatus" "ExpensePaymentStatus" NOT NULL DEFAULT 'PAID',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateTable PaymentRecord
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "transactionReference" TEXT,
    "amountPaidCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentRecord_orderId_idx" ON "PaymentRecord"("orderId");
CREATE INDEX "PaymentRecord_paymentDate_idx" ON "PaymentRecord"("paymentDate");
CREATE INDEX "PaymentRecord_status_idx" ON "PaymentRecord"("status");

-- CreateTable Refund
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "refundDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountCents" INTEGER NOT NULL,
    "type" "RefundType" NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PROCESSED',
    "transactionReference" TEXT,
    "processedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");
CREATE INDEX "Refund_refundDate_idx" ON "Refund"("refundDate");

-- CreateTable InventoryMovement
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "productName" TEXT NOT NULL,
    "sku" TEXT,
    "changeType" "InventoryChangeType" NOT NULL,
    "qtyBefore" INTEGER NOT NULL,
    "qtyAfter" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryMovement_productId_idx" ON "InventoryMovement"("productId");
CREATE INDEX "InventoryMovement_changedAt_idx" ON "InventoryMovement"("changedAt");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncomeLedgerEntry" ADD CONSTRAINT "IncomeLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
