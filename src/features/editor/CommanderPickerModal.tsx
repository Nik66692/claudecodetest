import { useRef, useState } from 'react';
import type { Card } from '@/domain/types';
import { Modal, TextField, IconButton, InlineLoading, EmptyState, ErrorState } from '@/ui';
import { useCardSearch } from '@/hooks/useCardSearch';
import styles from './EditorPage.module.css';

export interface CommanderPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (card: Card) => void;
}

export function CommanderPickerModal({ open, onClose, onSelect }: CommanderPickerModalProps) {
  const [query, setQuery] = useState('');
  const search = useCardSearch(open ? query : '', 'commanders');
  // The picker owns the focus target and hands it to the Modal so focus is
  // initialized exactly once on open and never competes with a stray autoFocus.
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose a commander"
      subtitle="Legendary creatures and other cards that can be your commander."
      width="34rem"
      initialFocusRef={inputRef}
    >
      <TextField
        ref={inputRef}
        label="Search commanders"
        hideLabel
        leadingIcon="search"
        placeholder="Search legendary commanders…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        autoComplete="off"
      />
      <div
        style={{ marginTop: 'var(--space-3)', maxHeight: '50vh', overflowY: 'auto' }}
        aria-live="polite"
      >
        {search.status === 'idle' && (
          <EmptyState icon="crown" title="Find your commander">
            Type at least two letters to search.
          </EmptyState>
        )}
        {search.status === 'loading' && <InlineLoading>Searching…</InlineLoading>}
        {search.status === 'empty' && (
          <EmptyState icon="search" title="No commanders found">
            Nothing matched “{query.trim()}”. Try another name.
          </EmptyState>
        )}
        {search.status === 'error' && <ErrorState title="Search failed">{search.error}</ErrorState>}
        {search.status === 'success' && (
          <ul>
            {search.cards.map((card) => (
              <li key={card.printing.scryfallId} className={styles.resultRow}>
                {card.printing.images.small ? (
                  <img className={styles.resultThumb} src={card.printing.images.small} alt="" />
                ) : (
                  <span className={styles.resultThumb} aria-hidden="true" />
                )}
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{card.name}</span>
                  <span className={styles.resultType}>{card.typeLine}</span>
                </div>
                <IconButton
                  label={`Choose ${card.name}`}
                  icon="check"
                  size="sm"
                  bordered
                  onClick={() => {
                    onSelect(card);
                    onClose();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
