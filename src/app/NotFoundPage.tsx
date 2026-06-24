import { useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '@/ui';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <EmptyState
        icon="info"
        title="Page not found"
        actions={
          <Button variant="primary" icon="library" onClick={() => navigate('/')}>
            Back to library
          </Button>
        }
      >
        That page doesn’t exist. It may have been a deck that was deleted.
      </EmptyState>
    </div>
  );
}
