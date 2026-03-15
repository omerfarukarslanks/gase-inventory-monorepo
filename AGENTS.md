## Skills

This repo carries project-local skills in `.skills/` and uses them as the default working frame for product development.

### Available skills

- `gase-cross-platform-product-engineering`: Default skill for feature work in this monorepo. Use for mobile, web, Next.js, shared domain logic, readability decisions, architecture choices, and product-first UI/UX tradeoffs. (file: /Users/omerfarukarslan/Desktop/projects/gase-inventory-monorepo/.skills/gase-cross-platform-product-engineering/SKILL.md)
- `frontend-design`: Use when a task is UI-heavy and needs stronger visual craft, layout direction, or polish beyond basic implementation. (file: /Users/omerfarukarslan/Desktop/projects/gase-inventory-monorepo/.skills/frontend-design/SKILL.md)
- `javascript-typescript`: Use when TypeScript modeling, API typing, runtime boundaries, or TS configuration choices are central to the task. (file: /Users/omerfarukarslan/Desktop/projects/gase-inventory-monorepo/.skills/javascript-typescript/SKILL.md)
- `code-refactoring`: Use when reducing complexity, improving maintainability, or cleaning up behavior-preserving code paths. (file: /Users/omerfarukarslan/Desktop/projects/gase-inventory-monorepo/.skills/code-refactoring/SKILL.md)
- `webapp-testing`: Use when validating web flows, debugging browser behavior, or creating Playwright-based checks for the Next.js app. (file: /Users/omerfarukarslan/Desktop/projects/gase-inventory-monorepo/.skills/webapp-testing/SKILL.md)
- `security-best-practices`: Use when auth, permissions, sessions, APIs, storage, or other trust boundaries are touched, or when a security review is requested. (file: /Users/omerfarukarslan/Desktop/projects/gase-inventory-monorepo/.skills/security-best-practices/SKILL.md)
- `web-design-guidelines`: Keep for explicit UI and accessibility audits. Do not load by default for implementation unless the user asks for review or compliance checks. (file: /Users/omerfarukarslan/.agents/skills/web-design-guidelines/SKILL.md)

### Coordination

- Default order for product implementation: `gase-cross-platform-product-engineering` first, then the minimal supplemental skill set needed for the task.
- For UI-heavy work, add `frontend-design`.
- For large cleanup or stabilization, add `code-refactoring`.
- For browser verification, add `webapp-testing`.
- For security-sensitive work, add `security-best-practices`.

### Repo guardrails

- Keep shared business logic in `packages/core` unless the behavior is clearly platform-specific.
- Keep design tokens and visual primitives aligned with `packages/design-tokens`.
- Keep `apps/web/app` route files thin and place browser interaction in client components or hooks.
- Keep `apps/mobile/src/screens` focused on composition and move reusable logic into hooks, context, or lib modules.
