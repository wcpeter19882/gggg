/**
 * BigNum Component (L2 Block)
 * 
 * Hero metric display - single large number with label.
 * Used for highlighting a standout KPI or statistic.
 * 
 * Usage:
 * ```mdx
 * <BigNum 
 *   value="136k" 
 *   label="Monthly Active Users"
 *   sublabel="Growing 12% MoM"
 * />
 * ```
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface BigNumProps {
  /** The main metric value */
  value: string;
  /** Label describing the metric */
  label?: string;
  /** Optional secondary label/context */
  sublabel?: string;
  /** Optional icon */
  icon?: string;
  /** Optional accent color override */
  accentColor?: string;
}

// =============================================================================
// Component
// =============================================================================

export function BigNum({ 
  value, 
  label, 
  sublabel,
  icon,
  accentColor 
}: BigNumProps): JSX.Element {
  
  return (
    <div className="big-num">
      {icon && (
        <div className="big-num-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div 
        className="big-num-value"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </div>
      {label && (
        <div className="big-num-label">
          {label}
        </div>
      )}
      {sublabel && (
        <div className="big-num-sublabel">
          {sublabel}
        </div>
      )}
    </div>
  );
}


export default BigNum;
