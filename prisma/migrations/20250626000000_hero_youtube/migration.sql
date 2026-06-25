-- Hero homepage slideshow + product YouTube URL
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;

CREATE TABLE IF NOT EXISTS "HeroSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "image" TEXT NOT NULL,
    "linkUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HeroSlide_position_idx" ON "HeroSlide"("position");

ALTER TABLE "FeaturedItem" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;
