import type { Deck, DeckSummary } from '@/domain/types';
import { toDeckSummary } from '@/domain/summary';
import { ManabaseDb, getDb } from './db';
import { persistedDeckSchema } from './schema';

export interface LoadDecksResult {
  decks: Deck[];
  /** Ids of records that failed validation and were skipped. */
  corrupted: string[];
}

/**
 * Typed repository for deck persistence. Holds no business logic — it only
 * reads, writes and validates records. Domain mutations live in
 * `@/domain/deck`. Every record is validated through {@link persistedDeckSchema}
 * on read so corrupted local data degrades gracefully instead of crashing.
 */
export class DeckRepository {
  constructor(private readonly db: ManabaseDb = getDb()) {}

  /** Validate a raw record, returning the typed deck or `null` if corrupted. */
  private parse(raw: unknown): Deck | null {
    const result = persistedDeckSchema.safeParse(raw);
    return result.success ? (result.data as Deck) : null;
  }

  async getAll(): Promise<LoadDecksResult> {
    const rows = await this.db.decks.toArray();
    const decks: Deck[] = [];
    const corrupted: string[] = [];
    for (const row of rows) {
      const parsed = this.parse(row);
      if (parsed) decks.push(parsed);
      else corrupted.push((row as { id?: string })?.id ?? 'unknown');
    }
    decks.sort((a, b) => b.updatedAt - a.updatedAt);
    return { decks, corrupted };
  }

  async listSummaries(): Promise<DeckSummary[]> {
    const { decks } = await this.getAll();
    return decks.map(toDeckSummary);
  }

  async get(id: string): Promise<Deck | null> {
    const row = await this.db.decks.get(id);
    if (!row) return null;
    return this.parse(row);
  }

  /** Insert or replace a deck. Validates before writing to reject bad data. */
  async save(deck: Deck): Promise<void> {
    const result = persistedDeckSchema.safeParse(deck);
    if (!result.success) {
      throw new Error(
        `Refusing to save invalid deck "${deck.name}": ${result.error.issues[0]?.message ?? 'invalid shape'}`,
      );
    }
    await this.db.decks.put(result.data as Deck);
  }

  async delete(id: string): Promise<void> {
    await this.db.decks.delete(id);
  }

  /** Remove records that fail validation. Returns the number deleted. */
  async purgeCorrupted(): Promise<number> {
    const { corrupted } = await this.getAll();
    if (corrupted.length) await this.db.decks.bulkDelete(corrupted);
    return corrupted.length;
  }

  async clear(): Promise<void> {
    await this.db.decks.clear();
  }
}
