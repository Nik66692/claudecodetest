import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, Deck, DeckSection } from '@/domain/types';
import * as deckOps from '@/domain/deck';
import { deckRepository } from '@/persistence';

export type EditorStatus = 'loading' | 'ready' | 'not-found' | 'error';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DeckEditorApi {
  deck: Deck | null;
  status: EditorStatus;
  saveStatus: SaveStatus;
  // Mutations
  rename: (name: string) => void;
  setDescription: (description: string) => void;
  addCard: (card: Card, options?: deckOps.AddCardOptions) => void;
  removeCard: (cardId: string, section: DeckSection) => void;
  setQuantity: (cardId: string, section: DeckSection, quantity: number) => void;
  moveCard: (cardId: string, from: DeckSection, to: DeckSection) => void;
  setCardCategory: (cardId: string, section: DeckSection, categoryId: string | null) => void;
  setCommander: (card: Card | null, additive?: boolean) => void;
  addCategory: (name: string) => string;
  renameCategory: (id: string, name: string) => void;
  removeCategory: (id: string) => void;
  updateView: (patch: Partial<Deck['view']>) => void;
  /** Replace the whole deck (used by import). */
  replace: (next: Deck) => void;
}

const SAVE_DEBOUNCE_MS = 400;

/**
 * Loads a deck into local editor state and persists every change to IndexedDB.
 * Saves are debounced so rapid edits coalesce into one write; the latest deck
 * is also flushed on unmount so nothing is lost on navigation or refresh.
 */
export function useDeckEditor(deckId: string): DeckEditorApi {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [status, setStatus] = useState<EditorStatus>('loading');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const pendingDeck = useRef<Deck | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Persist the newest pending deck. Saves are serialized: if a write is already
   * in flight, newer edits are parked in `pendingDeck` and drained in order, so
   * an older snapshot can never overwrite a newer one. Status updates are guarded
   * against the component having unmounted, so leaving the editor never triggers
   * a state update on an unmounted component while still completing the write.
   */
  const flush = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (savingRef.current || !pendingDeck.current) return;
    savingRef.current = true;
    if (mountedRef.current) setSaveStatus('saving');
    try {
      // Drain in order; new edits scheduled mid-write are picked up here.
      while (pendingDeck.current) {
        const toSave = pendingDeck.current;
        pendingDeck.current = null;
        await deckRepository.save(toSave);
      }
      if (mountedRef.current) setSaveStatus('saved');
    } catch {
      if (mountedRef.current) setSaveStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, []);

  // Keep a stable handle to flush for effects that must not re-run when it (never)
  // changes, and for the global lifecycle listeners below.
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const scheduleSave = useCallback((next: Deck) => {
    pendingDeck.current = next;
    if (mountedRef.current) setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushRef.current(), SAVE_DEBOUNCE_MS);
  }, []);

  // Load on id change. Flush any unsaved edits from the previously loaded deck
  // first so switching decks quickly cannot drop the last edit.
  useEffect(() => {
    void flushRef.current();
    let active = true;
    setStatus('loading');
    setDeck(null);
    deckRepository
      .get(deckId)
      .then((loaded) => {
        if (!active) return;
        if (!loaded) {
          setStatus('not-found');
          return;
        }
        setDeck(loaded);
        setStatus('ready');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [deckId]);

  // Flush any pending save when leaving the editor, and best-effort when the tab
  // is hidden or unloaded (covers refresh/close shortly after an edit, as far as
  // the browser reliably allows).
  useEffect(() => {
    const onLeave = () => void flushRef.current();
    window.addEventListener('pagehide', onLeave);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onLeave();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      void flushRef.current();
    };
  }, []);

  const update = useCallback(
    (mutator: (current: Deck) => Deck) => {
      setDeck((current) => {
        if (!current) return current;
        const next = mutator(current);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const addCategory = useCallback(
    (name: string): string => {
      let createdId = '';
      update((d) => {
        const { deck: nextDeck, id } = deckOps.addCategory(d, name);
        createdId = id;
        return nextDeck;
      });
      return createdId;
    },
    [update],
  );

  return {
    deck,
    status,
    saveStatus,
    rename: (name) => update((d) => deckOps.renameDeck(d, name)),
    setDescription: (description) => update((d) => deckOps.setDeckDescription(d, description)),
    addCard: (card, options) => update((d) => deckOps.addCard(d, card, options)),
    removeCard: (cardId, section) => update((d) => deckOps.removeCard(d, cardId, section)),
    setQuantity: (cardId, section, quantity) =>
      update((d) => deckOps.setCardQuantity(d, cardId, section, quantity)),
    moveCard: (cardId, from, to) => update((d) => deckOps.moveCardToSection(d, cardId, from, to)),
    setCardCategory: (cardId, section, categoryId) =>
      update((d) => deckOps.setCardCategory(d, cardId, section, categoryId)),
    setCommander: (card, additive) =>
      update((d) => deckOps.setCommander(d, card, { ...(additive ? { additive } : {}) })),
    addCategory,
    renameCategory: (id, name) => update((d) => deckOps.renameCategory(d, id, name)),
    removeCategory: (id) => update((d) => deckOps.removeCategory(d, id)),
    updateView: (patch) => update((d) => ({ ...d, view: { ...d.view, ...patch } })),
    replace: (next) => update(() => next),
  };
}
