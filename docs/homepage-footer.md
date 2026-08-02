# Homepage footer

## Overview

The storefront homepage footer (`web/src/components/storefront/footer.tsx`) gives visitors contact information and social media links alongside the existing copyright and legal links, so the homepage doesn't dead-end with just a copyright line.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Placement | Rendered once, at the bottom of `web/src/app/page.tsx` (below `<main>`) |
| Contact info | Dummy placeholder email, phone, and address — no real business details exist yet |
| Social links | Dummy placeholder profiles (Facebook, Instagram, X/Twitter, LinkedIn) — all `href="#"` until real URLs are provided |
| Legal links | Existing Help/Terms/Privacy links kept as-is (`href="#"` placeholders) |
| Static | No data fetching; all content is hardcoded, no backend involvement |
| Theming | Uses existing design tokens (`brand`, `ink`, `paper`, `slate`) and respects dark mode via existing `dark:` classes |

## Implementation

- `web/src/components/storefront/footer.tsx` — three-column layout (brand/tagline, contact, social) above a copyright + legal-links row
- `web/src/components/storefront/social-icons.tsx` — small inline SVG brand glyphs (`FacebookIcon`, `InstagramIcon`, `XIcon`, `LinkedinIcon`); added because `lucide-react` ships no trademarked brand icons, avoiding a new dependency
- Contact icons (mail, phone, pin) reuse the existing `lucide-react` dependency
- Shared `Logo` (`web/src/components/logo.tsx`) reused for the footer brand mark, consistent with the header

## Changes

- Added `web/src/components/storefront/social-icons.tsx` with dummy social brand icons
- Expanded `web/src/components/storefront/footer.tsx` with a Contact column (dummy email/phone/address) and a Follow us column (dummy Facebook/Instagram/X/LinkedIn links), keeping the existing copyright + Help/Terms/Privacy row
