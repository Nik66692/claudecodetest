import { useState, type FormEvent } from 'react';
import { Modal, Button, TextField, useToast } from '@/ui';
import { createDeck } from '@/domain/deck';
import { deckRepository } from '@/persistence';

export interface CreateDeckDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (deckId: string) => void;
}

export function CreateDeckDialog({ open, onClose, onCreated }: CreateDeckDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setSaving(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const deck = createDeck({ name: name.trim() || 'Untitled deck' });
      await deckRepository.save(deck);
      onCreated(deck.id);
      reset();
    } catch {
      setSaving(false);
      toast({ tone: 'error', title: 'Could not create deck', message: 'Try again in a moment.' });
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) {
          reset();
          onClose();
        }
      }}
      title="New deck"
      subtitle="You can choose a commander next."
      width="26rem"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-deck-form" loading={saving}>
            Create deck
          </Button>
        </>
      }
    >
      <form id="create-deck-form" onSubmit={handleSubmit}>
        <TextField
          label="Deck name"
          placeholder="e.g. Atraxa Superfriends"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={120}
          hint="Commander is the only supported format right now."
        />
      </form>
    </Modal>
  );
}
