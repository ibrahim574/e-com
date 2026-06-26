import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { CouponsManager, type CouponRow } from "@/components/admin/coupons-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  await requireAdmin();

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.value,
    minSubtotalCents: c.minSubtotalCents,
    maxRedemptions: c.maxRedemptions,
    usedCount: c.usedCount,
    perCustomerLimit: c.perCustomerLimit,
    firstOrderOnly: c.firstOrderOnly,
    allowedEmails: c.allowedEmails,
    buyQty: c.buyQty,
    getQty: c.getQty,
    productIds: c.productIds,
    startsAt: c.startsAt ? c.startsAt.toISOString() : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    enabled: c.enabled,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Coupons
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Create discount codes — percentage, fixed amount, free shipping, or
          buy-X-get-Y — with usage limits, expiry, and customer restrictions.
        </p>
      </div>
      <CouponsManager coupons={rows} />
    </div>
  );
}
