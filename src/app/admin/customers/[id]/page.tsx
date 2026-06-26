import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, isSuperAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { CustomerEditForms } from "@/components/admin/customer-edit-forms";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const isSuperAdmin = isSuperAdminRole(session.user.role);
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer || customer.role !== "CUSTOMER") {
    notFound();
  }

  const addressLines = [
    customer.addressLine1,
    customer.addressLine2,
    [customer.addressCity, customer.addressState, customer.addressPostal]
      .filter(Boolean)
      .join(", "),
    customer.addressCountry,
  ].filter((s): s is string => !!s && s.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/customers"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            &larr; All customers
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {customer.name ?? "Unnamed customer"}
          </h1>
          <p className="text-slate-600">{customer.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-900">{customer.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900">{customer.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-900">{customer.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Joined</dt>
              <dd className="text-slate-900">
                {customer.createdAt.toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">Address</h2>
          {addressLines.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No address on file.</p>
          ) : (
            <address className="mt-4 not-italic text-sm leading-relaxed text-slate-700">
              {addressLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </address>
          )}
        </div>
      </div>

      <CustomerEditForms
        customer={{
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          addressLine1: customer.addressLine1,
          addressLine2: customer.addressLine2,
          addressCity: customer.addressCity,
          addressState: customer.addressState,
          addressPostal: customer.addressPostal,
          addressCountry: customer.addressCountry,
        }}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">
            Orders ({customer.orders.length})
          </h2>
        </div>
        {customer.orders.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">Order</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {o.orderNumber}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {o.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {formatPrice(o.totalCents, o.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
