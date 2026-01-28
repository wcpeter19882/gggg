'use client';

/**
 * Grid - Row and Col components styled for slide layouts
 * 
 * Wraps Ant Design's Grid with slide-appropriate styling.
 * Uses only Ant Design's native props.
 * 
 * Reference: .claude/skills/export/react/components/layouts/LayoutSplit.tsx
 */

import React from 'react';
import { Row as AntRow, Col as AntCol, type RowProps as AntRowProps, type ColProps as AntColProps } from 'antd';
import styles from './Grid.module.css';

// Re-export Ant Design's props exactly
export type RowProps = AntRowProps;
export type ColProps = AntColProps;

export function Row({ 
  gutter = [24, 24],
  className = '',
  ...rest 
}: RowProps) {
  return (
    <AntRow
      gutter={gutter}
      className={`${styles.row} ${className}`}
      {...rest}
    />
  );
}

export function Col({ 
  className = '',
  ...rest 
}: ColProps) {
  return (
    <AntCol
      className={`${styles.col} ${className}`}
      {...rest}
    />
  );
}

export default { Row, Col };
