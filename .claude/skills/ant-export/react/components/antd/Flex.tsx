'use client';

/**
 * Flex - Styled for slide layouts
 * 
 * Wraps Ant Design's Flex with slide-appropriate styling.
 * Uses only Ant Design's native props.
 */

import React from 'react';
import { Flex as AntFlex, type FlexProps as AntFlexProps } from 'antd';
import styles from './Flex.module.css';

// Re-export Ant Design's props exactly
export type FlexProps = AntFlexProps;

export function Flex({ 
  gap = 16,
  className = '',
  ...rest 
}: FlexProps) {
  return (
    <AntFlex
      gap={gap}
      className={`${styles.flex} ${className}`}
      {...rest}
    />
  );
}

export default Flex;
