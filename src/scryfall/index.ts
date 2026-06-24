export { ScryfallClient, ScryfallError, SCRYFALL_BASE_URL } from './client';
export type { ScryfallErrorKind, ScryfallClientOptions } from './client';
export { ScryfallApi } from './api';
export type { SearchResult, CollectionResult } from './api';
export { mapScryfallCard } from './mapper';
export * from './schema';

import { ScryfallApi } from './api';

/** Shared singleton API instance for the running app. */
export const scryfall = new ScryfallApi();
