---
name: accessibility-and-interaction-review
description: >-
  Use to review any interface change for accessibility and interaction quality,
  aiming for WCAG 2.2 AA where practical. Checks semantic HTML, keyboard
  navigation, focus management, accessible names, contrast, reduced motion, and
  state behavior. Rejects clickable div/span where a native element fits and
  discourages unnecessary ARIA.
---

# Accessibility and Interaction Review

## Purpose
Ensure interfaces are operable and understandable for keyboard, screen-reader,
touch, and pointer users, targeting WCAG 2.2 AA where practical.

> Detect the framework and confirm whether components render native semantic
> elements. Adapt checks to the actual markup the components produce.

## When to activate
- Any new or changed interactive element, form, dialog, menu, or navigation.
- Before declaring a frontend change complete.

## Workflow
1. Identify interactive elements and flows affected by the change.
2. Inspect the rendered markup and behavior (running app and assistive-tech
   checks where tooling allows).
3. Verify keyboard operation end to end.
4. Record findings, clearly separating verified behavior from assumptions and
   from items needing manual screen-reader testing.

## Review criteria — check
- Semantic HTML and native interactive elements.
- Keyboard navigation, logical focus order, and visible focus indicators.
- Focus trapping (in modals), focus restoration (on close).
- Accessible names, labels, and descriptions.
- Form validation, error association, and screen-reader announcements.
- Live regions for async updates.
- Color contrast and non-color indicators (don't rely on color alone).
- Reduced-motion support (`prefers-reduced-motion`).
- Skip navigation where appropriate and correct heading hierarchy.
- Dialog semantics and tooltip accessibility.
- Hover interactions with keyboard and touch alternatives.
- Loading feedback, disabled-state behavior, and destructive-action
  confirmation.
- Target sizes and pointer/touch interactions.

## Reject
- Clickable `div`/`span` when a native `button`, `a`, `input`, `select`,
  `checkbox`, or other element is appropriate.
- Unnecessary ARIA where native HTML already conveys correct semantics.

## Completion criteria
- Keyboard operability verified for the affected flows.
- Critical accessibility blockers fixed or explicitly reported.

## Reporting requirements
Separate findings into:
- **Verified accessibility behavior** (observed in the running app).
- **Code-level assumptions** (inferred from markup, not observed).
- **Items requiring manual testing** (e.g., real screen-reader passes).
