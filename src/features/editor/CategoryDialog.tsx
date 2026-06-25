import { useState, type FormEvent } from 'react';
import type { DeckCategory } from '@/domain/types';
import { Modal, Button, TextField, IconButton, EmptyState } from '@/ui';
import styles from './ImportExport.module.css';

export interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  categories: DeckCategory[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export function CategoryDialog({
  open,
  onClose,
  categories,
  onAdd,
  onRename,
  onRemove,
}: CategoryDialogProps) {
  const [newName, setNewName] = useState('');

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName('');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Custom categories"
      subtitle="Group cards your way. Categories are saved with this deck."
      width="30rem"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <form
        onSubmit={handleAdd}
        style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}
      >
        <div style={{ flex: 1 }}>
          <TextField
            label="New category"
            placeholder="e.g. Ramp, Removal, Card draw…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={40}
          />
        </div>
        <Button variant="secondary" type="submit" icon="plus" disabled={!newName.trim()}>
          Add
        </Button>
      </form>

      <div style={{ marginTop: 'var(--space-4)' }}>
        {categories.length === 0 ? (
          <EmptyState icon="filter" title="No categories yet">
            Add categories like “Ramp” or “Removal”, then assign cards to them from each card’s
            menu.
          </EmptyState>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {categories.map((cat) => (
              <li
                key={cat.id}
                style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}
              >
                <input
                  className={styles.exportArea}
                  style={{
                    minHeight: 'auto',
                    height: '2.25rem',
                    padding: '0 var(--space-3)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  defaultValue={cat.name}
                  aria-label={`Rename ${cat.name}`}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== cat.name) onRename(cat.id, v);
                  }}
                />
                <IconButton
                  label={`Delete category ${cat.name}`}
                  icon="trash"
                  danger
                  onClick={() => onRemove(cat.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
