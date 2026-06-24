import type { Card } from '@/domain/types';
import { Modal, CardImage, ManaCost, Badge } from '@/ui';
import { colorIdentityLabel } from '@/domain/colors';
import styles from './EditorPage.module.css';

export interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  return (
    <Modal open={card !== null} onClose={onClose} title={card?.name ?? ''} width="40rem">
      {card && (
        <div className={styles.detailModal}>
          <div className={styles.detailImage}>
            <CardImage card={card} size="large" />
          </div>
          <div className={styles.detailText}>
            <div className={styles.detailMetaRow}>
              {card.manaCost && <ManaCost cost={card.manaCost} />}
              <Badge tone="neutral">MV {card.manaValue}</Badge>
              <Badge tone="neutral">{colorIdentityLabel(card.colorIdentity)}</Badge>
            </div>
            <p className={styles.detailTypeLine}>{card.typeLine}</p>
            {card.oracleText && <p className={styles.oracleText}>{card.oracleText}</p>}
            <p className={styles.detailPrinting}>
              {card.printing.setName} ({card.printing.set.toUpperCase()}) ·{' '}
              {card.canBeCommander ? 'Can be a commander' : 'Not a commander'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
