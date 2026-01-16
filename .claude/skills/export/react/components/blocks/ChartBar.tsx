'use client';

/**
 * ChartBar Component (L2 Block)
 * 
 * Semantic bar chart component using Recharts.
 * Supports both single-series and clustered (before/after) bar charts.
 * Automatically styled based on current theme.
 * 
 * Usage - Single series:
 * ```mdx
 * <ChartBar 
 *   title="Sales by Quarter"
 *   data={[
 *     { label: "Q1", value: 100 },
 *     { label: "Q2", value: 150 },
 *     { label: "Q3", value: 120 }
 *   ]}
 * />
 * ```
 * 
 * Usage - Clustered (before/after comparison):
 * ```mdx
 * <ChartBar 
 *   title="Performance Improvements"
 *   data={[
 *     { label: "Accuracy", before: 65.4, after: 74.8 },
 *     { label: "Latency", before: 800, after: 450 },
 *     { label: "CSAT", before: 42.9, after: 62.3 }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChartDataPoint, Size } from '@/utils/types';

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

export interface ChartBarProps {
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart height size */
  height?: Size;
  /** Optional integrated callout */
  callout?: CalloutData;
  /** Bar orientation: vertical (default) or horizontal (barStats style) */
  orientation?: 'vertical' | 'horizontal';
}

// =============================================================================
// Constants
// =============================================================================

const heightMap: Record<Size, number> = {
  sm: 150,
  md: 250,
  lg: 350,
  full: 400,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Detect if data is clustered (has before/after or current/target pairs)
 */
function isClusteredData(data: ChartDataPoint[]): boolean {
  if (!data || data.length === 0) return false;
  const first = data[0];
  return (
    (first.before !== undefined && first.after !== undefined) ||
    (first.current !== undefined && first.target !== undefined)
  );
}

/**
 * Get cluster keys from data
 */
function getClusterKeys(data: ChartDataPoint[]): { key1: string; key2: string; label1: string; label2: string } {
  const first = data[0];
  if (first.before !== undefined && first.after !== undefined) {
    return { key1: 'before', key2: 'after', label1: 'Before', label2: 'After' };
  }
  if (first.current !== undefined && first.target !== undefined) {
    return { key1: 'current', key2: 'target', label1: 'Current', label2: 'Target' };
  }
  return { key1: 'value', key2: 'value', label1: 'Value', label2: 'Value' };
}

// =============================================================================
// Component
// =============================================================================

/**
 * ChartBar Component
 * 
 * Renders a responsive bar chart with theme-aware colors.
 * Automatically detects clustered data (before/after) and renders grouped bars.
 * Supports both vertical (default) and horizontal (barStats) orientations.
 * 
 * @param data - Array of { label, value } or { label, before, after } objects
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param height - Chart height (sm, md, lg, full)
 * @param callout - Optional integrated callout
 * @param orientation - Bar orientation: 'vertical' (default) or 'horizontal'
 */
export function ChartBar({
  data,
  title,
  subtitle,
  height = 'md',
  callout,
  orientation = 'vertical',
}: ChartBarProps): JSX.Element {
  const chartHeight = heightMap[height] || heightMap.md;
  const isHorizontal = orientation === 'horizontal';
  
  // Determine callout class based on intent
  const calloutClass = callout 
    ? `block-callout callout-${callout.intent || 'info'}`
    : '';
  
  // Ensure data has valid values and is properly formatted
  const validData = (data || []).map(d => ({
    ...d,
    label: d.label || (d as any).name || '',
  })).filter(d => d.label);
  
  // Detect if this is clustered data
  const isClustered = isClusteredData(validData);
  const clusterKeys = isClustered ? getClusterKeys(validData) : null;
  
  return (
    <div className="chart-block">
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      {validData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%" minHeight={chartHeight}>
          <BarChart
            data={validData}
            layout={isHorizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 10, right: 10, left: isHorizontal ? 80 : 0, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--theme-border)"
              vertical={isHorizontal}
              horizontal={!isHorizontal}
            />
            {isHorizontal ? (
              <>
                <XAxis 
                  type="number"
                  tick={{ fill: 'var(--theme-text-muted)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--theme-border)' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="label"
                  tick={{ fill: 'var(--theme-text-muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
              </>
            ) : (
              <>
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'var(--theme-text-muted)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--theme-border)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'var(--theme-text-muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                borderRadius: 'var(--theme-radius)',
                color: 'var(--theme-text)',
              }}
            />
            {isClustered && clusterKeys ? (
              // Clustered bars for before/after comparison
              <>
                <Legend 
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="rect"
                />
                <Bar 
                  dataKey={clusterKeys.key1}
                  name={clusterKeys.label1}
                  fill="var(--theme-text-muted)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey={clusterKeys.key2}
                  name={clusterKeys.label2}
                  fill="var(--theme-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </>
            ) : (
              // Single series bars
              <Bar
                dataKey="value"
                fill="var(--theme-primary)"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {/* Integrated Callout */}
      {callout && (
        <div className={calloutClass}>
          {callout.title && <strong className="callout-title">{callout.title}</strong>}
          <span className="callout-text">{callout.text}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default ChartBar;
