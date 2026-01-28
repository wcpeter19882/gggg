'use client';

/**
 * Statistic - Shadow implementation matching BigNum/MetricCard styling
 * 
 * Uses Ant Design 6.x API but renders with custom styling.
 * Migrated from: .claude/skills/export/react/components/blocks/BigNum.tsx
 */

import React from 'react';
import { type StatisticProps as AntStatisticProps } from 'antd';
import styles from './Statistic.module.css';

// Extend Ant Design props with our variants
export interface StatisticProps extends Omit<AntStatisticProps, 'formatter' | 'loading' | 'groupSeparator' | 'decimalSeparator'> {
  /** Visual variant */
  variant?: 'default' | 'hero' | 'card' | 'inline';
  /** Optional sublabel (context text below title) */
  sublabel?: string;
  /** Optional icon (emoji or icon component) */
  icon?: React.ReactNode;
}

export function Statistic({ 
  title,
  value,
  prefix,
  suffix,
  precision,
  variant = 'default',
  sublabel,
  icon,
  className = '',
  style,
  valueStyle,
}: StatisticProps) {
  // Format value with precision if number
  const formattedValue = typeof value === 'number' && precision !== undefined
    ? value.toFixed(precision)
    : value;

  const containerClass = [
    styles.statistic,
    styles[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} style={style}>
      {icon && (
        <div className={styles.icon}>{icon}</div>
      )}
      <div className={styles.content}>
        <div className={styles.value}>
          {prefix && <span className={styles.prefix} style={valueStyle}>{prefix}</span>}
          <span className={styles.valueText} style={valueStyle}>{formattedValue}</span>
          {suffix && <span className={styles.suffix} style={valueStyle}>{suffix}</span>}
        </div>
      </div>
      {title && (
        <div className={styles.title}>{title}</div>
      )}
      {sublabel && (
        <div className={styles.sublabel}>{sublabel}</div>
      )}
    </div>
  );
}

export default Statistic;
