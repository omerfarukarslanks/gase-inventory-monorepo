# Gase Inventory Monorepo

This repository is the new source of truth for the web and mobile applications.

## Layout

- `apps/web`: existing Next.js application, imported with preserved git history
- `apps/mobile`: Expo + Expo Router React Native skeleton
- `packages/core`: shared API/auth/session primitives and shared permission helpers
- `packages/design-tokens`: shared brand colors, typography, radius, and shadow tokens
- `packages/i18n`: shared locale dictionaries and translation helpers
- `packages/configs`: shared TypeScript base config

## Migration Rules

- The original `gase-inventory-web` repository remains untouched.
- Temporary dual-write is limited to critical web hotfixes during stabilization.
- New feature work must start in this repository.
- Once stabilization ends, archive the legacy web repository and keep this one as the only active source.

## Tooling Notes

- Package manager: npm workspaces
- Task runner: Turborepo
- The previous app lockfile was removed from `apps/web`; regenerate the root lockfile after Node/npm is available.
