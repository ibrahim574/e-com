-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "cashOnPickupEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "cashPickupInstructions" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "interacEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "interacEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "interacInstructions" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fraudHighValueCents" INTEGER NOT NULL DEFAULT 150000;
