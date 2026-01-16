'use client';

/**
 * ChartBubble Component (L2 Block)
 * 
 * Semantic bubble/scatter chart component using Recharts.
 * Displays data with three dimensions: x position, y position, and bubble size.
 * Automatically styled with translucent bubbles and earthy color palette.
 * 
 * Usage:
 * ```mdx
 * <ChartBubble 
 *   title="Market Analysis"
 *   data={[
 *     { label: "Product A", x: 10, y: 20, size: 100 },
 *     { label: "Product B", x: 30, y: 45, size: 200 },
 *     { label: "Product C", x: 50, y: 15, size: 150 }
 *   ]}
 *   xLabel="Price"
 *   yLabel="Sales"
 * />
 * ```
 */

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartDataPoint, Size } from '@/utils/types';
import { 
  CHART_COLORS, 
  getChartColor,
  sizeMap,
  prepareBubbleData,
  tooltipStyle,
  axisStyle,
  gridStyle,
} from './chartUtils';

// =============================================================================
// Types
// =============================================================================

export interface ChartBubbleProps {
  /** Chart data points with x, y, size values */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart size */
  size?: Size;
  /** X-axis label */
  xLabel?: string;
  /** Y-axis label */
  yLabel?: string;
  /** Custom colors array */
  colors?: string[];
  /** Show grid lines */
  showGrid?: boolean;
  /** Bubble size range [min, max] */
  sizeRange?: [number, number];
}

// =============================================================================
// Component
// =============================================================================

/**
 * ChartBubble Component
 * 
 * Renders a responsive bubble chart with translucent bubbles.
 * Ideal for displaying relationships between three variables.
 * 
 * @param data - Array of { label, x, y, size } objects
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param size - Chart size (sm, md, lg, full)
 * @param xLabel - Label for X axis
 * @param yLabel - Label for Y axis
 * @param colors - Custom color palette
 * @param showGrid - Whether to show grid lines (default: true)
 * @param sizeRange - Min/max bubble size range (default: [20, 400])
 */
export function ChartBubble({
  data,
  title,
  subtitle,
  size = 'md',
  xLabel,
  yLabel,
  colors,
  showGrid = true,
  sizeRange = [20, 400],
}: ChartBubbleProps): JSX.Element {
  const chartSize = sizeMap[size] || sizeMap.md;
  
  // Prepare and validate bubble data
  const bubbleData = prepareBubbleData(data);
  
  // Handle empty data
  if (bubbleData.length === 0) {
    return (
      <div className="chart-block chart-bubble">
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
  
  // Custom tooltip for bubble chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          ...tooltipStyle.contentStyle,
          padding: '8px 12px',
        }}>
          <p style={{ ...tooltipStyle.labelStyle, fontWeight: 600, margin: 0 }}>
            {data.label}
          </p>
          <p style={{ ...tooltipStyle.itemStyle, margin: '4px 0 0 0', fontSize: '0.875rem' }}>
            {xLabel || 'X'}: {data.x}
          </p>
          <p style={{ ...tooltipStyle.itemStyle, margin: '2px 0 0 0', fontSize: '0.875rem' }}>
            {yLabel || 'Y'}: {data.y}
          </p>
          <p style={{ ...tooltipStyle.itemStyle, margin: '2px 0 0 0', fontSize: '0.875rem' }}>
            Size: {data.size}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="chart-block chart-bubble">
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      <ResponsiveContainer width="100%" height={chartSize}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray={gridStyle.strokeDasharray}
              stroke={gridStyle.stroke}
            />
          )}
          
          <XAxis 
            dataKey="x" 
            type="number"
            name={xLabel || 'X'}
            tick={axisStyle.tick}
            axisLine={axisStyle.axisLine}
            tickLine={axisStyle.tickLine}
            label={xLabel ? { 
              value: xLabel, 
              position: 'insideBottom', 
              offset: -10,
              style: { fill: 'var(--theme-text-muted)', fontSize: 12 }
            } : undefined}
          />
          <YAxis 
            dataKey="y" 
            type="number"
            name={yLabel || 'Y'}
            tick={axisStyle.tick}
            axisLine={false}
            tickLine={axisStyle.tickLine}
            label={yLabel ? { 
              value: yLabel, 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'var(--theme-text-muted)', fontSize: 12 }
            } : undefined}
          />
          <ZAxis 
            dataKey="size" 
            type="number"
            range={sizeRange}
            name="Size"
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter 
            data={bubbleData}
            fillOpacity={0.65}
          >
            {bubbleData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.color || getChartColor(index, colors)}
                stroke={entry.color || getChartColor(index, colors)}
                strokeOpacity={0.9}
                strokeWidth={1.5}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
