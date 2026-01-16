/**
 * LayoutSplit Component (L1 Layout)
 * 
 * Two-column layout with configurable ratio using Compound Components pattern.
 * Content is placed in .Left and .Right slots.
 * 
 * Usage:
 * ```mdx
 * <LayoutSplit ratio="2:1">
 *   <LayoutSplit.Left>
 *     <Heading level={2}>Left Content</Heading>
 *     <Text>Description text</Text>
 *   </LayoutSplit.Left>
 *   <LayoutSplit.Right>
 *     <ChartBar data={[...]} />
 *   </LayoutSplit.Right>
 * </LayoutSplit>
 * ```
 */

import React, { type ReactNode, Children, isValidElement } from 'react';
import type { SplitRatio, ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface LayoutSplitProps {
  children: ReactNode;
  /** Column width ratio */
  ratio?: SplitRatio;
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
}

export interface LayoutSplitSlotProps {
  children: ReactNode;
}

// =============================================================================
// Slot Components (exported for standalone use in MDX)
// =============================================================================

/**
 * Left slot for LayoutSplit
 * Can be used as <Left> or <LayoutSplit.Left>
 */
export function Left({ children }: LayoutSplitSlotProps): JSX.Element {
  return <div className="layout-split-left">{children}</div>;
}
Left.displayName = 'Left';

/**
 * Right slot for LayoutSplit
 * Can be used as <Right> or <LayoutSplit.Right>
 */
export function Right({ children }: LayoutSplitSlotProps): JSX.Element {
  return <div className="layout-split-right">{children}</div>;
}
Right.displayName = 'Right';

// =============================================================================
// Ratio Mapping
// =============================================================================

const ratioClassMap: Record<SplitRatio, string> = {
  '1:1': 'layout-split-1-1',
  '2:1': 'layout-split-2-1',
  '1:2': 'layout-split-1-2',
  '3:1': 'layout-split-3-1',
  '1:3': 'layout-split-1-3',
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * LayoutSplit Component
 * 
 * Renders a two-column split layout with configurable ratio.
 * Uses Compound Components pattern for semantic slot assignment.
 * 
 * @param children - Must contain LayoutSplit.Left and LayoutSplit.Right
 * @param ratio - Column width ratio (e.g., "2:1", "1:1")
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutSplit({
  children,
  ratio = '1:1',
  theme,
  vibe,
}: LayoutSplitProps): JSX.Element {
  // Extract Left and Right slots from children
  let leftContent: ReactNode = null;
  let rightContent: ReactNode = null;
  
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    
    const displayName = (child.type as { displayName?: string }).displayName;
    const componentType = child.type;
    
    // Match both standalone (Left/Right) and compound (LayoutSplit.Left/Right) patterns
    if (displayName === 'Left' || displayName === 'LayoutSplit.Left' || componentType === Left) {
      leftContent = child;
    } else if (displayName === 'Right' || displayName === 'LayoutSplit.Right' || componentType === Right) {
      rightContent = child;
    }
  });
  
  // Get ratio class
  const ratioClass = ratioClassMap[ratio] || ratioClassMap['1:1'];
  
  return (
    <div 
      className={`layout-split ${ratioClass}`}
      data-layout="split"
      data-ratio={ratio}
      data-theme={theme}
      data-vibe={vibe}
    >
      {leftContent}
      {rightContent}
    </div>
  );
}

// =============================================================================
// Attach Slot Components
// =============================================================================

LayoutSplit.Left = Left;
LayoutSplit.Right = Right;

// =============================================================================
// Exports
// =============================================================================

export default LayoutSplit;
