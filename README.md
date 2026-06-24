# Manabase

A modern, **local-first** deckbuilder for **Magic: The Gathering Commander**.

Build and organize Commander decks in your browser — no account, no backend, no
subscription. Card data comes from the [Scryfall API](https://scryfall.com/docs/api);
your decks are saved locally in IndexedDB. Manabase aims to differentiate over
time through honest, technical deck analysis (mana curve, mana production,
on-curve probability, local combo/synergy detection) — see
[`docs/MILESTONES.md`](docs/MILESTONES.md).

> Manabase is an unofficial fan tool. Magic: The Gathering is © Wizards of the
> Coast. Card data and images are provided by Scryfall. Manabase is not produced
> by or endorsed by Wizards of the Coast or Scryfall.

## Technology stack

- **React 18** + **Vite 6** + **TypeScript** (strict mode)
- **React Router** for client-side routing
- **CSS Modules + CSS custom properties** — a project-owned design system
  (`src/styles/tokens.css`), no CSS framework or component library
- **Dexie** (IndexedDB) for local persistence
- **Zod** for validating external (Scryfall) and persisted (deck) data
- **Vitest** + **React Testing Library** + **fake-indexeddb** for unit/integration tests
- **Playwright** for essential end-to-end flows
- **ESLint** + **Prettier**

No backend, no authentication, no paid services, no AI APIs.

## Getting started

Requirements: Node.js 20+ (developed on Node 22) and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
```

For end-to-end tests, the Playwright browser is needed once:

```bash
npx playwright install chromium
```

## Commands

| Command                | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | Start the Vite dev server.                                         |
| `npm run build`        | Type-check (`tsc -b`) and build for production.                    |
| `npm run preview`      | Preview the production build locally.                              |
| `npm run lint`         | Run ESLint.                                                        |
| `npm run typecheck`    | Type-check without emitting.                                       |
| `npm run test`         | Run unit/integration tests once (Vitest).                          |
| `npm run test:watch`   | Run Vitest in watch mode.                                          |
| `npm run test:e2e`     | Run Playwright end-to-end tests (builds + previews automatically). |
| `npm run format`       | Format the codebase with Prettier.                                 |
| `npm run format:check` | Check formatting without writing.                                  |

## Architecture overview

Strictly separated layers (details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)):

```
src/
  domain/        Pure domain types + logic (deck rules, sort/group/filter, import/export)
  scryfall/      Typed Scryfall integration (client, Zod schemas, mapping)
  persistence/   IndexedDB via Dexie (typed repositories, schema validation)
  ui/            Design-system primitives
  hooks/         React glue (data loading, debounced search, theme, autosave)
  features/      Screens: library, editor, settings
  app/           Shell, router, providers
  styles/        Design tokens + global styles
```

- The **domain** layer has no React, no Dexie, and no `fetch` — it is pure and
  unit-tested in isolation.
- All Scryfall access goes through `src/scryfall`; components never see raw API
  responses.
- All persistence goes through typed repositories that validate data with Zod.

See also:

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md)
- [`docs/DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md)
- [`docs/MILESTONES.md`](docs/MILESTONES.md)

## Current milestone

**Milestone 1 — Application foundation and base deck editor**, plus the
foundations of import/export, local persistence, and sorting/grouping/filters/
views. Implemented in this release:

- Deck library (create / name / rename / duplicate / delete / open) with autosave
  to IndexedDB and refresh recovery.
- Base deck editor: Scryfall search, add/remove cards, quantity changes within
  Commander rules, commander selection, card sections (commander / main /
  maybeboard), accessible card image preview.
- Plain-text and MTGO **import** (with a reviewable result) and **export**.
- Separate sorting, grouping, filtering, and view modes; editable custom
  categories saved with the deck.
- Dark-first, responsive (375 / 768 / 1024 / 1440 px), accessible UI.

## Limitations

- **Commander format only.**
- Not a full rules engine — only singleton (enforced), color identity (warnings),
  and deck size (informational) are modeled. Every calculation states its
  assumptions; estimates are labelled as estimates.
- The Scryfall response cache is in-memory (cleared on reload); the full card
  database is not downloaded.
- Only the default printing from Scryfall is used (no printing picker yet).
- Combo/synergy detection and all advanced analysis are **deferred** to later
  milestones (see [`docs/MILESTONES.md`](docs/MILESTONES.md)).
