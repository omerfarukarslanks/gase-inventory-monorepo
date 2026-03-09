---
name: gase-feature-guardrails
description: Implement and review features in the Gase inventory monorepo across apps/web, apps/mobile, and packages/*. Use when adding or changing screens, routes, tables, drawers, forms, filters, dashboards, auth flows, or data-fetching logic so the work follows current Gase architecture, respects permissions and store scope, uses shared packages before copying code, keeps web/mobile parity in mind, and always ships loading, empty, error, and success states.
---

# Gase Feature Guardrails

Use this skill to turn a product request into a concrete implementation that fits the current monorepo instead of adding one-off code.

## Start With Placement

- Decide whether the change is web-only, mobile-only, or shared before editing files.
- Keep route entry files thin.
- In `apps/web`, treat `app/**/page.tsx` and `PageClient.tsx` files as composition points and push reusable UI into `components/<domain>`.
- In `apps/mobile`, keep `app/**` files as thin Expo Router wrappers and place screen logic in `src/screens/*`.
- Put business rules, API contracts, domain types, normalization, and cross-surface data helpers in `packages/core`.
- Put colors, typography, radius, and shadows in `packages/design-tokens`.
- Put locale dictionaries and translation helpers in `packages/i18n`.

## Delivery Workflow

1. Write down the user job, actor, and permission gate.
2. Map the affected surface and the shared modules it should touch.
3. Reuse an existing domain folder and UI primitive before inventing a new pattern.
4. Implement the happy path first, then loading, empty, error, disabled, and success states.
5. Check whether the same capability exists on the other surface and keep terminology and critical behavior aligned even if the layout differs.
6. Verify the touched area with lint, typecheck, and a quick manual flow when possible.

## Guardrails

- Keep names domain-specific. Prefer `ProductDrawerStep2` over vague names like `Panel`.
- Split oversized components when they mix fetching, transformation, permissions, and rendering.
- Keep browser-only concerns in web app code and native-only concerns in mobile app code.
- Do not add a new copy of shared API types or helpers when `packages/core` is the better home.
- Do not hardcode new brand values in only one surface.
- Treat loading and failure states as part of the feature, not as polish.

## State Expectations

Every feature should answer these questions before it is considered done:

- What does the user see before data arrives?
- What does the user see when there is no data?
- What does the user see when the request fails?
- Which actions are disabled while work is in flight?
- How does the user know the action succeeded?

## References

- Read `references/repo-map.md` before large changes or when file placement is unclear.
- Read `references/done-checklist.md` before closing the task.
