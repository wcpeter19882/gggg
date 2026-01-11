/**
 * SlotLayoutGrid Component
 * 
 * A pure structural primitive for grid-based content arrangement.
 * Part of the 4-Layer Architecture (Layer 3: SlotLayout).
 * 
 * This component handles ONLY the CSS Grid structure for arranging
 * children in columns with configurable gap.
 * 
 * Usage:
 * ```tsx
 * <SlotLayoutGrid cols={3} gap="md">
 *   <MetricCard value="42" label="Users" />
 *   <MetricCard value="98%" label="Uptime" />
 *   <MetricCard value="$1.2M" label="Revenue" />
 * </SlotLayoutGrid>
 * ```
 */

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export type GridCols = 1 | 2 | 3 | 4;
export type GridGap = 'sm' | 'md' | 'lg';

export interface SlotLayoutGridProps {
  children: ReactNode;
  /** Number of columns (default: 2) */
  cols?: GridCols;
  /** Grid gap (default: 'md') */
  gap?: GridGap;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Column Mapping
// =============================================================================

const colsClassMap: Record<GridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

// =============================================================================
// Gap Mapping
// =============================================================================

const gapClassMap: Record<GridGap, string> = {
  sm: 'gap-2',    // 8px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
};

// =============================================================================
// Component
// =============================================================================

/**
 * SlotLayoutGrid Component
 * 
 * Renders children in a CSS Grid with configurable columns and spacing.
 * 
 * @param children - Content elements to arrange in grid
 * @param cols - Number of columns (default: 2)
 * @param gap - Space between grid items (default: 'md')
 * @param className - Additional CSS classes
 */
export function SlotLayoutGrid({
  children,
  cols = 2,
  gap = 'md',
  className = '',
}: SlotLayoutGridProps): JSX.Element {
  const colsClass = colsClassMap[cols];
  const gapClass = gapClassMap[gap];

  return (
    <div
      className={`slot-layout-grid grid ${colsClass} ${gapClass} ${className}`.trim()}
      data-slot-layout="grid"
      data-cols={cols}
      data-gap={gap}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Display Name
// =============================================================================

SlotLayoutGrid.displayName = 'SlotLayoutGrid';

// =============================================================================
// Exports
// =============================================================================

export default SlotLayoutGrid;
