/**
 * StepList Component (L2 Block)
 * 
 * Vertical numbered steps with visual connectors.
 * Lightweight alternative to NetworkGraph for linear sequences.
 * 
 * Usage:
 * ```mdx
 * <StepList 
 *   id="steps_001"
 *   items={[
 *     "Collect requirements",
 *     "Design solution",
 *     "Build prototype",
 *     "Test and iterate"
 *   ]}
 * />
 * 
 * // With descriptions:
 * <StepList 
 *   id="steps_002"
 *   items={[
 *     { label: "Plan", description: "Define scope and goals" },
 *     { label: "Build", description: "Implement core features" },
 *     { label: "Ship", description: "Deploy to production" }
 *   ]}
 * />
 * ```
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface StepItem {
  /** Step label (required) */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon override */
  icon?: string;
}

export interface StepListProps {
  /** Unique identifier */
  id?: string;
  /** Step items - strings or objects with label/description */
  items: (string | StepItem)[];
  /** Optional title */
  title?: string;
  /** Start numbering from (default: 1) */
  startFrom?: number;
}

// =============================================================================
// Component
// =============================================================================

/**
 * StepList Component
 * 
 * Renders a vertical list of numbered steps with connecting lines.
 * Best for procedures, tutorials, and how-to sequences.
 * 
 * @param id - Unique identifier
 * @param items - Array of step strings or objects
 * @param title - Optional title above steps
 * @param startFrom - Starting number (default: 1)
 */
export function StepList({
  id,
  items,
  title,
  startFrom = 1,
}: StepListProps): JSX.Element {
  return (
    <div className="step-list-block" id={id} data-block="step-list">
      {title && <h4 className="step-list-title">{title}</h4>}
      <ol className="step-list" start={startFrom}>
        {items.map((item, index) => {
          const isString = typeof item === 'string';
          const label = isString ? item : item.label;
          const description = isString ? undefined : item.description;
          const stepNum = startFrom + index;
          
          return (
            <li key={index} className="step-list-item" data-step={stepNum}>
              <div className="step-number">{stepNum}</div>
              <div className="step-content">
                <span className="step-label">{label}</span>
                {description && (
                  <span className="step-description">{description}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default StepList;
