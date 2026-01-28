'use client';

/**
 * MetricCard - Shadow implementation for segmented metric display
 * 
 * A card containing multiple metrics with icons, organized in horizontal
 * or vertical layout. Composes Card + Statistic internally.
 * 
 * Migrated from: .claude/skills/export/react/components/blocks/MetricCard.tsx
 * 
 * Usage in SKILL.md:
 * ```mdx
 * <MetricCard 
 *   title="Performance"
 *   layout="horizontal"
 *   items={[
 *     { icon: "📈", value: "+40%", title: "Revenue Growth" },
 *     { icon: "💰", value: "-20%", title: "Cost Reduction" },
 *     { icon: "⭐", value: "72", title: "NPS Score" }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import styles from './MetricCard.module.css';

// =============================================================================
// Types
// =============================================================================

export interface MetricCardItem {
  /** Icon (emoji or icon component) */
  icon?: React.ReactNode;
  /** Metric value */
  value: React.ReactNode;
  /** Metric title/label */
  title: string;
}

export interface MetricCardProps {
  /** Array of metrics to display */
  items: MetricCardItem[];
  /** Optional title for the card */
  title?: string;
  /** Layout direction: vertical (stacked) or horizontal (side by side) */
  layout?: 'vertical' | 'horizontal';
  /** Additional className */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

// =============================================================================
// Component
// =============================================================================

export function MetricCard({
  items,
  title,
  layout = 'horizontal',
  className = '',
  style,
}: MetricCardProps): JSX.Element {
  const containerClass = [
    styles.metricCard,
    className,
  ].filter(Boolean).join(' ');

  const gridClass = [
    styles.grid,
    styles[layout],
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} style={style}>
      {title && (
        <h3 className={styles.title}>{title}</h3>
      )}
      <div className={gridClass}>
        {items.map((item, index) => (
          <div key={index} className={styles.item}>
            {item.icon && (
              <div className={styles.icon}>{item.icon}</div>
            )}
            <div className={styles.content}>
              <div className={styles.label}>{item.title}</div>
              <div className={styles.value}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MetricCard;
