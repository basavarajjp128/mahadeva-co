# Product catalogue data

The first catalogue entry in `src/data/products.ts` is explicitly sample content. It is for demonstrating the page structure and does not represent an offer for sale or confirm product availability. Do not publish it as verified catalogue information.

## Replacing the sample

Keep catalogue records in `src/data/products.ts` while the catalogue is small. Replace the sample object only after the business has confirmed the details. Keep this module independent of UI components so a future repository adapter can provide the same `Product` shape if the business later needs a database.

For each verified item, maintain:
- A stable unique `id` and URL-safe unique `slug`.
- The approved `displayName` and a factual `description`.
- A local image path under `public/images/`, approved for business use, with useful `imageAlt` text.
- `packagingInformation` only when the business has verified it; otherwise keep `null`.
- `enquiryAvailability` to reflect whether the configured enquiry channel is actually ready. This field describes the contact path only and must not mean stock availability.
- `isSample: false` only after the business has reviewed and approved that record.

Do not add price, stock, grades, moisture levels, certifications, guarantees, delivery terms or purchase claims unless they are confirmed and the site is deliberately updated to represent them. The quantity widget is for preparing an enquiry only. Its 1,000,000 kg input ceiling is a software validation limit, not a supply limit.

Before replacing sample data, verify each detail with the business owner, review the image source and usage rights, check the product detail page and alt text, then run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
