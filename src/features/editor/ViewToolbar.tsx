import type { DeckView, GroupKey, LayoutMode, SortKey } from '@/domain/types';
import { Select, IconButton } from '@/ui';
import styles from './EditorPage.module.css';

export interface ViewToolbarProps {
  view: DeckView;
  onChange: (patch: Partial<DeckView>) => void;
  onToggleFilters: () => void;
  filtersActive: boolean;
  filtersOpen: boolean;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'manaValue', label: 'Mana value' },
  { value: 'name', label: 'Name' },
  { value: 'color', label: 'Color' },
  { value: 'type', label: 'Type' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'dateAdded', label: 'Date added' },
];

const GROUP_OPTIONS: { value: GroupKey; label: string }[] = [
  { value: 'type', label: 'Card type' },
  { value: 'manaValue', label: 'Mana value' },
  { value: 'colorIdentity', label: 'Color identity' },
  { value: 'category', label: 'Custom category' },
  { value: 'section', label: 'Deck section' },
  { value: 'none', label: 'No grouping' },
];

const LAYOUTS: { value: LayoutMode; icon: 'list' | 'rows' | 'grid'; label: string }[] = [
  { value: 'compact', icon: 'list', label: 'Compact list' },
  { value: 'detailed', icon: 'rows', label: 'Detailed list' },
  { value: 'grid', icon: 'grid', label: 'Card grid' },
];

export function ViewToolbar({
  view,
  onChange,
  onToggleFilters,
  filtersActive,
  filtersOpen,
}: ViewToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <span className={styles.toolbarLabel}>Sort</span>
        <Select
          label="Sort cards by"
          size="sm"
          value={view.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          options={SORT_OPTIONS}
        />
        <IconButton
          label={view.sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
          icon={view.sortDirection === 'asc' ? 'chevron-down' : 'chevron-right'}
          size="sm"
          bordered
          onClick={() => onChange({ sortDirection: view.sortDirection === 'asc' ? 'desc' : 'asc' })}
        />
      </div>

      <div className={styles.toolbarGroup}>
        <span className={styles.toolbarLabel}>Group</span>
        <Select
          label="Group cards by"
          size="sm"
          value={view.groupBy}
          onChange={(e) => onChange({ groupBy: e.target.value as GroupKey })}
          options={GROUP_OPTIONS}
        />
      </div>

      <IconButton
        label={filtersOpen ? 'Hide filters' : 'Show filters'}
        icon="filter"
        size="sm"
        bordered
        active={filtersActive || filtersOpen}
        onClick={onToggleFilters}
      />

      <div className={styles.spacerFlex} />

      <div className={styles.layoutToggle} role="group" aria-label="Card layout">
        {LAYOUTS.map((l) => (
          <IconButton
            key={l.value}
            label={l.label}
            icon={l.icon}
            size="sm"
            active={view.layout === l.value}
            onClick={() => onChange({ layout: l.value })}
          />
        ))}
      </div>
    </div>
  );
}
