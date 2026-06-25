import { test, expect } from '@playwright/test';
import { stubScryfall } from './scryfall-stub';

test.beforeEach(async ({ page }) => {
  await stubScryfall(page);
});

test('create a deck, choose a commander, add and remove a card', async ({ page }) => {
  await page.goto('/');

  // Empty state → create first deck.
  await expect(page.getByRole('heading', { name: 'No decks yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Create your first deck' }).click();

  // Create dialog.
  await page.getByLabel('Deck name').fill('Azusa Lands');
  await page.getByRole('button', { name: 'Create deck' }).click();

  // Editor opens with the chosen name.
  await expect(page.getByLabel('Deck name')).toHaveValue('Azusa Lands');

  // Choose a commander.
  await page.getByRole('button', { name: 'Choose commander' }).click();
  await page.getByPlaceholder('Search legendary commanders…').fill('Azusa');
  await page.getByRole('button', { name: 'Choose Azusa, Lost but Seeking' }).click();
  await expect(page.getByText('Azusa, Lost but Seeking')).toBeVisible();

  // Add a card from the search rail.
  await page.getByPlaceholder('Search cards…').fill('Sol Ring');
  await page.getByRole('button', { name: 'Add Sol Ring to deck' }).click();

  // Card count reflects commander + Sol Ring.
  await expect(page.getByText('2 / 100 cards')).toBeVisible();

  // Remove the card.
  await page.getByRole('button', { name: 'Remove Sol Ring from deck' }).click();
  await expect(page.getByText('1 / 100 cards')).toBeVisible();
});

test('import a partial deck list and review results before applying', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create your first deck' }).click();
  await page.getByLabel('Deck name').fill('Imported');
  await page.getByRole('button', { name: 'Create deck' }).click();
  await expect(page.getByLabel('Deck name')).toHaveValue('Imported');

  await page.getByRole('button', { name: 'Import' }).click();
  await page
    .getByRole('textbox', { name: 'Deck list' })
    .fill('1 Sol Ring\n1 Llanowar Elves\n1 Totally Fake Card');
  await page.getByRole('button', { name: 'Check cards' }).click();

  // Review screen reports recognized and not-found counts.
  await expect(page.getByText('2 recognized', { exact: false })).toBeVisible();
  await expect(page.getByText('1 not found', { exact: false })).toBeVisible();
  await expect(page.getByText('Totally Fake Card', { exact: false })).toBeVisible();

  // Apply the recognized cards.
  await page.getByRole('button', { name: /Add 2 cards/ }).click();
  await expect(page.getByText('2 / 100 cards')).toBeVisible();
});

test('library persists a created deck across a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create your first deck' }).click();
  await page.getByLabel('Deck name').fill('Persistent Deck');
  await page.getByRole('button', { name: 'Create deck' }).click();
  await expect(page.getByLabel('Deck name')).toHaveValue('Persistent Deck');

  // Back to the library and reload to confirm IndexedDB persistence.
  await page.goto('/');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Persistent Deck' })).toBeVisible();
});
