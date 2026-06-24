# Manabase — Product Specification

> A local-first deckbuilder for Magic: The Gathering Commander.

## 1. Product goals

- Give Commander players a focused, fast, **local-first** tool to build and
  organize decks without an account, a backend, or a subscription.
- Differentiate over time through **analysis depth** — mana-curve analysis,
  mana cost vs. production comparison, on-curve probability, and local combo and
  synergy detection — rather than social features.
- Be honest about its numbers: every calculation states its assumptions and
  every estimate is labelled as an estimate.
- Feel like a serious, contemporary deckbuilding instrument, not a generic admin
  panel and not a clone of an existing site.

## 2. Target user

A Commander (EDH) player who:

- already knows the format and builds 100-card singleton decks;
- wants quick card lookup, organization, and (later) real analysis;
- values owning their data locally and working offline-friendly;
- is comfortable importing/exporting plain-text lists.

This is a single-player, single-device tool in this milestone. No collaboration,
no cloud sync.

## 3. Core use cases

1. Create, name, rename, duplicate, and delete decks.
2. Choose and replace a Commander; have the deck reflect its color identity.
3. Search Scryfall and add cards; adjust quantities within the rules.
4. Organize cards by section (commander / main / maybeboard), custom category,
   type, mana value, or color identity.
5. Sort, group, filter, and switch between list and grid views.
6. Import a deck list (plain text / MTGO) and review the result before applying.
7. Export a deck as plain text or MTGO format.
8. Keep everything saved locally and recover it after a refresh.

## 4. Permanent constraints

- **Commander is the only supported format** for now.
- **Scryfall** is the primary source for card data, images, legality, and
  metadata. No scraping of Archidekt, Moxfield, EDHREC, or other sites.
- No Claude/OpenAI/other AI APIs inside the application.
- No paid services, no backend, no account, no authentication.
- **Local-first**: decks are stored in the browser (IndexedDB).
- TypeScript in strict mode.
- Domain logic, UI, persistence, and external integrations stay separated.
- No fake functionality presented as complete; no important interactions left as
  non-functional mockups.
- Every technical calculation exposes its assumptions; every estimate is
  labelled as an estimate.
- No copying of another product's branding, interface, or source.

## 5. Initial functional scope (this milestone)

- Application shell with library, editor, and local-data routes; dark-first,
  responsive, accessible.
- Deck library: create / name / rename / duplicate / delete / open, with
  last-modified info and an intentional empty state.
- Base deck editor: Scryfall search, add/remove cards, quantity changes within
  Commander rules, commander selection/replacement, card count, card metadata,
  larger image preview (with a touch/keyboard-accessible alternative),
  commander / main / maybeboard sections, autosave, refresh recovery.
- Import/export foundation: plain-text and MTGO import with a reviewable result
  (recognized / unrecognized / unparseable, never silently discarded); plain-text
  and MTGO export.
- Sorting, grouping, filtering, and view modes (compact / detailed / grid) as
  separate concepts; editable custom categories saved with the deck.
- A coherent, project-owned design system and token set.

## 6. Future functionality (later milestones)

Mana-curve analysis; mana cost vs. production comparison; draw/cast-on-curve
probability; technical deck analysis; **local** combo and synergy detection;
deck primer and advanced presentation; alternate-printing selection; final
optimization and deployment. See `MILESTONES.md`.

## 7. Non-goals

- Other formats (Standard, Modern, etc.).
- Accounts, authentication, cloud sync, collaboration, social feeds.
- Scraping or importing from other deckbuilding websites' URLs.
- A perfect, comprehensive rules engine (only a limited, clearly-scoped rule set
  is enforced — see `DOMAIN_MODEL.md` and `src/domain/rules.ts`).
- Pricing/marketplace integration.
- Any AI-API-backed features inside the app.

## 8. Terminology

- **Deck** — a Commander deck owned by the user.
- **Commander** — the legendary card (or partner pair) that defines the deck's
  color identity; lives in the commander section.
- **Section** — `commander`, `main`, or `maybeboard`.
- **Color identity** — the set of mana colors a card contributes, used for the
  Commander color-identity rule.
- **Mana value (MV)** — converted mana cost.
- **Custom category** — a user-defined grouping bucket saved with the deck.
- **View** — the combination of sort, grouping, filters, and layout applied to a
  deck's card list.
- **Maybeboard** — cards set aside without counting toward the 100-card deck.

## 9. Acceptance criteria (this milestone)

- A user can create a deck, name it, and it appears in the library after a
  refresh (persisted in IndexedDB).
- A user can choose a Commander via Scryfall search; the deck shows the
  commander and its color identity.
- A user can search for cards, add them, change quantities (with basic-land /
  singleton behavior correct), and remove them.
- Quantities of non-basic cards are clamped to one copy; basics and
  "any number" cards are not.
- A user can switch sort, grouping, filters, and layout, and the list updates
  accordingly; custom categories persist with the deck.
- A user can import a mixed list and see which cards were recognized,
  unrecognized, and unparseable **before** choosing to add or replace; no entry
  is silently dropped.
- A user can export a deck as plain text and MTGO, and re-import the plain-text
  export to an equivalent deck.
- All changes autosave and survive a page refresh.
- Type checking, linting, unit tests, the production build, and the essential
  Playwright flows pass.
- The interface is usable and intentional at 375 / 768 / 1024 / 1440 px with
  keyboard operability, visible focus, accessible dialogs, and a
  touch/keyboard-accessible card preview.
