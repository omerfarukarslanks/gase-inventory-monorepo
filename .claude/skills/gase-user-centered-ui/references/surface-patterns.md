# Surface Patterns

Read this file when proposing design changes so the output matches the current repo instead of drifting into a generic style.

## Web Patterns

- App Router pages often compose domain-specific `PageClient.tsx` files.
- Operational screens rely on tables, filters, drawers, badges, and pagination.
- Theme values are expressed through CSS variables and Tailwind classes.
- Dense data is acceptable, but scanability must stay high.

## Mobile Patterns

- Expo Router files stay thin and re-export screen modules from `src/screens/*`.
- Shared React Native primitives live in `src/components/ui.tsx`.
- The mobile surface already leans on banners, cards, filter tabs, sticky actions, and accessible labels.
- Progressive disclosure is preferred over trying to fit every control on the first screen.

## Shared Visual Direction

- Green is the main brand accent.
- Typography centers on DM Sans.
- The current product tone is practical, operational, and trustworthy rather than playful.

## Watchouts

- Do not copy desktop table density straight into mobile.
- Do not solve ambiguity with decoration alone; solve it with hierarchy and microcopy.
- Do not introduce one-off token values when the same need belongs in the shared token layer.
