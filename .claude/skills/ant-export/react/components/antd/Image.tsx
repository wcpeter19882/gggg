'use client';

/**
 * Image - Styled for slide presentations
 * 
 * Wraps Ant Design's Image with slide-appropriate styling.
 * Uses only Ant Design's native props.
 */

import React from 'react';
import { Image as AntImage, type ImageProps as AntImageProps } from 'antd';
import styles from './Image.module.css';

// Re-export Ant Design's props exactly
export type ImageProps = AntImageProps;

export function Image({ 
  className = '',
  ...rest 
}: ImageProps) {
  return (
    <AntImage
      className={`${styles.image} ${className}`}
      {...rest}
    />
  );
}

// Re-export PreviewGroup
Image.PreviewGroup = AntImage.PreviewGroup;

export default Image;
