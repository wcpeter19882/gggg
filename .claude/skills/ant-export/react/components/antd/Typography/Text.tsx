'use client';

/**
 * Typography.Text - Shadow implementation (no Ant Design dependency)
 * 
 * Pure inline span with styling for mark, strong, type variants.
 */

import React from 'react';
import styles from './Text.module.css';

export interface TextProps {
  children?: React.ReactNode;
  /** Semantic type */
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  /** Highlight with yellow background */
  mark?: boolean;
  /** Bold text */
  strong?: boolean;
  /** Underline */
  underline?: boolean;
  /** Strikethrough */
  delete?: boolean;
  /** Code style */
  code?: boolean;
  /** Additional className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

export function Text({ 
  children,
  type,
  mark,
  strong,
  underline,
  delete: del,
  code,
  className = '',
  style,
}: TextProps) {
  const typeClass = type ? styles[type] : '';
  
  let content = children;
  
  // Apply inline wrappers
  if (code) content = <code className={styles.code}>{content}</code>;
  if (del) content = <del>{content}</del>;
  if (underline) content = <u>{content}</u>;
  if (strong) content = <strong>{content}</strong>;
  if (mark) content = <mark className={styles.mark}>{content}</mark>;
  
  return (
    <span 
      className={`${styles.text} ${typeClass} ${className}`}
      style={style}
    >
      {content}
    </span>
  );
}

export default Text;
