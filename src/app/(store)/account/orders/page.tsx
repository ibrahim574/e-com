import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerOrdersList } from "@/components/account/customer-orders-list";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: true,
      invoices: { orderBy: { version: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    totalCents: o.totalCents,
    currency: o.currency,
    createdAt: o.createdAt,
    invoiceId: o.invoices[0]?.id ?? null,
    items: o.items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
    })),
  }));

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Order History</h1>
        <Link href="/account" className="text-sm font-semibold text-blue-600">
          Back to Account
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate-600">You have no orders yet.</p>
      ) : (
        <CustomerOrdersList orders={rows} />
      )}
    </div>
  );
}
