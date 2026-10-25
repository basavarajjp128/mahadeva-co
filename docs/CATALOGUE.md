# Catalogue data

The live catalogue is the `public.products` table in Supabase PostgreSQL. The Shop, product details, home highlights, Contact selector and checkout price lookup read through server-only Prisma code.

See [database-backed product catalogue guidance](PRODUCT-CATALOGUE.md) for the existing-table migration, RLS/grants, seed behavior, price rules, environment variables and safe run steps.

`src/data/products.ts` is retained as the sample catalogue seed input. `src/data/test-products.ts` is a separate local-only fixture. Its products and ₹35/kg test prices are never written to the database or used in production.

Do not add unverified prices, stock levels, grades, moisture values, certifications, guarantees, delivery terms or purchase claims. Product quantity controls remain quotation tools unless checkout is explicitly enabled for a verified active database product.
