import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DeckSummary } from '@/domain/types';
import { Button, ConfirmDialog, EmptyState, Icon, InlineLoading, useToast } from '@/ui';
import { duplicateDeck } from '@/domain/deck';
import { deckRepository } from '@/persistence';
import { PageHeader } from '@/features/shared/PageHeader';
import { useDeckLibrary } from '@/hooks/useDeckLibrary';
import { pluralize } from '@/lib/format';
import { CreateDeckDialog } from './CreateDeckDialog';
import { DeckCard } from './DeckCard';
import styles from './LibraryPage.module.css';

export function LibraryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { summaries, corruptedCount } = useDeckLibrary();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DeckSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDuplicate(id: string) {
    const deck = await deckRepository.get(id);
    if (!deck) {
      toast({ tone: 'error', title: 'Deck not found', message: 'It may have been deleted.' });
      return;
    }
    const copy = duplicateDeck(deck);
    await deckRepository.save(copy);
    toast({ tone: 'success', title: 'Deck duplicated', message: `Created “${copy.name}”.` });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deckRepository.delete(pendingDelete.id);
      toast({
        tone: 'success',
        title: 'Deck deleted',
        message: `“${pendingDelete.name}” was removed.`,
      });
      setPendingDelete(null);
    } catch {
      toast({ tone: 'error', title: 'Could not delete deck', message: 'Try again in a moment.' });
    } finally {
      setDeleting(false);
    }
  }

  const isLoading = summaries === undefined;
  const isEmpty = summaries !== undefined && summaries.length === 0;
  const count = summaries?.length ?? 0;

  return (
    <>
      <PageHeader
        title="Your decks"
        subtitle={
          isLoading
            ? 'Loading your local library…'
            : `${count} ${pluralize(count, 'deck')} saved on this device`
        }
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
            New deck
          </Button>
        }
      />

      <div className={styles.content}>
        {corruptedCount > 0 && (
          <div className={styles.notice} role="status">
            <Icon name="warning" size={18} />
            {corruptedCount} saved {pluralize(corruptedCount, 'deck')} could not be read and{' '}
            {corruptedCount === 1 ? 'is' : 'are'} hidden. You can remove them from Local data.
          </div>
        )}

        {isLoading && <InlineLoading>Loading your decks…</InlineLoading>}

        {isEmpty && (
          <EmptyState
            icon="library"
            title="No decks yet"
            actions={
              <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
                Create your first deck
              </Button>
            }
          >
            Build your first Commander deck. Everything is saved locally in your browser — no
            account needed.
          </EmptyState>
        )}

        {!isLoading && !isEmpty && summaries && (
          <div className={styles.grid}>
            {summaries.map((summary) => (
              <DeckCard
                key={summary.id}
                summary={summary}
                onDuplicate={handleDuplicate}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      <CreateDeckDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          navigate(`/decks/${id}`);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete deck?"
        confirmLabel="Delete deck"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        “{pendingDelete?.name}” and its cards will be permanently deleted from this device. This
        can’t be undone.
      </ConfirmDialog>
    </>
  );
}
