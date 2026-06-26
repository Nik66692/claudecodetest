import type { Card, DeckImportResult, DeckSection, ParsedDeckLine } from './types';

export interface ParsedDeckList {
  lines: ParsedDeckLine[];
  unparseable: string[];
}

const SECTION_HEADERS: Record<string, DeckSection> = {
  commander: 'commander',
  commanders: 'commander',
  deck: 'main',
  mainboard: 'main',
  main: 'main',
  maindeck: 'main',
  creatures: 'main',
  sideboard: 'maybeboard',
  maybeboard: 'maybeboard',
  maybe: 'maybeboard',
};

const SECTION_WORDS =
  'commander|commanders|deck|main|mainboard|maindeck|sideboard|maybeboard|maybe';

/** Strip a single line of cosmetic annotations a card name may carry. */
function cleanName(name: string): string {
  return (
    name
      // Legacy inline section annotation: "Azusa, Lost but Seeking // Commander".
      // Only stripped when the suffix is a known section word, so split-card
      // names such as "Fire // Ice" are preserved intact.
      .replace(new RegExp(`\\s*//\\s*(${SECTION_WORDS})\\s*$`, 'i'), '')
      // Trailing set/collector annotation: "(C21) 263" or "(M21)"
      .replace(/\s*\([a-z0-9]{2,5}\)\s*[\w-]*\s*$/i, '')
      // Foil markers like *F* or *E*
      .replace(/\s*\*[a-z]\*\s*$/i, '')
      // Trailing category tag "#Ramp"
      .replace(/\s*#\S+\s*$/i, '')
      .trim()
  );
}

const QTY_NAME = /^(\d+)\s*[xX]?\s+(.+)$/;

/**
 * Parse a deck list in plain-text or MTGO-style format.
 *
 * Recognized structure:
 *  - `2 Card Name` or `2x Card Name` quantity lines.
 *  - `1 Card Name (SET) 123` printing annotations (annotation is ignored).
 *  - Section headers on their own line: `Commander`, `Deck`, `Sideboard`,
 *    `Maybeboard` (case-insensitive, optional trailing `:`).
 *  - MTGO `SB:` line prefix → maybeboard.
 *  - When no headers are present, a blank line after the main list switches the
 *    remaining cards to the maybeboard (MTGO convention).
 *
 * Lines beginning with `//` or `#` are treated as comments. Anything that is
 * neither a comment, header, nor a `quantity name` entry is returned in
 * `unparseable` — entries are never silently dropped.
 */
export function parseDeckList(text: string): ParsedDeckList {
  const lines: ParsedDeckLine[] = [];
  const unparseable: string[] = [];

  let section: DeckSection = 'main';
  let sawExplicitHeader = false;
  let sawCardInMain = false;
  let blankAfterMain = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const raw = rawLine.trim();

    if (raw === '') {
      if (sawCardInMain && !sawExplicitHeader && section === 'main') {
        blankAfterMain = true;
      }
      continue;
    }

    // Comments. A comment whose text names a section (e.g. `// Commander`,
    // `// Deck`, `// Sideboard`) acts as a section header — this is how the MTGO
    // export marks sections without inline annotations. Other comments are
    // ignored.
    if (raw.startsWith('//') || raw.startsWith('#')) {
      const commentKey = raw
        .replace(/^(?:\/\/+|#+)\s*/, '')
        .replace(/:$/, '')
        .trim()
        .toLowerCase();
      if (SECTION_HEADERS[commentKey]) {
        section = SECTION_HEADERS[commentKey]!;
        sawExplicitHeader = true;
        blankAfterMain = false;
      }
      continue;
    }

    // MTGO sideboard prefix
    let working = raw;
    let lineSection: DeckSection | null = null;
    if (/^sb:\s*/i.test(working)) {
      working = working.replace(/^sb:\s*/i, '');
      lineSection = 'maybeboard';
    }

    // Header line (no leading quantity, matches a known header keyword)
    const headerKey = working.replace(/:$/, '').trim().toLowerCase();
    if (!QTY_NAME.test(working) && SECTION_HEADERS[headerKey]) {
      section = SECTION_HEADERS[headerKey]!;
      sawExplicitHeader = true;
      blankAfterMain = false;
      continue;
    }

    const match = QTY_NAME.exec(working);
    if (!match) {
      unparseable.push(raw);
      continue;
    }

    const quantity = Number.parseInt(match[1]!, 10);
    const name = cleanName(match[2]!);
    if (!name || !Number.isFinite(quantity) || quantity <= 0) {
      unparseable.push(raw);
      continue;
    }

    const resolvedSection: DeckSection =
      lineSection ?? (blankAfterMain && !sawExplicitHeader ? 'maybeboard' : section);
    if (resolvedSection === 'main') sawCardInMain = true;

    lines.push({ raw, quantity, name, section: resolvedSection });
  }

  return { lines, unparseable };
}

/** Normalize a card name for case/spacing-insensitive matching. */
export function normalizeCardName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Combine parsed lines with resolved cards into an import result. `resolved`
 * maps a normalized card name to its `Card`. Unmatched lines are reported,
 * never discarded.
 */
export function buildImportResult(
  parsed: ParsedDeckList,
  resolved: Map<string, Card>,
): DeckImportResult {
  const recognized: DeckImportResult['recognized'] = [];
  const unrecognized: ParsedDeckLine[] = [];
  let totalRequested = 0;

  for (const line of parsed.lines) {
    totalRequested += line.quantity;
    const card = resolved.get(normalizeCardName(line.name));
    if (card) {
      recognized.push({ line, card });
    } else {
      unrecognized.push(line);
    }
  }

  return {
    recognized,
    unrecognized,
    unparseable: parsed.unparseable,
    totalRequested,
  };
}

/** Distinct normalized names that need resolving (for a collection lookup). */
export function namesToResolve(parsed: ParsedDeckList): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of parsed.lines) {
    const n = line.name.trim();
    const key = normalizeCardName(n);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(n);
    }
  }
  return out;
}
