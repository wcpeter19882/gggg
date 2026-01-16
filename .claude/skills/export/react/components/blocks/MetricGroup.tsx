'use client';

/**
 * MetricGroup Component (L2 Block)
 * 
 * Semantic KPI/metrics display component.
 * Shows multiple metrics in a grid layout with values, labels, and optional change indicators.
 * Supports integrated slots for title, subtitle, callout, and summary.
 * 
 * Auto-fit mode: When cols is not specified (or set to 'auto'), the component
 * automatically calculates optimal grid layout based on:
 * - Number of items
 * - Container dimensions (width/height)
 * - Target aspect ratio for each metric card
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
 * Usage (child components with auto-fit):
 * ```mdx
 * <MetricGroup>
 *   <Metric value="$2.4M" label="Revenue" change={12} />
 *   <Metric value="89%" label="Satisfaction" change={-3} />
 *   <Metric value="1,234" label="Customers" />
 * </MetricGroup>
 * ```
 */

import React, { Children, isValidElement, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
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
  /** Number of columns (1-4, or 'auto' for auto-fit based on container) */
  cols?: 1 | 2 | 3 | 4 | 'auto';
  /** Number of columns (alias for cols) */
  columns?: 1 | 2 | 3 | 4 | 'auto';
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
// Auto-fit Grid Calculator
// =============================================================================

/**
 * Find all divisor pairs (cols, rows) where cols * rows == n
 */
function getDivisorPairs(n: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      pairs.push([i, n / i]);       // e.g., [1, 4]
      if (i !== n / i) {
        pairs.push([n / i, i]);     // e.g., [4, 1]
      }
    }
  }
  return pairs;
}

/**
 * Find smallest grid (cols, rows) where cols * rows >= n
 * Returns pairs sorted by total cells (smallest first)
 */
function getMinimalGrids(n: number, maxCols: number = 6): Array<[number, number]> {
  const grids: Array<[number, number]> = [];
  
  for (let cols = 1; cols <= maxCols; cols++) {
    const rows = Math.ceil(n / cols);
    if (rows <= maxCols) { // Also limit rows
      grids.push([cols, rows]);
    }
  }
  
  // Sort by total cells (prefer smaller grids), then by cols
  return grids.sort((a, b) => {
    const totalA = a[0] * a[1];
    const totalB = b[0] * b[1];
    if (totalA !== totalB) return totalA - totalB;
    return a[0] - b[0]; // Prefer fewer cols if same total
  });
}

/**
 * Calculate optimal grid dimensions based on container size and item count.
 * 
 * Priority:
 * 1. Perfect fit (no empty cells): e.g., 4 items → 2x2, 4x1, 1x4
 * 2. Container aspect ratio determines which perfect fit to use
 * 3. If no perfect fit (e.g., 5 items), use smallest grid that fits (3x2 or 2x3)
 * 
 * @param containerWidth - Available width in pixels
 * @param containerHeight - Available height in pixels  
 * @param itemCount - Number of items to display
 * @returns Optimal number of columns
 */
function calculateOptimalCols(
  containerWidth: number,
  containerHeight: number,
  itemCount: number
): number {
  if (itemCount <= 0) return 2;
  if (itemCount === 1) return 1;
  
  // Use default if container not measured yet
  if (containerWidth <= 0 || containerHeight <= 0) {
    // Sensible defaults based on item count
    if (itemCount <= 2) return itemCount;
    if (itemCount <= 4) return 2;
    if (itemCount <= 6) return 3;
    return 4;
  }
  
  const containerAspectRatio = containerWidth / containerHeight;
  const gap = 16; // 1rem gap
  
  // Priority 1: Find perfect fit layouts (cols * rows === itemCount)
  const perfectFits = getDivisorPairs(itemCount);
  
  // Priority 2: If no perfect fit, get minimal grids
  const candidates = perfectFits.length > 0 ? perfectFits : getMinimalGrids(itemCount);
  
  if (candidates.length === 0) {
    return Math.min(itemCount, 4);
  }
  
  // Score each candidate based on how well cell aspect ratio matches container
  let bestCols = candidates[0][0];
  let bestScore = Infinity;
  
  for (const [cols, rows] of candidates) {
    // Skip extreme layouts (avoid 1xN or Nx1 unless necessary)
    if (perfectFits.length > 2 && (cols === 1 || rows === 1) && itemCount > 2) {
      continue; // Skip single row/column if there are better options
    }
    
    // Calculate cell dimensions
    const totalHGap = (cols - 1) * gap;
    const totalVGap = (rows - 1) * gap;
    const cellWidth = (containerWidth - totalHGap) / cols;
    const cellHeight = (containerHeight - totalVGap) / rows;
    
    if (cellWidth <= 0 || cellHeight <= 0) continue;
    
    const cellAspectRatio = cellWidth / cellHeight;
    
    // Target: cells should be roughly 1.5-2x wider than tall (good for metrics)
    const targetAspectRatio = 1.6;
    
    // Score: how far from ideal aspect ratio
    // Penalize portrait cells (too tall) more heavily
    const aspectDiff = Math.abs(cellAspectRatio - targetAspectRatio);
    const tooTallPenalty = cellAspectRatio < 1 ? 3 : 1;
    const tooWidePenalty = cellAspectRatio > 3 ? 1.5 : 1; // Slightly penalize very wide
    
    // Bonus for perfect fit (no empty cells)
    const emptySlots = cols * rows - itemCount;
    const emptyPenalty = emptySlots * 0.5;
    
    const score = aspectDiff * tooTallPenalty * tooWidePenalty + emptyPenalty;
    
    if (score < bestScore) {
      bestScore = score;
      bestCols = cols;
    }
  }
  
  return bestCols;
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
 * Auto-fit mode calculates optimal grid based on container dimensions.
 * 
 * @param metrics - Array of metric data objects (optional if using children)
 * @param children - Metric children (optional if using metrics prop)
 * @param cols - Number of columns in the grid (1-4, or 'auto' for auto-fit)
 * @param title - Optional title above the metrics
 * @param subtitle - Optional subtitle below title
 * @param callout - Optional integrated callout
 * @param summary - Optional summary text below metrics
 */
export function MetricGroup({
  metrics,
  children,
  cols,
  columns,
  id,
  title,
  subtitle,
  callout,
  summary,
}: MetricGroupProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoFitCols, setAutoFitCols] = useState<number | null>(null); // null = not yet calculated
  const [containerMeasured, setContainerMeasured] = useState(false);
  
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
  const itemCount = resolvedMetrics.length;
  
  // Explicit cols from props (used as fallback only)
  const explicitCols = cols ?? columns;
  
  // Auto-fit calculation using ResizeObserver
  // Always run auto-fit - explicit cols is only fallback before measurement
  const calculateLayout = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const optimalCols = calculateOptimalCols(rect.width, rect.height, itemCount);
      setAutoFitCols(optimalCols);
      setContainerMeasured(true);
    }
  }, [itemCount]);
  
  useEffect(() => {
    // Initial calculation
    calculateLayout();
    
    // Observe container size changes
    const observer = new ResizeObserver(() => {
      calculateLayout();
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [calculateLayout]);
  
  // Priority: 
  // 1. Auto-fit (module + aspect ratio) if container measured
  // 2. Explicit cols as fallback before measurement
  // 3. Default to 2 if nothing else
  const effectiveCols = containerMeasured && autoFitCols !== null 
    ? autoFitCols 
    : (typeof explicitCols === 'number' ? explicitCols : 2);
  
  // Build inline grid styles - explicit display:grid ensures no override
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${effectiveCols}, 1fr)`,
    gap: '1rem',
    height: '100%', // Fill available height for auto-fit calculation
  };
  
  // Determine callout class based on intent
  const calloutClass = callout 
    ? `block-callout callout-${callout.intent || 'info'}`
    : '';
  
  return (
    <div className="metric-group-block" id={id} ref={containerRef}>
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
