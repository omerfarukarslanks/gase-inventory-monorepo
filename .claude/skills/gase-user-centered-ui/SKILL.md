---
name: gase-user-centered-ui
description: Review or design Gase web and mobile interfaces with a user-centered lens. Use when creating or refactoring screens, auth flows, forms, drawers, tables, dashboards, filters, or navigation, and when concrete UI or UX guidance is needed about clarity, accessibility, responsive behavior, task completion, feedback states, and consistency with current Gase components and tokens.
---

# Gase User Centered UI

Use this skill to produce actionable interface decisions instead of generic design commentary.

## Review Order

1. State the user's main job in one sentence.
2. Check whether the first screen answers: where am I, what can I do, and what should I do next.
3. Evaluate primary action emphasis, information hierarchy, and decision load.
4. Inspect success, error, empty, and loading states and the recovery path from each one.
5. Inspect accessibility and platform ergonomics.
6. End with concrete edits ordered by user impact.

## Gase-Specific Heuristics

- Preserve the current brand direction: clean operational tooling, green accent, DM Sans, dense but readable data surfaces.
- On web, optimize for scanability in tables, filters, drawers, and pagination.
- On mobile, optimize for thumb reach, progressive disclosure, sticky primary actions, and short forms.
- Reuse the existing primitives before inventing decorative variants.
- Use badges, banners, helper text, and explicit microcopy to reduce ambiguity.
- Keep destructive actions clearly separated from routine actions.
- Keep terminology and outcome consistent across web and mobile even when layouts differ.

## Accessibility Baseline

- Give controls visible labels or reliable accessible names.
- Keep focus order, keyboard access, and touch targets reasonable.
- Do not communicate status with color alone.
- Make error text specific and recovery-oriented.
- Keep contrast and density suitable for long operational sessions.

## Response Style

- Lead with the user task framing.
- Then list the highest-impact issues or opportunities.
- Then propose concrete changes, not taste-based opinions.
- Call out parity gaps when web and mobile diverge in critical behavior.

## References

- Read `references/review-checklist.md` for the evaluation checklist.
- Read `references/surface-patterns.md` for repo-specific UI patterns.
