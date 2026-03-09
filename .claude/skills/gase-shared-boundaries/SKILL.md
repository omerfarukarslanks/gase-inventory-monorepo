---
name: gase-shared-boundaries
description: Decide where Gase code should live and how it should be refactored across apps/web, apps/mobile, and packages/*. Use when adding helpers, API clients, domain types, auth or session logic, translation data, design tokens, or when code feels duplicated, drifts across platforms, or should be normalized under DRY and SOLID principles.
---

# Gase Shared Boundaries

Use this skill to choose the smallest correct home for code and reduce duplication without over-abstracting.

## Placement Decision Tree

- Put domain APIs, DTOs, authz rules, normalization, query builders, and cross-platform business logic in `packages/core`.
- Put brand tokens in `packages/design-tokens`.
- Put locale dictionaries and translation helpers in `packages/i18n`.
- Put build and TypeScript base config in `packages/configs`.
- Keep Next.js routing, cookies, browser storage, and browser-only hooks in `apps/web`.
- Keep Expo Router wiring, `SecureStore`, device behavior, and React Native presentation code in `apps/mobile`.
- Keep route composition in apps. Do not move route trees into shared packages.

## Refactor Triggers

- A file exists in `apps/web/lib` and `packages/core/src` with the same domain name.
- A translation dictionary or translate helper exists in more than one place.
- Design token values are copied into CSS, Tailwind, or native styles instead of imported from the token source.
- Two screens repeat the same validation or workflow logic.
- A component becomes a mixed bag of fetch, state machine, transform, and rendering code.
- A helper name becomes so generic that nobody can tell which layer owns it.

## DRY and SOLID Rules

- Give each file one main reason to change.
- Prefer small pure helpers over giant mutable modules.
- Depend on shared adapters instead of rebuilding `fetch` wrappers per feature.
- Extract repeated domain rules. Do not extract accidental one-off JSX.
- Prefer composition and narrow interfaces over prop dumping.
- Delete the duplicate after moving the canonical version. Do not keep two sources of truth.

## Output Expectations

When using this skill:

1. Name the correct target layer.
2. Explain why the other layers are worse fits.
3. Call out any nearby duplication hotspot.
4. Recommend the smallest safe refactor path.

## References

- Read `references/shared-map.md` when choosing a target layer.
- Read `references/refactor-playbook.md` before moving or deduplicating code.
