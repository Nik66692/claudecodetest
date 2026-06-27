# Manabase — Milestones

The product is built in sequence. Each milestone is a usable increment; analysis
features come only after the foundation is solid.

1. **Application foundation and base deck editor** ← _milestone 1_
2. **Import, export, and local persistence** ← _milestone 2 foundation_
3. **Sorting, grouping, filters, and views** ← _milestone 3 foundation_
4. **Mana curve** ← _implemented (Phase 2)_
5. **Mana production and cost comparison** ← _implemented (Phase 2)_
6. Probability calculations
7. Technical deck analysis
8. Local combo and synergy engine
9. Primer and advanced presentation
10. Final optimization and deployment

---

## ✅ Included in the current pull request

This PR delivers **milestone 1**, plus the foundations of **milestones 2 and 3**,
as required by the milestone brief.

### Milestone 1 — Application foundation and base deck editor

- Project scaffolding: Vite + React + TypeScript (strict), React Router, CSS-
  variable design system, Dexie, Zod, Vitest + Testing Library, Playwright,
  ESLint, Prettier; dev / build / preview / lint / typecheck / test / e2e /
  format scripts; `.gitignore`.
- Project-owned design system and tokens (`src/styles/tokens.css`,
  `src/ui/*`); dark-first with a light theme.
- Application shell: responsive nav (sidebar / mobile bottom bar), skip link,
  library / editor / local-data routes, loading / empty / error states.
- Deck library: create, name, rename (in editor), duplicate, delete (with
  confirmation), open, last-modified info, intentional empty state.
- Base deck editor: Scryfall search, add/remove cards, quantity changes within
  Commander rules, commander selection/replacement, card count, card metadata,
  larger image preview with an accessible (keyboard/touch) alternative,
  commander / main / maybeboard sections, autosave to IndexedDB, refresh
  recovery.
- Typed Scryfall integration: autocomplete, card search, commander search, exact
  lookup, collection lookup; validation, throttling, dedup, in-memory cache,
  debounced interactive search, normalized error handling, attribution.
- Local persistence: Dexie with explicit schema versioning, typed repositories,
  validation on read, corruption handling.

### Milestone 2 (foundation) — Import, export, and local persistence

- Plain-text and MTGO **import** with a reviewable result (recognized /
  unrecognized / unparseable, never silently dropped) and add-vs-replace choice;
  efficient resolution via the Scryfall collection endpoint.
- Plain-text and MTGO **export** (copy / download).
- Local persistence as above (also milestone 1).

### Milestone 3 (foundation) — Sorting, grouping, filters, and views

- Separate **sort** (name, mana value, color, type, quantity, date added),
  **group** (custom category, type, mana value, color identity, section),
  **filter** (name, color, type, mana-value range, custom category), and
  **view** (compact list, detailed list, card grid) concepts.
- Editable custom categories saved with the deck.

## ✅ Added in Phase 2 — Mana curve and manabase analysis

Phase 2 hardened the Phase 1 foundation and delivered milestones **4** and **5**.

### Stability hardening (Phase 1 repairs)

- **Commander picker focus** — `Modal` now takes an explicit `initialFocusRef`
  and initializes focus exactly once per open, so typing a commander name never
  jumps focus to the close button (regression-tested in unit and e2e).
- **Commander eligibility** — `setCommander` and `moveCardToSection` refuse to
  put a non-eligible card in the commander slot; the UI hides the option;
  legacy invalid data is surfaced as a warning, not a crash.
- **MTGO round-trip** — the MTGO export emits valid `quantity name` rows with
  `// Commander` / `// Deck` / `// Sideboard` section comments instead of an
  inline `name // Commander` suffix (which broke re-import and collided with
  split-card names like `Fire // Ice`). The importer reads section-naming
  comments as headers.
- **Deck health** — `validateDeck` warnings (missing/invalid commander, deck
  size, off-color identity, singleton) are surfaced in the Analysis area.
- **Autosave** — saves are serialized (no stale overwrite), flushed on unmount /
  deck switch / `pagehide`, and never set state after unmount.

### Analysis (milestones 4 & 5)

- Pure analysis domain in `src/domain/analysis/` (curve, mana-symbol parser,
  colored demand, production sources, demand-vs-production), deterministic and
  React/Dexie/fetch-free, with comprehensive unit tests.
- New Build / Analysis tabs in the editor (nested `/decks/:id/analysis` route).
- Mana curve with 0–6 and 7+ buckets, average, percentages, drill-down, and an
  accessible table equivalent; toggles for commanders, lands, and maybeboard.
- Colored mana demand separating strict pips from hybrid, two-brid, Phyrexian,
  and explicit `{C}`.
- Mana production from Scryfall's structured `produced_mana`, split land/non-land,
  with the explicit caveat that per-color source counts are non-additive.
- An honest demand-vs-production comparison (no pass/fail verdict; only a single,
  labeled `sources / pip` heuristic with its formula shown).
- `Card` gained `produces` / `productionDataComplete`; persistence bumped to
  schema **v2** with a real migration; a "Refresh card data" operation completes
  legacy snapshots via the Scryfall collection endpoint.

## ⛔ Explicitly deferred (future milestones)

- Probability calculations (opening hands, hypergeometric, cast-on-curve,
  mulligans) and automatic land-count recommendations (milestones 6–7).
- **Local combo and synergy detection** (milestone 8).
- Deck primer and advanced presentation (milestone 9).
- Final optimization (code-splitting, deployment) (milestone 10).
- Alternate-printing selection, bulk/offline card data, Moxfield/Archidekt URL
  import, card prices.
