# Rapid Radio Gear - E-Commerce Platform

Custom full-stack Next.js e-commerce store for two-way radios and accessories.

## Features

- Conversion-focused storefront (hero, trust badges, featured products, categories, industries, testimonials, newsletter)
- Product catalog with search, categories, industries, and product detail pages
- Product variants/options with CAD/USD pricing and sale prices
- Guest + account checkout with PayPal
- Customer accounts with order history
- Admin panel for products, categories, industries, and orders

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Auth.js (NextAuth)
- PayPal Server SDK
- Docker Compose

## Prerequisites

- Node.js 20+
- Docker Desktop (Windows 11 dev) or Docker Engine (Debian prod)
- PayPal Developer account (sandbox keys for testing)

## Windows 11 Development

### Option A: Docker (recommended)

```powershell
# Copy environment file
copy .env.example .env

# Start app + database
docker compose up --build
```

Open http://localhost:3000

### Option B: Local Node + Docker Postgres only

```powershell
copy .env.example .env

# Start only Postgres
docker compose up db -d

# Install deps and setup DB
npm install
npx prisma generate
npx prisma db push
npm run db:seed

# Run dev server
npm run dev
```

## Default Admin Login

After seeding:

- Email: `admin@example.com`
- Password: `admin123`

Admin panel: http://localhost:3000/admin

Change credentials via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before seeding.

## Email / OTP Signup

Customer signup is a two-step flow: enter details, then verify a 6-digit code
emailed to the address. Configure SMTP in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Hytera Radios <your-sender@gmail.com>"
```

For Gmail, enable 2-Step Verification and create an App Password
(https://myaccount.google.com/apppasswords). If `SMTP_HOST` is left empty, the
OTP is logged to the server console instead of being emailed (handy for local
testing without credentials).

## PayPal Setup

1. Create a PayPal Developer app at https://developer.paypal.com
2. Add sandbox credentials to `.env`:

```env
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-secret
PAYPAL_MODE=sandbox
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-sandbox-client-id
```

### Sandbox is safe for public testing

With `PAYPAL_MODE=sandbox`, the server uses PayPal's sandbox API — no real money is charged. Test buyers use sandbox accounts at https://sandbox.paypal.com. Your database will still record orders as paid (that is your app's state, not a real transaction). Use sandbox credentials only until you intentionally switch to live.

## Public Testing (Cloudflare)

Use this when the site is behind Cloudflare's orange-cloud proxy. It runs a **production build** on port 80 (no dev auto-reload, buttons work from remote PCs).

### Zero-config deploy (recommended)

A ready-to-run env file is committed at [`.env.public`](.env.public) with your domain, PayPal sandbox keys, and SMTP credentials. On Ubuntu:

```bash
git clone https://github.com/AbuSufian6543/wirelesscom-e-commerce.git
cd wirelesscom-e-commerce
chmod +x deploy-public.sh
./deploy-public.sh
```

Or without the script:

```bash
docker compose --env-file .env.public -f docker-compose.public.yml up -d --build
```

Open **https://hyteraradios.ca** from any PC.

Cloudflare settings (one-time in dashboard):

- **SSL/TLS → Flexible** (browser HTTPS, origin HTTP on port 80)
- **Rocket Loader → Off**
- **Auto Minify JavaScript → Off**

Default admin after seed: `admin@example.com` / `admin123` at `/admin`.

### Custom env (optional)

If you need different values, copy and edit:

```bash
cp .env.example .env
nano .env
```

Set at minimum:

```env
AUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=<sandbox client id>
PAYPAL_CLIENT_SECRET=<sandbox secret>
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<same sandbox client id>
```

Then deploy:

```bash
docker compose --env-file .env -f docker-compose.public.yml up -d --build
```

## Debian Production Deployment

On your Debian server with a public IP:

```bash
# Clone/copy project to server
git clone <your-repo> radio-store
cd radio-store

# Configure environment
cp .env.example .env
nano .env
```

Set production values:

```env
AUTH_SECRET=<long-random-string>
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DOMAIN=yourdomain.com
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
POSTGRES_PASSWORD=strong-password
```

Deploy with Caddy reverse proxy:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy will obtain TLS certificates automatically when `DOMAIN` points to your server.

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
npm run extract:product-images -- --pdf "path/to/pricebook.pdf"  # Extract images from PDF

# Public testing (Cloudflare)
./deploy-public.sh
# or: docker compose --env-file .env.public -f docker-compose.public.yml up -d --build

# Production (Caddy + own TLS)
docker compose -f docker-compose.prod.yml up -d --build
```

## Project Structure

```
src/
  app/
    (store)/          # Storefront pages
    admin/            # Admin panel
    actions/          # Server actions
    api/auth/         # Auth.js routes
  components/         # UI components
  lib/                # Utilities, auth, prisma, paypal
prisma/
  schema.prisma       # Database schema
  seed.ts             # Sample data
```

## Environment Variables

See `.env.example` for all required variables.

## Product images (from pricebook PDF)

Product photos live in `public/products/` as WebP files extracted from the Hytera DMR Pricebook PDF. They are committed to the repo so Docker/production does not need the PDF at runtime.

The extractor post-processes each image: PDF black/white backgrounds are replaced with off-white (`#f8fafc`), letterboxing is trimmed, and output is normalized to a 900×900 square canvas.

To re-extract after a pricebook update:

```powershell
# One-time: install Python deps (use Python 3.10+)
python -m pip install pymupdf pillow

# Extract images (adjust PDF path)
python scripts/extract-pricebook-images.py --pdf "C:\path\to\Hytera DMR Pricebook 2026 1-28.pdf"

# Or via npm (pass --pdf after the script name)
npm run extract:product-images -- --pdf "C:\path\to\pricebook.pdf"
```

Page-to-product mapping is in `scripts/pricebook-image-map.json`. Debug a PDF page:

```powershell
python scripts/extract-pricebook-images.py --pdf "path\to\pricebook.pdf" --list-page 3
```

After extracting or updating images, re-seed so the database picks up paths:

```bash
docker compose exec app npx prisma db seed
# or locally:
npm run db:seed
```

To re-run post-processing on existing `public/products/*.webp` without the PDF:

```powershell
python scripts/extract-pricebook-images.py --postprocess-only
```

## Notes

- Multi-currency: CAD and USD prices are stored per product (no live FX).
- Shipping uses flat-rate placeholders; configure in `src/lib/constants.ts`.
- Sized for ~5k users on a single Dockerized server.
