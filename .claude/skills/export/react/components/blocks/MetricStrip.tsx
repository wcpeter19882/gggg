/**
 * MetricStrip Component (L2 Block)
 * 
 * Inline horizontal compact metrics row.
 * Shows multiple metrics in a single horizontal strip with icons.
 * 
 * Usage:
 * ```mdx
 * <MetricStrip 
 *   title="Key Stats"
 *   metrics={[
 *     { icon: "📊", value: "99.9%", label: "Uptime" },
 *     { icon: "⚡", value: "10x", label: "Faster" },
 *     { icon: "👥", value: "1M+", label: "Users" }
 *   ]}
 * />
 * ```
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface MetricStripItem {
  /** Optional icon (emoji or icon name) */
  icon?: string;
  /** Metric value */
  value: string;
  /** Metric label */
  label: string;
}

export interface MetricStripProps {
  /** Array of metrics to display */
  metrics: MetricStripItem[];
  /** Optional title above the strip */
  title?: string;
}

// =============================================================================
// Component
// =============================================================================

export function MetricStrip({ metrics, title }: MetricStripProps): JSX.Element {
  return (
    <div className="metric-strip">
      {title && (
        <div className="metric-strip-title">
          {title}
        </div>
      )}
      {metrics.map((metric, index) => (
        <div key={index} className="metric-strip-item">
          {metric.icon && (
            <span className="strip-icon" aria-hidden="true">
              {metric.icon}
            </span>
          )}
          <span className="strip-value">
            {metric.value}
          </span>
          <span className="strip-label">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  );
}


export default MetricStrip;
