/**
 * MetricBadges Component (L2 Block)
 * 
 * Compact badge array for displaying many small metrics.
 * Shows metrics as pill-shaped badges with icons.
 * 
 * Usage:
 * ```mdx
 * <MetricBadges 
 *   badges={[
 *     { icon: "🌐", value: "9", label: "Languages" },
 *     { icon: "📍", value: "20", label: "Regions" },
 *     { icon: "✅", value: "99%", label: "Accuracy" }
 *   ]}
 * />
 * ```
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface BadgeItem {
  /** Icon (emoji or icon name) */
  icon?: string;
  /** Badge value */
  value: string;
  /** Badge label */
  label: string;
}

export interface MetricBadgesProps {
  /** Array of badges to display */
  badges: BadgeItem[];
}

// =============================================================================
// Component
// =============================================================================

export function MetricBadges({ badges }: MetricBadgesProps): JSX.Element {
  return (
    <div className="metric-badges">
      {badges.map((badge, index) => (
        <div key={index} className="metric-badge">
          {badge.icon && (
            <span className="badge-icon" aria-hidden="true">
              {badge.icon}
            </span>
          )}
          <span className="badge-label">
            {badge.label}
          </span>
          <span className="badge-value">
            {badge.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default MetricBadges;

