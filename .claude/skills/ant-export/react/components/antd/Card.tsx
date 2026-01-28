'use client';

/**
 * Card - Styled to match our CardGroup Card component
 * 
 * Wraps Ant Design's Card with slide-appropriate styling.
 * Uses only Ant Design's native props.
 * 
 * Reference: .claude/skills/export/react/components/blocks/CardGroup.tsx
 */

import React from 'react';
import { Card as AntCard, type CardProps as AntCardProps } from 'antd';
import styles from './Card.module.css';

// Re-export Ant Design's props exactly
export type CardProps = AntCardProps;

export function Card({ 
  size = 'default',
  className = '',
  ...rest 
}: CardProps) {
  // Map Ant Design's size to our styling
  const sizeClass = styles[size] || styles.default;
  
  return (
    <AntCard
      size={size}
      className={`${styles.card} ${sizeClass} ${className}`}
      {...rest}
    />
  );
}

// Re-export Card sub-components
Card.Meta = AntCard.Meta;
Card.Grid = AntCard.Grid;

export default Card;
