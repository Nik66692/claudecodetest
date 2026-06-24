---
name: responsive-ui-audit
description: >-
  Use to audit any interface change for responsive behavior across mobile,
  tablet, and desktop. Reviews affected UI at 375px, 768px, 1024px, and 1440px
  for overflow, broken layouts, density, truncation, and navigation, and
  recommends real mobile transformations rather than a shrunken desktop.
---

# Responsive UI Audit

## Purpose
Ensure interfaces work as designed across viewport sizes and input types, with
layouts genuinely adapted per breakpoint.

> Detect the real breakpoint system in the project's styling configuration and
> align findings with it. The viewport widths below are the minimum set to
> check, not a replacement for the project's own breakpoints.

## When to activate
- Any change to layout, navigation, tables, forms, grids, or overlays.
- Before declaring a frontend change complete.

## Required viewports (minimum)
- **375 px** (small mobile)
- **768 px** (tablet)
- **1024 px** (small desktop / large tablet)
- **1440 px** (desktop)

Check portrait and landscape where relevant.

## Workflow
1. Identify the affected interfaces and their interactive elements.
2. Inspect each affected interface at all four viewports (use the running app
   and browser tooling when available — see `visual-qa-and-polish`).
3. Exercise navigation, overlays, and data-heavy components at each size.
4. Record issues per viewport and recommend concrete transformations.
5. Report verified vs. unverified findings.

## Review criteria — check
- Horizontal overflow and accidental scrollbars.
- Broken grids and unreadable density.
- Text truncation, long labels, and localization resilience.
- Navigation, sidebars, drawers, and toolbars.
- Forms, tables, card grids, and lists.
- Dialogs, popovers, menus, and tooltips.
- Charts, sticky elements, and fixed elements.
- Touch targets (comfortable minimum ~44px), mobile keyboard behavior where
  relevant, and portrait/landscape constraints where relevant.

## Reject
- Treating mobile as merely a compressed desktop layout.

## Recommended transformations (where appropriate)
Drawers; bottom sheets; stacked layouts; responsive tables or alternative
mobile data views; horizontally scrollable tabs; adaptive toolbars; simplified
secondary controls; progressive disclosure; compact navigation.

## Completion criteria
- All four viewports inspected for the affected interfaces.
- Critical responsive issues fixed or explicitly reported.

## Reporting requirements — every audit produces
1. **Critical responsive issues.**
2. **Viewport-specific issues** (per 375 / 768 / 1024 / 1440).
3. **Recommended fixes.**
4. **What was actually verified** (and how — running app vs. code inspection).
5. **Anything that could not be verified.**
