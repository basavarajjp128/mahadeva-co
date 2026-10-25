# Contact and WhatsApp enquiry workflow

## Public contact configuration

`src/config/contact.ts` is the single public configuration location for the WhatsApp number, phone, email and address. The business WhatsApp number is configured as a public contact detail; email and address remain `null` placeholders until supplied. For an Indian WhatsApp number, include country code `+91` in configuration. The generated `wa.me` path removes plus signs, spaces and punctuation, producing digits only. These are public website details, never credentials.

## What happens in the first release

- Contact and Bulk Orders pages render through the Next.js server runtime. Enquiry CTAs from across the site use the shared `EnquiryLink` and navigate to Contact Us.
- Product, quantity, unit, enquiry type and delivery location can be carried in fixed, allowlisted query parameters. `src/lib/enquiry-context.ts` validates them against the catalogue and quantity rules. Unknown products, unsupported units, malformed or excessive quantities, and overlong locations are omitted; values are rendered as escaped React text.
- The Contact Us page shows valid carried context and pre-fills its optional product and quantity fields. Browser-side validation checks required values, length bounds, a phone or email contact method, catalogue product selection, and quantity/unit values.
- Once a business number is configured, submitting a validated enquiry opens a URL on the fixed `https://wa.me/` host with an encoded draft addressed to that number. The message includes SRI MAHADEVA & CO, enquiry type, product when selected, quantity and unit when entered, optional delivery location, and the customer's name and message when entered. Customer phone and email fields are not copied into the WhatsApp message.
- Until the WhatsApp number is configured, the WhatsApp action is disabled and the page explains where to set it. Until the business email is configured, the email action is unavailable and the page shows the setup location.
- The visitor must review the draft and press Send in WhatsApp. The site does not send it automatically. The `wa.me` link can open the WhatsApp app or web flow but cannot deliver a message without the visitor's action.
- Once configured, an encoded `mailto:` draft is addressed to the business and includes a useful subject and enquiry details. It opens the visitor's configured email application and does not guarantee delivery or sending.
- The customer Contact Us form remains a client-side WhatsApp workflow and does not save enquiries. The separate farmer Sell Your Copra workflow has a server endpoint only for validation and rate limiting; it does not persist submissions or send notifications. Neither workflow logs personal details or message contents.

Do not treat client-side checks as trusted business validation. The payment backend does not handle customer or farmer enquiry submissions. For reliable supplier submission storage or notification, see [SELL-YOUR-COPRA.md](SELL-YOUR-COPRA.md); server-side validation, spam prevention, rate limiting, retention/access rules and any persistence must be designed explicitly. Keep provider credentials out of the browser.
