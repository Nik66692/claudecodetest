import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommanderPickerModal } from './CommanderPickerModal';
import { makeCard } from '@/test/fixtures';

// Stub the Scryfall layer so the picker's search never touches the network and
// resolves deterministically. The focus regression is independent of search.
const searchCommanders = vi.fn();
vi.mock('@/scryfall', () => {
  class ScryfallError extends Error {
    kind: string;
    constructor(kind: string, message: string) {
      super(message);
      this.kind = kind;
    }
  }
  return {
    ScryfallError,
    scryfall: {
      searchCommanders: (...args: unknown[]) => searchCommanders(...args),
      searchCards: () => Promise.resolve({ cards: [], totalCards: 0, hasMore: false }),
    },
  };
});

beforeEach(() => {
  searchCommanders.mockResolvedValue({
    cards: [makeCard({ name: 'Azusa, Lost but Seeking', canBeCommander: true })],
    totalCards: 1,
    hasMore: false,
  });
});

describe('CommanderPickerModal focus (Phase 1 regression)', () => {
  it('focuses the search input on open and never lets focus escape while typing', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <CommanderPickerModal open onClose={() => {}} onSelect={() => {}} />
      </StrictMode>,
    );

    const input = screen.getByPlaceholderText('Search legendary commanders…') as HTMLInputElement;
    const closeButton = screen.getByRole('button', { name: 'Close dialog' });

    // Opening the picker focuses the commander search input.
    expect(document.activeElement).toBe(input);

    // Type a full multi-character commander name continuously.
    const name = 'Azusa, Lost but Seeking';
    await user.type(input, name);

    // The full value appears and the input keeps focus throughout — the close
    // button must never steal it.
    expect(input.value).toBe(name);
    expect(document.activeElement).toBe(input);
    expect(document.activeElement).not.toBe(closeButton);

    // A search-state change (a rerender) must not move focus either.
    await screen.findByText('Azusa, Lost but Seeking');
    expect(document.activeElement).toBe(input);
  });
});
