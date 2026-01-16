/**
 * MetricCard Component (L2 Block)
 * 
 * Segmented summary card with categorized metrics.
 * Shows metrics with icons in a card layout (vertical or horizontal).
 * 
 * Usage:
 * ```mdx
 * <MetricCard 
 *   title="Performance"
 *   layout="horizontal"
 *   metrics={[
 *     { icon: "📈", value: "+40%", label: "Revenue Growth" },
 *     { icon: "💰", value: "-20%", label: "Cost Reduction" },
 *     { icon: "⭐", value: "72", label: "NPS Score" }
 *   ]}
 * />
 * ```
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface MetricCardItem {
  /** Icon (emoji or icon name) */
  icon?: string;
  /** Metric value */
  value: string;
  /** Metric label */
  label: string;
}

export interface MetricCardProps {
  /** Array of metrics to display */
  metrics: MetricCardItem[];
  /** Optional title for the card */
  title?: string;
  /** Layout direction: vertical (stacked) or horizontal (side by side) */
  layout?: 'vertical' | 'horizontal';
}



// =============================================================================
// Component
// =============================================================================

export function MetricCard({
  metrics,
  title,
  layout = 'horizontal',
}: MetricCardProps): JSX.Element {
  
  return (
    <div className="metric-card">
      {title && (
        <h3 className="metric-card-title">
          {title}
        </h3>
      )}

      <div className={`metric-card-grid ${layout}`}>
        {metrics.map((item, index) => (
          <div key={index} className="metric-card-item">
            {item.icon && (
              <div className="card-icon">
                {item.icon}
              </div>
            )}
            <div className="card-content">
              <div className="card-label">
                {item.label}
              </div>
              <div className="card-value">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MetricCard;
