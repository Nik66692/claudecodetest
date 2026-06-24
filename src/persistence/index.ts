export { ManabaseDb, getDb, SCHEMA_VERSION } from './db';
export type { PreferenceRecord } from './db';
export { DeckRepository } from './deckRepository';
export type { LoadDecksResult } from './deckRepository';
export { PreferenceRepository } from './preferenceRepository';
export { persistedDeckSchema, PERSISTENCE_SCHEMA_VERSION } from './schema';
export type { PersistedDeck } from './schema';

import { DeckRepository } from './deckRepository';
import { PreferenceRepository } from './preferenceRepository';

/** Shared repository singletons for the running app. */
export const deckRepository = new DeckRepository();
export const preferenceRepository = new PreferenceRepository();
