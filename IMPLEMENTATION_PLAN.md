# WirelessCom — Implementation Plan (Remaining Features)

Phased checklist for gap items only. See `GAP_ANALYSIS.md` for status.

## Phase 1 — Auth + Banner

- [x] `src/lib/password-policy.ts` — shared validation
- [x] Forgot/reset password (customer + admin routes + `PasswordResetToken`)
- [x] Customer change password on profile
- [x] `PasswordInput` on storefront login/register
- [x] `SiteSettings.announcementText` + header wiring

## Phase 2 — Leads + UX

- [x] `QuoteSubmission` model + persist in `quote.ts`
- [x] `/admin/leads` page
- [x] Dark mode (`next-themes`, toggle, CSS tokens)
- [x] `proudlyCanadianEnabled` setting
- [x] Featured item edit + media fallback

## Phase 3 — Orders + Shipping

- [x] Order editor: billing, add product, shipping/tax override
- [x] Ledger + invoice re-sync on PAID order edits
- [x] `ShippingClass`, `ShippingZone`, product shipping fields
- [x] Zone + weight shipping calculation
- [x] Admin order shipping breakdown panel

## Phase 4 — Polish

- [x] Frequencies on invoice PDF + emails + customer order detail
- [x] Variant edit/delete/sale/image
- [x] Expense edit, partial refund metadata, re-send invoice
- [x] `/admin/accounting/pnl`

## Phase 5 — Security + Tests

- [x] Customer login lockout + rate limits
- [x] Vitest suite + `npm test`
- [x] `SECURITY_REPORT.md`, `TESTING_REPORT.md`

## Migration

```bash
npx prisma migrate deploy
```

Migration: `prisma/migrations/20250625000000_remaining_features/`
