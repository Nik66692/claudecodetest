import { describe, it, expect } from 'vitest';
import { scryfallCardSchema } from './schema';
import { mapScryfallCard } from './mapper';

function parseAndMap(raw: unknown) {
  const parsed = scryfallCardSchema.parse(raw);
  return mapScryfallCard(parsed);
}

describe('mapScryfallCard', () => {
  it('maps a normal creature into the domain shape', () => {
    const card = parseAndMap({
      id: 'abc',
      oracle_id: 'oracle-abc',
      name: 'Llanowar Elves',
      mana_cost: '{G}',
      cmc: 1,
      type_line: 'Creature — Elf Druid',
      oracle_text: '{T}: Add {G}.',
      colors: ['G'],
      color_identity: ['G'],
      image_uris: { small: 'https://img/s.jpg', normal: 'https://img/n.jpg' },
      set: 'm19',
      set_name: 'Core Set 2019',
      collector_number: '314',
      rarity: 'common',
      legalities: { commander: 'legal' },
      scryfall_uri: 'https://scryfall.com/card/m19/314',
    });

    expect(card.oracleId).toBe('oracle-abc');
    expect(card.manaValue).toBe(1);
    expect(card.colorIdentity).toEqual(['G']);
    expect(card.commanderLegal).toBe(true);
    expect(card.canBeCommander).toBe(false);
    expect(card.printing.images.normal).toBe('https://img/n.jpg');
    // No produced_mana on this raw card → captured, produces nothing.
    expect(card.produces).toEqual([]);
    expect(card.productionDataComplete).toBe(true);
  });

  it('maps produced_mana into normalized production data (WUBRG+C order)', () => {
    const card = parseAndMap({
      id: 'command-tower',
      name: 'Command Tower',
      type_line: 'Land',
      produced_mana: ['G', 'W', 'U', 'B', 'R'],
      set: 'cmd',
      collector_number: '1',
    });
    expect(card.produces).toEqual(['W', 'U', 'B', 'R', 'G']);
    expect(card.productionDataComplete).toBe(true);
  });

  it('captures colorless production', () => {
    const card = parseAndMap({
      id: 'sol-ring',
      name: 'Sol Ring',
      mana_cost: '{1}',
      cmc: 1,
      type_line: 'Artifact',
      produced_mana: ['C'],
      set: 'cmd',
      collector_number: '2',
    });
    expect(card.produces).toEqual(['C']);
  });

  it('flags legendary creatures as commander-eligible', () => {
    const card = parseAndMap({
      id: 'x',
      name: 'Azusa, Lost but Seeking',
      cmc: 3,
      type_line: 'Legendary Creature — Human Monk',
      color_identity: ['G'],
      set: 'chk',
      collector_number: '1',
    });
    expect(card.canBeCommander).toBe(true);
  });

  it('flags basic lands as unlimited quantity', () => {
    const card = parseAndMap({
      id: 'f',
      name: 'Forest',
      type_line: 'Basic Land — Forest',
      color_identity: ['G'],
      set: 'm19',
      collector_number: '347',
    });
    expect(card.unlimitedQuantity).toBe(true);
    expect(card.manaValue).toBe(0);
  });

  it('flags "any number" cards as unlimited quantity', () => {
    const card = parseAndMap({
      id: 'rats',
      name: 'Relentless Rats',
      cmc: 4,
      type_line: 'Creature — Rat',
      oracle_text:
        'A deck can have any number of cards named Relentless Rats.\nRelentless Rats gets +1/+1 for each other creature named Relentless Rats you control.',
      color_identity: ['B'],
      set: 'me',
      collector_number: '1',
    });
    expect(card.unlimitedQuantity).toBe(true);
  });

  it('falls back to the front face for double-faced cards without top-level images', () => {
    const card = parseAndMap({
      id: 'dfc',
      name: 'Front // Back',
      cmc: 2,
      color_identity: ['R'],
      set: 'mid',
      collector_number: '1',
      card_faces: [
        {
          name: 'Front',
          mana_cost: '{1}{R}',
          type_line: 'Creature — Werewolf',
          oracle_text: 'Front text',
          image_uris: { normal: 'https://img/front.jpg' },
        },
        { name: 'Back', type_line: 'Creature — Werewolf' },
      ],
    });
    expect(card.manaCost).toBe('{1}{R}');
    expect(card.typeLine).toBe('Creature — Werewolf');
    expect(card.printing.images.normal).toBe('https://img/front.jpg');
  });
});
