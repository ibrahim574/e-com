import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-settings";
import { ProductsAdminList } from "@/components/admin/products-admin-list";

export default async function AdminProductsPage() {
  await requireAdmin();
  const { dualCurrencyEnabled } = await getSiteSettings();

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      variants: { select: { stock: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>
      <ProductsAdminList products={products} dualCurrency={dualCurrencyEnabled} />
    </div>
  );
}
