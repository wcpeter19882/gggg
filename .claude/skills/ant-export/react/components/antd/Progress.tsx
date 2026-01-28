'use client';

/**
 * Progress - Styled for slide presentations
 * 
 * Wraps Ant Design's Progress with slide-appropriate styling.
 * Uses only Ant Design's native props.
 */

import React from 'react';
import { Progress as AntProgress, type ProgressProps as AntProgressProps } from 'antd';
import styles from './Progress.module.css';

// Re-export Ant Design's props exactly
export type ProgressProps = AntProgressProps;

export function Progress({ 
  type = 'line',
  size = 'default',
  className = '',
  ...rest 
}: ProgressProps) {
  // Map type and size to our styling
  const typeClass = styles[type] || styles.line;
  const sizeClass = typeof size === 'string' ? (styles[size] || styles.default) : '';
  
  return (
    <AntProgress
      type={type}
      size={size}
      className={`${styles.progress} ${typeClass} ${sizeClass} ${className}`}
      {...rest}
    />
  );
}

export default Progress;
