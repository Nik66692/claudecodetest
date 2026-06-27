import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Card, DeckImportResult, DeckSection, DeckView } from '@/domain/types';
import { commanders, commanderColorIdentity, sectionCount, totalCardCount } from '@/domain/rules';
import { applyImportResult } from '@/domain/deck';
import { EMPTY_FILTERS, hasActiveFilters } from '@/domain/filter';
import {
  Button,
  IconButton,
  CardImage,
  EmptyState,
  ErrorState,
  InlineLoading,
  useToast,
} from '@/ui';
import { PageHeader } from '@/features/shared/PageHeader';
import { Modal } from '@/ui';
import { useDeckEditor } from '@/hooks/useDeckEditor';
import { pluralize } from '@/lib/format';
import { CommanderBar } from './CommanderBar';
import { CommanderPickerModal } from './CommanderPickerModal';
import { EditorTabs } from './EditorTabs';
import { ViewToolbar } from './ViewToolbar';
import { FilterBar } from './FilterBar';
import { DeckCardList } from './DeckCardList';
import { AddCardsPanel } from './AddCardsPanel';
import { CardDetailModal } from './CardDetailModal';
import { ImportDialog, type ImportMode } from './ImportDialog';
import { ExportDialog } from './ExportDialog';
import { CategoryDialog } from './CategoryDialog';
import styles from './EditorPage.module.css';

function SaveIndicator({ status }: { status: ReturnType<typeof useDeckEditor>['saveStatus'] }) {
  const map = {
    idle: { label: 'All changes saved locally', dot: styles.saveDotSaved },
    saving: { label: 'Saving…', dot: '' },
    saved: { label: 'Saved locally', dot: styles.saveDotSaved },
    error: { label: 'Save failed — changes kept in this tab', dot: styles.saveDotError },
  } as const;
  const { label, dot } = map[status];
  return (
    <span className={styles.saveIndicator} role="status">
      <span className={`${styles.saveDot} ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function EditorPage() {
  const { deckId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editor = useDeckEditor(deckId);

  const [activeSection, setActiveSection] = useState<Exclude<DeckSection, 'commander'>>('main');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [hoverCard, setHoverCard] = useState<Card | null>(null);
  const [commanderPickerOpen, setCommanderPickerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);

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
      <>
        <PageHeader title="Deck not found" />
        <div style={{ padding: 'var(--space-8)' }}>
          <EmptyState
            icon="library"
            title="This deck doesn’t exist"
            actions={
              <Button variant="primary" icon="library" onClick={() => navigate('/')}>
                Back to library
              </Button>
            }
          >
            It may have been deleted from this device.
          </EmptyState>
        </div>
      </>
    );
  }

  if (editor.status === 'error' || !editor.deck) {
    return (
      <>
        <PageHeader title="Couldn’t open deck" />
        <div style={{ padding: 'var(--space-8)' }}>
          <ErrorState
            title="Something went wrong"
            actions={
              <Button variant="primary" onClick={() => navigate('/')}>
                Back to library
              </Button>
            }
          >
            The deck data could not be loaded from local storage.
          </ErrorState>
        </div>
      </>
    );
  }

  const deck = editor.deck;
  const cmdrs = commanders(deck);
  const identity = commanderColorIdentity(deck);
  const total = totalCardCount(deck);
  const sectionCards = deck.cards.filter((c) => c.section === activeSection);
  const mainCount = sectionCount(deck, 'main');
  const maybeCount = sectionCount(deck, 'maybeboard');

  function handleAddCard(card: Card) {
    editor.addCard(card, { section: activeSection === 'maybeboard' ? 'maybeboard' : 'main' });
    toast({ tone: 'success', title: 'Card added', message: card.name, duration: 1800 });
  }

  function handleApplyImport(result: DeckImportResult, mode: ImportMode) {
    editor.replace(applyImportResult(deck, result, mode));
    const copies = result.recognized.reduce((s, e) => s + e.line.quantity, 0);
    toast({
      tone: 'success',
      title: mode === 'replace' ? 'Deck replaced' : 'Cards imported',
      message: `${copies} ${pluralize(copies, 'card')} added${
        result.unrecognized.length ? `, ${result.unrecognized.length} skipped` : ''
      }.`,
    });
  }

  const updateView = (patch: Partial<DeckView>) => editor.updateView(patch);
  const updateFilters = (patch: Partial<DeckView['filters']>) =>
    editor.updateView({ filters: { ...deck.view.filters, ...patch } });

  return (
    <div className={styles.layout}>
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
          actions={
            <>
              <Button variant="ghost" icon="upload" onClick={() => setImportOpen(true)}>
                Import
              </Button>
              <Button variant="ghost" icon="download" onClick={() => setExportOpen(true)}>
                Export
              </Button>
            </>
          }
        />

        <EditorTabs deckId={deckId} />

        <div className={styles.deckColumn}>
          <CommanderBar
            commanders={cmdrs}
            colorIdentity={identity}
            onChoose={() => setCommanderPickerOpen(true)}
            onRemove={(cardId) => editor.removeCard(cardId, 'commander')}
            onPreview={(card) => setPreviewCard(card)}
          />

          {/* Section + count */}
          <div className={styles.toolbar}>
            <div className={styles.modeToggle} role="group" aria-label="Deck section">
              <button
                type="button"
                className={styles.modeButton}
                aria-pressed={activeSection === 'main'}
                onClick={() => setActiveSection('main')}
              >
                Main deck · {mainCount}
              </button>
              <button
                type="button"
                className={styles.modeButton}
                aria-pressed={activeSection === 'maybeboard'}
                onClick={() => setActiveSection('maybeboard')}
              >
                Maybeboard · {maybeCount}
              </button>
            </div>
            <div className={styles.spacerFlex} />
            <Button variant="ghost" size="sm" icon="filter" onClick={() => setCategoryOpen(true)}>
              Categories
            </Button>
            <span className={`${styles.countPill} tabular`}>{total} / 100 cards</span>
          </div>

          <ViewToolbar
            view={deck.view}
            onChange={updateView}
            onToggleFilters={() => setFiltersOpen((v) => !v)}
            filtersActive={hasActiveFilters(deck.view.filters)}
            filtersOpen={filtersOpen}
          />

          {filtersOpen && (
            <FilterBar
              filters={deck.view.filters}
              categories={deck.categories}
              onChange={updateFilters}
              onClear={() => editor.updateView({ filters: { ...EMPTY_FILTERS } })}
            />
          )}

          <DeckCardList
            deck={deck}
            cards={sectionCards}
            emptyTitle={
              activeSection === 'main' ? 'Your main deck is empty' : 'Nothing in the maybeboard'
            }
            emptyBody={
              activeSection === 'main'
                ? 'Search for cards on the right and add them to start building.'
                : 'Move cards here to set them aside without removing them from your ideas.'
            }
            onIncrease={(id) =>
              editor.setQuantity(
                id,
                activeSection,
                (sectionCards.find((c) => c.cardId === id)?.quantity ?? 0) + 1,
              )
            }
            onDecrease={(id) =>
              editor.setQuantity(
                id,
                activeSection,
                (sectionCards.find((c) => c.cardId === id)?.quantity ?? 0) - 1,
              )
            }
            onRemove={(id) => editor.removeCard(id, activeSection)}
            onPreview={(card) => setPreviewCard(card)}
            onHover={(card) => setHoverCard(card)}
            onMoveSection={(id, to) => editor.moveCard(id, activeSection, to)}
            onAssignCategory={(id, catId) => editor.setCardCategory(id, activeSection, catId)}
          />
        </div>
      </div>

      {/* Desktop add-cards rail */}
      <aside className={styles.addColumn} aria-label="Add cards">
        <AddCardsPanel
          onAddCard={handleAddCard}
          onSetCommander={(card) => editor.setCommander(card)}
          onPreview={(card) => setPreviewCard(card)}
        />
      </aside>

      {/* Mobile add-cards trigger */}
      <div className={styles.mobileAddBar}>
        <Button variant="primary" icon="plus" onClick={() => setMobileAddOpen(true)}>
          Add cards
        </Button>
      </div>

      {/* Desktop hover preview (enhancement; the per-card preview button is the
          guaranteed keyboard/touch path). */}
      {hoverCard && (
        <div className={styles.hoverPreview} aria-hidden="true">
          <CardImage card={hoverCard} size="normal" />
        </div>
      )}

      <CommanderPickerModal
        open={commanderPickerOpen}
        onClose={() => setCommanderPickerOpen(false)}
        onSelect={(card) => editor.setCommander(card)}
      />

      <CardDetailModal card={previewCard} onClose={() => setPreviewCard(null)} />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApply={handleApplyImport}
      />

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} deck={deck} />

      <CategoryDialog
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        categories={deck.categories}
        onAdd={(name) => editor.addCategory(name)}
        onRename={(id, name) => editor.renameCategory(id, name)}
        onRemove={(id) => editor.removeCategory(id)}
      />

      <Modal
        open={mobileAddOpen}
        onClose={() => setMobileAddOpen(false)}
        title="Add cards"
        width="32rem"
      >
        <AddCardsPanel
          embedded
          onAddCard={handleAddCard}
          onSetCommander={(card) => editor.setCommander(card)}
          onPreview={(card) => setPreviewCard(card)}
        />
      </Modal>
    </div>
  );
}
