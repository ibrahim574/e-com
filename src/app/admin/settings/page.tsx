import { requireAdmin } from "@/lib/admin-guard";
import { auth } from "@/lib/auth";
import { isSuperAdminRole } from "@/lib/admin-guard";
import { getSiteSettings } from "@/lib/site-settings";
import { getInvoiceSettings } from "@/lib/invoice/invoice-settings";
import { prisma } from "@/lib/prisma";
import { SettingsForms } from "@/components/admin/settings-forms";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const session = await auth();
  const [settings, signalTypes, frequencyBands, taxRules, shippingRegions, invoiceSettings] =
    await Promise.all([
      getSiteSettings(),
      prisma.signalType.findMany({ orderBy: { name: "asc" } }),
      prisma.frequencyBand.findMany({ orderBy: { name: "asc" } }),
      prisma.taxRule.findMany({ orderBy: [{ country: "asc" }, { province: "asc" }] }),
      prisma.shippingRegion.findMany({ orderBy: { country: "asc" } }),
      getInvoiceSettings(),
    ]);

  const isSuperAdmin = isSuperAdminRole(session?.user?.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Site Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Global controls for tax, shipping, invoices, email, currency, and product attributes.
        </p>
      </div>

      <SettingsForms
        settings={settings}
        signalTypes={signalTypes}
        frequencyBands={frequencyBands}
        taxRules={taxRules}
        shippingRegions={shippingRegions}
        invoiceSettings={invoiceSettings}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
