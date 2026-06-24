import type { Card } from '@/domain/types';
import { normalizeCardName } from '@/domain/import';
import { ScryfallClient, ScryfallError } from './client';
import { mapScryfallCard } from './mapper';
import { scryfallAutocompleteSchema, scryfallCardSchema, scryfallListSchema } from './schema';

/** Scryfall accepts up to 75 identifiers per collection request. */
const COLLECTION_CHUNK_SIZE = 75;

export interface SearchResult {
  cards: Card[];
  totalCards: number;
  hasMore: boolean;
}

export interface CollectionResult {
  /** Resolved cards keyed by normalized name for O(1) lookup. */
  byName: Map<string, Card>;
  /** Names Scryfall could not resolve. */
  notFound: string[];
}

/**
 * High-level, typed Scryfall API. This is the only module the rest of the app
 * imports for card data; components never touch the client or raw responses.
 */
export class ScryfallApi {
  constructor(private readonly client: ScryfallClient = new ScryfallClient()) {}

  /** Card-name autocomplete for interactive search. Returns up to ~20 names. */
  async autocomplete(query: string, signal?: AbortSignal): Promise<string[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const result = await this.client.request(
      {
        path: `/cards/autocomplete?q=${encodeURIComponent(q)}`,
        cacheKey: `autocomplete:${q.toLowerCase()}`,
        ...(signal ? { signal } : {}),
      },
      scryfallAutocompleteSchema,
    );
    return result.data;
  }

  /** Full card search using Scryfall query syntax, restricted to one page. */
  async searchCards(query: string, signal?: AbortSignal): Promise<SearchResult> {
    return this.search(query, signal);
  }

  /** Search restricted to cards that can be a commander. */
  async searchCommanders(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const trimmed = query.trim();
    const q = trimmed ? `(${trimmed}) is:commander` : 'is:commander';
    return this.search(q, signal, 'edhrec');
  }

  private async search(
    query: string,
    signal?: AbortSignal,
    order: 'name' | 'edhrec' = 'name',
  ): Promise<SearchResult> {
    const q = query.trim();
    if (!q) return { cards: [], totalCards: 0, hasMore: false };
    const path =
      `/cards/search?q=${encodeURIComponent(q)}` +
      `&unique=cards&order=${order}&dir=auto&include_extras=false`;
    try {
      const list = await this.client.request(
        { path, cacheKey: `search:${order}:${q.toLowerCase()}`, ...(signal ? { signal } : {}) },
        scryfallListSchema,
      );
      return {
        cards: list.data.map(mapScryfallCard),
        totalCards: list.total_cards ?? list.data.length,
        hasMore: list.has_more ?? false,
      };
    } catch (error) {
      // A search with zero results returns HTTP 404 — treat as an empty result.
      if (error instanceof ScryfallError && error.kind === 'not-found') {
        return { cards: [], totalCards: 0, hasMore: false };
      }
      throw error;
    }
  }

  /** Exact card lookup by name. Returns `null` when no exact match exists. */
  async getCardByExactName(name: string, signal?: AbortSignal): Promise<Card | null> {
    try {
      const card = await this.client.request(
        {
          path: `/cards/named?exact=${encodeURIComponent(name)}`,
          cacheKey: `named:${normalizeCardName(name)}`,
          ...(signal ? { signal } : {}),
        },
        scryfallCardSchema,
      );
      return mapScryfallCard(card);
    } catch (error) {
      if (error instanceof ScryfallError && error.kind === 'not-found') return null;
      throw error;
    }
  }

  /**
   * Resolve many card names in as few requests as possible using the collection
   * endpoint (75 identifiers per request) rather than one request per card.
   */
  async getCollectionByNames(names: string[], signal?: AbortSignal): Promise<CollectionResult> {
    const byName = new Map<string, Card>();
    const notFound: string[] = [];
    const unique = dedupePreservingCase(names);

    for (let i = 0; i < unique.length; i += COLLECTION_CHUNK_SIZE) {
      const chunk = unique.slice(i, i + COLLECTION_CHUNK_SIZE);
      const list = await this.client.request(
        {
          path: '/cards/collection',
          method: 'POST',
          body: { identifiers: chunk.map((name) => ({ name })) },
          ...(signal ? { signal } : {}),
        },
        scryfallListSchema,
      );
      for (const raw of list.data) {
        const card = mapScryfallCard(raw);
        byName.set(normalizeCardName(card.name), card);
      }
      for (const nf of list.not_found ?? []) {
        const name = extractName(nf);
        if (name) notFound.push(name);
      }
    }

    return { byName, notFound };
  }
}

function dedupePreservingCase(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const key = normalizeCardName(name);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(name.trim());
    }
  }
  return out;
}

function extractName(value: unknown): string | null {
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return null;
}
