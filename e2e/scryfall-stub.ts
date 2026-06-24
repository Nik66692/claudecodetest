import type { Page, Route } from '@playwright/test';

interface StubCard {
  id: string;
  name: string;
  type_line: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
}

function fullCard(card: StubCard) {
  return {
    object: 'card',
    id: card.id,
    oracle_id: `oracle-${card.id}`,
    name: card.name,
    mana_cost: card.mana_cost ?? '',
    cmc: card.cmc ?? 0,
    type_line: card.type_line,
    oracle_text: '',
    colors: card.colors ?? [],
    color_identity: card.color_identity ?? [],
    image_uris: {
      small: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
      normal: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
      art_crop: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
    },
    set: 'tst',
    set_name: 'Test Set',
    collector_number: card.id,
    rarity: 'common',
    legalities: { commander: 'legal' },
    scryfall_uri: `https://scryfall.com/card/tst/${card.id}`,
  };
}

const COMMANDERS: StubCard[] = [
  {
    id: 'azusa',
    name: 'Azusa, Lost but Seeking',
    type_line: 'Legendary Creature — Human Monk',
    mana_cost: '{2}{G}',
    cmc: 3,
    colors: ['G'],
    color_identity: ['G'],
  },
];

const CARDS: StubCard[] = [
  { id: 'solring', name: 'Sol Ring', type_line: 'Artifact', mana_cost: '{1}', cmc: 1 },
  {
    id: 'llanowar',
    name: 'Llanowar Elves',
    type_line: 'Creature — Elf Druid',
    mana_cost: '{G}',
    cmc: 1,
    colors: ['G'],
    color_identity: ['G'],
  },
  { id: 'forest', name: 'Forest', type_line: 'Basic Land — Forest', cmc: 0, color_identity: ['G'] },
];

const ALL = [...COMMANDERS, ...CARDS];

/** Install deterministic Scryfall API stubs so e2e runs fully offline. */
export async function stubScryfall(page: Page): Promise<void> {
  await page.route('https://api.scryfall.com/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === '/cards/autocomplete') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const data = ALL.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.name);
      return route.fulfill({ json: { object: 'catalog', data } });
    }

    if (path === '/cards/search') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const pool = q.includes('is:commander') ? COMMANDERS : CARDS;
      const term = q.replace(/\(|\)|is:commander/g, '').trim();
      const matches = pool.filter((c) => c.name.toLowerCase().includes(term));
      if (matches.length === 0) {
        return route.fulfill({
          status: 404,
          json: { object: 'error', status: 404, code: 'not_found', details: 'No cards found' },
        });
      }
      return route.fulfill({
        json: {
          object: 'list',
          total_cards: matches.length,
          has_more: false,
          data: matches.map(fullCard),
        },
      });
    }

    if (path === '/cards/collection') {
      const body = route.request().postDataJSON() as { identifiers: { name: string }[] };
      const data: unknown[] = [];
      const notFound: { name: string }[] = [];
      for (const ident of body.identifiers) {
        const found = ALL.find((c) => c.name.toLowerCase() === ident.name.toLowerCase());
        if (found) data.push(fullCard(found));
        else notFound.push({ name: ident.name });
      }
      return route.fulfill({ json: { object: 'list', data, not_found: notFound } });
    }

    return route.fulfill({
      status: 404,
      json: { object: 'error', status: 404, code: 'not_found', details: 'Unhandled' },
    });
  });
}
