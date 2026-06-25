import type { DeckCard } from '@/domain/types';
import { Button, Icon, IconButton, ColorPips } from '@/ui';
import styles from './EditorPage.module.css';

export interface CommanderBarProps {
  commanders: DeckCard[];
  colorIdentity: import('@/domain/types').ManaColor[];
  onChoose: () => void;
  onRemove: (cardId: string) => void;
  onPreview: (card: DeckCard['card']) => void;
}

export function CommanderBar({
  commanders,
  colorIdentity,
  onChoose,
  onRemove,
  onPreview,
}: CommanderBarProps) {
  if (commanders.length === 0) {
    return (
      <div className={styles.commanderBar}>
        <div className={`${styles.commanderArt} ${styles.commanderArtPlaceholder}`}>
          <Icon name="crown" size={24} />
        </div>
        <div className={styles.commanderInfo}>
          <span className={styles.commanderLabel}>Commander</span>
          <span className={styles.commanderEmpty}>
            No commander selected. Choose one to set your deck’s color identity.
          </span>
        </div>
        <Button variant="primary" icon="crown" onClick={onChoose}>
          Choose commander
        </Button>
      </div>
    );
  }

  const primary = commanders[0]!;
  const art = primary.card.printing.images.artCrop ?? primary.card.printing.images.small;

  return (
    <div className={styles.commanderBar}>
      <button
        type="button"
        className={styles.thumbButton}
        onClick={() => onPreview(primary.card)}
        aria-label={`Preview ${primary.card.name}`}
      >
        {art ? (
          <img className={styles.commanderArt} src={art} alt="" />
        ) : (
          <span className={`${styles.commanderArt} ${styles.commanderArtPlaceholder}`}>
            <Icon name="crown" size={24} />
          </span>
        )}
      </button>
      <div className={styles.commanderInfo}>
        <span className={styles.commanderLabel}>
          {commanders.length > 1 ? 'Commanders' : 'Commander'}
        </span>
        <span className={styles.commanderName}>
          {commanders.map((c) => c.card.name).join('  +  ')}
        </span>
        <span className={styles.commanderPips}>
          <ColorPips colors={colorIdentity} />
        </span>
      </div>
      <div className={styles.commanderActions}>
        <Button variant="secondary" size="sm" icon="pencil" onClick={onChoose}>
          Replace
        </Button>
        <IconButton
          label="Remove commander"
          icon="trash"
          size="sm"
          danger
          onClick={() => onRemove(primary.cardId)}
        />
      </div>
    </div>
  );
}
