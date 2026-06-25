import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DeckSummary } from '@/domain/types';
import { Icon, IconButton, ColorPips } from '@/ui';
import { relativeTime, pluralize } from '@/lib/format';
import styles from './LibraryPage.module.css';

export interface DeckCardProps {
  summary: DeckSummary;
  onDuplicate: (id: string) => void;
  onDelete: (summary: DeckSummary) => void;
}

export function DeckCard({ summary, onDuplicate, onDelete }: DeckCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const commanderLabel =
    summary.commanderNames.length > 0 ? summary.commanderNames.join(' + ') : 'No commander yet';

  return (
    <article className={styles.card}>
      <div className={styles.cardArt}>
        {summary.commanderArt ? (
          <img src={summary.commanderArt} alt="" aria-hidden="true" loading="lazy" />
        ) : (
          <div className={styles.cardArtEmpty}>
            <Icon name="crown" size={28} />
          </div>
        )}
        <div className={styles.cardArtScrim} aria-hidden="true" />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <Link to={`/decks/${summary.id}`} className={styles.cardLink}>
            {summary.name}
          </Link>
          <div className={styles.menuWrap} ref={menuRef}>
            <IconButton
              ref={triggerRef}
              label={`Actions for ${summary.name}`}
              icon="more"
              size="sm"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            />
            {menuOpen && (
              <div className={styles.menu} role="menu">
                <Link to={`/decks/${summary.id}`} className={styles.menuItem} role="menuitem">
                  <Icon name="pencil" size={16} />
                  Open
                </Link>
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(summary.id);
                  }}
                >
                  <Icon name="copy" size={16} />
                  Duplicate
                </button>
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(summary);
                  }}
                >
                  <Icon name="trash" size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className={styles.cardCommander}>{commanderLabel}</p>

        <div className={styles.cardMeta}>
          <span className={styles.cardMetaItem}>
            <ColorPips colors={summary.colorIdentity} />
          </span>
          <span className={`${styles.cardMetaItem} tabular`}>
            {summary.cardCount} {pluralize(summary.cardCount, 'card')}
          </span>
          <span className={styles.cardMetaItem}>{relativeTime(summary.updatedAt)}</span>
        </div>
      </div>
    </article>
  );
}
