---
name: design-system-guardian
description: >-
  Use whenever adding or changing UI to ensure the change respects a single
  coherent design system. Enforces reusing existing tokens and components,
  consistent spacing/typography/color/radius/shadow/motion scales, aligned
  hover/focus/active/disabled/loading/error states, light/dark parity, and the
  smallest coherent change. Prevents a second competing design system.
---

# Design System Guardian

## Purpose
Keep every frontend change consistent with one design system. Reuse first,
extend second, and only introduce new design primitives when justified and
documented.

> This repository currently has no committed design tokens or components. On
> first frontend work, locate or establish the token mechanism (CSS variables,
> a theme file, or the styling system already in use) and treat that as the
> single source of truth. Do not invent a parallel system.

## When to activate
- Adding, editing, or styling any component or screen.
- Introducing colors, spacing, typography, radius, shadow, or motion values.
- Reviewing a frontend diff for consistency.

## Workflow
1. **Audit the current design system.** Find token definitions, theme files,
   and the component inventory before writing anything.
2. **Identify reusable primitives.** Search for existing components that already
   solve the need; search for similar components before building a duplicate.
3. **Identify missing tokens or variants.** Decide whether a real gap exists or
   an existing variant covers it.
4. **Implement the smallest coherent change.** Prefer a new variant of an
   existing component over a near-identical copy.
5. **Check consistency across related components** that share the pattern.
6. **Report newly introduced design decisions**, including any new tokens.

## Review criteria — require
- Existing design tokens inspected before adding new values.
- Existing components reused before new ones are created.
- A search for similar components before implementing duplicates.
- Component variants instead of near-identical copies.
- The existing visual language preserved unless a redesign is explicitly
  requested.
- Consistent spacing scale and consistent typography scale.
- Semantic color tokens (not raw hex/rgb scattered in components).
- Shared radius, border, shadow, elevation, and animation tokens.
- Consistent icon sizes and stroke styles.
- Consistent hover, focus, active, selected, disabled, loading, and error
  states across components.
- Light and dark themes kept aligned when both exist.
- CSS variables or the project's existing token mechanism preferred.
- Arbitrary hardcoded values avoided unless clearly justified and documented.

## Reject
- A second, competing design system or token set.
- Duplicate components that should have been variants.
- One-off magic numbers where a token exists or should exist.

## Completion criteria
- The change uses existing tokens/components wherever they exist.
- Any new token or variant is minimal, named consistently, and documented.
- Related components remain visually consistent.

## Reporting requirements
Report: tokens and components reused; new tokens/variants introduced and why;
and any consistency risks left for follow-up.
