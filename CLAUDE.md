# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Repository status

This repository is currently empty — it has no application source, no
`package.json`, no styling system, and no test or build tooling yet. When
frontend code is added, **detect the actual stack first** (framework, styling
system, component library, package scripts, test and end-to-end tooling) by
reading `package.json`, the lockfile, and the framework configuration. Do not
assume any technology that is not present.

## Frontend and UI workflow

Follow this workflow for any frontend or UI task:

1. Read the relevant project documentation.
2. Inspect the current design system and existing components.
3. Define the visual and UX direction.
4. Implement with reusable components and existing tokens.
5. Review responsive behavior.
6. Review accessibility and interactions.
7. Review UX states and copy.
8. Run the application.
9. Perform visual QA.
10. Ask the independent frontend critic to review the result.
11. Fix all critical issues.
12. Fix high-priority issues unless there is a documented reason not to.
13. Run validation again.
14. Report what was verified and what remains unverified.

This workflow is backed by project-level skills in `.claude/skills/` and the
`frontend-critic` agent in `.claude/agents/`:

- **frontend-design** — deliberate visual direction and production-quality UI.
- **design-system-guardian** — token and component consistency.
- **responsive-ui-audit** — behavior at 375 / 768 / 1024 / 1440 px.
- **accessibility-and-interaction-review** — WCAG 2.2 AA where practical.
- **visual-qa-and-polish** — validation in the running app.
- **ux-states-and-copy** — complete states and clear copy.
- **frontend-critic** (agent) — independent, demanding final review.

### Permanent rules

- Do not create generic AI-looking interfaces.
- Do not redesign unrelated areas.
- Preserve the existing product identity unless a redesign is explicitly
  requested.
- Reuse existing components and tokens.
- Search for an existing component before creating a new one.
- Do not introduce a new UI library without a strong technical reason.
- Do not add dependencies merely for cosmetic convenience.
- All frontend work must consider mobile, tablet, and desktop.
- Every interactive element must have appropriate hover, focus, active,
  selected, loading, disabled, and error behavior.
- All user-facing features must consider loading, empty, success, and error
  states.
- Visual quality must be checked in the running application.
- Type checking, linting, and unit tests are not substitutes for visual QA.
- Do not claim that an interface was visually verified unless it was actually
  run and inspected.
- Clearly distinguish verified behavior from assumptions.
- Do not silently leave incomplete placeholders or mock behavior.
- Do not use paid external services unless explicitly approved.
- Do not expose secrets, credentials, or private data.

### Project commands

The application is a Vite + React + TypeScript app. The real scripts from
`package.json`:

| Purpose                                            | Command                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| Development server (workflow step 8 "run the app") | `npm run dev`                                    |
| Production build (validation)                      | `npm run build`                                  |
| Preview production build                           | `npm run preview`                                |
| Lint                                               | `npm run lint`                                   |
| Type check                                         | `npm run typecheck`                              |
| Unit/integration tests (Vitest)                    | `npm run test`                                   |
| End-to-end tests (Playwright)                      | `npm run test:e2e`                               |
| Format                                             | `npm run format` (check: `npm run format:check`) |

Use `npm run dev` for visual QA (step 8) and the lint / typecheck / test / build
/ e2e commands above for validation (step 13). Playwright requires the browser
once: `npx playwright install chromium`. The stack: React, Vite, React Router,
CSS Modules + CSS variables (project-owned tokens in `src/styles/tokens.css`),
Dexie (IndexedDB), Zod, Vitest + React Testing Library, Playwright. Do not invent
commands beyond these.
