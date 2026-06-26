import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import {
  PurchaseRequestsManager,
  type PurchaseRequestRow,
} from "@/components/admin/purchase-requests-manager";

export const dynamic = "force-dynamic";

export default async function AdminPurchaseRequestsPage() {
  await requireAdmin();

  const requests = await prisma.purchaseRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: PurchaseRequestRow[] = requests.map((r) => ({
    id: r.id,
    productName: r.productName,
    name: r.name,
    email: r.email,
    phone: r.phone,
    quantity: r.quantity,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Purchase Requests
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Customers who asked to be notified about out-of-stock products.
        </p>
      </div>
      <PurchaseRequestsManager requests={rows} />
    </div>
  );
}
