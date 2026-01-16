/**
 * MetricGroup Component (L2 Block)
 * 
 * Semantic KPI/metrics display component.
 * Shows multiple metrics in a grid layout with values, labels, and optional change indicators.
 * Supports integrated slots for title, subtitle, callout, and summary.
 * 
 * Usage (array prop):
 * ```mdx
 * <MetricGroup 
 *   metrics={[
 *     { value: "$2.4M", label: "Revenue", change: 12 },
 *     { value: "89%", label: "Satisfaction", change: -3 },
 *     { value: "1,234", label: "Customers" }
 *   ]}
 *   cols={3}
 *   title="Key Metrics"
 *   callout={{ intent: "success", text: "All targets exceeded" }}
 * />
 * ```
 * 
 * Usage (child components):
 * ```mdx
 * <MetricGroup cols={3}>
 *   <Metric value="$2.4M" label="Revenue" change={12} />
 *   <Metric value="89%" label="Satisfaction" change={-3} />
 *   <Metric value="1,234" label="Customers" />
 * </MetricGroup>
 * ```
 */

import React, { Children, isValidElement, type ReactNode } from 'react';
import type { MetricData } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface CalloutData {
  /** Callout intent: info, warning, success, error */
  intent?: 'info' | 'warning' | 'success' | 'error';
  /** Callout title */
  title?: string;
  /** Callout text content */
  text: string;
}

export interface MetricProps extends MetricData {
  children?: ReactNode;
}

export interface MetricGroupProps {
  /** Array of metric data (alternative to using Metric children) */
  metrics?: MetricData[];
  /** Metric children (alternative to metrics prop) */
  children?: ReactNode;
  /** Number of columns */
  cols?: 1 | 2 | 3 | 4;
  /** Optional id for the metric group */
  id?: string;
  /** Optional title above the metrics */
  title?: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Optional integrated callout */
  callout?: CalloutData;
  /** Optional summary text below metrics */
  summary?: string;
}

// =============================================================================
// Metric Component (for child component pattern)
// =============================================================================

/**
 * Metric Component
 * 
 * Individual metric item used as child of MetricGroup.
 * Also exports for direct use in MDX.
 */
export function Metric({ value, label, change, changeLabel, icon }: MetricProps): JSX.Element {
  // Determine change direction for styling
  const changeDirection = change !== undefined
    ? change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
    : null;
  
  // Format change value with sign
  const formattedChange = change !== undefined
    ? `${change > 0 ? '+' : ''}${change}%`
    : null;
  
  return (
    <div className="metric-card">
      {icon && (
        <span className="metric-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {formattedChange && (
        <div className={`metric-change metric-change-${changeDirection}`}>
          <span className="metric-change-value">{formattedChange}</span>
          {changeLabel && (
            <span className="metric-change-label">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
Metric.displayName = 'Metric';

// =============================================================================
// Helper Components
// =============================================================================

interface MetricCardProps {
  metric: MetricData;
}

function MetricCard({ metric }: MetricCardProps): JSX.Element {
  return <Metric {...metric} />;
}

// =============================================================================
// Component
// =============================================================================

/**
 * MetricGroup Component
 * 
 * Renders a grid of metric cards with theme-aware styling.
 * Supports both array prop and child component patterns.
 * 
 * @param metrics - Array of metric data objects (optional if using children)
 * @param children - Metric children (optional if using metrics prop)
 * @param cols - Number of columns in the grid (1-4)
 * @param title - Optional title above the metrics
 * @param subtitle - Optional subtitle below title
 * @param callout - Optional integrated callout
 * @param summary - Optional summary text below metrics
 */
export function MetricGroup({
  metrics,
  children,
  cols = 2,
  id,
  title,
  subtitle,
  callout,
  summary,
}: MetricGroupProps): JSX.Element {
  // Build inline grid styles
  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
  };
  
  // Determine callout class based on intent
  const calloutClass = callout 
    ? `block-callout callout-${callout.intent || 'info'}`
    : '';

  // Extract metrics from children if no metrics prop provided
  const metricsFromChildren: MetricData[] = [];
  if (!metrics && children) {
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const displayName = (child.type as { displayName?: string })?.displayName;
        if (displayName === 'Metric' || (child.type as any) === Metric) {
          const props = child.props as MetricProps;
          metricsFromChildren.push({
            value: props.value,
            label: props.label,
            change: props.change,
            changeLabel: props.changeLabel,
            icon: props.icon,
          });
        }
      }
    });
  }

  const resolvedMetrics = metrics || metricsFromChildren;
  
  return (
    <div className="metric-group-block" id={id}>
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Metrics Grid */}
      <div className="metric-group" style={gridStyle}>
        {resolvedMetrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
      
      {/* Integrated Callout */}
      {callout && (
        <div className={calloutClass}>
          {callout.title && <strong className="callout-title">{callout.title}</strong>}
          <span className="callout-text">{callout.text}</span>
        </div>
      )}
      
      {/* Summary Footer */}
      {summary && (
        <div className="block-footer">
          <span className="summary-text">{summary}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default MetricGroup;
