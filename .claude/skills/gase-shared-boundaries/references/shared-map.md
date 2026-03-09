# Shared Map

Use this file when deciding whether code belongs in an app or a package.

## Shared Packages

- `packages/core`: Canonical home for API clients, auth helpers, permission logic, DTOs, normalization, and query-building.
- `packages/design-tokens`: Canonical home for colors, typography, radius, and shadows.
- `packages/i18n`: Canonical home for locale dictionaries and translation helpers.
- `packages/configs`: Canonical home for shared TypeScript config.

## App-Specific Layers

- `apps/web`: Next.js routes, cookies, browser-only storage, browser redirects, browser-only hooks, and web presentation components.
- `apps/mobile`: Expo Router wiring, `SecureStore`, device-specific behavior, and React Native presentation components.

## Current Duplication Hotspots

- `apps/web/lib/api.ts` and multiple domain files under `apps/web/lib/*` mirror logic that already exists under `packages/core/src/*`.
- `apps/web/context/LangContext.tsx` mirrors translation behavior that already exists in `packages/i18n`.
- `apps/web/app/globals.css` and `apps/web/tailwind.config.ts` repeat values from `packages/design-tokens`.

## Default Bias

- Move toward one shared source of truth when the logic is not runtime-specific.
- Leave runtime-specific persistence and routing behavior inside each app.
