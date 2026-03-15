---
name: gase-cross-platform-product-engineering
description: Guide product-driven implementation and refactoring for mobile, web, and Next.js work in the GASE inventory monorepo. Use when adding or changing features in apps/web, apps/mobile, packages/core, packages/design-tokens, or shared operator flows. Apply monorepo boundaries, readability rules, architecture decisions, accessibility and usability guardrails, and release verification for cross-platform features.
---

# Gase Cross Platform Product Engineering

## Overview

Build product features that stay readable, shared where it matters, and intentionally different per platform where it helps the operator. Use this skill as the default decision layer before touching `apps/web`, `apps/mobile`, `packages/core`, or `packages/design-tokens`.

Read [references/architecture.md](references/architecture.md) for the repo map and placement rules. Read [references/delivery-checklist.md](references/delivery-checklist.md) before shipping a non-trivial flow.

## Core Principles

- Start from the operator outcome. Define the task, the primary action, the failure state, and the success signal before moving files around.
- Prefer clear ownership over convenience. Shared code belongs in packages only when at least two surfaces benefit and the abstraction stays simpler than duplication.
- Keep rendering layers thin. Pages, screens, and navigation shells compose data and UI; domain rules and normalization live below them.
- Optimize for operational speed. Inventory, stock, supply, and reporting flows should reduce clicks, taps, and mental branching.
- Preserve explicitness. Names, permissions, route intent, and state transitions should read plainly without reverse engineering.

## Workflow

### 1. Classify the change

- `domain`: types, normalization, query helpers, validation, or permission logic that can serve multiple platforms.
- `platform`: routing, screen composition, browser concerns, React Native concerns, or shell navigation.
- `design-system`: colors, spacing, typography, or reusable visual primitives.
- `feature`: a concrete user flow such as reports, stock, customers, or sales.

If the change touches more than one class, sequence the work from domain to platform, not the other way around.

### 2. Choose the home for the code

- Put reusable business rules in `packages/core`.
- Put shared visual tokens in `packages/design-tokens`.
- Put Next.js route entrypoints and metadata in `apps/web/app`.
- Put web-only hooks, API helpers, and view helpers in `apps/web/hooks` and `apps/web/lib`.
- Put React Native-only navigation, shell state, and screen composition in `apps/mobile/src/navigation`, `apps/mobile/src/hooks`, `apps/mobile/src/lib`, and `apps/mobile/src/screens`.
- Keep feature-specific glue close to the feature unless reuse is already proven.

### 3. Shape the flow before polishing the UI

- Identify entry point, empty state, loading state, error state, and success state.
- Check permission and scope behavior early. This repo contains store-scoped and role-scoped views, so permission handling is part of the flow, not a later concern.
- Prefer progressive disclosure over overcrowded dashboards. Show the main KPI or action first, secondary controls second.
- When data is dense, improve scanability with grouping, labels, summaries, and drill-down paths instead of raw volume.

### 4. Apply platform rules

#### Web and Next.js

- Keep `page.tsx` and `layout.tsx` focused on routing, metadata, and shell composition.
- Use a colocated `PageClient.tsx` when interaction, local state, or browser-only hooks are needed.
- Favor server-safe modules by default; introduce client boundaries intentionally.
- Keep formatting, normalization, and API translation out of JSX when they can live in `lib` or `packages/core`.

#### Mobile

- Keep screens focused on composition and operator actions, not long procedural logic.
- Use hooks and `src/lib` for reusable state transitions, data shaping, and workflow helpers.
- Preserve one-handed usability: important actions should be easy to reach and clearly named.
- Use React Native accessibility props for buttons, modal toggles, and stateful controls.

### 5. Verify from the business angle

- Confirm the change helps a concrete metric: faster task completion, fewer mistakes, clearer insight, or reduced support burden.
- Reject abstractions that save code locally but slow feature iteration globally.
- Prefer a boring data contract and a polished user flow over a clever architecture.

## Readability Rules

- Use domain names that match the business vocabulary already present in reports, stock, suppliers, stores, and warehouse flows.
- Keep components small enough that their state model is obvious in one read.
- Extract helpers when they remove branching noise, not just to reduce line count.
- Avoid generic `utils` growth. Place helpers near the domain they serve.
- Add short comments only when the code hides a non-obvious business rule or sequencing constraint.

## UI and UX Guardrails

- Reuse tokens and theme primitives before inventing new visual values.
- Preserve strong hierarchy: one primary action, a few secondary actions, and low-emphasis utilities.
- Design for error prevention first. Constrain destructive actions, validate input early, and make scope visible.
- Match the information density to the surface. Desktop can compare; mobile should prioritize act-now tasks.
- Do not ship a polished happy path with weak loading, empty, and error states.

## Skill Coordination

- Use `frontend-design` alongside this skill when the task is UI-heavy or needs a stronger visual point of view.
- Use `javascript-typescript` when type modeling or TS configuration choices are central.
- Use `code-refactoring` when cleaning up complexity without changing behavior.
- Use `webapp-testing` after meaningful web flow changes or while debugging browser behavior.
- Use `security-best-practices` when touching auth, permissions, session handling, APIs, or other trust boundaries.

## Resources (optional)

### references/
Use `references/architecture.md` for placement and ownership decisions.
Use `references/delivery-checklist.md` before handing off a non-trivial feature.
