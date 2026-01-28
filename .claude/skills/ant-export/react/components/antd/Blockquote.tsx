'use client';

/**
 * Blockquote - Shadow implementation matching QuoteBlock styling
 * 
 * Custom component (no Ant Design equivalent).
 * Migrated from: .claude/skills/export/react/components/blocks/QuoteBlock.tsx
 */

import React, { type ReactNode } from 'react';
import styles from './Blockquote.module.css';

export interface BlockquoteProps {
  /** Quote text content */
  children: ReactNode;
  /** Quote author name */
  author?: string;
  /** Source, date, or context */
  source?: string;
  /** Visual style */
  variant?: 'default' | 'large' | 'minimal';
  /** Additional className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

export function Blockquote({ 
  children,
  author,
  source,
  variant = 'default',
  className = '',
  style,
}: BlockquoteProps) {
  const hasAttribution = author || source;
  
  const containerClass = [
    styles.blockquote,
    styles[variant],
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <figure className={containerClass} style={style} data-variant={variant}>
      <span className={styles.icon}>"</span>
      <div className={styles.content}>
        <blockquote className={styles.text}>
          {children}
        </blockquote>
        
        {hasAttribution && (
          <figcaption className={styles.attribution}>
            {author && <cite className={styles.author}>— {author}</cite>}
            {source && <span className={styles.source}>{source}</span>}
          </figcaption>
        )}
      </div>
    </figure>
  );
}

export default Blockquote;
