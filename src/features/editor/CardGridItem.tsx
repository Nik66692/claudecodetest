import type { DeckCard } from '@/domain/types';
import { maxCopies } from '@/domain/rules';
import { CardImage, IconButton } from '@/ui';
import styles from './EditorPage.module.css';

export interface CardGridItemProps {
  entry: DeckCard;
  onIncrease: () => void;
  onDecrease: () => void;
  onPreview: () => void;
}

export function CardGridItem({ entry, onIncrease, onDecrease, onPreview }: CardGridItemProps) {
  const atMax = entry.quantity >= maxCopies(entry.card);
  return (
    <div className={styles.gridItem}>
      <button
        type="button"
        className={styles.gridImageWrap}
        onClick={onPreview}
        aria-label={`Preview ${entry.card.name}`}
      >
        <CardImage card={entry.card} size="normal" />
        {entry.quantity > 1 && <span className={styles.gridQtyBadge}>×{entry.quantity}</span>}
      </button>
      <div className={styles.gridItemBar}>
        <IconButton
          label={`Remove one ${entry.card.name}`}
          icon="minus"
          size="sm"
          bordered
          onClick={onDecrease}
        />
        <span className={`${styles.qtyValue} tabular`}>{entry.quantity}</span>
        <IconButton
          label={`Add one ${entry.card.name}`}
          icon="plus"
          size="sm"
          bordered
          onClick={onIncrease}
          disabled={atMax}
        />
      </div>
    </div>
  );
}
