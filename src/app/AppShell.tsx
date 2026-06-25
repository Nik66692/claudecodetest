import { NavLink, Outlet } from 'react-router-dom';
import { Icon, type IconName } from '@/ui';
import { useTheme } from '@/hooks/useTheme';
import styles from './AppShell.module.css';

interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
}

const NAV: NavEntry[] = [
  { to: '/', label: 'Library', icon: 'library' },
  { to: '/settings', label: 'Local data', icon: 'settings' },
];

function Brand() {
  return (
    <div className={styles.brand}>
      <span className={styles.brandMark} aria-hidden="true">
        M
      </span>
      <span className={styles.brandText}>
        <span className={styles.brandName}>Manabase</span>
        <span className={styles.brandTag}>Commander deckbuilder</span>
      </span>
    </div>
  );
}

export function AppShell() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <aside className={styles.sidebar}>
        <Brand />
        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === '/'}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')
              }
            >
              <Icon name={entry.icon} size={19} />
              {entry.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.spacer} />
        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.themeToggle} onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </button>
        </div>
      </aside>

      <div className={styles.mobileBrand}>
        <Brand />
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          style={{ width: 'auto' }}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.mobileBar} aria-label="Primary">
        {NAV.map((entry) => (
          <NavLink
            key={entry.to}
            to={entry.to}
            end={entry.to === '/'}
            className={({ isActive }) =>
              [styles.mobileItem, isActive ? styles.mobileItemActive : ''].filter(Boolean).join(' ')
            }
          >
            <Icon name={entry.icon} size={20} />
            {entry.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
