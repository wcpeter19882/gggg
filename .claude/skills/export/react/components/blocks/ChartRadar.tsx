'use client';

/**
 * ChartRadar Component (L2 Block)
 * 
 * Semantic radar/spider chart component using Recharts.
 * Displays multivariate data across multiple axes.
 * Automatically styled with soft fill opacity and earthy color palette.
 * 
 * Usage:
 * ```mdx
 * <ChartRadar 
 *   title="Product Comparison"
 *   data={[
 *     { label: "Performance", value: 80 },
 *     { label: "Reliability", value: 90 },
 *     { label: "Cost", value: 65 },
 *     { label: "Features", value: 75 },
 *     { label: "Support", value: 85 }
 *   ]}
 *   fillOpacity={0.35}
 * />
 * ```
 */

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ChartDataPoint, Size } from '@/utils/types';
import { 
  CHART_COLORS, 
  sizeMap,
  prepareRadarData,
  tooltipStyle,
} from './chartUtils';

// =============================================================================
// Types
// =============================================================================

export interface ChartRadarProps {
  /** Chart data points - each point is an axis */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart size */
  size?: Size;
  /** Fill opacity (0-1) for soft fill effect */
  fillOpacity?: number;
  /** Show dots at data points */
  showDots?: boolean;
  /** Custom color override */
  color?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ChartRadar Component
 * 
 * Renders a responsive radar/spider chart with soft fill and theme-aware colors.
 * Ideal for comparing items across multiple dimensions.
 * 
 * @param data - Array of { label, value } objects (minimum 3 points)
 * @param title - Optional chart title
 * @param subtitle - Optional chart subtitle
 * @param size - Chart size (sm, md, lg, full)
 * @param fillOpacity - Fill opacity for the radar polygon (default: 0.35)
 * @param showDots - Whether to show dots at data points (default: true)
 * @param color - Custom color override
 */
export function ChartRadar({
  data,
  title,
  subtitle,
  size = 'md',
  fillOpacity = 0.35,
  showDots = true,
  color,
}: ChartRadarProps): JSX.Element {
  const chartSize = sizeMap[size] || sizeMap.md;
  const radarColor = color || CHART_COLORS[1]; // Sage green for radar
  
  // Prepare and validate radar data (needs minimum 3 points)
  const radarData = prepareRadarData(data);
  
  // Handle insufficient data - need at least 3 points for radar
  if (radarData.length < 3) {
    return (
      <div className="chart-block chart-radar">
        {(title || subtitle) && (
          <div className="block-header">
            {title && <h3 className="block-title">{title}</h3>}
            {subtitle && <p className="block-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="chart-empty-state">
          {data && data.length > 0 
            ? 'Radar chart requires at least 3 data points' 
            : 'No data available'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="chart-block chart-radar">
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      <ResponsiveContainer width="100%" height={chartSize}>
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="80%" 
          data={radarData}
        >
          <PolarGrid 
            stroke="var(--theme-border)"
            strokeOpacity={0.6}
          />
          <PolarAngleAxis 
            dataKey="label"
            tick={{ 
              fill: 'var(--theme-text-muted)', 
              fontSize: 12 
            }}
          />
          <PolarRadiusAxis 
            angle={30}
            domain={[0, 'auto']}
            tick={{ 
              fill: 'var(--theme-text-muted)', 
              fontSize: 10 
            }}
            axisLine={false}
          />
          
          <Tooltip
            contentStyle={tooltipStyle.contentStyle}
            labelStyle={tooltipStyle.labelStyle}
            itemStyle={tooltipStyle.itemStyle}
          />
          
          <Radar
            name="Value"
            dataKey="value"
            stroke={radarColor}
            strokeWidth={2}
            fill={radarColor}
            fillOpacity={fillOpacity}
            dot={showDots ? { 
              r: 4, 
              fill: radarColor,
              strokeWidth: 2,
              stroke: 'var(--theme-surface)'
            } : false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
