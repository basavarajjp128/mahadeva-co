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
- Brand and links: business copy is in `src/config/brand.ts`; site links are in `src/config/navigation.ts`.

## Imagery and logo insertion

There is no supplied company logo or approved product photography in the project. `public/images/copra-editorial.svg` is an original local illustration used to demonstrate image placement and crop behavior. Replace it with approved, high-resolution photographs of the actual product when available, and update the `image` and descriptive `imageAlt` in `src/data/products.ts`. Keep assets local and do not add third-party image embeds.

The text-based `BrandMark` is intentional and is not a fabricated logo file. When the real logo is supplied, add its asset under `public/images/` and update `src/components/site/brand-mark.tsx`, preserving the accessible name “SRI MAHADEVA & CO”.

## Interaction and accessibility

- The compact navigation uses native `details` and `summary`, so it works with keyboard and without client-side JavaScript.
- Links and controls have visible focus styles; form fields connect labels, hints, and errors programmatically.
- Motion is limited to short hover and loading feedback and is reduced for users who request reduced motion.
- The page uses semantic landmarks, heading order, a skip link, and descriptive alternative text.
