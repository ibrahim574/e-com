-- CreateEnum
CREATE TYPE "SystemLogCategory" AS ENUM ('ERROR', 'PAYMENT', 'EMAIL', 'SMS', 'API', 'LOGIN', 'SECURITY');

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "category" "SystemLogCategory" NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_category_idx" ON "SystemLog"("category");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog"("createdAt");

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "fraudReasons" JSONB;
