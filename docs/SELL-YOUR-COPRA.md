# Sell Your Copra supplier enquiry

## What this page does

`/sell-your-copra/` lets a farmer prepare a supplier enquiry. It is separate from customer checkout and does not request payment. The farmer enters a name, Indian mobile number, estimated quantity and unit, grade, village/town and district, and optional notes. Quantities are normalized to kilograms for review (1 quintal = 100 kg; 1 metric tonne = 1,000 kg).

The form first displays a review. It then posts the details to `/api/supplier-enquiries/validate` for server-side validation and abuse throttling. A successful validation only enables the explicit **Request a Call Back** action, which opens a pre-filled `wa.me` draft to the public business number in `src/config/contact.ts`. The farmer must press Send in WhatsApp. The site does not claim the enquiry was sent or received.

This is not a confirmed sale or guaranteed price. The business owner must assess quality and separately agree on price and pickup. No photographs are collected because the site does not yet have secure upload/storage support.

## Data handling and privacy

- The supplier endpoint does not save enquiry fields or send notifications. Submitted values are used for request validation and are not returned in API responses. Do not add request-body logging.
- Once the farmer chooses WhatsApp, their entered name, mobile, quantity, grade, location and optional notes appear in the draft addressed to the configured business number. WhatsApp receives the draft only after the farmer presses Send.
- A privacy notice on the page explains these uses. Replace/update it if handling changes.
- The endpoint applies a honeypot and a limit of five validation attempts per rate window. When configured, it stores only a keyed hash of the client address and a count in the existing `RateLimitBucket` table; it does not store the address itself. Configure the dedicated `APP_DATABASE_URL`, `APP_ORIGIN` and a unique `RATE_LIMIT_HMAC_SECRET` (at least 32 characters) for production. The production endpoint fails closed if the limiter cannot run. The production ingress must overwrite `x-real-ip` and prevent direct access to the application origin, as required by the existing payment rate-limit helper. Never commit the actual secret.
- Local development uses a process-local throttle when the database limiter is unavailable. That throttle is only a development convenience; it is not a production spam-control mechanism.

## For reliable submission storage or notifications

The current workflow is intentionally a WhatsApp fallback, not a submission inbox. Reliable submission storage would require approval for a dedicated supplier-enquiry model/table, a migration, access controls for the business owner, data-retention/deletion rules, backup policy, server-side persistence, monitoring, and spam/rate-limit controls. Email or other notifications would require an approved provider, server-only credentials and delivery-failure handling. Do not place provider credentials in browser code. Consider consent and privacy wording before retaining farmer personal data.

The server-side rate limiter shares the payment `RateLimitBucket` table. Its runtime database access uses the restricted `APP_DATABASE_URL` role, not the Prisma CLI migration connection.

## Image

The hero uses `public/images/farmer-copra.avif`, copied from the image supplied by the business owner. It is an owner-provided asset; no third-party source or external license was introduced. Replace this file with an authorized business image while retaining the same path, or update the `Image` source in `src/app/sell-your-copra/page.tsx`.
