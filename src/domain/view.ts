import type { DeckView } from './types';
import { EMPTY_FILTERS } from './filter';

export const SCHEMA_VERSION = 2;

export function defaultView(): DeckView {
  return {
    sort: 'manaValue',
    sortDirection: 'asc',
    groupBy: 'type',
    layout: 'detailed',
    filters: { ...EMPTY_FILTERS, colors: [] },
  };
}
