import type { DeckCategory, DeckFilters, ManaColor } from '@/domain/types';
import { MANA_COLORS } from '@/domain/types';
import { COLOR_LABELS } from '@/domain/colors';
import { TextField, Select, Button } from '@/ui';
import { ColorPips } from '@/ui';
import { hasActiveFilters } from '@/domain/filter';
import styles from './EditorPage.module.css';

export interface FilterBarProps {
  filters: DeckFilters;
  categories: DeckCategory[];
  onChange: (patch: Partial<DeckFilters>) => void;
  onClear: () => void;
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function FilterBar({ filters, categories, onChange, onClear }: FilterBarProps) {
  function toggleColor(color: ManaColor) {
    const next = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onChange({ colors: next });
  }

  return (
    <div className={styles.filterBar} role="group" aria-label="Filter cards">
      <TextField
        label="Card name"
        leadingIcon="search"
        placeholder="Filter by name…"
        value={filters.text}
        onChange={(e) => onChange({ text: e.target.value })}
        type="search"
      />

      <TextField
        label="Card type"
        placeholder="e.g. Creature, Land…"
        value={filters.type}
        onChange={(e) => onChange({ type: e.target.value })}
      />

      <div className={styles.miniField}>
        <span className={styles.miniLabel}>Colors</span>
        <div className={styles.colorFilter}>
          {MANA_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.colorChip}
              aria-pressed={filters.colors.includes(color)}
              aria-label={`${COLOR_LABELS[color]}${filters.colors.includes(color) ? ' (active)' : ''}`}
              onClick={() => toggleColor(color)}
            >
              <ColorPips colors={[color]} />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.miniField}>
        <span className={styles.miniLabel}>Mana value</span>
        <div className={styles.mvRange}>
          <TextField
            label="Minimum mana value"
            hideLabel
            type="number"
            min={0}
            placeholder="Min"
            value={filters.manaValueMin ?? ''}
            onChange={(e) => onChange({ manaValueMin: toNumberOrNull(e.target.value) })}
          />
          <span aria-hidden="true">–</span>
          <TextField
            label="Maximum mana value"
            hideLabel
            type="number"
            min={0}
            placeholder="Max"
            value={filters.manaValueMax ?? ''}
            onChange={(e) => onChange({ manaValueMax: toNumberOrNull(e.target.value) })}
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className={styles.miniField}>
          <span className={styles.miniLabel}>Category</span>
          <Select
            label="Filter by category"
            size="sm"
            value={filters.categoryId ?? ''}
            onChange={(e) => onChange({ categoryId: e.target.value || null })}
            options={[
              { value: '', label: 'All categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onClear} disabled={!hasActiveFilters(filters)}>
        Clear filters
      </Button>
    </div>
  );
}
