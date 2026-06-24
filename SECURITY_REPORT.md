# Security Report — WirelessCom

**Date:** June 2025  
**Scope:** Storefront, admin panel, accounting module, and gap-fix rollout

## Summary

A security review was performed against authentication, authorization, input handling, and sensitive data exposure. Several hardening measures were applied during this rollout; residual risks are documented below.

## Implemented Controls

| Area | Control |
|------|---------|
| Passwords | bcrypt cost 12; unified policy (8+ chars, upper/lower/number/special); no plaintext storage |
| Password reset | SHA-256 hashed tokens, 1-hour expiry, single-use, anti-enumeration responses |
| Login lockout | Shared `login-lockout.ts` for **admin and customer** login (5 failures / 15 min / IP+email) |
| Sessions | Auth.js credentials; configurable admin session timeout in Site Settings |
| Authorization | `requireAdmin` / `getActorOrThrow` on admin actions; role checks on sensitive routes |
| Middleware | Security headers and route protection in `src/middleware.ts` |
| Secrets | SMTP password encrypted at rest; sensitive fields stripped from API responses |
| Audit | Admin actions recorded with optional IP and before/after snapshots |
| File uploads | Invoice logo, expense attachments, and featured images restricted by MIME/size in actions |
| CSRF | Next.js Server Actions + Auth.js defaults for mutating requests |

## Fixes Applied (This Rollout)

1. **Customer login lockout** — `loginAction` now uses the same lockout tracker as admin login.
2. **Password policy** — Registration, admin create, change-password, and reset flows enforce complexity rules.
3. **Reset tokens** — Stored hashed; invalidated on use; old tokens cleared on new request.
4. **Lead export / admin actions** — Gated behind `getActorOrThrow()`.

## Residual Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Rate limiting on public forms | Medium | Quote/submit and forgot-password rely on SMTP/app server; consider edge rate limits in production |
| PayPal refund automation | Low | Refunds recorded manually; no automatic PayPal API reversal |
| Dependency vulnerabilities | Medium | Run `npm audit` periodically; 7 advisories reported at time of review |
| DB migration deploy | Low | New tables/columns require `npx prisma migrate deploy` on production |
| Customer checkout audit | Low | Order placement not yet written to audit log (admin edits are) |

## Recommendations

1. Enable WAF / reverse-proxy rate limits on `/account/login`, forgot-password, and quote endpoints.
2. Rotate SMTP and PayPal secrets on a schedule.
3. Enforce HTTPS and HSTS at the hosting layer.
4. Review `SECURITY_REPORT.md` after major feature releases.

## Verification

- [x] Passwords hashed with bcrypt
- [x] Reset tokens single-use and expiring
- [x] Admin routes require authenticated admin role
- [x] Invoice PDF/email routes require ownership or admin
- [x] Customer + admin login lockout active
