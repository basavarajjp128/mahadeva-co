# Database-backed product catalogue

## Data flow

The Shop, product detail, home highlights and Contact product selector read active rows from `public.products` through server-only Prisma queries using `APP_DATABASE_URL`. Inactive rows and unknown slugs are not returned. The shop and product pages are request-rendered so catalogue edits appear without rebuilding the site. Prisma never runs in a Client Component.

The table already existed before Prisma managed it. The migration at `prisma/migrations/20261025000000_product_catalogue/migration.sql` adds nullable price and media details, sales-unit fields, sample/checkout flags and `updated_at`; it preserves the existing UUID, slug, category, status and creation timestamp. It does not insert, update or delete catalogue rows. Existing rows default to `is_sample = true` until the business reviews them; this prevents unreviewed records being presented as verified or purchased. The migration expects `smc_payment_runtime` to exist, be a non-owner of `products`, and have neither `SUPERUSER` nor `BYPASSRLS`.

RLS is enabled on `products`. Public Data API roles receive `SELECT` only, with a policy that exposes active rows. The runtime role also receives `SELECT` only on this table and an active-row policy. No browser-facing policy can insert, update or delete products. `service_role` is explicitly revoked from this table; the application must use its restricted runtime connection for catalogue reads. Verify role membership and inherited privileges before applying the migration.

Prices and price units are returned with active product rows and therefore are public. They remain null until verified details are entered. Direct checkout additionally requires a non-sample active product, explicit `is_direct_checkout_enabled`, an INR price per kilogram, and KG in `supported_sales_units`. The order API reads that product and computes the total on the server; it never trusts browser-supplied prices. Other price units can be stored for display or enquiry, but direct checkout stays disabled until its amount-conversion and commercial rules are implemented and reviewed. `PaymentOrder` continues to store a price, currency, quantity and slug snapshot; existing Razorpay verification and webhook logic are unchanged.

## Static data and seed

`src/data/products.ts` is retained as seed input, not as a runtime catalogue. `prisma/seed.ts` imports its entries and inserts them as active sample listings with no price or direct-checkout permission. It uses `createMany({ skipDuplicates: true })` with the unique slug as the conflict key. Re-running it does not add duplicate slugs or overwrite a database row that has since been edited. The four records in `src/data/test-products.ts` are development payment fixtures and are never seeded.

After verified catalogue data is entered and backed up, `src/data/products.ts` may be removed only after confirming that the seed file is no longer needed for repeatable setup and has been replaced by an approved import source. `src/data/test-products.ts` remains separate for opt-in local checkout testing.

Product image paths use local public assets, for example `/images/copra-stock.jpg`. Missing database image paths fall back to that existing local image; set a product-specific path and meaningful alt text when verified assets are available. No stock, inventory, capacity, grade or availability is inferred from the product row.

## Environment and operation

- `DATABASE_URL`: Prisma CLI migration connection and controlled seeding connection. Keep it out of the web runtime where possible.
- `APP_DATABASE_URL`: server runtime role connection for active catalogue reads and existing payment/rate-limit work.

Both are server-only. Do not use `NEXT_PUBLIC_` prefixes or commit local environment files. `.env.example` contains placeholders only.

Review the amended SQL and current database migration history before applying anything. This repository has an earlier payment migration too; if it is still pending, `prisma migrate deploy` would process both migrations in timestamp order. Back up the selected database and verify its migration ledger before applying. After separate approval, run migrations first, then seed. The seed requires the Prisma CLI connection to have insert rights on `products`; do not grant those rights to the runtime role. The seed is not run by build, postinstall or development startup. After applying, run the read-only ACL/RLS assertions in `prisma/security/verify-product-catalogue.sql` and review its policy/grant output.

```sh
npm run db:generate
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build

# Only after reviewing/approving the target database, backup, SQL and pending migrations:
npm run db:migrate:deploy
npm run db:seed
```

The migration is additive and contains no product-row data changes. Recovery still requires a database backup and review; Prisma migrations do not provide automatic down migrations. Do not reset the database. If application code is rolled back after the migration, the additive columns and policies can remain in place while the earlier application version is restored.
