'use client';

/**
 * Steps - Shadow implementation matching ProcessStrip/StepList styling
 * 
 * Uses Ant Design 6.x API but renders with custom styling.
 * Migrated from: 
 *   - .claude/skills/export/react/components/blocks/ProcessStrip.tsx
 *   - .claude/skills/export/react/components/blocks/StepList.tsx
 */

import React from 'react';
import { type StepsProps as AntStepsProps } from 'antd';
import styles from './Steps.module.css';

// Step item interface (Ant Design 6.x compatible)
export interface StepItem {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  status?: 'wait' | 'process' | 'finish' | 'error';
  disabled?: boolean;
}

// Extend Ant Design props
export interface StepsProps {
  /** Current step index (0-based) */
  current?: number;
  /** Step items */
  items?: StepItem[];
  /** Direction: horizontal or vertical */
  direction?: 'horizontal' | 'vertical';
  /** Size: default or small */
  size?: 'default' | 'small';
  /** Status of current step */
  status?: 'wait' | 'process' | 'finish' | 'error';
  /** Progress dot style (small dots instead of numbers) */
  progressDot?: boolean;
  /** Additional className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

export function Steps({ 
  current = 0,
  items = [],
  direction = 'horizontal',
  size = 'default',
  status,
  progressDot = false,
  className = '',
  style,
}: StepsProps) {
  const containerClass = [
    styles.steps,
    styles[direction],
    styles[size],
    progressDot && styles.progressDot,
    className,
  ].filter(Boolean).join(' ');

  // Determine status for each item
  const getItemStatus = (index: number, item: StepItem): 'wait' | 'process' | 'finish' | 'error' => {
    if (item.status) return item.status;
    if (index < current) return 'finish';
    if (index === current) return status || 'process';
    return 'wait';
  };

  return (
    <div className={containerClass} style={style}>
      {items.map((item, index) => {
        const itemStatus = getItemStatus(index, item);
        const isLast = index === items.length - 1;
        
        return (
          <div 
            key={index}
            className={`${styles.item} ${styles[`status${itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1)}`]}`}
            data-status={itemStatus}
          >
            {/* Icon/Number */}
            <div className={styles.itemIcon}>
              {progressDot ? (
                <span className={styles.dot} />
              ) : item.icon ? (
                <span className={styles.customIcon}>{item.icon}</span>
              ) : (
                <span className={styles.number}>
                  {itemStatus === 'finish' ? '✓' : index + 1}
                </span>
              )}
            </div>
            
            {/* Connector tail (not for last item) */}
            {!isLast && <div className={styles.tail} />}
            
            {/* Content */}
            <div className={styles.itemContent}>
              {item.title && <div className={styles.itemTitle}>{item.title}</div>}
              {item.description && <div className={styles.itemDescription}>{item.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Legacy Step sub-component (deprecated, use items prop)
Steps.Step = ({ title, description }: { title?: React.ReactNode; description?: React.ReactNode }) => {
  console.warn('Steps.Step is deprecated. Use items prop instead.');
  return null;
};

export default Steps;
