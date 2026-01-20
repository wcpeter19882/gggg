'use client';

/**
 * ChartArea Component (L2 Block)
 * 
 * Semantic area chart component using Recharts.
 * Displays filled line chart with soft gradient for trend visualization.
 * Automatically styled based on current theme with earthy color palette.
 * 
 * Usage:
 * ```mdx
 * <ChartArea 
 *   title="Revenue Trend"
 *   data={[
 *     { label: "Jan", value: 100 },
 *     { label: "Feb", value: 150 },
 *     { label: "Mar", value: 180 }
 *   ]}
 *   gradient={true}
 *   curve="smooth"
 * />
 * ```
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint, Size } from '@/utils/types';
import { 
  CHART_COLORS, 
  heightMap, 
  normalizeChartData,
  tooltipStyle,
  axisStyle,
  gridStyle,
} from './chartUtils';

// =============================================================================
// Types
// =============================================================================

export interface ChartAreaProps {
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart height size */
  height?: Size;
  /** Enable soft gradient fill under the area */
  gradient?: boolean;
  /** Line curve type */
  curve?: 'linear' | 'smooth';
  /** Custom color override */
  color?: string;
  /** Show grid lines */
  showGrid?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ChartArea Component
 * 
 * Renders a responsive area chart with theme-aware colors and soft gradient fills.
 * Ideal for displaying cumulative trends and time-series data.
 * 
 * @param data - Array of { label, value } objects
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param height - Chart height (sm, md, lg, full)
 * @param gradient - Whether to show gradient fill (default: true)
 * @param curve - Line curve type (linear or smooth)
 * @param color - Custom color override
 * @param showGrid - Whether to show grid lines (default: true)
 */
export function ChartArea({
  data,
  title,
  subtitle,
  height = 'md',
  gradient = true,
  curve = 'smooth',
  color,
  showGrid = true,
}: ChartAreaProps): JSX.Element {
  const chartHeight = heightMap[height] || heightMap.md;
  const curveType = curve === 'smooth' ? 'monotone' : 'linear';
  const areaColor = color || CHART_COLORS[0];
  
  // Normalize and validate data
  const validData = normalizeChartData(data);
  
  // Handle empty data
  if (validData.length === 0) {
    return (
      <div className="chart-block chart-area">
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
  
  // Unique gradient ID for this component instance
  const gradientId = `areaGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="chart-block chart-area">
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart
          data={validData}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          {/* Gradient Definition */}
          {gradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={areaColor} 
                  stopOpacity={0.8}
                />
                <stop 
                  offset="95%" 
                  stopColor={areaColor} 
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
          )}
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray={gridStyle.strokeDasharray}
              stroke={gridStyle.stroke}
              vertical={gridStyle.vertical}
            />
          )}
          
          <XAxis 
            dataKey="label" 
            tick={axisStyle.tick}
            axisLine={axisStyle.axisLine}
            tickLine={axisStyle.tickLine}
          />
          <YAxis 
            tick={axisStyle.tick}
            axisLine={false}
            tickLine={axisStyle.tickLine}
          />
          
          <Tooltip
            contentStyle={tooltipStyle.contentStyle}
            labelStyle={tooltipStyle.labelStyle}
            itemStyle={tooltipStyle.itemStyle}
          />
          
          <Area
            type={curveType}
            dataKey="value"
            stroke={areaColor}
            strokeWidth={2}
            fill={gradient ? `url(#${gradientId})` : areaColor}
            fillOpacity={gradient ? 1 : 0.7}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
