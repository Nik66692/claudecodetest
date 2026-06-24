import { useMemo, useState } from 'react';
import type { Deck, DeckExportFormat } from '@/domain/types';
import { exportDeck } from '@/domain/export';
import { Modal, Button, useToast } from '@/ui';
import styles from './ImportExport.module.css';

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  deck: Deck;
}

export function ExportDialog({ open, onClose, deck }: ExportDialogProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<DeckExportFormat>('text');

  const exported = useMemo(() => exportDeck(deck, format), [deck, format]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(exported);
      toast({ tone: 'success', title: 'Copied to clipboard' });
    } catch {
      toast({
        tone: 'error',
        title: 'Could not copy',
        message: 'Select the text and copy it manually.',
      });
    }
  }

  function download() {
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const safeName = deck.name.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'deck';
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.${format === 'mtgo' ? 'mtgo.txt' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export deck"
      subtitle="Copy or download your list as plain text."
      width="38rem"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" icon="download" onClick={download}>
            Download .txt
          </Button>
          <Button variant="primary" icon="copy" onClick={copy}>
            Copy to clipboard
          </Button>
        </>
      }
    >
      <div className={styles.formatToggle} role="group" aria-label="Export format">
        <button
          type="button"
          className={styles.formatButton}
          aria-pressed={format === 'text'}
          onClick={() => setFormat('text')}
        >
          Plain text
        </button>
        <button
          type="button"
          className={styles.formatButton}
          aria-pressed={format === 'mtgo'}
          onClick={() => setFormat('mtgo')}
        >
          MTGO
        </button>
      </div>
      <label htmlFor="export-output" className="sr-only">
        Exported deck list
      </label>
      <textarea
        id="export-output"
        className={styles.exportArea}
        value={exported}
        readOnly
        spellCheck={false}
        onFocus={(e) => e.currentTarget.select()}
      />
    </Modal>
  );
}
