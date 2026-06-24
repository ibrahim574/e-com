"use client";

import { useState } from "react";
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

const TABS = [
  { id: "currency", label: "Currency" },
  { id: "tax", label: "Tax Rules" },
  { id: "shipping", label: "Shipping" },
  { id: "invoice", label: "Invoice" },
  { id: "smtp", label: "SMTP" },
  { id: "quote", label: "Quote Notifications" },
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
}: {
  settings: SiteSettings;
  signalTypes: Attr[];
  frequencyBands: Attr[];
  taxRules: TaxRuleRow[];
  shippingRegions: ShippingRow[];
  shippingZones: ShippingZoneRow[];
  invoiceSettings: InvoiceSettingsData;
  isSuperAdmin: boolean;
}) {
  const [tab, setTab] = useState<TabId>("currency");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    await updateInvoiceSettingsAction(formData);
    setMessage("Invoice settings saved.");
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
