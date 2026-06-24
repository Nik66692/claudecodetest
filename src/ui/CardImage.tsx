import { useState } from 'react';
import type { Card } from '@/domain/types';
import { Icon } from './Icon';
import styles from './CardImage.module.css';

export interface CardImageProps {
  card: Card;
  /** Prefer a larger source for previews. */
  size?: 'small' | 'normal' | 'large';
  className?: string;
}

function pickSource(card: Card, size: CardImageProps['size']): string | undefined {
  const { images } = card.printing;
  if (size === 'large') return images.large ?? images.normal ?? images.small;
  if (size === 'small') return images.small ?? images.normal;
  return images.normal ?? images.large ?? images.small;
}

export function CardImage({ card, size = 'normal', className }: CardImageProps) {
  const src = pickSource(card, size);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const showFallback = !src || failed;

  return (
    <div className={[styles.frame, className ?? ''].filter(Boolean).join(' ')}>
      {!showFallback && !loaded && <div className={styles.skeleton} aria-hidden="true" />}
      {showFallback ? (
        <div className={styles.fallback}>
          <Icon name="cards" size={22} aria-hidden="true" />
          <span className={styles.fallbackName}>{card.name}</span>
          <span style={{ fontSize: 'var(--text-xs)' }}>No image available</span>
        </div>
      ) : (
        <img
          className={[styles.image, loaded ? styles.loaded : ''].filter(Boolean).join(' ')}
          src={src}
          alt={`${card.name} card art`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
