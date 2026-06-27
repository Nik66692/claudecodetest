import 'fake-indexeddb/auto';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeckEditor } from './useDeckEditor';
import { deckRepository } from '@/persistence';
import { createDeck } from '@/domain/deck';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDeckEditor autosave reliability', () => {
  it('coalesces rapid successive edits and persists the newest value', async () => {
    const deck = createDeck({ name: 'Seed', id: `rapid-${crypto.randomUUID()}` });
    await deckRepository.save(deck);

    const saveSpy = vi.spyOn(deckRepository, 'save');
    const { result } = renderHook(() => useDeckEditor(deck.id));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    saveSpy.mockClear();

    act(() => {
      result.current.rename('A');
      result.current.rename('AB');
      result.current.rename('ABC');
    });

    await waitFor(() => expect(saveSpy).toHaveBeenCalled());

    // Rapid edits coalesce rather than producing one write per keystroke…
    expect(saveSpy.mock.calls.length).toBeLessThan(3);
    // …and the newest value wins.
    expect(saveSpy.mock.calls.at(-1)?.[0].name).toBe('ABC');

    await waitFor(async () => {
      const reloaded = await deckRepository.get(deck.id);
      expect(reloaded?.name).toBe('ABC');
    });
  });

  it('flushes the newest edit when the editor unmounts before the debounce fires', async () => {
    const id = `unmount-${crypto.randomUUID()}`;
    await deckRepository.save(createDeck({ name: 'Seed', id }));

    const { result, unmount } = renderHook(() => useDeckEditor(id));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.rename('Renamed before leaving'));
    unmount();

    await waitFor(async () => {
      const reloaded = await deckRepository.get(id);
      expect(reloaded?.name).toBe('Renamed before leaving');
    });
  });
});
