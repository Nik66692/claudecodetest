import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import styles from './Toast.module.css';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  duration: number;
}

interface ToastInput {
  tone?: ToastTone;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, IconName> = {
  success: 'check',
  error: 'warning',
  info: 'info',
};

const TONE_CLASS: Record<ToastTone, { box: string; icon: string }> = {
  success: { box: styles.success!, icon: styles.successIcon! },
  error: { box: styles.error!, icon: styles.errorIcon! },
  info: { box: styles.info!, icon: styles.infoIcon! },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id: number, duration: number) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  const pause = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      const item: ToastItem = {
        id,
        tone: input.tone ?? 'info',
        title: input.title,
        ...(input.message !== undefined ? { message: input.message } : {}),
        duration: input.duration ?? 5000,
      };
      setItems((prev) => [...prev, item]);
      scheduleDismiss(id, item.duration);
    },
    [scheduleDismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className={styles.region} role="region" aria-label="Notifications">
          {items.map((item) => (
            <div
              key={item.id}
              className={`${styles.toast} ${TONE_CLASS[item.tone].box}`}
              role={item.tone === 'error' ? 'alert' : 'status'}
              onMouseEnter={() => pause(item.id)}
              onMouseLeave={() => scheduleDismiss(item.id, 2500)}
              onFocusCapture={() => pause(item.id)}
              onBlurCapture={() => scheduleDismiss(item.id, 2500)}
            >
              <span className={`${styles.icon} ${TONE_CLASS[item.tone].icon}`}>
                <Icon name={TONE_ICON[item.tone]} size={18} />
              </span>
              <div className={styles.content}>
                <span className={styles.title}>{item.title}</span>
                {item.message && <span className={styles.message}>{item.message}</span>}
              </div>
              <IconButton
                label="Dismiss notification"
                icon="close"
                size="sm"
                className={styles.dismiss}
                onClick={() => dismiss(item.id)}
              />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
