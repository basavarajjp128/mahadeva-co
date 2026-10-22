# SRI MAHADEVA & CO

Static website foundation for the coconut copra wholesale trading business. This repository is set up for Next.js App Router, React, strict TypeScript, Tailwind CSS, and static export. The public website content and catalogue have not yet been implemented.

## Requirements

- Node.js 24 LTS (the repository pins Node.js 24.22.1 in `.nvmrc`)
- npm (the lockfile is `package-lock.json`)

Install Node.js 24.22.1 with a version manager that supports `.nvmrc`, or use the official installer from [nodejs.org](https://nodejs.org/). Confirm `node --version` reports `v24.22.1` before installing dependencies.

## Setup and run

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. The current page is only a project placeholder; replace it with approved company content during implementation.

## Checks

```sh
npm run test          # Vitest unit and component tests
npm run test:e2e      # Playwright browser tests
npm run lint          # Biome lint checks
npm run format:check  # Biome formatting check
npm run typecheck     # TypeScript strict type check
npm run build         # Production build and static export
npm run deps:audit    # npm dependency advisory review
npm outdated          # Review available dependency updates
```

Playwright needs a browser installed once per machine. Install Chromium with `npx playwright install chromium` before running browser tests.

`npm run build` writes the static site to `out/`. Deploy that directory to a static host configured for HTTPS, route fallback/404 handling, and response security headers. The initial architecture has no API routes, server actions, database, authentication, payment processing, or order persistence. The generated site can be served without a Next.js Node server.

## Project layout

- `src/app/` — App Router entry point and route placeholders
- `src/components/` — shared and accessible UI components
- `src/data/` — typed product catalogue data
- `src/lib/` — small reusable utilities
- `tests/` — unit, component, and browser tests
- `public/` — local static assets
- `docs/` — project security and operations notes

## Content policy

Do not add unverified company details, contact information, prices, inventory, certifications, or delivery claims. Confirm business facts and obtain permission for image assets before publishing them. See [Security](docs/SECURITY.md) for development and deployment rules.
