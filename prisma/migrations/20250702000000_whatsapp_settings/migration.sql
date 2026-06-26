-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "whatsappNumber" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "whatsappGreeting" TEXT;
