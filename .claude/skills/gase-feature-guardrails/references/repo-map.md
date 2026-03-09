# Repo Map

Read this file when deciding where a new feature should live.

## Current Layout

- `apps/web`: Next.js App Router app. Routes live in `app/**`. Many feature routes use `page.tsx` plus `PageClient.tsx`. Reusable UI lives under `components/<domain>` and common widgets under `components/ui`.
- `apps/mobile`: Expo Router app. Route files in `app/**` are thin wrappers. Real screen logic lives in `src/screens/*`. Shared native UI primitives live in `src/components/ui.tsx`.
- `packages/core`: Shared API client, auth, permissions, domain DTOs, normalize helpers, and query builders.
- `packages/design-tokens`: Shared color, typography, radius, and shadow tokens.
- `packages/i18n`: Shared locale dictionaries and translation helper.
- `packages/configs`: Shared TypeScript config package. It exists, but current apps are not fully converged on it yet.

## Current Hotspots

- `apps/web/lib/{products,customers,inventory,permissions,reports,sales,stores,suppliers,users,...}.ts` overlaps with `packages/core/src/*`.
- `apps/web/context/LangContext.tsx` overlaps with `packages/i18n`.
- `apps/web/app/globals.css` and `apps/web/tailwind.config.ts` repeat token values that also exist in `packages/design-tokens`.

## Bias

- Prefer converging toward the shared packages instead of creating a third copy.
- Keep route composition inside each app.
- Keep persistence and runtime details app-specific:
  - Web: `localStorage`, cookies, browser redirects, Next-specific wiring.
  - Mobile: `SecureStore`, Expo Router wiring, React Native presentation.
