'use client';

/**
 * Divider - Styled for slide layouts
 * 
 * Wraps Ant Design's Divider with slide-appropriate styling.
 * Accepts all standard Ant Design Divider props.
 */

import React from 'react';
import { Divider as AntDivider, type DividerProps as AntDividerProps } from 'antd';
import styles from './Divider.module.css';

// Re-export Ant Design's props as-is
export type DividerProps = AntDividerProps;

export function Divider({ 
  className = '',
  variant = 'solid',
  ...rest 
}: DividerProps) {
  // Map Ant Design's variant to our CSS classes
  const variantClass = styles[variant] || styles.solid;
  
  return (
    <AntDivider
      className={`${styles.divider} ${variantClass} ${className}`}
      variant={variant}
      {...rest}
    />
  );
}

export default Divider;
