-- Homepage hero featured product panel
CREATE TABLE IF NOT EXISTS "HeroFeaturedProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeroFeaturedProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HeroFeaturedProduct_productId_key" ON "HeroFeaturedProduct"("productId");
CREATE INDEX IF NOT EXISTS "HeroFeaturedProduct_position_idx" ON "HeroFeaturedProduct"("position");

ALTER TABLE "HeroFeaturedProduct" DROP CONSTRAINT IF EXISTS "HeroFeaturedProduct_productId_fkey";
ALTER TABLE "HeroFeaturedProduct" ADD CONSTRAINT "HeroFeaturedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
