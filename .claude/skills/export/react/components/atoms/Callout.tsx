/**
 * Callout Component (L3 Atom)
 *
 * Elegant takeaway/conclusion anchor for slides. Used to emphasize the 
 * "so what?" or key insight from a section. Features a distinctive 
 * arrow icon that visually reinforces its purpose as a key takeaway.
 *
 * Use cases:
 * - Slide takeaway/conclusion at bottom of LayoutStacked
 * - Key insight paired with data in LayoutSplit  
 * - Summary point in narrow columns (Main slot of Dashboard)
 *
 * Usage:
 * ```mdx
 * <Callout>Batch processing reduces CoGS by 40% at scale.</Callout>
 * <Callout label="Takeaway">Trust is the primary blocker for enterprise adoption.</Callout>
 * <Callout label="Implication" variant="accent">We're building on proven components.</Callout>
 * ```
 */

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export type CalloutVariant = 'default' | 'accent' | 'muted';

export interface CalloutProps {
  children: ReactNode;
  /** Optional label prefix (e.g., "Takeaway", "Implication", "Key Insight") */
  label?: string;
  /** Visual variant: default (subtle), accent (emphasized), muted (understated) */
  variant?: CalloutVariant;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

// =============================================================================
// Component
// =============================================================================

/**
 * Callout Component
 *
 * Renders an elegant takeaway block with arrow icon and optional label.
 * The arrow icon reinforces the "key point" purpose visually.
 *
 * @param label - Optional prefix label (Takeaway, Implication, etc.)
 * @param variant - Visual variant (default, accent, muted)
 * @param align - Text alignment (left, center, right)
 * @param children - Takeaway content
 */
export function Callout({
  children,
  label,
  variant = 'default',
  align = 'left',
}: CalloutProps): JSX.Element {
  return (
    <aside
      className={`callout callout-${variant}`}
      role="note"
      aria-label={label ? `${label}` : 'key takeaway'}
      data-align={align}
    >
      <span className="callout-icon" aria-hidden="true">→</span>
      <div className="callout-content">
        {label && <span className="callout-label">{label}</span>}
        <div className="callout-body">{children}</div>
      </div>
    </aside>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Callout;
