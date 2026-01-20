'use client';

/**
 * BarStats Component (L2 Block)
 * 
 * Horizontal bar chart component for rankings and stats displays.
 * Shows data as horizontal bars with labels and optional value labels.
 * Automatically styled with earthy color palette and gentle emphasis.
 * 
 * Usage:
 * ```mdx
 * <BarStats 
 *   title="Top Products"
 *   data={[
 *     { label: "Product A", value: 95 },
 *     { label: "Product B", value: 87 },
 *     { label: "Product C", value: 76 },
 *     { label: "Product D", value: 65 }
 *   ]}
 *   showLabels={true}
 *   sortDescending={true}
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
  Cell,
  LabelList,
} from 'recharts';
import type { ChartDataPoint, Size } from '@/utils/types';
import { 
  CHART_COLORS, 
  getChartColor,
  heightMap,
  normalizeChartData,
  tooltipStyle,
  axisStyle,
} from './chartUtils';

// =============================================================================
// Types
// =============================================================================

export interface BarStatsProps {
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart height size */
  height?: Size;
  /** Show value labels on bars */
  showLabels?: boolean;
  /** Sort bars in descending order by value */
  sortDescending?: boolean;
  /** Custom colors array */
  colors?: string[];
  /** Use single color for all bars (instead of rotating palette) */
  singleColor?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * BarStats Component
 * 
 * Renders horizontal bar chart ideal for rankings and statistics.
 * Automatically sorts data and displays with gentle emphasis styling.
 * 
 * @param data - Array of { label, value } objects
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param height - Chart height (sm, md, lg, full)
 * @param showLabels - Whether to show value labels on bars (default: true)
 * @param sortDescending - Whether to sort bars by value descending (default: true)
 * @param colors - Custom color palette
 * @param singleColor - Use single color for all bars (default: false)
 */
export function BarStats({
  data,
  title,
  subtitle,
  height = 'md',
  showLabels = true,
  sortDescending = true,
  colors,
  singleColor = false,
}: BarStatsProps): JSX.Element {
  const chartHeight = heightMap[height] || heightMap.md;
  
  // Normalize and validate data
  let validData = normalizeChartData(data);
  
  // Handle empty data
  if (validData.length === 0) {
    return (
      <div className="chart-block chart-bar-stats">
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
  
  // Sort data if requested
  if (sortDescending) {
    validData = [...validData].sort((a, b) => (b.value || 0) - (a.value || 0));
  }
  
  // Calculate dynamic height based on number of items (at least 30px per bar)
  const minBarHeight = 30;
  const dynamicHeight = Math.max(chartHeight, validData.length * minBarHeight + 60);
  
  return (
    <div className="chart-block chart-bar-stats">
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      <ResponsiveContainer width="100%" height={dynamicHeight}>
        <BarChart
          data={validData}
          layout="vertical"
          margin={{ top: 5, right: showLabels ? 60 : 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--theme-border)"
            horizontal={false}
          />
          
          <XAxis 
            type="number"
            tick={axisStyle.tick}
            axisLine={axisStyle.axisLine}
            tickLine={axisStyle.tickLine}
          />
          <YAxis 
            type="category"
            dataKey="label"
            width={100}
            tick={axisStyle.tick}
            axisLine={false}
            tickLine={axisStyle.tickLine}
          />
          
          <Tooltip
            contentStyle={tooltipStyle.contentStyle}
            labelStyle={tooltipStyle.labelStyle}
            itemStyle={tooltipStyle.itemStyle}
            cursor={{ fill: 'var(--theme-border)', opacity: 0.3 }}
          />
          
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            maxBarSize={35}
          >
            {validData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.color || (singleColor 
                  ? getChartColor(0, colors)
                  : getChartColor(index, colors)
                )}
              />
            ))}
            {showLabels && (
              <LabelList 
                dataKey="value" 
                position="right"
                style={{ 
                  fill: 'var(--theme-text-muted)', 
                  fontSize: 12,
                }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
