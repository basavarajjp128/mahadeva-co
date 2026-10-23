# SRI MAHADEVA & CO

Public-facing website for SRI MAHADEVA & CO, a coconut copra wholesale trading business in India. Built with Next.js App Router, React, strict TypeScript, Tailwind CSS, and a Node.js server runtime. Home, Shop, sample Product Details, About Us, Contact Us, Bulk Orders and Gallery pages are implemented; catalogue, prices and company-story details remain editable and should be confirmed before publication.

## Requirements

- Node.js 24 LTS (the repository pins Node.js 24.22.1 in `.nvmrc`)
- npm (the lockfile is `package-lock.json`)

Install Node.js 24.22.1 with a version manager that supports `.nvmrc`, or use the official installer from [nodejs.org](https://nodejs.org/). Confirm `node --version` reports `v24.22.1` before installing dependencies.

## Setup and run

```sh
npm ci
npm run dev
```

Open <http://localhost:3000> to preview the site. Enquiry links route to Contact Us, where validated details prepare WhatsApp/email drafts in the visitor's browser; the site does not submit or save them. Configure verified public contact details in `src/config/contact.ts` before enabling those actions. Payment routes require server-only configuration and a PostgreSQL database; payments remain disabled until verified products and prices are configured.

To preview the separate development-only copra test catalogue and ₹35/kg test-price UI, add `ENABLE_PAYMENT_TEST_DATA=true` to your ignored local `.env.local` and restart the dev server. This switch is ignored in production. The foreign currency display uses daily indicative reference rates and does not change the INR amount that the server sends to Razorpay. No credentials are needed to preview products or quantity rules. A real Razorpay test checkout additionally requires test-mode credentials and a development database; see [payment security and setup](docs/PAYMENT-SECURITY.md).

Run the optional Playwright fixture flow on a separate local port with `PLAYWRIGHT_PORT=3210 ENABLE_PAYMENT_TEST_DATA=true npm run test:e2e`. It starts a development server for the run and verifies the test catalogue, displayed price, quantity boundary and enquiry selection.

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
npm run db:migrate:deploy # Apply committed migrations in an approved environment
npm run deps:audit    # npm dependency advisory review
npm outdated          # Review available dependency updates
```

Playwright needs a browser installed once per machine. Install Chromium with `npx playwright install chromium` before running browser tests.

`npm run build` creates a Next.js server build. Run it with `npm run start` on a Node.js host that supports App Router Route Handlers, HTTPS, runtime secrets, and connections to the configured PostgreSQL database. Do not deploy the `out/` folder or use a static-only host. See [Payment security and setup](docs/PAYMENT-SECURITY.md) before configuring payment credentials or applying migrations.

## Project layout

- `src/app/` — App Router pages and global styles
- `src/components/` — shared and accessible UI components
- `src/config/` — brand, contact placeholders, and site navigation
- `src/data/` — typed product catalogue and editable page copy
- `src/lib/` — small reusable utilities
- `tests/` — unit, component, and browser tests
- `public/` — local static assets
- `docs/` — project security and operations notes

## Content policy

Do not add unverified company details, contact information, prices, inventory, certifications, or delivery claims. Review [image credits](docs/IMAGE-CREDITS.md) and replace the clearly labeled temporary stock photos with approved company photography before publication. See [Security](docs/SECURITY.md) for development and deployment rules.

The Shop currently contains a clearly marked sample listing and cannot be purchased. The payment integration is fail-closed and remains unavailable until the owner supplies verified product prices, currency, final tax/fee policy and checkout eligibility. See [catalogue data guidance](docs/CATALOGUE.md) and [Payment security and setup](docs/PAYMENT-SECURITY.md) before replacing sample catalogue content.
