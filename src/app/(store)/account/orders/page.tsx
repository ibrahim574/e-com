import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Order History</h1>
        <Link href="/account" className="text-sm font-semibold text-blue-600">
          Back to Account
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-slate-600">You have no orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-slate-200 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatPrice(order.totalCents, order.currency)}
                  </p>
                  <p className="text-sm capitalize text-slate-600">
                    {order.status.toLowerCase()}
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.productName}
                    {item.variantLabel ? ` (${item.variantLabel})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
