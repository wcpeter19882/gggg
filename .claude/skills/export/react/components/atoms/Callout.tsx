/**
 * Callout Component (L3 Atom)
 * 
 * Semantic callout/alert component for highlighting important information.
 * Supports different intents (info, warning, success, danger).
 * 
 * Usage:
 * ```mdx
 * <Callout intent="info">This is informational</Callout>
 * <Callout intent="warning">This is a warning</Callout>
 * <Callout intent="success">This is successful</Callout>
 * <Callout intent="danger">This is an error</Callout>
 * ```
 */

import React, { type ReactNode } from 'react';
import type { Intent } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface CalloutProps {
  children: ReactNode;
  /** Semantic intent */
  intent?: Intent;
  /** Optional title */
  title?: string;
}

// =============================================================================
// Icons
// =============================================================================

const icons: Record<Intent, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  danger: '❌',
};

// =============================================================================
// Component
// =============================================================================

/**
 * Callout Component
 * 
 * Renders a highlighted callout box with intent-based styling.
 * 
 * @param intent - Semantic intent (info, warning, success, danger)
 * @param title - Optional title text
 * @param children - Callout content
 */
export function Callout({
  children,
  intent = 'info',
  title,
}: CalloutProps): JSX.Element {
  const className = `callout callout-${intent}`;
  const icon = icons[intent];
  
  return (
    <aside className={className} role="note" aria-label={`${intent} callout`}>
      <span className="callout-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="callout-content">
        {title && <strong className="callout-title">{title}</strong>}
        <div className="callout-body">{children}</div>
      </div>
    </aside>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Callout;
