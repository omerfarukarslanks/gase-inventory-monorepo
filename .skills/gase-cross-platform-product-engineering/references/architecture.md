# Architecture Map

## Repo Roles

- `apps/web`: Next.js App Router surface for browser workflows, dashboards, and report exploration.
- `apps/mobile`: React Native and Expo surface for field and operator workflows.
- `packages/core`: shared domain logic, data contracts, normalization, validation, and cross-platform helpers.
- `packages/design-tokens`: shared visual tokens and theme primitives.
- `packages/i18n`: language assets and translation support.

## Placement Rules

### Put code in `packages/core` when:

- The logic is domain-oriented rather than view-oriented.
- Both web and mobile can reuse the type, formatter, normalizer, or permission helper.
- The module can stay framework-light and predictable.

### Keep code in the app when:

- It depends on routing, browser APIs, React Native APIs, screen navigation, or shell state.
- The behavior is specific to one platform's interaction model.
- The abstraction would introduce platform leakage into `packages/core`.

## Web Patterns

- Keep route files thin. Follow the existing `page.tsx` plus `PageClient.tsx` split where interaction exists.
- Use `apps/web/lib` for pure helpers and data translations.
- Use `apps/web/hooks` for stateful browser-facing behavior.
- Keep metadata, redirects, and route-level policies near the route entrypoint.

## Mobile Patterns

- Keep `src/navigation` responsible for shell routing and cross-screen transitions.
- Keep `src/screens` focused on rendering and intent wiring.
- Move reusable state, filtering, workflow helpers, and persistence concerns to `src/hooks`, `src/lib`, or `src/context`.
- Do not bury business rules inside `StyleSheet`-heavy screen files.

## Design System Rules

- Extend shared tokens before creating ad hoc colors or spacing values.
- If a visual primitive is reused across multiple screens, extract it to a shared UI module or tokens package.
- If only one surface needs the pattern, keep it local until reuse is real.

## Decision Shortcuts

- Shared logic plus no UI dependency: `packages/core`
- Shared visual language: `packages/design-tokens`
- Web-only interaction or route behavior: `apps/web`
- Mobile-only interaction or navigation: `apps/mobile`
- One-off feature glue: keep it near the feature
