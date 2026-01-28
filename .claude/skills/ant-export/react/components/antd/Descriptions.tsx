'use client';

/**
 * Descriptions - Styled to match our MetricGroup component
 * 
 * Wraps Ant Design's Descriptions with slide-appropriate styling.
 * Uses only Ant Design's native props.
 * 
 * Reference: .claude/skills/export/react/components/blocks/MetricGroup.tsx
 */

import React from 'react';
import { Descriptions as AntDescriptions, type DescriptionsProps as AntDescriptionsProps } from 'antd';
import styles from './Descriptions.module.css';

// Re-export Ant Design's props exactly
export type DescriptionsProps = AntDescriptionsProps;

export function Descriptions({ 
  size = 'default',
  className = '',
  ...rest 
}: DescriptionsProps) {
  // Map Ant Design's size to our styling
  const sizeClass = styles[size] || styles.default;
  
  return (
    <AntDescriptions
      size={size}
      className={`${styles.descriptions} ${sizeClass} ${className}`}
      {...rest}
    />
  );
}

// Re-export Descriptions.Item
Descriptions.Item = AntDescriptions.Item;

export default Descriptions;
