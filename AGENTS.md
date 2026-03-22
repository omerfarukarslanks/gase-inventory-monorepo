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

# Workflow Orchestration

## 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

## 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

## 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

## 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

## 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

# Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

# Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
