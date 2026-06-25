import Dexie, { type Table } from 'dexie';
import type { Deck } from '@/domain/types';
import { PERSISTENCE_SCHEMA_VERSION } from './schema';

/**
 * A stored app-preference row (key/value). Used for view defaults and other
 * cross-deck preferences that are not tied to a single deck.
 */
export interface PreferenceRecord {
  key: string;
  value: unknown;
  updatedAt: number;
}

/**
 * IndexedDB database for Manabase, accessed through Dexie.
 *
 * Schema versioning: each Dexie version below describes the indexes for a
 * storage revision. Migrations are added as new `.version(n).upgrade(...)`
 * blocks; existing blocks are never edited. The application-level data shape is
 * validated separately by Zod (`schema.ts`) on read.
 */
export class ManabaseDb extends Dexie {
  decks!: Table<Deck, string>;
  preferences!: Table<PreferenceRecord, string>;

  constructor(name = 'manabase') {
    super(name);
    // v1 — initial schema. `&id` primary key, indexes for library sorting.
    this.version(1).stores({
      decks: '&id, name, updatedAt',
      preferences: '&key',
    });
  }
}

export const SCHEMA_VERSION = PERSISTENCE_SCHEMA_VERSION;

let dbInstance: ManabaseDb | null = null;

/** Lazily-created shared database instance for the running app. */
export function getDb(): ManabaseDb {
  if (!dbInstance) dbInstance = new ManabaseDb();
  return dbInstance;
}
