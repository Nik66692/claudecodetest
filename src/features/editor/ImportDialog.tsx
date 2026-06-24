import { useState } from 'react';
import type { DeckImportResult } from '@/domain/types';
import { parseDeckList, namesToResolve, buildImportResult } from '@/domain/import';
import { scryfall } from '@/scryfall';
import { Modal, Button, TextArea, Badge, InlineLoading, Icon, useToast } from '@/ui';
import { pluralize } from '@/lib/format';
import styles from './ImportExport.module.css';

export type ImportMode = 'append' | 'replace';

export interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (result: DeckImportResult, mode: ImportMode) => void;
}

const PLACEHOLDER = `1 Sol Ring
1 Arcane Signet
10 Forest
1 Llanowar Elves

// Commander and Maybeboard sections are supported:
Commander
1 Azusa, Lost but Seeking`;

export function ImportDialog({ open, onClose, onApply }: ImportDialogProps) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<DeckImportResult | null>(null);

  function reset() {
    setText('');
    setResult(null);
    setChecking(false);
  }

  async function handleCheck() {
    const parsed = parseDeckList(text);
    if (parsed.lines.length === 0) {
      toast({
        tone: 'error',
        title: 'Nothing to import',
        message: 'No “quantity card name” lines were found.',
      });
      return;
    }
    setChecking(true);
    try {
      const names = namesToResolve(parsed);
      const { byName } = await scryfall.getCollectionByNames(names);
      setResult(buildImportResult(parsed, byName));
    } catch {
      toast({
        tone: 'error',
        title: 'Could not reach Scryfall',
        message: 'Check your connection and try again.',
      });
    } finally {
      setChecking(false);
    }
  }

  function apply(mode: ImportMode) {
    if (!result) return;
    onApply(result, mode);
    reset();
    onClose();
  }

  const recognizedCopies = result?.recognized.reduce((s, e) => s + e.line.quantity, 0) ?? 0;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import deck list"
      subtitle="Paste a plain-text or MTGO-style list. Nothing is changed until you choose to add or replace."
      width="40rem"
      footer={
        result ? (
          <>
            <Button variant="ghost" onClick={() => setResult(null)}>
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() => apply('replace')}
              disabled={result.recognized.length === 0}
            >
              Replace deck
            </Button>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => apply('append')}
              disabled={result.recognized.length === 0}
            >
              Add {recognizedCopies} {pluralize(recognizedCopies, 'card')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" icon="search" onClick={handleCheck} loading={checking}>
              Check cards
            </Button>
          </>
        )
      }
    >
      {!result && (
        <>
          <TextArea
            label="Deck list"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={12}
            spellCheck={false}
          />
          {checking && <InlineLoading>Looking up cards on Scryfall…</InlineLoading>}
        </>
      )}

      {result && (
        <div className={styles.report}>
          <div className={styles.reportSummary}>
            <Badge tone="success">
              {result.recognized.length} recognized ({recognizedCopies}{' '}
              {pluralize(recognizedCopies, 'copy', 'copies')})
            </Badge>
            {result.unrecognized.length > 0 && (
              <Badge tone="warning">{result.unrecognized.length} not found</Badge>
            )}
            {result.unparseable.length > 0 && (
              <Badge tone="danger">{result.unparseable.length} unreadable</Badge>
            )}
          </div>

          {result.recognized.length === 0 && (
            <p className={styles.reportNote}>
              <Icon name="warning" size={15} />
              None of the lines matched a card. Check spelling and try again.
            </p>
          )}

          {result.unrecognized.length > 0 && (
            <div className={styles.reportSection}>
              <h4 className={styles.reportHeading}>Not found on Scryfall</h4>
              <p className={styles.reportNote}>
                These lines will be skipped. You can fix the names and re-import.
              </p>
              <ul className={styles.reportList}>
                {result.unrecognized.map((line, i) => (
                  <li key={`${line.name}-${i}`}>
                    {line.quantity}× {line.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.unparseable.length > 0 && (
            <div className={styles.reportSection}>
              <h4 className={styles.reportHeading}>Could not be read</h4>
              <ul className={styles.reportList}>
                {result.unparseable.map((line, i) => (
                  <li key={`${line}-${i}`}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
