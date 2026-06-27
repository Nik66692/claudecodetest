# Manabase — Architecture

## 1. Frontend architecture

A single-page React application built with Vite, written in **TypeScript strict
mode**. There is no backend, no SSR, and no authentication — the app is
local-first and runs entirely in the browser. Routing is client-side via React
Router.

The codebase is organized into **strictly separated layers** so that domain
rules, UI, persistence, and the external Scryfall integration never leak into one
another:

```
src/
  domain/        Pure domain types + logic (no React, no I/O)
  scryfall/      Typed Scryfall integration (HTTP, schemas, mapping)
  persistence/   IndexedDB via Dexie (typed repositories, schema validation)
  ui/            Design-system primitives (Button, Modal, Mana, …)
  hooks/         React glue (data loading, search, theme, autosave)
  features/      Feature screens (library, editor, settings) + their parts
  app/           App shell, router, providers
  lib/           Small framework-agnostic helpers (formatting)
  styles/        Design tokens + global styles
  test/          Test setup + fixtures
```

**Dependency direction:** `features`/`app` depend on `ui`, `hooks`, `domain`,
`scryfall`, `persistence`. `hooks` depend on `domain`/`scryfall`/`persistence`.
`domain` depends on nothing else in the app (no React, no Dexie, no `fetch`).
This keeps the domain trivially testable and portable.

## 2. Dependency choices and justification

| Dependency                                                               | Why                                                                                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **react / react-dom**                                                    | UI rendering; the default stack for this milestone.                                                                               |
| **react-router-dom**                                                     | Client-side routing for library / editor / settings. No SSR or server routes needed, so Next.js is intentionally avoided.         |
| **dexie** + **dexie-react-hooks**                                        | Ergonomic, typed IndexedDB access with `useLiveQuery` for reactive, multi-tab-safe lists. Avoids hand-rolling IndexedDB.          |
| **zod**                                                                  | Runtime validation of _external_ data (Scryfall responses) and _persisted_ data (decks read from IndexedDB), with inferred types. |
| **vite** + **@vitejs/plugin-react**                                      | Fast dev server and production build.                                                                                             |
| **vitest** + **@testing-library/react** + **jsdom** + **fake-indexeddb** | Unit/integration tests for domain, mapping, and repositories.                                                                     |
| **@playwright/test**                                                     | Essential end-to-end flows in a real browser.                                                                                     |
| **eslint** / **typescript-eslint** / **prettier**                        | Linting and formatting.                                                                                                           |

Styling uses **plain CSS Modules + CSS custom properties**, not a CSS framework.
The product needs a distinctive, owned visual identity and a token system anyway
(see `src/styles/tokens.css`); Tailwind was not adopted because it would not
materially improve maintainability here and would add a competing source of
truth. No component library is installed — primitives are small and
project-owned to avoid a generic look and unnecessary dependencies.

## 3. Application layers

- **Domain (`src/domain`)** — Pure types and functions: deck creation and
  mutation, singleton rules, color identity, sorting, grouping, filtering,
  import parsing, export formatting, import application. Deterministic and
  side-effect-free (IDs and timestamps are injectable).
- **Analysis (`src/domain/analysis`)** — Pure, deterministic mana analysis
  (curve, mana-symbol parsing, colored demand, production sources, demand-vs-
  production). Consumes domain `Card`/`Deck` objects only; imports no React,
  Dexie, browser APIs, or Scryfall client. Results are derived on demand and
  never persisted. Every function states its assumptions and exposes incomplete-
  data states — it is a set of honest heuristics, not a Magic rules engine.
- **Scryfall (`src/scryfall`)** — `ScryfallClient` (HTTP, throttling, dedup,
  cache, error normalization), Zod `schema`, `mapper` (raw → domain `Card`), and
  `ScryfallApi` (autocomplete, search, commander search, exact lookup,
  collection lookup). Components never import the client or raw responses.
- **Persistence (`src/persistence`)** — `ManabaseDb` (Dexie), `DeckRepository`
  and `PreferenceRepository`, plus a Zod `persistedDeckSchema`. Repositories
  validate on read and write and contain no business logic.
- **UI (`src/ui`)** — Reusable, accessible primitives consuming design tokens.
- **Features (`src/features`)** — Screen-level composition and feature-specific
  components.

## 4. Scryfall integration

- All endpoints and request handling are centralized in `ScryfallClient`.
- Responses are validated with Zod; malformed responses become typed errors.
- Interactive search is **debounced** (≈350 ms) and **request-cancelled** via
  `AbortController` (`useCardSearch`).
- Concurrent identical requests are **deduplicated** (in-flight map) and
  successful GET/collection responses are **cached in memory**.
- Requests are **throttled** (≈120 ms minimum spacing) to stay below Scryfall's
  documented limits.
- Importing many cards uses the **collection endpoint** (up to 75 identifiers
  per request) instead of one request per card.
- The whole card database is **not** downloaded.
- **Attribution:** the Settings/Local-data screen credits Scryfall and Wizards
  of the Coast, and the schema file documents the data source. No API key or
  secret is required.

## 5. Caching strategy

- **In-memory response cache** in `ScryfallClient`, keyed by an explicit
  `cacheKey`, with a simple size bound (oldest-out). This covers autocomplete,
  search, exact lookup, and repeated lookups within a session.
- **Card snapshots in decks:** each `DeckCard` stores a snapshot of the card's
  domain data, so an opened deck renders fully without re-fetching Scryfall.
- No persistent HTTP cache or bulk database is introduced in this milestone
  (deferred; see "Future migration paths").

## 6. Local persistence

- IndexedDB through Dexie (`manabase` database). Tables: `decks` (primary key
  `id`, indexed by `name` and `updatedAt`) and `preferences`.
- **Explicit schema versioning:** Dexie store versions live in `db.ts`; the
  application-data shape version is `PERSISTENCE_SCHEMA_VERSION` and is stored on
  every deck (`schemaVersion`).
- **Validation before use:** every record is parsed through
  `persistedDeckSchema` on read; invalid records are skipped and counted rather
  than crashing the UI, and can be purged from the Local-data screen.
- **Autosave:** the editor debounces writes (≈400 ms) and flushes on unmount,
  deck switch, and `pagehide`/`visibilitychange`. Saves are serialized so a newer
  edit can never be overwritten by an older one, and no state is set after the
  component unmounts.
- **Schema migrations:** the store is at **v2**. The `version(2)` migration adds
  `produces` / `productionDataComplete` to each card snapshot; legacy cards are
  marked _unknown_ (not "produces nothing") and bumped to the current schema
  version. The Zod schema also defaults the new fields on read as a safety net.

## 7. Error handling

- Scryfall failures are normalized into a `ScryfallError` with a `kind`
  (`network`, `http`, `not-found`, `rate-limited`, `invalid-response`) and mapped
  to user-facing copy in `useCardSearch`/dialogs.
- Search states are explicit: `idle`, `loading`, `empty`, `success`, `error`.
- Persistence errors surface as toasts; the editor's save indicator shows
  `saving` / `saved` / `error` and keeps unsaved changes in the tab on failure.
- Corrupted local records degrade gracefully (skipped, counted, purgeable).
- Routing has a not-found route and an editor not-found/error state.

## 8. Testing strategy

- **Unit/integration (Vitest):** domain rules, deck mutations, sorting,
  grouping, filtering, import parsing, export formatting, import application,
  Scryfall response mapping, the Scryfall client (cache/dedup/error handling),
  and the Dexie repository (save/reopen/list/delete/corruption) using
  `fake-indexeddb`.
- **End-to-end (Playwright):** create a deck → choose a commander → add/remove a
  card; import a partial list and review before applying; persistence across a
  reload. Scryfall is stubbed via request interception so e2e runs offline and
  deterministically.
- Tests assert behavior and outcomes, not implementation details.

## 9. Future migration paths

- **Alternate printings:** `Card` already separates oracle-level data from a
  `CardPrinting`; adding printing selection is additive.
- **Bulk/offline card data:** a persistent card cache or Scryfall bulk dataset
  can be added behind `ScryfallApi` without touching components.
- **Schema migrations:** new Dexie `version(n).upgrade(...)` blocks plus a bumped
  `PERSISTENCE_SCHEMA_VERSION` and Zod schema; existing version blocks are never
  edited.
- **Analysis features:** the mana curve and mana production/cost comparison are
  implemented under `src/domain/analysis` (Phase 2); probability and combos are
  future milestones that will add more pure functions consuming the same model.
- **Card-data refresh:** `useCardDataRefresh` re-fetches card snapshots via the
  Scryfall collection endpoint (≤75 ids/request), replacing only card metadata
  while preserving sections, quantities, categories, dates, and organization. It
  runs only on demand and surfaces loading / partial / success / offline / error
  states. This completes legacy snapshots that predate `produces` metadata.

## 10. Known limitations

- Not a full rules engine: only singleton, color-identity (as warnings), and
  deck-size (informational) are modeled. Companion/background/partner edge cases
  are not fully handled.
- The response cache is in-memory only (cleared on reload).
- Only the default printing returned by Scryfall is used; no printing picker yet.
- No bundle code-splitting yet (single chunk); acceptable for this milestone.
- Double-faced cards use front-face data for cost/type/image, and the curve uses
  the stored front-face mana value (split/adventure cards are not double-counted).
- Analysis is heuristic: it uses Scryfall's structured mana value and
  `produced_mana` ("can produce" only — no quantity, reliability, timing, or
  restrictions), counts only strict pips as colored demand, and never emits a
  pass/fail manabase verdict. Per-color source counts are non-additive.
