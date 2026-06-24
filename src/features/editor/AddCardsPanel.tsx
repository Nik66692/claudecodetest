import { useState } from 'react';
import type { Card } from '@/domain/types';
import { TextField, IconButton, InlineLoading, EmptyState, ErrorState, Icon } from '@/ui';
import { useCardSearch, type SearchMode } from '@/hooks/useCardSearch';
import styles from './EditorPage.module.css';

export interface AddCardsPanelProps {
  onAddCard: (card: Card) => void;
  onSetCommander: (card: Card) => void;
  onPreview: (card: Card) => void;
  /** Hide the panel's own heading when embedded in a dialog that has a title. */
  embedded?: boolean;
}

export function AddCardsPanel({
  onAddCard,
  onSetCommander,
  onPreview,
  embedded = false,
}: AddCardsPanelProps) {
  const [mode, setMode] = useState<SearchMode>('cards');
  const [query, setQuery] = useState('');
  const search = useCardSearch(query, mode);

  const addingCommander = mode === 'commanders';

  return (
    <>
      <div className={styles.addHead}>
        {!embedded && <h2 className={styles.addTitle}>Add cards</h2>}
        <div className={styles.modeToggle} role="group" aria-label="Search mode">
          <button
            type="button"
            className={styles.modeButton}
            aria-pressed={mode === 'cards'}
            onClick={() => setMode('cards')}
          >
            All cards
          </button>
          <button
            type="button"
            className={styles.modeButton}
            aria-pressed={mode === 'commanders'}
            onClick={() => setMode('commanders')}
          >
            Commanders
          </button>
        </div>
        <TextField
          label="Search Scryfall"
          hideLabel
          leadingIcon="search"
          placeholder={addingCommander ? 'Search legendary commanders…' : 'Search cards…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          autoComplete="off"
          aria-describedby="add-search-status"
        />
      </div>

      {/* Concise live summary for screen readers; the results list itself is not
          a live region, so it does not announce every card on each keystroke. */}
      <p className="sr-only" role="status" aria-live="polite" id="add-search-status">
        {searchStatusSummary(search, addingCommander)}
      </p>

      <div className={styles.addResults}>
        {search.status === 'idle' && (
          <EmptyState icon="search" title="Search for cards">
            Type at least two letters to search Scryfall’s card database.
          </EmptyState>
        )}
        {search.status === 'loading' && <InlineLoading>Searching Scryfall…</InlineLoading>}
        {search.status === 'empty' && (
          <EmptyState icon="search" title="No matches">
            No {addingCommander ? 'commanders' : 'cards'} matched “{query.trim()}”. Check the
            spelling or try a broader term.
          </EmptyState>
        )}
        {search.status === 'error' && <ErrorState title="Search failed">{search.error}</ErrorState>}
        {search.status === 'success' && (
          <ul>
            {search.cards.map((card) => (
              <li key={card.printing.scryfallId} className={styles.resultRow}>
                <button
                  type="button"
                  className={styles.thumbButton}
                  onClick={() => onPreview(card)}
                  aria-label={`Preview ${card.name}`}
                >
                  {card.printing.images.small ? (
                    <img className={styles.resultThumb} src={card.printing.images.small} alt="" />
                  ) : (
                    <span className={styles.resultThumb} aria-hidden="true" />
                  )}
                </button>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{card.name}</span>
                  <span className={styles.resultType}>{card.typeLine}</span>
                </div>
                {addingCommander ? (
                  <IconButton
                    label={`Set ${card.name} as commander`}
                    icon="crown"
                    size="sm"
                    bordered
                    disabled={!card.canBeCommander}
                    onClick={() => onSetCommander(card)}
                  />
                ) : (
                  <IconButton
                    label={`Add ${card.name} to deck`}
                    icon="plus"
                    size="sm"
                    bordered
                    onClick={() => onAddCard(card)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {search.status === 'success' && search.totalCards > search.cards.length && (
          <p className={styles.resultsNote}>
            <Icon name="info" size={14} />
            Showing {search.cards.length} of {search.totalCards}. Refine your search to narrow
            results.
          </p>
        )}
      </div>
    </>
  );
}

function searchStatusSummary(
  search: ReturnType<typeof useCardSearch>,
  addingCommander: boolean,
): string {
  const noun = addingCommander ? 'commanders' : 'cards';
  switch (search.status) {
    case 'loading':
      return 'Searching Scryfall…';
    case 'empty':
      return `No ${noun} found.`;
    case 'error':
      return search.error ?? 'Search failed.';
    case 'success':
      return `${search.cards.length} ${search.cards.length === 1 ? 'card' : noun} found.`;
    default:
      return '';
  }
}
