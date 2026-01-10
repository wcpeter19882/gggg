/**
 * SlotLayout Primitives
 * 
 * Pure structural components for the 4-Layer Architecture (Layer 3).
 * These primitives handle ONLY the arrangement of content within a Slot,
 * with no business logic or content awareness.
 * 
 * Available SlotLayouts:
 * - SlotLayoutStack: Vertical flex stacking with gap
 * - SlotLayoutGrid: CSS Grid with configurable columns
 * - SlotLayoutFit: Forces child to fill container (for visuals)
 */

// =============================================================================
// Component Exports
// =============================================================================

export { SlotLayoutStack } from './SlotLayoutStack';
export { SlotLayoutGrid } from './SlotLayoutGrid';
export { SlotLayoutFit } from './SlotLayoutFit';

// =============================================================================
// Type Exports
// =============================================================================

export type {
  SlotLayoutStackProps,
  StackGap,
  StackAlign,
  StackJustify,
} from './SlotLayoutStack';

export type {
  SlotLayoutGridProps,
  GridCols,
  GridGap,
} from './SlotLayoutGrid';

export type {
  SlotLayoutFitProps,
  FitMode,
  FitAlign,
  FitValign,
} from './SlotLayoutFit';
