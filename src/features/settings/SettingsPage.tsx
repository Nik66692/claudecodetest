import { useState } from 'react';
import { Button, ConfirmDialog, useToast } from '@/ui';
import { PageHeader } from '@/features/shared/PageHeader';
import { useDeckLibrary } from '@/hooks/useDeckLibrary';
import { useTheme } from '@/hooks/useTheme';
import { deckRepository, SCHEMA_VERSION } from '@/persistence';
import { pluralize } from '@/lib/format';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { summaries, corruptedCount } = useDeckLibrary();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const deckCount = summaries?.length ?? 0;
  const cardTotal = (summaries ?? []).reduce((sum, s) => sum + s.cardCount, 0);

  async function handleClearAll() {
    setClearing(true);
    try {
      await deckRepository.clear();
      toast({
        tone: 'success',
        title: 'All decks deleted',
        message: 'Local data has been cleared.',
      });
      setConfirmClear(false);
    } catch {
      toast({ tone: 'error', title: 'Could not clear data', message: 'Try again in a moment.' });
    } finally {
      setClearing(false);
    }
  }

  async function handlePurge() {
    const removed = await deckRepository.purgeCorrupted();
    toast({
      tone: removed > 0 ? 'success' : 'info',
      title: removed > 0 ? 'Removed unreadable decks' : 'Nothing to clean up',
      message:
        removed > 0
          ? `${removed} corrupted ${pluralize(removed, 'record')} deleted.`
          : 'No corrupted records were found.',
    });
  }

  return (
    <>
      <PageHeader title="Local data" subtitle="Everything stays in this browser." />

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Storage</h2>
            <p className={styles.sectionDesc}>
              Decks are stored in your browser via IndexedDB (schema v{SCHEMA_VERSION}). Clearing
              your browser data will remove them.
            </p>
          </div>
          <div className={styles.statRow}>
            <div>
              <div className={styles.stat}>{deckCount}</div>
              <div className={styles.statLabel}>{pluralize(deckCount, 'deck')}</div>
            </div>
            <div>
              <div className={styles.stat}>{cardTotal}</div>
              <div className={styles.statLabel}>cards across decks</div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <p className={styles.sectionDesc}>Manabase is dark by default.</p>
          </div>
          <div className={styles.row}>
            <span>Current theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
            <Button
              variant="secondary"
              icon={theme === 'dark' ? 'sun' : 'moon'}
              onClick={toggleTheme}
            >
              Switch to {theme === 'dark' ? 'light' : 'dark'}
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Maintenance</h2>
            <p className={styles.sectionDesc}>
              If a saved deck can’t be read after an update, remove the unreadable records.
            </p>
          </div>
          <div className={styles.row}>
            <span>
              {corruptedCount > 0
                ? `${corruptedCount} unreadable ${pluralize(corruptedCount, 'record')} detected.`
                : 'No unreadable records detected.'}
            </span>
            <Button variant="secondary" onClick={handlePurge} disabled={corruptedCount === 0}>
              Remove unreadable decks
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Danger zone</h2>
            <p className={styles.sectionDesc}>
              Permanently delete every deck stored on this device.
            </p>
          </div>
          <div className={styles.row}>
            <span>This cannot be undone.</span>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => setConfirmClear(true)}
              disabled={deckCount === 0}
            >
              Delete all decks
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Attribution</h2>
          </div>
          <p className={styles.attribution}>
            Card data and images are provided by the{' '}
            <a href="https://scryfall.com/docs/api" target="_blank" rel="noreferrer noopener">
              Scryfall API
            </a>
            . Magic: The Gathering is © Wizards of the Coast. Manabase is an unofficial tool and is
            not produced by or endorsed by Wizards of the Coast or Scryfall.
          </p>
        </section>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Delete all decks?"
        confirmLabel="Delete everything"
        destructive
        loading={clearing}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      >
        All {deckCount} {pluralize(deckCount, 'deck')} on this device will be permanently deleted.
        This can’t be undone.
      </ConfirmDialog>
    </>
  );
}
