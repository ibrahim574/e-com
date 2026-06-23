import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/app/actions/admin";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AdminProductsPage() {
  await requireAdmin();
  const { dualCurrencyEnabled } = await getSiteSettings();

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      categories: { include: { category: true } },
      variants: { select: { stock: true } },
    },
  });

  function stockLabel(product: (typeof products)[number]) {
    if (product.hasVariants) {
      const total = product.variants.reduce((sum, v) => sum + v.stock, 0);
      return { quantity: total, hint: "across variants" };
    }
    return { quantity: product.stock, hint: null };
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">CAD</th>
              {dualCurrencyEnabled && <th className="px-4 py-3">USD</th>}
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const { quantity, hint } = stockLabel(product);
              return (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize">{product.status.toLowerCase()}</td>
                <td className="px-4 py-3">{formatPrice(product.priceCadCents, "CAD")}</td>
                {dualCurrencyEnabled && (
                  <td className="px-4 py-3">{formatPrice(product.priceUsdCents, "USD")}</td>
                )}
                <td className="px-4 py-3">
                  <span
                    className={
                      quantity === 0
                        ? "font-semibold text-red-600"
                        : quantity <= 5
                          ? "font-semibold text-amber-600"
                          : "font-semibold text-slate-900"
                    }
                  >
                    {quantity}
                  </span>
                  {hint && (
                    <p className="text-xs text-slate-500">{hint}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                    </Button>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
