/**
 * ProcessStrip Component (L2 Block)
 * 
 * Horizontal process/phase strip with status indicators.
 * Lightweight alternative to NetworkGraph for linear progressions.
 * 
 * Usage:
 * ```mdx
 * // Simple items (all neutral status)
 * <ProcessStrip 
 *   id="process_001"
 *   items={["Plan", "Build", "Test", "Ship"]}
 * />
 * 
 * // With status
 * <ProcessStrip 
 *   id="process_002"
 *   items={[
 *     { label: "Plan", status: "done" },
 *     { label: "Build", status: "active" },
 *     { label: "Test", status: "pending" },
 *     { label: "Ship", status: "pending" }
 *   ]}
 * />
 * ```
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export type ProcessStatus = 'done' | 'active' | 'pending' | 'neutral';

export interface ProcessItem {
  /** Stage/phase label */
  label: string;
  /** Status: done, active, pending, neutral */
  status?: ProcessStatus;
  /** Optional icon */
  icon?: string;
}

export interface ProcessStripProps {
  /** Unique identifier */
  id?: string;
  /** Process items - strings or objects with label/status */
  items: (string | ProcessItem)[];
  /** Optional title */
  title?: string;
  /** Show connectors between items (default: true) */
  showConnectors?: boolean;
  /** Variant: default, compact */
  variant?: 'default' | 'compact';
}

// =============================================================================
// Component
// =============================================================================

/**
 * ProcessStrip Component
 * 
 * Renders a horizontal strip of process stages with visual connectors.
 * Best for project phases, pipelines, and status progressions.
 * 
 * @param id - Unique identifier
 * @param items - Array of stage strings or objects
 * @param title - Optional title above strip
 * @param showConnectors - Show arrows between items
 * @param variant - Visual variant
 */
export function ProcessStrip({
  id,
  items,
  title,
  showConnectors = true,
  variant = 'default',
}: ProcessStripProps): JSX.Element {
  const variantClass = variant === 'compact' ? 'process-strip-compact' : '';
  
  return (
    <div 
      className={`process-strip-block ${variantClass}`} 
      id={id} 
      data-block="process-strip"
    >
      {title && <h4 className="process-strip-title">{title}</h4>}
      <div className="process-strip">
        {items.map((item, index) => {
          const isString = typeof item === 'string';
          const label = isString ? item : item.label;
          const status: ProcessStatus = isString ? 'neutral' : (item.status || 'neutral');
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <div 
                className={`process-step process-status-${status}`}
                data-status={status}
              >
                <div className="process-step-indicator">
                  {status === 'done' && <span className="process-check">✓</span>}
                  {status === 'active' && <span className="process-dot"></span>}
                </div>
                <span className="process-step-label">{label}</span>
              </div>
              {showConnectors && !isLast && (
                <div className="process-connector">
                  <span className="process-arrow">→</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default ProcessStrip;
