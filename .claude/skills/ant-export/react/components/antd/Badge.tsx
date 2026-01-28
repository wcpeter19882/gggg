'use client';

/**
 * Badge - Styled for slide presentations
 * 
 * Wraps Ant Design's Badge with slide-appropriate styling.
 * Uses only Ant Design's native props.
 */

import React from 'react';
import { Badge as AntBadge, type BadgeProps as AntBadgeProps } from 'antd';
import styles from './Badge.module.css';

// Re-export Ant Design's props exactly
export type BadgeProps = AntBadgeProps;

export function Badge({ 
  size = 'default',
  className = '',
  ...rest 
}: BadgeProps) {
  // Map size to our styling
  const sizeClass = styles[size] || styles.default;
  
  return (
    <AntBadge
      size={size}
      className={`${styles.badge} ${sizeClass} ${className}`}
      {...rest}
    />
  );
}

// Re-export Badge.Ribbon
Badge.Ribbon = AntBadge.Ribbon;

export default Badge;
