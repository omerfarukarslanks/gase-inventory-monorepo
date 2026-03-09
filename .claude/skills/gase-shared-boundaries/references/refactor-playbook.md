# Refactor Playbook

Use this sequence when deduplicating code.

1. Identify the canonical owner.
2. Move the shared types or helper into the target package.
3. Keep runtime-specific wrappers in the app:
   - Web keeps `localStorage`, cookies, redirect behavior, and Next-specific wiring.
   - Mobile keeps `SecureStore`, Expo Router behavior, and native presentation details.
4. Update both surfaces to import the shared version.
5. Delete the stale duplicate instead of leaving parallel versions in place.
6. Run lint and typecheck for the affected app or package.

## Good Candidates

- Repeated domain DTOs.
- Repeated API request builders.
- Repeated translation dictionaries or translate helpers.
- Repeated token values.

## Poor Candidates

- A one-off web-only interaction detail.
- A native-only screen layout detail.
- Route tree structure.
