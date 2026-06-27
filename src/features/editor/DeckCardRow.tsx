import { useEffect, useRef, useState } from 'react';
import type { DeckCard, DeckCategory, DeckSection, LayoutMode } from '@/domain/types';
import { DECK_SECTIONS, DECK_SECTION_LABELS } from '@/domain/types';
import { maxCopies } from '@/domain/rules';
import { Icon, IconButton, ManaCost } from '@/ui';
import rowStyles from './EditorPage.module.css';
import menuStyles from '../library/LibraryPage.module.css';

export interface DeckCardRowProps {
  entry: DeckCard;
  layout: Exclude<LayoutMode, 'grid'>;
  categories: DeckCategory[];
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onPreview: () => void;
  onHover: () => void;
  onMoveSection: (to: DeckSection) => void;
  onAssignCategory: (categoryId: string | null) => void;
}

export function DeckCardRow({
  entry,
  layout,
  categories,
  onIncrease,
  onDecrease,
  onRemove,
  onPreview,
  onHover,
  onMoveSection,
  onAssignCategory,
}: DeckCardRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const limit = maxCopies(entry.card);
  const atMax = entry.quantity >= limit;

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const thumb = entry.card.printing.images.small ?? entry.card.printing.images.normal;

  return (
    <div className={rowStyles.row} onMouseEnter={onHover} onFocus={onHover}>
      <button
        type="button"
        className={rowStyles.thumbButton}
        onClick={onPreview}
        aria-label={`Preview ${entry.card.name}`}
      >
        {thumb ? (
          <img className={rowStyles.rowThumb} src={thumb} alt="" />
        ) : (
          <span className={rowStyles.rowThumb} aria-hidden="true" />
        )}
      </button>

      <div className={rowStyles.rowQty}>
        <IconButton
          label={`Remove one ${entry.card.name}`}
          icon="minus"
          size="sm"
          onClick={onDecrease}
        />
        <span className={`${rowStyles.qtyValue} tabular`}>{entry.quantity}</span>
        <IconButton
          label={`Add one ${entry.card.name}`}
          icon="plus"
          size="sm"
          onClick={onIncrease}
          disabled={atMax}
          title={atMax && limit === 1 ? 'Singleton limit: one copy in Commander' : undefined}
        />
      </div>

      <div className={rowStyles.rowMain}>
        <span className={rowStyles.rowName}>{entry.card.name}</span>
        {layout === 'detailed' && <span className={rowStyles.rowType}>{entry.card.typeLine}</span>}
      </div>

      {entry.card.manaCost ? (
        <ManaCost cost={entry.card.manaCost} />
      ) : (
        <span style={{ width: 1 }} aria-hidden="true" />
      )}

      <div className={rowStyles.rowActions}>
        <div className={menuStyles.menuWrap} ref={menuRef}>
          <IconButton
            ref={triggerRef}
            label={`More actions for ${entry.card.name}`}
            icon="more"
            size="sm"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          />
          {menuOpen && (
            <div className={`${menuStyles.menu} ${rowStyles.cardMenu}`} role="menu">
              <p className={rowStyles.menuSectionLabel}>Move to section</p>
              {DECK_SECTIONS.filter(
                // Only offer the commander destination for commander-eligible
                // cards, so a generic move can never create an invalid commander.
                (section) => section !== 'commander' || entry.card.canBeCommander,
              ).map((section) => (
                <button
                  key={section}
                  type="button"
                  role="menuitem"
                  className={menuStyles.menuItem}
                  disabled={section === entry.section}
                  onClick={() => {
                    setMenuOpen(false);
                    onMoveSection(section);
                  }}
                >
                  {section === entry.section && <Icon name="check" size={16} />}
                  {section === 'commander' ? 'Make commander' : DECK_SECTION_LABELS[section]}
                </button>
              ))}
              <p className={`${rowStyles.menuSectionLabel} ${rowStyles.menuSectionLabelDivider}`}>
                Category
              </p>
              <button
                type="button"
                role="menuitem"
                className={menuStyles.menuItem}
                onClick={() => {
                  setMenuOpen(false);
                  onAssignCategory(null);
                }}
              >
                {entry.categoryId === null && <Icon name="check" size={16} />}
                Uncategorized
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="menuitem"
                  className={menuStyles.menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    onAssignCategory(cat.id);
                  }}
                >
                  {entry.categoryId === cat.id && <Icon name="check" size={16} />}
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <IconButton
          label={`Remove ${entry.card.name} from deck`}
          icon="trash"
          size="sm"
          danger
          onClick={onRemove}
        />
      </div>
    </div>
  );
}
