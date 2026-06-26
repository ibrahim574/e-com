"use client";

import { useState } from "react";
import Image from "next/image";
import {
  updateSiteSettingsAction,
  sendTestEmailAction,
  createSignalTypeAction,
  deleteSignalTypeAction,
  createFrequencyBandAction,
  deleteFrequencyBandAction,
} from "@/app/actions/settings";
import {
  createTaxRuleAction,
  deleteTaxRuleAction,
  toggleTaxRuleAction,
  updateShippingRegionAction,
  saveShippingZoneAction,
  deleteShippingZoneAction,
  updateInvoiceSettingsAction,
} from "@/app/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { SiteSettings } from "@/lib/site-settings";
import type { InvoiceSettingsData } from "@/lib/invoice/invoice-settings";
import {
  isSiteLogoUpload,
  resolveSiteLogoUrl,
} from "@/lib/site-logo";

type Attr = { id: string; name: string };

type TaxRuleRow = {
  id: string;
  country: string;
  province: string | null;
  label: string;
  rate: number;
  isDefault: boolean;
  isEnabled: boolean;
};

type ShippingRow = {
  id: string;
  country: string;
  freeShippingEnabled: boolean;
  thresholdCents: number;
  flatRateCents: number;
  displayMessage: string | null;
};

type ShippingZoneRow = {
  id: string;
  name: string;
  country: string;
  provinces: string[];
  baseCostCents: number;
  costPerKgCents: number;
  freeThresholdCents: number | null;
  isEnabled: boolean;
};

type PayPalStatus = {
  clientIdSet: boolean;
  secretSet: boolean;
  publicClientIdSet: boolean;
  mode: "live" | "sandbox";
  publicClientIdLast4: string | null;
};

const TABS = [
  { id: "branding", label: "Branding" },
  { id: "currency", label: "Currency" },
  { id: "payments", label: "Payments" },
  { id: "tax", label: "Tax Rules" },
  { id: "shipping", label: "Shipping" },
  { id: "invoice", label: "Invoice" },
  { id: "smtp", label: "SMTP" },
  { id: "quote", label: "Quote Notifications" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "attributes", label: "Attributes" },
  { id: "session", label: "Security" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsForms({
  settings,
  signalTypes,
  frequencyBands,
  taxRules,
  shippingRegions,
  shippingZones,
  invoiceSettings,
  isSuperAdmin,
  paypalStatus,
}: {
  settings: SiteSettings;
  signalTypes: Attr[];
  frequencyBands: Attr[];
  taxRules: TaxRuleRow[];
  shippingRegions: ShippingRow[];
  shippingZones: ShippingZoneRow[];
  invoiceSettings: InvoiceSettingsData;
  isSuperAdmin: boolean;
  paypalStatus: PayPalStatus;
}) {
  const [tab, setTab] = useState<TabId>("currency");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBranding(formData: FormData) {
    setMessage(null);
    setError(null);
    const result = await updateSiteSettingsAction(formData);
    if (result?.error) setError(result.error);
    else setMessage("Logo saved.");
  }

  async function handleSettings(formData: FormData) {
    setMessage(null);
    setError(null);
    const result = await updateSiteSettingsAction(formData);
    if (result?.error) setError(result.error);
    else setMessage("Settings saved.");
  }

  async function handleInvoiceSettings(formData: FormData) {
    setMessage(null);
    setError(null);
    const result = await updateInvoiceSettingsAction(formData);
    if (result?.error) setError(result.error);
    else setMessage("Invoice settings saved.");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="mb-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {tab === "branding" && (
        <form
          action={handleBranding}
          encType="multipart/form-data"
          className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="section" value="branding" />
          <h2 className="text-lg font-bold text-slate-900">Site logo</h2>
          <p className="text-sm text-slate-600">
            Upload a logo to display in the site header and footer.
          </p>
          <div>
            <Label>Current logo</Label>
            <div className="mt-2 flex items-center gap-4">
              <Image
                src={resolveSiteLogoUrl(settings.siteLogoUrl)}
                alt="Current site logo"
                width={64}
                height={64}
                className="h-16 w-16 rounded-xl object-contain"
                unoptimized={
                  isSiteLogoUpload(resolveSiteLogoUrl(settings.siteLogoUrl)) ||
                  resolveSiteLogoUrl(settings.siteLogoUrl) === "/logo.png"
                }
              />
              <Input
                name="siteLogo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              JPEG, PNG, or WebP up to 2 MB.
            </p>
            {settings.siteLogoUrl && (
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="resetLogo" />
                Reset to default logo
              </label>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <Label>Browser tab icon (favicon)</Label>
            <div className="mt-2 flex items-center gap-4">
              {settings.siteFaviconUrl ? (
                <Image
                  src={settings.siteFaviconUrl}
                  alt="Current favicon"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                  unoptimized
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-600">
                  none
                </span>
              )}
              <Input
                name="siteFavicon"
                type="file"
                accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,.ico"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ICO, PNG, or SVG up to 512 KB. Falls back to the site logo when unset.
            </p>
            {settings.siteFaviconUrl && (
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="resetFavicon" />
                Remove custom favicon
              </label>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save branding</Button>
          </div>
        </form>
      )}

      {tab === "currency" && (
        <form
          action={handleSettings}
          className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="section" value="currency" />
          <h2 className="text-lg font-bold text-slate-900">Currency</h2>
          <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 cursor-pointer">
            <input
              type="checkbox"
              name="dualCurrencyEnabled"
              defaultChecked={settings.dualCurrencyEnabled}
              className="h-5 w-5 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-semibold text-slate-900">
              Show USD alongside CAD on the storefront
            </span>
          </label>
          <div className="mt-6 flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}

      {tab === "payments" && (
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            PayPal
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            PayPal credentials are configured in the server <code>.env</code> file
            (never editable here for security). After updating them, restart the app
            container. This panel only shows whether each value is present.
          </p>

          <div className="mt-5 space-y-3">
            <StatusRow label="PAYPAL_CLIENT_ID (server)" ok={paypalStatus.clientIdSet} />
            <StatusRow label="PAYPAL_CLIENT_SECRET (server)" ok={paypalStatus.secretSet} />
            <StatusRow
              label="NEXT_PUBLIC_PAYPAL_CLIENT_ID (browser)"
              ok={paypalStatus.publicClientIdSet}
              hint={
                paypalStatus.publicClientIdLast4
                  ? `ends in …${paypalStatus.publicClientIdLast4}`
                  : undefined
              }
            />
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Mode
              </span>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                  paypalStatus.mode === "live"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                {paypalStatus.mode}
              </span>
            </div>
          </div>

          {paypalStatus.clientIdSet &&
          paypalStatus.secretSet &&
          paypalStatus.publicClientIdSet ? (
            <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              PayPal is fully configured. Checkout should display the PayPal button.
            </p>
          ) : (
            <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              PayPal is not fully configured. Set the missing keys in <code>.env</code>{" "}
              (all three must belong to the same PayPal app and the same mode), then
              restart the app container.
            </p>
          )}

          <form action={handleSettings} className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
            <input type="hidden" name="section" value="offline-payments" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Offline Payment Methods
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Let customers place orders without paying online. Orders stay
              PENDING until you mark them PAID in the admin.
            </p>

            <div className="mt-5 space-y-5">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <input
                    type="checkbox"
                    name="cashOnPickupEnabled"
                    defaultChecked={settings.cashOnPickupEnabled}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Enable Cash on Pickup
                </label>
                <div className="mt-3">
                  <Label htmlFor="cashPickupInstructions">Pickup instructions</Label>
                  <textarea
                    id="cashPickupInstructions"
                    name="cashPickupInstructions"
                    rows={3}
                    defaultValue={settings.cashPickupInstructions ?? ""}
                    placeholder="Visit our store at … during business hours and pay in cash."
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <input
                    type="checkbox"
                    name="interacEnabled"
                    defaultChecked={settings.interacEnabled}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Enable Interac e-Transfer
                </label>
                <div className="mt-3">
                  <Label htmlFor="interacEmail">Interac e-Transfer email</Label>
                  <Input
                    id="interacEmail"
                    name="interacEmail"
                    type="email"
                    defaultValue={settings.interacEmail ?? ""}
                    placeholder="payments@yourstore.com"
                  />
                </div>
                <div className="mt-3">
                  <Label htmlFor="interacInstructions">Interac instructions</Label>
                  <textarea
                    id="interacInstructions"
                    name="interacInstructions"
                    rows={3}
                    defaultValue={settings.interacInstructions ?? ""}
                    placeholder="Send your e-Transfer with the order number as the message…"
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Fraud detection
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Orders at or above this total are automatically flagged for
                review.
              </p>
              <div className="mt-3 max-w-xs">
                <Label htmlFor="fraudHighValue">High-value threshold ($)</Label>
                <Input
                  id="fraudHighValue"
                  name="fraudHighValue"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={(settings.fraudHighValueCents / 100).toFixed(2)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit">Save payment methods</Button>
            </div>
          </form>
        </div>
      )}

      {tab === "tax" && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Tax Rules</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tax is calculated at checkout from the customer&apos;s shipping address.
            </p>
            <form action={createTaxRuleAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Country (e.g. CA)</Label>
                <Input name="country" defaultValue="CA" required maxLength={2} />
              </div>
              <div>
                <Label>Province (optional)</Label>
                <Input name="province" placeholder="ON" maxLength={10} />
              </div>
              <div>
                <Label>Label</Label>
                <Input name="label" defaultValue="HST" required />
              </div>
              <div>
                <Label>Rate (%)</Label>
                <Input name="rate" type="number" step="0.01" defaultValue="13" required />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="isDefault" className="rounded" />
                Default rule when no region match
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">Add Rule</Button>
              </div>
            </form>
            <ul className="mt-6 space-y-2">
              {taxRules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>
                    {rule.country}
                    {rule.province ? ` / ${rule.province}` : ""} — {rule.label}{" "}
                    {rule.rate}%
                    {rule.isDefault && (
                      <span className="ml-2 rounded bg-blue-100 px-1.5 text-xs text-blue-700">
                        default
                      </span>
                    )}
                    {!rule.isEnabled && (
                      <span className="ml-2 text-xs text-slate-400">disabled</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <form action={toggleTaxRuleAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {rule.isEnabled ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <form action={deleteTaxRuleAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-red-600">
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "shipping" && (
        <div className="max-w-2xl space-y-4">
          <form
            action={handleSettings}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="section" value="general" />
            <h2 className="text-lg font-bold">Storefront display</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="announcementEnabled"
                defaultChecked={settings.announcementEnabled}
              />
              Show announcement bar in header
            </label>
            <div>
              <Label htmlFor="announcementText">Announcement text</Label>
              <Input
                id="announcementText"
                name="announcementText"
                defaultValue={settings.announcementText}
                placeholder="Free shipping available on eligible products and orders."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="proudlyCanadianEnabled"
                defaultChecked={settings.proudlyCanadianEnabled}
              />
              Show Proudly Canadian badge in footer
            </label>
            <Button type="submit" size="sm">Save display settings</Button>
          </form>

          {shippingRegions.map((region) => (
            <form
              key={region.id}
              action={updateShippingRegionAction}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <input type="hidden" name="id" value={region.id} />
              <h2 className="text-lg font-bold">{region.country}</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="freeShippingEnabled"
                  defaultChecked={region.freeShippingEnabled}
                />
                Free shipping enabled
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Free shipping threshold ($)</Label>
                  <Input
                    name="thresholdDollars"
                    type="number"
                    step="0.01"
                    defaultValue={(region.thresholdCents / 100).toFixed(2)}
                  />
                </div>
                <div>
                  <Label>Flat rate ($)</Label>
                  <Input
                    name="flatRateDollars"
                    type="number"
                    step="0.01"
                    defaultValue={(region.flatRateCents / 100).toFixed(2)}
                  />
                </div>
              </div>
              <div>
                <Label>Display message (optional)</Label>
                <Input
                  name="displayMessage"
                  defaultValue={region.displayMessage ?? ""}
                  placeholder="Free shipping available on eligible orders."
                />
              </div>
              <Button type="submit" size="sm">Save {region.country}</Button>
            </form>
          ))}

          <form
            action={saveShippingZoneAction}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">Add shipping zone</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input name="name" placeholder="Ontario" required />
              </div>
              <div>
                <Label>Country</Label>
                <Input name="country" defaultValue="CA" maxLength={2} />
              </div>
              <div className="sm:col-span-2">
                <Label>Provinces (comma-separated, empty = all)</Label>
                <Input name="provinces" placeholder="ON, QC" />
              </div>
              <div>
                <Label>Base cost ($)</Label>
                <Input name="baseCostDollars" type="number" step="0.01" defaultValue="15.00" />
              </div>
              <div>
                <Label>Cost per kg ($)</Label>
                <Input name="costPerKgDollars" type="number" step="0.01" defaultValue="0.00" />
              </div>
              <div>
                <Label>Free shipping threshold ($)</Label>
                <Input name="freeThresholdDollars" type="number" step="0.01" placeholder="Optional" />
              </div>
              <label className="flex items-center gap-2 self-end text-sm">
                <input type="checkbox" name="isEnabled" defaultChecked />
                Enabled
              </label>
            </div>
            <Button type="submit" size="sm">Add zone</Button>
          </form>

          {shippingZones.map((zone) => (
            <form
              key={zone.id}
              action={saveShippingZoneAction}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <input type="hidden" name="id" value={zone.id} />
              <h2 className="text-lg font-bold">{zone.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input name="name" defaultValue={zone.name} required />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input name="country" defaultValue={zone.country} maxLength={2} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Provinces</Label>
                  <Input name="provinces" defaultValue={zone.provinces.join(", ")} />
                </div>
                <div>
                  <Label>Base cost ($)</Label>
                  <Input
                    name="baseCostDollars"
                    type="number"
                    step="0.01"
                    defaultValue={(zone.baseCostCents / 100).toFixed(2)}
                  />
                </div>
                <div>
                  <Label>Cost per kg ($)</Label>
                  <Input
                    name="costPerKgDollars"
                    type="number"
                    step="0.01"
                    defaultValue={(zone.costPerKgCents / 100).toFixed(2)}
                  />
                </div>
                <div>
                  <Label>Free threshold ($)</Label>
                  <Input
                    name="freeThresholdDollars"
                    type="number"
                    step="0.01"
                    defaultValue={
                      zone.freeThresholdCents != null
                        ? (zone.freeThresholdCents / 100).toFixed(2)
                        : ""
                    }
                  />
                </div>
                <label className="flex items-center gap-2 self-end text-sm">
                  <input type="checkbox" name="isEnabled" defaultChecked={zone.isEnabled} />
                  Enabled
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save zone</Button>
              </div>
            </form>
          ))}

          {shippingZones.map((zone) => (
            <form key={`del-${zone.id}`} action={deleteShippingZoneAction}>
              <input type="hidden" name="id" value={zone.id} />
              <Button type="submit" size="sm" variant="ghost" className="text-red-600">
                Delete {zone.name}
              </Button>
            </form>
          ))}
        </div>
      )}

      {tab === "invoice" && (
        <form
          action={handleInvoiceSettings}
          className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Invoice Settings</h2>
          <div>
            <Label>Company logo</Label>
            <Input name="logo" type="file" accept="image/*" />
          </div>
          <div>
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" name="companyName" defaultValue={invoiceSettings.companyName} />
          </div>
          <div>
            <Label htmlFor="companyAddress">Address</Label>
            <textarea
              id="companyAddress"
              name="companyAddress"
              rows={3}
              defaultValue={invoiceSettings.companyAddress}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="taxNumber">GST/HST number</Label>
              <Input id="taxNumber" name="taxNumber" defaultValue={invoiceSettings.taxNumber ?? ""} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={invoiceSettings.phone ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={invoiceSettings.email ?? ""} />
          </div>
          <div>
            <Label htmlFor="footerMessage">Footer message</Label>
            <textarea
              id="footerMessage"
              name="footerMessage"
              rows={2}
              defaultValue={invoiceSettings.footerMessage}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="returnPolicy">Return policy note</Label>
            <textarea
              id="returnPolicy"
              name="returnPolicy"
              rows={2}
              defaultValue={invoiceSettings.returnPolicy}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="invoicePrefix">Invoice prefix</Label>
              <Input id="invoicePrefix" name="invoicePrefix" defaultValue={invoiceSettings.invoicePrefix} />
            </div>
            <div>
              <Label htmlFor="nextInvoiceNumber">Next invoice number</Label>
              <Input
                id="nextInvoiceNumber"
                name="nextInvoiceNumber"
                type="number"
                defaultValue={invoiceSettings.nextInvoiceNumber}
              />
            </div>
          </div>
          <Button type="submit">Save Invoice Settings</Button>
        </form>
      )}

      {tab === "smtp" && (
        <form
          action={handleSettings}
          className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="section" value="smtp" />
          <h2 className="text-lg font-bold text-slate-900">SMTP Configuration</h2>
          <p className="text-sm text-slate-600">
            Used for quote requests, order notifications, and customer emails.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="smtpHost">Host</Label>
              <Input
                id="smtpHost"
                name="smtpHost"
                defaultValue={settings.smtpHost ?? ""}
                placeholder="mail.wirelesscom.ca"
              />
            </div>
            <div>
              <Label htmlFor="smtpPort">Port</Label>
              <Input
                id="smtpPort"
                name="smtpPort"
                type="number"
                defaultValue={settings.smtpPort ?? 587}
              />
            </div>
            <div>
              <Label htmlFor="smtpUser">Username</Label>
              <Input
                id="smtpUser"
                name="smtpUser"
                defaultValue={settings.smtpUser ?? ""}
                placeholder="wcsendmail@wirelesscom.ca"
              />
            </div>
            <div>
              <Label htmlFor="smtpFrom">From Address</Label>
              <Input
                id="smtpFrom"
                name="smtpFrom"
                defaultValue={settings.smtpFrom ?? ""}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="smtpPassword">Password</Label>
              <PasswordInput
                id="smtpPassword"
                name="smtpPassword"
                placeholder={settings.smtpPasswordEnc ? "••••••••" : "Enter password"}
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave blank to keep the current password.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="smtpSecure"
              defaultChecked={settings.smtpSecure}
              className="rounded"
            />
            Use SSL/TLS (port 465)
          </label>
          <div className="flex justify-end">
            <Button type="submit">Save SMTP</Button>
          </div>
        </form>
      )}

      {tab === "quote" && (
        <form
          action={handleSettings}
          className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="section" value="quote" />
          <h2 className="text-lg font-bold text-slate-900">Quote Notifications</h2>
          <div className="mt-4">
            <Label htmlFor="quoteRecipients">Quote Request Recipients</Label>
            <Input
              id="quoteRecipients"
              name="quoteRecipients"
              defaultValue={settings.quoteRecipients}
              placeholder="abu@wirelesscom.ca, service@wirelesscom.ca"
            />
            <p className="mt-1 text-xs text-slate-500">Comma-separated email addresses.</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}

      {tab === "whatsapp" && (
        <form
          action={handleSettings}
          className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="section" value="whatsapp" />
          <h2 className="text-lg font-bold text-slate-900">WhatsApp Chat</h2>
          <p className="mt-1 text-sm text-slate-500">
            Shows a floating chat button on the storefront. Messages open in
            WhatsApp and are delivered to your WhatsApp Business number.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="whatsappEnabled"
              defaultChecked={settings.whatsappEnabled}
              className="h-4 w-4 rounded border-slate-300"
            />
            Enable WhatsApp chat widget
          </label>
          <div className="mt-4">
            <Label htmlFor="whatsappNumber">WhatsApp Business number</Label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              defaultValue={settings.whatsappNumber ?? ""}
              placeholder="14165551234 (country code, no symbols)"
            />
            <p className="mt-1 text-xs text-slate-500">
              Include the country code. Digits only — e.g. 1 416 555 1234.
            </p>
          </div>
          <div className="mt-4">
            <Label htmlFor="whatsappGreeting">Default greeting message</Label>
            <Input
              id="whatsappGreeting"
              name="whatsappGreeting"
              defaultValue={settings.whatsappGreeting ?? ""}
              placeholder="Hi! I have a question about your radios."
            />
            <p className="mt-1 text-xs text-slate-500">
              Pre-filled into the visitor&apos;s message.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}

      {tab === "attributes" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Signal Types</h2>
            <form action={createSignalTypeAction} className="mt-4 flex gap-2">
              <Input name="name" placeholder="e.g. DMR" required />
              <Button type="submit">Add</Button>
            </form>
            <ul className="mt-4 space-y-2">
              {signalTypes.map((st) => (
                <li
                  key={st.id}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  {st.name}
                  <form action={deleteSignalTypeAction}>
                    <input type="hidden" name="id" value={st.id} />
                    <Button type="submit" variant="ghost" className="h-8 text-red-600">
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Frequency Bands</h2>
            <form action={createFrequencyBandAction} className="mt-4 flex gap-2">
              <Input name="name" placeholder="e.g. 700/800 MHz" required />
              <Button type="submit">Add</Button>
            </form>
            <ul className="mt-4 space-y-2">
              {frequencyBands.map((fb) => (
                <li
                  key={fb.id}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  {fb.name}
                  <form action={deleteFrequencyBandAction}>
                    <input type="hidden" name="id" value={fb.id} />
                    <Button type="submit" variant="ghost" className="h-8 text-red-600">
                      Delete
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "session" && (
        <div className="max-w-2xl space-y-6">
          <form
            action={handleSettings}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="section" value="session" />
            <h2 className="text-lg font-bold text-slate-900">Session Timeout</h2>
            <div className="mt-4">
              <Label htmlFor="sessionTimeoutMinutes">Inactivity timeout (minutes)</Label>
              <Input
                id="sessionTimeoutMinutes"
                name="sessionTimeoutMinutes"
                type="number"
                min="5"
                max="480"
                defaultValue={settings.sessionTimeoutMinutes}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="submit">Save</Button>
            </div>
          </form>

          {isSuperAdmin && (
            <form
              action={async (fd) => {
                setMessage(null);
                setError(null);
                const result = await sendTestEmailAction(fd);
                if (result?.error) setError(result.error);
                else setMessage("Test email sent.");
              }}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">Test Email</h2>
              <div className="mt-4">
                <Label htmlFor="testEmail">Send test to</Label>
                <Input id="testEmail" name="testEmail" type="email" placeholder="your@email.com" />
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit">Send Test</Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function StatusRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {label}
        {hint ? (
          <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className={`rounded-full px-3 py-0.5 text-xs font-bold ${
          ok
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
        }`}
      >
        {ok ? "Set" : "Missing"}
      </span>
    </div>
  );
}
