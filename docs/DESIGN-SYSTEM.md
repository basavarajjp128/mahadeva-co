# Design system

The first design pass uses an editorial, agricultural-trade visual language: warm cream surfaces, forest-green actions, coconut-brown accents, generous spacing and serif display headings. The CSS custom properties and responsive utilities live in `src/app/globals.css`.

## Tokens

- Brand colors: forest `#1B5E20`, coconut `#8B5E3C`, warm cream `#F8F5EE`, dark brown `#3E2723`, and sand `#D9C9AA`.
- Type: system serif stack for display headings and system sans-serif stack for interface and body text. No font requests leave the site.
- Space: `--space-1` through `--space-24`; section spacing uses a responsive `clamp()` scale.
- Shape and depth: shared radius, card shadow, and a high-contrast keyboard focus ring.
- Layout: `.container` sets the centered content width; `.section-space` applies responsive vertical rhythm.

## Shared components

- Site shell: `SiteHeader`, `BrandMark`, `SiteFooter`, and `Breadcrumb` in `src/components/site/`.
- UI: `Button` / `ButtonLink`, `Card`, `Badge`, `SectionHeading`, accessible form fields, and loading, empty, and error states in `src/components/ui/`.
- Product card: `ProductCard` in `src/components/catalogue/`, populated from typed entries in `src/data/products.ts`.
- Brand, contacts and links: business identity is in `src/config/brand.ts`, contact placeholders are in `src/config/contact.ts`, and shared links are in `src/config/navigation.ts`.
- Page copy: Home and About Us content is in `src/data/page-content.ts`; replace the visibly marked story placeholder only with business-approved details.

## Imagery and logo

The business supplied its logo. A transparent PNG version is stored at `public/images/sri-mahadeva-logo.png` and is used by the shared `BrandMark` component in the site header and footer. The original uploaded artwork is preserved outside the repository. The Home and About pages also use locally supplied coconut, farm and husking photographs. Their source and license details were not included with the files; review `docs/IMAGE-CREDITS.md` and confirm usage rights and whether they depict the business before public launch. Keep assets local and do not add third-party image embeds.

`BrandMark` centralizes logo usage and provides the accessible name “SRI MAHADEVA & CO”. Update that component if a revised approved logo is supplied.

`src/config/contact.ts` holds the public business WhatsApp/phone number and email placeholders, plus the unprovided address placeholder. The shared enquiry workflow routes enquiry links to Contact Us; its validated form opens an encoded WhatsApp draft when configured. It never sends or stores enquiries itself. See `docs/CONTACT-WORKFLOW.md` for the browser-only form and future backend requirements.

## Interaction and accessibility

- The compact navigation uses native `details` and `summary`, so it works with keyboard and without client-side JavaScript.
- Links and controls have visible focus styles; form fields connect labels, hints, and errors programmatically.
- Motion uses a shared, cleaned-up Intersection Observer for small section/card reveals, short CSS transitions for navigation, buttons, cards and gallery images, and a brief hero entrance. Content remains visible when scripting or Intersection Observer is unavailable, and `prefers-reduced-motion` disables these nonessential effects.
- Header navigation marks the current route with `aria-current="page"`; Shop stays active on its product-detail routes. The mobile disclosure retains native `details`/`summary` behavior, with a short CSS open/close transition where supported.
- The page uses semantic landmarks, heading order, a skip link, and descriptive alternative text.
