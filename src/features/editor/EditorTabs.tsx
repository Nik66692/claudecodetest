import { NavLink } from 'react-router-dom';
import { Icon } from '@/ui';
import styles from './EditorTabs.module.css';

export interface EditorTabsProps {
  deckId: string;
}

/**
 * Build / Analysis switcher for the deck editor. Uses real links so each view is
 * deep-linkable and keyboard-operable; `aria-current` marks the active tab.
 */
export function EditorTabs({ deckId }: EditorTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="Deck editor views">
      <NavLink
        to={`/decks/${deckId}`}
        end
        className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
      >
        <Icon name="cards" size={16} />
        Build
      </NavLink>
      <NavLink
        to={`/decks/${deckId}/analysis`}
        className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
      >
        <Icon name="chart" size={16} />
        Analysis
      </NavLink>
    </nav>
  );
}
