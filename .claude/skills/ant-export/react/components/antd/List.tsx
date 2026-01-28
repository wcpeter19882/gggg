'use client';

/**
 * List - Shadow implementation matching SmartList styling
 * 
 * Uses Ant Design 6.x API but renders with custom styling.
 * Migrated from: .claude/skills/export/react/components/blocks/SmartList.tsx
 */

import React from 'react';
import { type ListProps as AntListProps } from 'antd';
import styles from './List.module.css';

// Extend Ant Design props with our variants
export interface ListProps<T = any> {
  /** Data source array */
  dataSource?: T[];
  /** Render function for each item */
  renderItem?: (item: T, index: number) => React.ReactNode;
  /** List size */
  size?: 'default' | 'small' | 'large';
  /** Visual variant */
  variant?: 'default' | 'cards' | 'checklist' | 'highlight';
  /** Optional header */
  header?: React.ReactNode;
  /** Optional footer */
  footer?: React.ReactNode;
  /** Whether items have border */
  bordered?: boolean;
  /** Split line between items */
  split?: boolean;
  /** Additional className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

export interface ListItemProps {
  children?: React.ReactNode;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Description text below main content */
  description?: React.ReactNode;
  /** Additional className */
  className?: string;
}

function ListItem({ children, icon, description, className = '' }: ListItemProps) {
  return (
    <li className={`${styles.item} ${className}`}>
      {icon && <span className={styles.itemIcon}>{icon}</span>}
      <div className={styles.itemContent}>
        <span className={styles.itemText}>{children}</span>
        {description && <span className={styles.itemDescription}>{description}</span>}
      </div>
    </li>
  );
}

export function List<T = any>({ 
  dataSource = [],
  renderItem,
  size = 'default',
  variant = 'default',
  header,
  footer,
  bordered = false,
  split = true,
  className = '',
  style,
}: ListProps<T>) {
  const containerClass = [
    styles.list,
    styles[size],
    styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    bordered && styles.bordered,
    !split && styles.noSplit,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} style={style}>
      {header && <div className={styles.header}>{header}</div>}
      <ul className={styles.items}>
        {dataSource.map((item, index) => {
          if (renderItem) {
            const rendered = renderItem(item, index);
            // If renderItem returns a ListItem, use it directly
            if (React.isValidElement(rendered) && rendered.type === ListItem) {
              return React.cloneElement(rendered, { key: index });
            }
            // Otherwise wrap in ListItem
            return <ListItem key={index}>{rendered}</ListItem>;
          }
          // Default: render item as string
          return <ListItem key={index}>{String(item)}</ListItem>;
        })}
      </ul>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}

// Attach Item sub-component
List.Item = ListItem;

export default List;
