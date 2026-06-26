-- CreateTable
CREATE TABLE "ComparisonAttribute" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'spec',
    "key" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComparisonAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComparisonAttribute_enabled_idx" ON "ComparisonAttribute"("enabled");
