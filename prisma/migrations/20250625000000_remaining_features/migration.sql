-- CreateEnum
CREATE TYPE "QuoteSubmissionType" AS ENUM ('QUOTE', 'PREORDER', 'STAY_CONNECTED');

-- AlterTable SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "announcementText" TEXT NOT NULL DEFAULT 'Free shipping available on eligible products and orders.';
ALTER TABLE "SiteSettings" ADD COLUMN "announcementEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "proudlyCanadianEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "shippingOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "taxOverride" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "selectedFrequency" TEXT;

-- CreateTable ShippingClass
CREATE TABLE "ShippingClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "surchargeCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShippingClass_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShippingClass_name_key" ON "ShippingClass"("name");

INSERT INTO "ShippingClass" ("id", "name", "description", "surchargeCents") VALUES
  (gen_random_uuid()::text, 'Small Package', 'Standard small parcel', 0),
  (gen_random_uuid()::text, 'Medium Package', 'Medium parcel', 500),
  (gen_random_uuid()::text, 'Large Package', 'Large parcel', 1000),
  (gen_random_uuid()::text, 'Oversized', 'Oversized freight', 2500);

-- CreateTable ShippingZone
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "provinces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baseCostCents" INTEGER NOT NULL DEFAULT 1500,
    "costPerKgCents" INTEGER NOT NULL DEFAULT 0,
    "freeThresholdCents" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShippingZone_country_idx" ON "ShippingZone"("country");

INSERT INTO "ShippingZone" ("id", "name", "country", "provinces", "baseCostCents", "costPerKgCents", "freeThresholdCents", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Ontario', 'CA', ARRAY['ON'], 1500, 200, 12500, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Quebec', 'CA', ARRAY['QC'], 1500, 200, 12500, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Alberta', 'CA', ARRAY['AB'], 1800, 250, 12500, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'British Columbia', 'CA', ARRAY['BC'], 1800, 250, 12500, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Other Provinces', 'CA', ARRAY[]::TEXT[], 2000, 300, 12500, CURRENT_TIMESTAMP);

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "shippingEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "lengthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "widthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "heightCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "weightGrams" INTEGER;
ALTER TABLE "Product" ADD COLUMN "shippingClassId" TEXT;

-- AlterTable ProductVariant
ALTER TABLE "ProductVariant" ADD COLUMN "shippingEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ProductVariant" ADD COLUMN "lengthCm" DOUBLE PRECISION;
ALTER TABLE "ProductVariant" ADD COLUMN "widthCm" DOUBLE PRECISION;
ALTER TABLE "ProductVariant" ADD COLUMN "heightCm" DOUBLE PRECISION;
ALTER TABLE "ProductVariant" ADD COLUMN "weightGrams" INTEGER;
ALTER TABLE "ProductVariant" ADD COLUMN "shippingClassId" TEXT;

-- CreateTable PasswordResetToken
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateTable QuoteSubmission
CREATE TABLE "QuoteSubmission" (
    "id" TEXT NOT NULL,
    "type" "QuoteSubmissionType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "productInterest" TEXT,
    "quantity" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuoteSubmission_type_idx" ON "QuoteSubmission"("type");
CREATE INDEX "QuoteSubmission_createdAt_idx" ON "QuoteSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shippingClassId_fkey" FOREIGN KEY ("shippingClassId") REFERENCES "ShippingClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_shippingClassId_fkey" FOREIGN KEY ("shippingClassId") REFERENCES "ShippingClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
