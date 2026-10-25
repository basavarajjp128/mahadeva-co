# SRI MAHADEVA & CO

Public-facing website for SRI MAHADEVA & CO, a coconut copra wholesale trading business in India. Built with Next.js App Router, React, strict TypeScript, Tailwind CSS, Prisma 7 and a Node.js server runtime. The Shop, product details, home highlights and Contact selector read active products from Supabase PostgreSQL through server-only Prisma access.

## Requirements

- Node.js 24 LTS (the repository pins Node.js 24.22.1 in `.nvmrc`)
- npm (the lockfile is `package-lock.json`)

Install Node.js 24.22.1 with a version manager that supports `.nvmrc`, or use the official installer from [nodejs.org](https://nodejs.org/). Confirm `node --version` reports `v24.22.1` before installing dependencies.

## Setup and run

```sh
npm ci
npm run dev
```

Before previewing the database-backed catalogue, configure `APP_DATABASE_URL` for runtime product queries and apply the reviewed migrations and seed to a development database. Keep `DATABASE_URL` for Prisma CLI migrations and controlled seed runs. Enquiry links route to Contact Us, where validated details prepare WhatsApp/email drafts in the visitor's browser; the site does not submit or save them. Configure verified public contact details in `src/config/contact.ts` before enabling those actions. Payment routes remain fail-closed until an active verified product is explicitly approved for checkout and has a valid INR/kg price.

To preview the separate development-only copra test catalogue and ₹35/kg test-price UI, add `ENABLE_PAYMENT_TEST_DATA=true` to your ignored local `.env.local` and restart the dev server. This switch is ignored in production. The foreign currency display uses daily indicative reference rates and does not change the INR amount that the server sends to Razorpay. A configured development database is needed for catalogue pages; actual Razorpay test checkout also requires test-mode credentials. See [payment security and setup](docs/PAYMENT-SECURITY.md) and [database-backed catalogue guidance](docs/PRODUCT-CATALOGUE.md).

Run the optional Playwright fixture flow on a separate local port with `PLAYWRIGHT_PORT=3210 ENABLE_PAYMENT_TEST_DATA=true npm run test:e2e` after configuring the development database. It starts a development server for the run and verifies the test catalogue, displayed price, quantity boundary and enquiry selection.

## Checks

```sh
npm run test          # Vitest unit and component tests
npm run test:e2e      # Playwright browser tests
npm run lint          # Biome lint checks
npm run format:check  # Biome formatting check
npm run typecheck     # TypeScript strict type check
npm run build         # Production server build
npm run start         # Start the built Next.js Node server
npm run db:generate   # Generate the Prisma client
npm run db:migrate:dev # Create/apply development migrations (requires DATABASE_URL)
npm run db:migrate:deploy # Apply committed migrations in an approved environment (DATABASE_URL)
npm run db:seed           # Import sample products after the migration, only when approved
npm run deps:audit    # npm dependency advisory review
npm outdated          # Review available dependency updates
```

Playwright needs a browser installed once per machine. Install Chromium with `npx playwright install chromium` before running browser tests.

`npm run build` creates a Next.js server build. Run it with `npm run start` on a Node.js host that supports App Router Route Handlers, HTTPS, runtime secrets, and connections to the configured PostgreSQL database. Do not deploy the `out/` folder or use a static-only host. Prisma CLI operations use `DATABASE_URL`; the running application uses `APP_DATABASE_URL` and should receive only the dedicated runtime role connection. See [Payment security and setup](docs/PAYMENT-SECURITY.md) before configuring payment credentials or applying migrations.

## Project layout

- `src/app/` — App Router pages and global styles
- `src/components/` — shared and accessible UI components
- `src/config/` — brand, contact placeholders, and site navigation
- `src/data/` — product seed input, opt-in test fixtures and editable page copy
- `src/server/` — server-only Prisma catalogue, payment and rate-limit access
- `src/lib/` — small reusable utilities
- `tests/` — unit, component, and browser tests
- `public/` — local static assets
- `docs/` — project security and operations notes

## Content policy

Do not add unverified company details, contact information, prices, inventory, certifications, or delivery claims. Review [image credits](docs/IMAGE-CREDITS.md) and replace the clearly labeled temporary stock photos with approved company photography before publication. See [Security](docs/SECURITY.md) for development and deployment rules.

The Shop reads active rows from the existing `public.products` table. Its migration adds catalogue fields and active-only read policies while preserving existing UUIDs and rows. Review [database-backed catalogue guidance](docs/PRODUCT-CATALOGUE.md), [legacy catalogue guidance](docs/CATALOGUE.md), and [Payment security and setup](docs/PAYMENT-SECURITY.md) before applying migrations or seeding. Sample rows have no price and cannot be purchased. Checkout uses only verified database product prices read on the server and remains fail-closed by default.
