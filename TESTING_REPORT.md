# Testing Report — WirelessCom

**Date:** June 2025  
**Runner:** Vitest 3.x (Node environment)

## How to Run

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Test Suite

| File | Coverage |
|------|----------|
| `src/lib/password-policy.test.ts` | Password complexity validation |
| `src/lib/tax-rules.test.ts` | HST calculation on subtotal + shipping |
| `src/lib/shipping.test.ts` | Weight aggregation for zone-based shipping |
| `src/lib/related-products.test.ts` | Manual related-product ID deduplication order |

## Build Verification

```bash
npx prisma generate
npm run build
```

Run database migrations when PostgreSQL is available:

```bash
npx prisma migrate deploy
```

## Manual Test Checklist (Gap Rollout)

1. Header announcement text editable in Settings → Shipping; footer Proudly Canadian toggle works
2. Forgot/reset password (customer + admin); profile password change enforces policy
3. Dark mode toggle persists (storefront + admin)
4. Quote/pre-order submissions appear in `/admin/leads` with CSV export
5. Admin order: billing, add line item, shipping/tax overrides, PAID ledger/invoice re-sync
6. Product shipping fields + province zones affect checkout when weight data present
7. Invoice PDF and emails show custom frequencies
8. Variant edit/delete; featured item edit; expense inline edit; partial refund metadata; re-send invoice; `/admin/accounting/pnl`

## Notes

- Integration tests for Prisma-backed actions (e.g. quote persistence) are not included to avoid requiring a test database in CI; add `vitest` + test DB when CI is configured.
- E2E browser tests are out of scope for this deliverable.
