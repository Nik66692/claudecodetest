import { useMemo } from 'react';
import type { Card, Deck, DeckCard, DeckSection } from '@/domain/types';
import { filterDeckCards } from '@/domain/filter';
import { sortDeckCards } from '@/domain/sort';
import { groupDeckCards } from '@/domain/group';
import { EmptyState } from '@/ui';
import { DeckCardRow } from './DeckCardRow';
import { CardGridItem } from './CardGridItem';
import styles from './EditorPage.module.css';

export interface DeckCardListProps {
  deck: Deck;
  cards: DeckCard[];
  emptyTitle: string;
  emptyBody: string;
  onIncrease: (cardId: string) => void;
  onDecrease: (cardId: string) => void;
  onRemove: (cardId: string) => void;
  onPreview: (card: Card) => void;
  onHover: (card: Card) => void;
  onMoveSection: (cardId: string, to: DeckSection) => void;
  onAssignCategory: (cardId: string, categoryId: string | null) => void;
}

export function DeckCardList({
  deck,
  cards,
  emptyTitle,
  emptyBody,
  onIncrease,
  onDecrease,
  onRemove,
  onPreview,
  onHover,
  onMoveSection,
  onAssignCategory,
}: DeckCardListProps) {
  const { view } = deck;

  const groups = useMemo(() => {
    const filtered = filterDeckCards(cards, view.filters);
    const sorted = sortDeckCards(filtered, view.sort, view.sortDirection);
    return groupDeckCards(sorted, view.groupBy, deck);
  }, [cards, view, deck]);

  const visibleCount = groups.reduce((sum, g) => sum + g.cards.length, 0);

  if (cards.length === 0) {
    return (
      <EmptyState icon="cards" title={emptyTitle}>
        {emptyBody}
      </EmptyState>
    );
  }

  if (visibleCount === 0) {
    return (
      <EmptyState icon="filter" title="No cards match these filters">
        Adjust or clear the filters to see cards in this section.
      </EmptyState>
    );
  }

  const isGrid = view.layout === 'grid';
  const rowLayout = view.layout === 'compact' ? 'compact' : 'detailed';

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group} aria-label={group.label}>
          <div className={styles.groupHead}>
            <h3 className={styles.groupName}>{group.label}</h3>
            <span className={styles.groupCount}>{group.count}</span>
          </div>
          {isGrid ? (
            <div className={styles.cardGrid}>
              {group.cards.map((entry) => (
                <CardGridItem
                  key={entry.cardId}
                  entry={entry}
                  onIncrease={() => onIncrease(entry.cardId)}
                  onDecrease={() => onDecrease(entry.cardId)}
                  onPreview={() => onPreview(entry.card)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.rowList}>
              {group.cards.map((entry) => (
                <DeckCardRow
                  key={entry.cardId}
                  entry={entry}
                  layout={rowLayout}
                  categories={deck.categories}
                  onIncrease={() => onIncrease(entry.cardId)}
                  onDecrease={() => onDecrease(entry.cardId)}
                  onRemove={() => onRemove(entry.cardId)}
                  onPreview={() => onPreview(entry.card)}
                  onHover={() => onHover(entry.card)}
                  onMoveSection={(to) => onMoveSection(entry.cardId, to)}
                  onAssignCategory={(catId) => onAssignCategory(entry.cardId, catId)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
