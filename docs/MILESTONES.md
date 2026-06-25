# Manabase — Milestones

The product is built in sequence. Each milestone is a usable increment; analysis
features come only after the foundation is solid.

1. **Application foundation and base deck editor** ← _included in this PR_
2. **Import, export, and local persistence** ← _included in this PR_
3. **Sorting, grouping, filters, and views** ← _included in this PR (foundation)_
4. Mana curve
5. Mana production and cost comparison
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

## ⛔ Explicitly deferred (not in this PR)

- Mana-curve analysis and all later analysis (milestones 4–7).
- **Local combo and synergy detection** (milestone 8) — explicitly out of scope
  for this milestone.
- Deck primer and advanced presentation (milestone 9).
- Final optimization (code-splitting, deployment) (milestone 10).
- Alternate-printing selection, bulk/offline card data, Moxfield/Archidekt URL
  import.
