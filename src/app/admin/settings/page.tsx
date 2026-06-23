import { requireAdmin } from "@/lib/admin-guard";
import { getSiteSettings } from "@/lib/site-settings";
import { updateSiteSettingsAction } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Site Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Global controls that affect the storefront and admin views.
        </p>
      </div>

      <form
        action={updateSiteSettingsAction}
        className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-slate-900">Currency</h2>
        <p className="mt-1 text-sm text-slate-600">
          Toggle whether the storefront offers both CAD and USD prices, or runs
          in CAD only. When disabled, the header currency switcher is hidden and
          all prices render in CAD.
        </p>

        <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 cursor-pointer">
          <input
            type="checkbox"
            name="dualCurrencyEnabled"
            defaultChecked={settings.dualCurrencyEnabled}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-900">
              Show USD alongside CAD on the storefront
            </span>
            <span className="block text-xs text-slate-500">
              When off, the store is locked to CAD pricing.
            </span>
          </span>
        </label>

        <div className="mt-6 flex justify-end">
          <Button type="submit">Save settings</Button>
        </div>
      </form>
    </div>
  );
}
