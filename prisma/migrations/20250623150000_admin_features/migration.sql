-- AlterTable: customer profile fields on User
ALTER TABLE "User"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "addressCity" TEXT,
  ADD COLUMN "addressState" TEXT,
  ADD COLUMN "addressPostal" TEXT,
  ADD COLUMN "addressCountry" TEXT;

-- CreateTable: SiteSettings (single-row singleton)
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "dualCurrencyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row
INSERT INTO "SiteSettings" ("id", "dualCurrencyEnabled", "updatedAt")
VALUES ('singleton', true, CURRENT_TIMESTAMP);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Promote the existing seed admin (if any) to SUPER_ADMIN so there is at least one
-- super admin after migration. The seed script also handles this idempotently for
-- fresh installs.
