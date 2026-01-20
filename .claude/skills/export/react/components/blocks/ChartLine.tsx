'use client';

/**
 * ChartLine Component (L2 Block)
 * 
 * Semantic line chart component using Recharts.
 * Automatically styled based on current theme.
 * 
 * Usage:
 * ```mdx
 * <ChartLine 
 *   title="Revenue Growth"
 *   data={[
 *     { label: "Jan", value: 100 },
 *     { label: "Feb", value: 150 },
 *     { label: "Mar", value: 180 }
 *   ]}
 *   height="md"
 * />
 * ```
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export interface ChartLineProps {
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart height size */
  height?: Size;
  /** Show area under line */
  area?: boolean;
  /** Line curve type */
  curve?: 'linear' | 'smooth';
  /** Optional integrated callout */
  callout?: CalloutData;
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
// Component
// =============================================================================

/**
 * ChartLine Component
 * 
 * Renders a responsive line chart with theme-aware colors.
 * Supports integrated slots for title, subtitle, and callout.
 * 
 * @param data - Array of { label, value } objects
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param height - Chart height (sm, md, lg, full)
 * @param area - Whether to show area fill under line
 * @param curve - Line curve type (linear or smooth)
 * @param callout - Optional integrated callout
 */
export function ChartLine({
  data,
  title,
  subtitle,
  height = 'md',
  area = false,
  curve = 'smooth',
  callout,
}: ChartLineProps): JSX.Element {
  const chartHeight = heightMap[height] || heightMap.md;
  const curveType = curve === 'smooth' ? 'monotone' : 'linear';
  
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
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--theme-border)"
            vertical={false}
          />
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
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              borderRadius: 'var(--vibe-radius)',
              boxShadow: 'var(--vibe-shadow)',
            }}
            labelStyle={{ color: 'var(--theme-text)' }}
          />
          <Line
            type={curveType}
            dataKey="value"
            stroke="var(--theme-primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--theme-primary)', r: 4 }}
            activeDot={{ r: 6, fill: 'var(--theme-accent)' }}
            fill={area ? 'var(--theme-primary)' : 'none'}
            fillOpacity={area ? 0.1 : 0}
          />
        </LineChart>
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

export default ChartLine;
