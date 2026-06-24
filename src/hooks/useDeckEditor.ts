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

  const flush = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const toSave = pendingDeck.current;
    if (!toSave) return;
    pendingDeck.current = null;
    setSaveStatus('saving');
    try {
      await deckRepository.save(toSave);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, []);

  const scheduleSave = useCallback(
    (next: Deck) => {
      pendingDeck.current = next;
      setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  // Load on id change.
  useEffect(() => {
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

  // Flush any pending save when leaving the editor.
  useEffect(() => {
    return () => {
      void flush();
    };
  }, [flush]);

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
