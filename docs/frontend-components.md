# Frontend component folders

## Overview

Storefront (customer) and admin UI components live in separate folders under `web/src/components/`, so audience-specific code is easy to find when debugging or extending features. Shared pieces used by both stay at the components root.

## Behavior / rules

| Audience | Folder | Use for |
|----------|--------|---------|
| Customer / storefront | `web/src/components/storefront/` | Homepage, catalog, product detail, storefront chrome (header/footer/search) |
| Admin | `web/src/components/admin/` | Admin shell, dashboard cards, product/category forms, admin dialogs |
| Shared | `web/src/components/` (root) | Cross-audience primitives only — currently `logo.tsx`, `theme-toggle.tsx` |

### Rules

- Prefer putting a new component in `storefront/` or `admin/` based on who sees it.
- Only keep a file at the components root when both storefront and admin import it.
- Mirror this split in `web/src/lib/` where it already exists (`lib/admin/` vs shared `lib/*`).
- Import via `@/components/storefront/…`, `@/components/admin/…`, or `@/components/…` for shared.

## Implementation

```text
web/src/components/
  logo.tsx                 # shared
  theme-toggle.tsx         # shared
  storefront/
    header.tsx
    header-search.tsx
    footer.tsx
    social-icons.tsx
    hero.tsx
    category-nav.tsx
    featured-products.tsx
    product-card.tsx
    product-catalog.tsx
    product-detail.tsx
  admin/
    header.tsx
    sidebar.tsx
    stat-card.tsx
    modal.tsx
    confirm-dialog.tsx
    product-form.tsx
    category-form.tsx
```

## Changes

- Moved customer-facing components from `web/src/components/*.tsx` into `web/src/components/storefront/`
- Left `admin/` as-is; left `logo` + `theme-toggle` at the root as shared
- Updated app imports and feature docs to the new paths
