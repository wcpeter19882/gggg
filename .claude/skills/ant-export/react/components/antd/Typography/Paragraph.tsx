'use client';

/**
 * Typography.Paragraph - Shadow implementation (no Ant Design dependency)
 * 
 * Block-level text container with proper margins and styling.
 */

import React from 'react';
import styles from './Paragraph.module.css';

export interface ParagraphProps {
  children?: React.ReactNode;
  /** Semantic type */
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  /** Additional className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

export function Paragraph({ 
  children,
  type,
  className = '',
  style,
}: ParagraphProps) {
  const typeClass = type ? styles[type] : styles.default;
  
  return (
    <div 
      className={`${styles.paragraph} ${typeClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export default Paragraph;
