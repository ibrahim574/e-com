-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "txFrequency" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CartItem" ADD COLUMN "rxFrequency" TEXT NOT NULL DEFAULT '';

-- DropIndex
DROP INDEX IF EXISTS "CartItem_cartId_productId_variantId_key";

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_txFrequency_rxFrequency_key" ON "CartItem"("cartId", "productId", "variantId", "txFrequency", "rxFrequency");

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "adjustmentCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "txFrequency" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "rxFrequency" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "Product" ADD COLUMN "frequencyOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN "allowCustomFrequency" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "customTxRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "customRxRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "taxLabel" TEXT NOT NULL DEFAULT 'HST';
ALTER TABLE "SiteSettings" ADD COLUMN "taxRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 13;
ALTER TABLE "SiteSettings" ADD COLUMN "companyName" TEXT NOT NULL DEFAULT 'WirelessCom';
ALTER TABLE "SiteSettings" ADD COLUMN "quoteRecipients" TEXT NOT NULL DEFAULT 'abu@wirelesscom.ca, service@wirelesscom.ca';
ALTER TABLE "SiteSettings" ADD COLUMN "smtpHost" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpPort" INTEGER;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpSecure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpUser" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpPasswordEnc" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpFrom" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequencyBand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrequencyBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RelatedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompatibleProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "compatibleProductId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompatibleProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSignalType" (
    "productId" TEXT NOT NULL,
    "signalTypeId" TEXT NOT NULL,

    CONSTRAINT "ProductSignalType_pkey" PRIMARY KEY ("productId","signalTypeId")
);

-- CreateTable
CREATE TABLE "ProductFrequencyBand" (
    "productId" TEXT NOT NULL,
    "frequencyBandId" TEXT NOT NULL,

    CONSTRAINT "ProductFrequencyBand_pkey" PRIMARY KEY ("productId","frequencyBandId")
);

-- CreateTable
CREATE TABLE "FeaturedItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "videoUrl" TEXT,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Series_name_key" ON "Series"("name");
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");
CREATE UNIQUE INDEX "SignalType_name_key" ON "SignalType"("name");
CREATE UNIQUE INDEX "FrequencyBand_name_key" ON "FrequencyBand"("name");
CREATE INDEX "RelatedProduct_productId_idx" ON "RelatedProduct"("productId");
CREATE UNIQUE INDEX "RelatedProduct_productId_relatedProductId_key" ON "RelatedProduct"("productId", "relatedProductId");
CREATE INDEX "CompatibleProduct_productId_idx" ON "CompatibleProduct"("productId");
CREATE UNIQUE INDEX "CompatibleProduct_productId_compatibleProductId_key" ON "CompatibleProduct"("productId", "compatibleProductId");
CREATE INDEX "LoginAttempt_email_ip_createdAt_idx" ON "LoginAttempt"("email", "ip", "createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RelatedProduct" ADD CONSTRAINT "RelatedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelatedProduct" ADD CONSTRAINT "RelatedProduct_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompatibleProduct" ADD CONSTRAINT "CompatibleProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompatibleProduct" ADD CONSTRAINT "CompatibleProduct_compatibleProductId_fkey" FOREIGN KEY ("compatibleProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSignalType" ADD CONSTRAINT "ProductSignalType_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSignalType" ADD CONSTRAINT "ProductSignalType_signalTypeId_fkey" FOREIGN KEY ("signalTypeId") REFERENCES "SignalType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductFrequencyBand" ADD CONSTRAINT "ProductFrequencyBand_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductFrequencyBand" ADD CONSTRAINT "ProductFrequencyBand_frequencyBandId_fkey" FOREIGN KEY ("frequencyBandId") REFERENCES "FrequencyBand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default signal types and frequency bands
INSERT INTO "SignalType" ("id", "name", "createdAt") VALUES
  ('signal_analog', 'Analog', NOW()),
  ('signal_digital', 'Digital', NOW())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "FrequencyBand" ("id", "name", "createdAt") VALUES
  ('band_uhf', 'UHF', NOW()),
  ('band_vhf', 'VHF', NOW())
ON CONFLICT ("name") DO NOTHING;
