---
name: frontend-design
description: >-
  Use when designing, building, or substantially changing any user-facing
  interface, screen, page, component, or visual layout. Enforces a deliberate
  visual direction, strong hierarchy, intentional typography, coherent spacing,
  semantic color, responsive and accessible interactions, and production-quality
  polish. Rejects generic AI-generated interface patterns.
---

# Frontend Design

## Purpose
Guide frontend work toward intentional, production-quality interfaces that fit
this product's identity — not generic, AI-looking demos. Design decisions must
be deliberate and defensible, never decorative by default.

> This repository currently has no committed frontend code. Before applying
> this skill, detect the actual stack (framework, styling system, component
> library, package scripts) by reading `package.json`, the lockfile, framework
> config, and the source tree. Adapt every recommendation to what is actually
> present. Do not assume React, Tailwind, shadcn/ui, or any other technology
> unless it exists in the repository.

## When to activate
- Creating a new screen, page, view, or significant component.
- Redesigning or restyling existing UI.
- Any task whose acceptance depends on how an interface looks or feels.

## Workflow
1. **Understand the product context.** Read project docs, existing screens, and
   the established visual language. Identify the product's purpose and tone.
2. **Define a visual direction first.** Before writing UI code, state the
   intended hierarchy, typographic scale, spacing rhythm, color roles, and
   density. Tie each choice to the product, not to a trend.
3. **Reuse before inventing.** Check for existing components and design tokens
   (defer to `design-system-guardian`). Extend variants instead of duplicating.
4. **Implement** with reusable components, existing tokens, and semantic markup.
5. **Cover all states**: loading, empty, error, success, partial-success, and
   disabled — not just the happy path.
6. **Apply motion sparingly** and only where it clarifies a state change.
7. **Verify** responsiveness, accessibility, and visual quality using the
   dedicated skills before declaring the work done.

## Review criteria — require
- A deliberate visual direction decided before implementation.
- Strong, scannable information hierarchy.
- Intentional typography (purposeful scale, weight, measure, line-height).
- Coherent spacing on a consistent scale.
- Semantic, role-based color use (not arbitrary palettes).
- Responsive layouts designed per breakpoint, not scaled-down desktop.
- Accessible interactions (keyboard, focus, contrast, target size).
- Polished loading, empty, error, and success states.
- Restrained, purposeful motion that respects reduced-motion preferences.
- Consistency with the existing product identity.
- Reusable components and production-quality implementation.

## Reject — generic AI interface patterns
- Arbitrary purple/blue gradients with no product rationale.
- Excessive glassmorphism, glow, or blur for decoration.
- Everything wrapped in identical rounded cards.
- Random shadows, border radii, and one-off spacing values.
- Meaningless decorative graphics or stock illustration filler.
- Weak typography; oversized headings with no real hierarchy.
- Generic dashboard layouts unrelated to what the product does.
- "Polish" that harms readability, contrast, or usability.

## Completion criteria
- Visual direction is documented and reflected in the implementation.
- Components and tokens are reused; no competing one-off styles introduced.
- All relevant states are implemented.
- Responsive, accessibility, and visual-QA skills have been applied (or the gaps
  are explicitly reported as unverified).

## Reporting requirements
Report: the chosen visual direction and its rationale; components and tokens
reused vs. created; states implemented; and what was verified vs. assumed.
