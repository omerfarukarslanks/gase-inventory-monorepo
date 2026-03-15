# Delivery Checklist

## Product Fit

- State the user type and the task being accelerated.
- Check whether the feature reduces time, confusion, or error rate for that task.
- Confirm the wording matches existing inventory and reporting language.

## UI and UX

- Primary action is visually obvious.
- Loading, empty, error, and success states are covered.
- Destructive or sensitive actions have friction and clear labels.
- Mobile layouts favor reachability and fast scanning.
- Web layouts support comparison and drill-down without visual overload.

## Architecture

- Shared logic lives in `packages/core` only if it is truly cross-platform.
- Screens, pages, and layouts are composition-first, not business-logic-heavy.
- New helpers live near their domain and have obvious names.
- Permission and scope checks are close to the user flow.

## Verification

- Run targeted lint or typecheck for the touched workspace when feasible.
- Smoke-test the changed route or screen.
- If the web flow changed materially, use `webapp-testing`.
- If auth, session, or permissions changed, apply `security-best-practices`.
