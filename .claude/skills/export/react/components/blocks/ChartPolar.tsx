'use client';

/**
 * ChartPolar Component (L2 Block)
 * 
 * Semantic polar area chart component using Recharts.
 * Displays data as segments of equal angle but varying radii.
 * Automatically styled with earthy color palette.
 * 
 * Usage:
 * ```mdx
 * <ChartPolar 
 *   title="Regional Distribution"
 *   data={[
 *     { label: "North", value: 400 },
 *     { label: "South", value: 300 },
 *     { label: "East", value: 250 },
 *     { label: "West", value: 350 }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  PolarAngleAxis,
} from 'recharts';
import type { ChartDataPoint, Size } from '@/utils/types';
import { 
  CHART_COLORS, 
  getChartColor,
  sizeMap,
  normalizeChartData,
  tooltipStyle,
} from './chartUtils';

// =============================================================================
// Types
// =============================================================================

export interface ChartPolarProps {
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart size */
  size?: Size;
  /** Show legend */
  showLegend?: boolean;
  /** Custom colors array */
  colors?: string[];
  /** Inner radius (0 = full, >0 = ring style) */
  innerRadius?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ChartPolar Component
 * 
 * Renders a responsive polar area chart using RadialBarChart.
 * Each segment has equal angle but varying radius based on value.
 * Ideal for cyclical or categorical data visualization.
 * 
 * @param data - Array of { label, value } objects
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param size - Chart size (sm, md, lg, full)
 * @param showLegend - Whether to show legend (default: true)
 * @param colors - Custom color palette
 * @param innerRadius - Inner radius percentage (default: '30%')
 */
export function ChartPolar({
  data,
  title,
  subtitle,
  size = 'md',
  showLegend = true,
  colors,
  innerRadius = '30%',
}: ChartPolarProps): JSX.Element {
  const chartSize = sizeMap[size] || sizeMap.md;
  
  // Normalize and validate data
  const validData = normalizeChartData(data);
  
  // Handle empty data
  if (validData.length === 0) {
    return (
      <div className="chart-block chart-polar">
        {(title || subtitle) && (
          <div className="block-header">
            {title && <h3 className="block-title">{title}</h3>}
            {subtitle && <p className="block-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">No data available</div>
      </div>
    );
  }
  
  // Calculate max value for domain scaling
  const maxValue = Math.max(...validData.map(d => d.value || 0));
  
  // Transform data for RadialBarChart format
  // Each segment needs its own fill color
  const chartData = validData.map((d, index) => ({
    name: d.label,
    value: d.value || 0,
    fill: d.color || getChartColor(index, colors),
  }));
  
  return (
    <div className="chart-block chart-polar">
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      <ResponsiveContainer width="100%" height={chartSize}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius="80%"
          data={chartData}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis 
            type="number" 
            domain={[0, maxValue]} 
            angleAxisId={0} 
            tick={false}
          />
          
          <Tooltip
            contentStyle={tooltipStyle.contentStyle}
            labelStyle={tooltipStyle.labelStyle}
            formatter={(value: number, name: string) => [value, name]}
          />
          
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            background={{ fill: 'var(--theme-border)', opacity: 0.3 }}
          />
          
          {showLegend && (
            <Legend
              iconSize={10}
              layout="horizontal"
              verticalAlign="bottom"
              wrapperStyle={{ 
                fontSize: '0.75rem',
                paddingTop: '10px',
              }}
              formatter={(value, entry: any) => (
                <span style={{ color: 'var(--theme-text-muted)' }}>{value}</span>
              )}
            />
          )}
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
