/**
 * LayoutGrid Component (L1 Layout)
 * 
 * Multi-column grid layout using Compound Components pattern.
 * Content is placed in .Col slots.
 * 
 * Usage:
 * ```mdx
 * <LayoutGrid cols={3}>
 *   <LayoutGrid.Col>
 *     <Heading level={3}>Column 1</Heading>
 *     <Text>Content</Text>
 *   </LayoutGrid.Col>
 *   <LayoutGrid.Col>
 *     <Heading level={3}>Column 2</Heading>
 *     <Text>Content</Text>
 *   </LayoutGrid.Col>
 *   <LayoutGrid.Col>
 *     <Heading level={3}>Column 3</Heading>
 *     <Text>Content</Text>
 *   </LayoutGrid.Col>
 * </LayoutGrid>
 * ```
 */

import React, { type ReactNode, Children, isValidElement } from 'react';
import type { GridCols, ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface LayoutGridProps {
  children: ReactNode;
  /** Number of columns (2-4) */
  cols?: GridCols;
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
}

export interface LayoutGridColProps {
  children: ReactNode;
}

// =============================================================================
// Slot Component
// =============================================================================

/**
 * Column slot for LayoutGrid
 */
function Col({ children }: LayoutGridColProps): JSX.Element {
  return <div className="layout-grid-col">{children}</div>;
}
Col.displayName = 'LayoutGrid.Col';

// =============================================================================
// Column Class Mapping
// =============================================================================

const colsClassMap: Record<GridCols, string> = {
  2: 'layout-grid-2',
  3: 'layout-grid-3',
  4: 'layout-grid-4',
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * LayoutGrid Component
 * 
 * Renders a multi-column grid layout.
 * Supports both Compound Components pattern (with LayoutGrid.Col)
 * and direct children without Col wrappers.
 * 
 * @param children - LayoutGrid.Col components or direct children
 * @param cols - Number of columns (2, 3, or 4)
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutGrid({
  children,
  cols = 3,
  theme,
  vibe,
}: LayoutGridProps): JSX.Element {
  // Extract Col components from children
  const columns: ReactNode[] = [];
  const directChildren: ReactNode[] = [];
  
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      directChildren.push(child);
      return;
    }
    
    const displayName = (child.type as { displayName?: string }).displayName;
    
    if (displayName === 'LayoutGrid.Col') {
      columns.push(child);
    } else {
      // Wrap non-Col children in a div for proper grid placement
      directChildren.push(child);
    }
  });
  
  // Get columns class
  const colsClass = colsClassMap[cols] || colsClassMap[3];
  
  // Use Col children if available, otherwise use direct children
  const content = columns.length > 0 ? columns : directChildren;
  
  return (
    <div 
      className={`layout-grid ${colsClass}`}
      data-layout="grid"
      data-cols={cols}
      data-theme={theme}
      data-vibe={vibe}
    >
      {content}
    </div>
  );
}

// =============================================================================
// Attach Slot Component
// =============================================================================

LayoutGrid.Col = Col;

// =============================================================================
// Exports
// =============================================================================

export default LayoutGrid;
