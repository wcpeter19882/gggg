'use client';

/**
 * Alert - Styled to match our Callout component
 * 
 * Wraps Ant Design's Alert with slide-appropriate styling.
 * Uses only Ant Design's native props.
 * 
 * Reference: .claude/skills/export/react/components/atoms/Callout.tsx
 */

import React from 'react';
import { Alert as AntAlert, type AlertProps as AntAlertProps } from 'antd';
import styles from './Alert.module.css';

// Re-export Ant Design's props exactly
export type AlertProps = AntAlertProps;

export function Alert({ 
  type = 'info',
  className = '',
  ...rest 
}: AlertProps) {
  // Map Ant Design's type to our styling
  const typeClass = styles[type] || styles.info;
  
  return (
    <AntAlert
      type={type}
      className={`${styles.alert} ${typeClass} ${className}`}
      {...rest}
    />
  );
}

export default Alert;
