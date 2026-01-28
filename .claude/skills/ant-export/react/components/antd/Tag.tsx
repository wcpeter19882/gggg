'use client';

/**
 * Tag - Styled for slide presentations
 * 
 * Wraps Ant Design's Tag with slide-appropriate styling.
 * Uses only Ant Design's native props.
 */

import React from 'react';
import { Tag as AntTag, type TagProps as AntTagProps } from 'antd';
import styles from './Tag.module.css';

// Re-export Ant Design's props exactly
export type TagProps = AntTagProps;

export function Tag({ 
  bordered = true,
  className = '',
  ...rest 
}: TagProps) {
  // Map bordered to our styling
  const borderedClass = bordered ? styles.bordered : styles.borderless;
  
  return (
    <AntTag
      bordered={bordered}
      className={`${styles.tag} ${borderedClass} ${className}`}
      {...rest}
    />
  );
}

// Re-export CheckableTag
Tag.CheckableTag = AntTag.CheckableTag;

export default Tag;
