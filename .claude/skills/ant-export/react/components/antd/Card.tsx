'use client';

/**
 * Card - Standard Ant Design API
 * 
 * Styling via Tailwind classes (passed through className).
 * Shadow effects from theme CSS variables.
 */

import React from 'react';
import { Card as AntCard, type CardProps as AntCardProps } from 'antd';
import styles from './Card.module.css';

export type CardProps = AntCardProps;

export function Card({ 
  size = 'default',
  className = '',
  ...rest 
}: CardProps) {
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
