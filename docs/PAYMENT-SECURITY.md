# Payment security and setup

## Current status

The payment interface is visible on product detail pages, but online payment is deliberately disabled for the sample catalogue. The visible disabled state explains that verified product and sale information is required and links to the existing quotation flow. No payment can be initiated from the sample listing.

The payment integration is test-mode only. It creates Razorpay orders on the server, verifies the checkout signature and then checks payment state with Razorpay before recording it. Signed webhooks use the unmodified request body and deduplicate provider event IDs. Payment state updates are monotonic to avoid an old event undoing a captured or refunded state. The site does not collect or store card credentials, and does not automatically mark an order fulfilled.

The payment migration has not been applied. The payment tables and enums were absent at the last successful read-only database check. A later connectivity check could not resolve the database host, so role membership and current default privileges must be rechecked before provisioning. No production payment readiness is implied.

## Local test fixture

The local test catalogue is separate from the database seed input `src/data/products.ts` in `src/data/test-products.ts`. It contains four clearly labeled test entries. Enable it only for local development with `ENABLE_PAYMENT_TEST_DATA=true` in an ignored `.env.local` file, then restart the development server. The ₹35/kg fixture prices and INR-based totals are in `src/server/payment-test-pricing.ts`; Standard Dried Copra and Premium Dried Copra are configured to exercise test checkout, while Wholesale Copra and Bulk Copra Supply are enquiry-only. These names and prices are test fixtures, not verified product data or an offer.

The server and catalogue helpers always disable the fixture when `NODE_ENV=production`, even if the switch is accidentally set. Database-backed product pages also require the development `APP_DATABASE_URL` and product migration. Order creation accepts the fixture only when the same switch is on, the app is not in production, the product is configured for test checkout, and the server has test-mode Razorpay credentials and a database. No live Razorpay key is accepted. Test checkout remains disabled if any requirement is missing.

The fixture supports quantity presets of 25, 100, 299, 300, 500, 1,000 and 5,000 kg. Less than 300 kg may proceed to test checkout only for direct-checkout fixture products; at 300 kg and above, the interface and server require an enquiry. In local test mode only, the browser requests daily indicative INR reference rates from [Frankfurter](https://frankfurter.dev/) for display conversion. The request contains no customer or enquiry data. Converted amounts are display-only, not the amount sent to Razorpay. If rates cannot be loaded, the interface remains in INR. The rate provider returns reference rates and may update them on its own schedule; this is not a financial quote. The production guard prevents test products/prices and this converter from being rendered in production.

To preview the development fixture, first configure the development database and apply the reviewed product migration, then set the switch and restart `npm run dev`. This enables browsing the fixture and testing the selector, quantity boundary and conversion UI. To run an actual Razorpay test checkout, the payment migration and test credentials are also required.

## Before test checkout can be enabled

The owner must provide and approve all of the following:
1. A verified, active, non-sample product in `public.products`, with its exact Decimal price, currency, price unit, supported units and explicit direct-checkout approval. Current online checkout accepts only INR per kilogram and requires `KG` in the supported sales units; other combinations remain enquiry-only. The server reads this product directly from PostgreSQL and ignores client-supplied totals.
2. Eligibility for online sale and the applicable tax, shipping, fee and rounding rules. The current calculation rounds a fractional paise half-up; confirm this matches the approved sale rules before use.
3. A PostgreSQL database and the dedicated `smc_payment_runtime` role. Configure `DATABASE_URL` as the Prisma CLI/migration connection and `APP_DATABASE_URL` as the server runtime connection in the ignored local `.env` file or a host secret manager. Only the migration job should receive `DATABASE_URL`; the web process should receive `APP_DATABASE_URL`.
4. Razorpay **test-mode** key ID and key secret, plus the webhook secret, in the ignored local `.env` file or the host secret manager. Key IDs must use the `rzp_test_` prefix. Never send credentials in chat or commit them.
5. The exact application origin in `APP_ORIGIN` and a unique random `RATE_LIMIT_HMAC_SECRET` of at least 32 characters. Use HTTPS outside local development.
6. A test-mode Razorpay webhook pointed at `/api/payments/webhook`, configured for the payment authorization, failure, capture and refund events handled by the route. The configured webhook secret must match the test-mode endpoint secret.

`.env.example` contains placeholders only. Copy it to `.env` locally and replace values privately. Do not use `NEXT_PUBLIC_` for secrets. Before applying the migration, verify administrator privileges, current global and schema-specific default ACLs, and that the dedicated role does not already exist. Capture the current default ACL output (for example, `\\ddp`) for rollback. Run `prisma/security/prepare-payment-migration.sql` manually as the database administrator before the first `prisma migrate deploy`; this protects Prisma's ledger table, which Prisma creates before executing the migration file. Then review and run `prisma/security/provision-payment-runtime-role.sql`, and set its password through an interactive `psql` `\\password smc_payment_runtime` prompt or an approved secret manager. Never put the password in SQL files or chat. Set `APP_DATABASE_URL` to this role's connection string. Keep the migration URL in `DATABASE_URL` only for approved Prisma CLI operations.

The migration and pre-step explicitly revoke default table grants to `PUBLIC`, `anon`, `authenticated` and `service_role` for future tables created by `postgres` in `public`. That change does not remove grants from existing tables; future public tables need deliberate grants and RLS policies. PostgreSQL combines per-schema defaults with global defaults, so both scripts abort if they find a conflicting global table ACL rather than changing defaults across every schema without review. Inspect that condition before retrying. The four payment/rate-limit tables have no API-role grants, RLS enabled with no client policies, and ownership transferred to `smc_payment_runtime`. The migration ledger also has API-role grants revoked and RLS enabled. The runtime role's temporary schema `CREATE` privilege is revoked by the migration. Do not add permissive policies to make Prisma work: as owner, this server-only role can operate on its tables without them. The Supabase Data API roles cannot access these tables because they have no table privileges. After migration, run `prisma/security/verify-payment-runtime-access.sql` to assert those conditions; then run the existing unit/route tests and an approved staging-only Prisma smoke test.

The SQL migration encloses its DDL and ACL changes in an explicit PostgreSQL transaction. Prisma CLI documentation does not promise that each SQL file is otherwise wrapped atomically. If a deployment reports failure, inspect migration status and the database before retrying; do not assume that every failure mode left no migration-history marker. Recovery is to stop application writes, take/confirm a backup, inspect whether the SQL transaction rolled back, and use `prisma migrate resolve --rolled-back 20261023000000_payment_security` only if Prisma records the migration as failed and the migration DDL is confirmed absent. Never reset the database. A manual rollback of a successfully applied migration is destructive to any rows written since; only consider it after exporting and reviewing the affected data.

Apply migrations only to a deliberately selected development or staging database after reviewing the SQL and backup:

```sh
npm run db:migrate:deploy
```

That command changes the selected database. Do not run it against production without explicit approval.

## Runtime and endpoints

The application must run with the Next.js Node.js server runtime; a static export cannot execute these request-dependent handlers. Use a maintained Node.js 24 LTS patch, HTTPS, runtime secret management, backups and a PostgreSQL connection path permitted by the host. The application code reads `APP_DATABASE_URL`; Prisma CLI reads `DATABASE_URL` through `prisma.config.ts`. Keep both server-only and configure runtime/migration jobs separately. Review the host's trusted ingress behavior: the order-create limiter expects `x-real-ip` to be overwritten by the trusted ingress, and fails closed when no trusted client IP is available in production.
- `POST /api/payments/orders` validates same-origin requests, content type, body size, product eligibility, quantity and amount server-side, and limits requests before creating an order.
- `POST /api/payments/verify` compares the checkout HMAC in constant time and fetches payment state from Razorpay before persisting a verified result.
- `POST /api/payments/webhook` validates the signature over raw bytes, validates the event envelope, confirms sensitive payment state with Razorpay, and stores only event identifiers and a body digest rather than raw webhook content.

Razorpay Checkout is loaded only when the product has an approved price and the test configuration is valid. Its script and connect origins are allowed by the current CSP. Verify the full hosted checkout in a non-production browser with test credentials before release; this workspace has no such credentials, so provider script, CSP behavior and webhook delivery have not been end-to-end verified.

## Data and operations

The database stores product slug, quantity in kilograms, amount/currency, provider order/payment identifiers and payment statuses. It does not store customer contact details or payment card data. The rate limiter stores an HMAC-derived IP subject, not a plaintext IP. Webhook payloads are not persisted. Payment/order records currently have no automated retention or deletion policy; define and implement one with the business before processing real customer payments. Ensure database access, backups, monitoring and incident handling are configured by the hosting operator.

The current application has no inventory reservation, shipping, tax calculation, refunds administration or fulfillment workflow. A captured payment is not proof that goods were dispatched. The business must confirm fulfillment separately. No real purchase should be offered until terms, support/refund handling and operational ownership are defined.

## Threats and controls

| Risk                                       | Current control                                                                                                   | Remaining work                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Client changes product, quantity or amount | Server-side product allowlist, quantity conversion, price lookup and amount calculation; client amount is ignored | Add verified products/prices and review commercial rules                |
| Forged checkout callback                   | HMAC comparison in constant time, then provider API lookup for order, amount, currency and captured state         | Test with Razorpay test account                                         |
| Forged or replayed webhook                 | HMAC over raw body, unique event ID, idempotent transaction and monotonic state machine                           | Configure endpoint and monitor delivery/retries                         |
| Cross-site order creation                  | Exact origin validation, JSON content type, bounded body, rate limit                                              | Confirm ingress/proxy setup on selected host                            |
| Secret exposure                            | Server-only environment parsing; no client secret; test key ID only sent to Checkout                              | Configure a secret manager and rotation process                         |
| Database compromise or misuse              | Minimal stored fields, unique constraints and transaction handling                                                | Provision restricted DB role, backups, retention and monitoring         |
| Duplicate or excessive order requests      | Database-backed HMAC-subject rate limiter and unique provider IDs                                                 | Validate real host IP forwarding and tune limits using observed traffic |
| Browser script abuse / framing             | CSP nonce, Razorpay allowlist, response security headers, frame denial                                            | Verify CSP on hosted checkout and test rollout on the chosen host       |

## Release gates

Before any production release, complete a code review, dependency audit, test-mode end-to-end run, webhook retry/duplicate/out-of-order tests, host and database review, retention policy, customer support/refund and fulfillment procedures, monitoring/alerting and recovery checks. Live Razorpay keys and live payment processing require explicit owner approval and a separate release review. This implementation does not enable live credentials.

## Official references

- [Razorpay Node.js server integration](https://razorpay.com/docs/payments/server-integration/nodejs/)
- [Razorpay Standard Checkout integration steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)
- [Razorpay webhook validation and testing](https://razorpay.com/docs/webhooks/validate-test/)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Next.js guide](https://www.prisma.io/docs/guides/nextjs)
