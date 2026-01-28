'use client';

/**
 * Timeline - Shadow implementation for slide presentations
 * 
 * Uses Ant Design's Timeline API but renders with custom styling.
 * Supports vertical and horizontal orientations.
 */

import React from 'react';
import { type TimelineProps as AntTimelineProps } from 'antd';
import styles from './Timeline.module.css';

// Re-export Ant Design's props with orientation support
export interface TimelineProps extends Omit<AntTimelineProps, 'pending' | 'pendingDot' | 'reverse'> {
  /** Timeline orientation - vertical (default) or horizontal */
  orientation?: 'vertical' | 'horizontal';
  /** Reverse the order of items */
  reverse?: boolean;
}

export interface TimelineItemType {
  color?: 'blue' | 'green' | 'red' | 'gray' | string;
  dot?: React.ReactNode;
  label?: React.ReactNode;
  children?: React.ReactNode;
  /** For horizontal mode, position content above or below the line */
  position?: 'left' | 'right';
}

const colorMap: Record<string, string> = {
  blue: 'var(--theme-primary, #1677ff)',
  green: 'var(--theme-success, #52c41a)',
  red: 'var(--theme-error, #ff4d4f)',
  gray: 'var(--theme-text-muted, #8c8c8c)',
};

function getColor(color?: string): string {
  if (!color) return colorMap.blue;
  return colorMap[color] || color;
}

export function Timeline({ 
  items = [],
  mode = 'left',
  orientation = 'vertical',
  reverse = false,
  className = '',
  ...rest 
}: TimelineProps) {
  const processedItems = reverse ? [...items].reverse() : items;
  
  if (orientation === 'horizontal') {
    return (
      <div 
        className={`${styles.timelineHorizontal} ${className}`}
        {...rest}
      >
        {/* Horizontal line */}
        <div className={styles.horizontalLine} />
        
        {/* Items container */}
        <div className={styles.horizontalItems}>
          {processedItems.map((item, index) => {
            const typedItem = item as TimelineItemType;
            const isTop = mode === 'alternate' 
              ? index % 2 === 0 
              : mode === 'right';
            
            return (
              <div 
                key={index}
                className={`${styles.horizontalItem} ${isTop ? styles.itemTop : styles.itemBottom}`}
              >
                {/* Dot */}
                <div 
                  className={styles.horizontalDot}
                  style={{ backgroundColor: getColor(typedItem.color) }}
                >
                  {typedItem.dot}
                </div>
                
                {/* Connector line from dot to content */}
                <div className={styles.horizontalConnector} />
                
                {/* Content card */}
                <div className={styles.horizontalContent}>
                  {typedItem.label && (
                    <div className={styles.horizontalLabel}>{typedItem.label}</div>
                  )}
                  <div className={styles.horizontalText}>{typedItem.children}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical timeline (default)
  return (
    <div 
      className={`${styles.timeline} ${styles[mode] || styles.left} ${className}`}
      {...rest}
    >
      {processedItems.map((item, index) => {
        const typedItem = item as TimelineItemType;
        const isLast = index === processedItems.length - 1;
        const isLeft = mode === 'alternate' 
          ? index % 2 === 0 
          : mode === 'left';
        
        return (
          <div 
            key={index}
            className={`${styles.timelineItem} ${isLeft ? styles.itemLeft : styles.itemRight}`}
          >
            {/* Label (for mode="left" or "alternate") */}
            {typedItem.label && mode !== 'right' && (
              <div className={styles.itemLabel}>{typedItem.label}</div>
            )}
            
            {/* Dot and tail */}
            <div className={styles.itemDotContainer}>
              <div 
                className={styles.itemDot}
                style={{ backgroundColor: getColor(typedItem.color) }}
              >
                {typedItem.dot}
              </div>
              {!isLast && <div className={styles.itemTail} />}
            </div>
            
            {/* Content */}
            <div className={styles.itemContent}>
              {typedItem.children}
            </div>
            
            {/* Label on right side (for mode="right") */}
            {typedItem.label && mode === 'right' && (
              <div className={styles.itemLabelRight}>{typedItem.label}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Legacy Item support for backward compatibility
Timeline.Item = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
  console.warn('Timeline.Item is deprecated. Use items prop instead.');
  return <div {...props}>{children}</div>;
};

export default Timeline;
