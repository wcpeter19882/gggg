'use client';

/**
 * ChartPie Component (L2 Block)
 * 
 * Semantic pie/donut chart component using Recharts.
 * Automatically styled based on current theme.
 * 
 * Usage:
 * ```mdx
 * <ChartPie 
 *   title="Market Share"
 *   data={[
 *     { label: "Product A", value: 40 },
 *     { label: "Product B", value: 35 },
 *     { label: "Product C", value: 25 }
 *   ]}
 *   variant="donut"
 * />
 * ```
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
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

export interface ChartPieProps {
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart size */
  size?: Size;
  /** Pie or donut variant */
  variant?: 'pie' | 'donut';
  /** Show legend */
  showLegend?: boolean;
  /** Optional integrated callout */
  callout?: CalloutData;
}

// =============================================================================
// Constants
// =============================================================================

const sizeMap: Record<Size, number> = {
  sm: 150,
  md: 250,
  lg: 350,
  full: 400,
};

// Color palette for pie slices
const COLORS = [
  'var(--theme-primary)',
  'var(--theme-secondary)',
  'var(--theme-accent)',
  'var(--theme-info)',
  'var(--theme-success)',
  'var(--theme-warning)',
];

// =============================================================================
// Component
// =============================================================================

/**
 * ChartPie Component
 * 
 * Renders a responsive pie or donut chart with theme-aware colors.
 * Supports integrated slots for title, subtitle, and callout.
 * 
 * @param data - Array of { label, value } objects
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param size - Chart size (sm, md, lg, full)
 * @param variant - pie (filled) or donut (hollow center)
 * @param showLegend - Whether to show legend
 * @param callout - Optional integrated callout
 */
export function ChartPie({
  data,
  title,
  subtitle,
  size = 'md',
  variant = 'pie',
  showLegend = true,
  callout,
}: ChartPieProps): JSX.Element {
  const chartSize = sizeMap[size] || sizeMap.md;
  const innerRadius = variant === 'donut' ? '60%' : 0;
  const outerRadius = '80%';
  
  // Determine callout class based on intent
  const calloutClass = callout 
    ? `block-callout callout-${callout.intent || 'info'}`
    : '';
  
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
      <ResponsiveContainer width="100%" height={chartSize}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            nameKey="label"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              borderRadius: 'var(--vibe-radius)',
              boxShadow: 'var(--vibe-shadow)',
            }}
            labelStyle={{ color: 'var(--theme-text)' }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: 'var(--theme-text)', fontSize: 12 }}>
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
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

export default ChartPie;
