---
name: visual-qa-and-polish
description: >-
  Use to validate UI quality in the running application, not from source code
  alone. Starts the app with its real dev command, opens affected screens at
  multiple viewports, exercises interactions, inspects the browser console, and
  fixes visual defects. Never claim visual verification without actually running
  and inspecting the app.
---

# Visual QA and Polish

## Purpose
Catch defects that only appear at runtime: misalignment, overflow, broken
states, console errors, layout shift, and visual regressions. Source-code
inspection alone is not visual QA.

> Use the repository's real development command (read it from `package.json`
> scripts or the framework config — do not invent it). This repository has no
> dev command yet; once a frontend app exists, record its actual command and
> use it here.

## When to activate
- After implementing or changing any user-facing UI.
- Before reporting frontend work as complete.

## Workflow
1. Identify the affected pages and states.
2. Start the application using the repository's real development command.
3. Open the affected interface.
4. Inspect it at multiple viewport sizes (coordinate with
   `responsive-ui-audit`).
5. Exercise relevant interactions (hover, focus, click, keyboard, submit).
6. Capture screenshots when supported.
7. Inspect browser console output.
8. Identify defects.
9. Fix defects.
10. Repeat the inspection until clean.
11. Report exactly what was verified.

## Review criteria — check
- Alignment, spacing, hierarchy, visual rhythm, content density.
- Inconsistent sizing, text clipping, overflow, accidental scrollbars.
- Icon alignment and sizing; border-radius and shadow consistency.
- Hover, focus, active, and selected states.
- Loading states and skeletons; empty, error, and success feedback.
- Dark-theme issues and responsive issues.
- Layout shifts, hydration errors, runtime errors, and browser console errors.
- Visual regressions against the prior state.

## Tooling
- If browser automation or screenshot tooling already exists in the repo, use
  it (e.g., the project's existing E2E or browser MCP setup).
- If no compatible browser tooling exists: do **not** add heavy dependencies
  automatically. Document the limitation, recommend the smallest compatible
  option, and do **not** claim visual verification was completed.

## Reject
- Substituting type checking, linting, or unit tests for visual QA.
- Claiming an interface was visually verified when the app was not run and
  inspected.

## Completion criteria
- The app was run, affected screens inspected at multiple viewports, console
  checked, and defects fixed — or limitations explicitly documented.

## Reporting requirements
Report: the dev command used; screens/states inspected; viewports checked;
console findings; defects found and fixed; screenshots if captured; and
anything that could not be verified.
