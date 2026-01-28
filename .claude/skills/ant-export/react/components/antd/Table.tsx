'use client';

/**
 * Table - Styled for slide presentations
 * 
 * Wraps Ant Design's Table with slide-appropriate styling.
 * Uses only Ant Design's native props.
 */

import React from 'react';
import { Table as AntTable, type TableProps as AntTableProps } from 'antd';
import styles from './Table.module.css';

// Re-export Ant Design's props exactly
export type TableProps<T = any> = AntTableProps<T>;

export function Table<T extends object = any>({ 
  size = 'middle',
  className = '',
  ...rest 
}: TableProps<T>) {
  // Map size to our styling
  const sizeClass = styles[size] || styles.middle;
  
  return (
    <AntTable<T>
      size={size}
      className={`${styles.table} ${sizeClass} ${className}`}
      {...rest}
    />
  );
}

export default Table;
