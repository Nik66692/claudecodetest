import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Card } from '@/domain/types';
import { useDeckEditor } from '@/hooks/useDeckEditor';
import { useCardDataRefresh } from '@/hooks/useCardDataRefresh';
import { IconButton, Icon, InlineLoading, ErrorState, EmptyState } from '@/ui';
import { PageHeader } from '@/features/shared/PageHeader';
import { EditorTabs } from './EditorTabs';
import { AnalysisView } from './AnalysisView';
import { CardDetailModal } from './CardDetailModal';
import styles from './EditorPage.module.css';

export function AnalysisPage() {
  const { deckId = '' } = useParams();
  const navigate = useNavigate();
  const editor = useDeckEditor(deckId);
  const refresh = useCardDataRefresh(editor.deck, editor.replace);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);

  if (editor.status === 'loading') {
    return (
      <>
        <PageHeader title="Loading deck…" />
        <div style={{ padding: 'var(--space-8)' }}>
          <InlineLoading>Opening your deck…</InlineLoading>
        </div>
      </>
    );
  }

  if (editor.status === 'not-found') {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <PageHeader title="Deck not found" />
        <EmptyState icon="cards" title="This deck doesn’t exist">
          It may have been deleted. Head back to your library.
        </EmptyState>
      </div>
    );
  }

  if (editor.status === 'error' || !editor.deck) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <PageHeader title="Couldn’t open deck" />
        <ErrorState title="Something went wrong">
          The deck couldn’t be loaded for analysis. Try again.
        </ErrorState>
      </div>
    );
  }

  const deck = editor.deck;

  return (
    <div style={{ minWidth: 0 }}>
      <PageHeader
        leading={
          <IconButton
            label="Back to library"
            icon="arrow-left"
            bordered
            onClick={() => navigate('/')}
            iconSize={18}
          />
        }
        title={
          <input
            className={styles.titleInput}
            value={deck.name}
            aria-label="Deck name"
            onChange={(e) => editor.rename(e.target.value)}
            maxLength={120}
          />
        }
        subtitle={<SaveIndicator status={editor.saveStatus} />}
      />

      <EditorTabs deckId={deckId} />

      <AnalysisView deck={deck} refresh={refresh} onPreview={setPreviewCard} />

      <CardDetailModal card={previewCard} onClose={() => setPreviewCard(null)} />
    </div>
  );
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'All changes saved'
        : status === 'error'
          ? 'Save failed'
          : 'Analysis';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
      {status === 'error' && <Icon name="warning" size={14} />}
      {label}
    </span>
  );
}
