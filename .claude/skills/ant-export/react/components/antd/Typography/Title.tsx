'use client';

/**
 * Typography.Title - Styled to match our Heading component
 * 
 * Wraps Ant Design's Typography.Title with slide-appropriate styling.
 * Uses only Ant Design's native props.
 * 
 * Reference: .claude/skills/export/react/components/atoms/Heading.tsx
 */

import React from 'react';
import { Typography } from 'antd';
import type { TitleProps as AntTitleProps } from 'antd/es/typography/Title';
import styles from './Title.module.css';

const { Title: AntTitle } = Typography;

// Re-export Ant Design's props exactly
export type TitleProps = AntTitleProps;

export function Title({ level = 1, className = '', ...rest }: TitleProps) {
  // Map level to our styling
  const levelClass = styles[`level${level}`] || styles.level1;
  
  return (
    <AntTitle
      level={level}
      className={`${styles.title} ${levelClass} ${className}`}
      {...rest}
    />
  );
}

export default Title;
