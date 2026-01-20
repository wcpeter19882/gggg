'use client';

/**
 * ChartBubble Component (L2 Block)
 * 
 * Semantic bubble/scatter chart component using Recharts.
 * Displays data with three dimensions: x position, y position, and bubble size.
 * 
 * Two modes:
 * 1. Data Visualization Mode - For actual numeric data with tick marks
 * 2. Positioning Map Mode - For comparing options/strategies (no tick marks, larger bubbles with labels)
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
 *   positioningMap={true}  // Enable positioning map mode
 * />
 * ```
 */

import React, { useRef, useState, useEffect } from 'react';
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
  Customized,
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
// Constants
// =============================================================================

// Fallback solid colors for bubbles - used when theme colors unavailable
const FALLBACK_BUBBLE_COLORS = [
  '#3b82f6',  // Blue (primary-like)
  '#10b981',  // Green (success-like)
  '#f59e0b',  // Amber (warning-like)
  '#06b6d4',  // Cyan (info-like)
  '#8b5cf6',  // Purple (accent-like)
  '#ef4444',  // Red (danger-like)
];

// Theme-aware color CSS variable names
// These will be resolved at runtime from the theme
const THEME_COLOR_KEYS = [
  '--theme-primary',
  '--theme-warning',
  '--theme-success',
  '--theme-info',
  '--theme-accent',
  '--theme-danger',
];

// Base bubble size ranges (will be scaled based on chart size)
const DATA_BUBBLE_SIZE_RANGE: [number, number] = [100, 600];  // Smaller for data viz

/**
 * Calculate bubble size range based on chart dimensions
 * For positioning mode, bubbles should fill the chart nicely without overlapping or overflowing
 * We calculate based on available space and number of bubbles
 */
const calculateBubbleSizeRange = (width: number, height: number, bubbleCount: number): [number, number] => {
  const minDimension = Math.min(width, height);
  
  // For positioning maps, calculate size based on number of bubbles
  // With well-spread bubbles, each can be larger; more bubbles = smaller each
  // Base: 15-18% of chart dimension for 2 bubbles, scaling down for more
  const baseDiameterPercent = 0.15;
  const scaleFactor = Math.max(0.5, 1 - (bubbleCount - 2) * 0.15);
  const targetDiameter = minDimension * baseDiameterPercent * scaleFactor;
  
  // ZAxis range is area (πr²), so we need to convert diameter to area
  const minArea = Math.PI * Math.pow(targetDiameter * 0.90, 2);
  const maxArea = Math.PI * Math.pow(targetDiameter * 1.0, 2);
  return [Math.round(minArea), Math.round(maxArea)];
};

/**
 * Calculate domain padding based on bubble size to prevent overflow
 * Returns padding as percentage to add to domain bounds
 * Padding should be at least half the bubble diameter to prevent clipping at edges
 */
const calculateDomainPadding = (bubbleCount: number): number => {
  // Base bubble diameter is 15% of chart, so we need ~10% padding (slightly more than radius)
  // Scale down padding slightly for more bubbles since bubbles are smaller
  const basePadding = 12;
  const scaleFactor = Math.max(0.6, 1 - (bubbleCount - 2) * 0.1);
  return Math.round(basePadding * scaleFactor);
};

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
  /** Enable positioning map mode (no ticks, larger bubbles with labels) */
  positioningMap?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Auto-detect if this is a positioning map (relative 0-100 scale)
 */
const isRelativePositioning = (data: any[]): boolean => {
  if (data.length < 2) return false;
  const allInRange = data.every(d => 
    d.x >= 0 && d.x <= 100 && d.y >= 0 && d.y <= 100
  );
  return allInRange;
};

// =============================================================================
// Component
// =============================================================================

/**
 * ChartBubble Component
 * 
 * Renders a responsive bubble chart with gradient bubbles and optional labels.
 * Ideal for displaying relationships between three variables or comparing options.
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
  sizeRange,
  positioningMap,
}: ChartBubbleProps): JSX.Element {
  const chartSize = sizeMap[size] || sizeMap.md;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [themeColors, setThemeColors] = useState<string[]>(FALLBACK_BUBBLE_COLORS);
  const [axisColor, setAxisColor] = useState('#6b7280');
  
  // Track container dimensions and resolve theme colors
  useEffect(() => {
    const resolveThemeColors = () => {
      if (containerRef.current) {
        // Resolve theme CSS variables to actual colors
        const computedStyle = getComputedStyle(containerRef.current);
        
        // Resolve axis color
        const resolvedAxisColor = computedStyle.getPropertyValue('--theme-text-muted').trim() || '#6b7280';
        setAxisColor(resolvedAxisColor);
        
        // Resolve solid colors from theme
        const resolvedColors = THEME_COLOR_KEYS.map((key, index) => {
          const color = computedStyle.getPropertyValue(key).trim();
          // Fall back to default colors if CSS variables not defined
          if (color) {
            return color;
          }
          return FALLBACK_BUBBLE_COLORS[index % FALLBACK_BUBBLE_COLORS.length];
        });
        setThemeColors(resolvedColors);
      }
    };
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
        resolveThemeColors();
      }
    };
    
    updateDimensions();
    
    // Retry theme resolution after a short delay (theme may be applied after mount)
    const timeoutId = setTimeout(resolveThemeColors, 100);
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);
  
  // Prepare and validate bubble data
  const bubbleData = prepareBubbleData(data);
  
  // Auto-detect positioning map mode
  const isPositioningMode = positioningMap ?? isRelativePositioning(bubbleData);
  
  // Calculate dynamic bubble size range based on chart dimensions
  const dynamicSizeRange = calculateBubbleSizeRange(dimensions.width, dimensions.height, bubbleData.length);
  
  // Calculate domain padding to prevent bubble overflow
  const domainPadding = calculateDomainPadding(bubbleData.length);
  
  // Adjust size range based on mode
  const effectiveSizeRange: [number, number] = sizeRange || 
    (isPositioningMode ? dynamicSizeRange : DATA_BUBBLE_SIZE_RANGE);

  // Determine final bubble colors - prefer explicit colors prop over theme colors
  const effectiveColors = React.useMemo(() => {
    if (colors && colors.length > 0) {
      return colors;
    }
    return themeColors;
  }, [colors, themeColors]);
  
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
          {!isPositioningMode && (
            <>
              <p style={{ ...tooltipStyle.itemStyle, margin: '4px 0 0 0', fontSize: '0.875rem' }}>
                {xLabel || 'X'}: {data.x}
              </p>
              <p style={{ ...tooltipStyle.itemStyle, margin: '2px 0 0 0', fontSize: '0.875rem' }}>
                {yLabel || 'Y'}: {data.y}
              </p>
              <p style={{ ...tooltipStyle.itemStyle, margin: '2px 0 0 0', fontSize: '0.875rem' }}>
                Size: {data.size}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Calculate adaptive font sizes based on chart dimensions
  const minDimension = Math.min(dimensions.width, dimensions.height);
  const titleFontSize = Math.max(14, Math.min(24, minDimension * 0.06));
  const axisLabelFontSize = Math.max(12, Math.min(20, minDimension * 0.05));
  
  return (
    <div ref={containerRef} className="chart-block chart-bubble" style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header" style={{ textAlign: 'center' }}>
          {title && <h3 className="block-title" style={{ fontSize: `${titleFontSize}px`, fontWeight: 600 }}>{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      <ResponsiveContainer width="80%" aspect={1.5}>
        <ScatterChart
          margin={{ 
            top: 20, 
            right: 20, 
            bottom: 10, 
            left: 10 
          }}
        >
          {/* Definitions for axis arrows */}
          <defs>
            {/* Arrow markers for axis ends */}
            <marker
              id="axis-arrow-right"
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,10 L10,5 z" fill={axisColor} />
            </marker>
            <marker
              id="axis-arrow-up"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="10"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,10 L5,0 L10,10 z" fill={axisColor} />
            </marker>
          </defs>

          {showGrid && (
            <CartesianGrid 
              strokeDasharray={gridStyle.strokeDasharray}
              stroke={isPositioningMode ? 'rgba(107, 114, 128, 0.2)' : gridStyle.stroke}
            />
          )}
          
          <XAxis 
            dataKey="x" 
            type="number"
            name={xLabel || 'X'}
            tick={isPositioningMode ? false : axisStyle.tick}
            axisLine={{ stroke: axisColor, strokeWidth: 2 }}
            tickLine={isPositioningMode ? false : axisStyle.tickLine}
            domain={isPositioningMode ? [-domainPadding, 100 + domainPadding] : ['auto', 'auto']}
            label={xLabel ? { 
              value: xLabel, 
              position: 'insideBottom', 
              offset: isPositioningMode ? 0 : -10,
              style: { fill: axisColor, fontSize: axisLabelFontSize, fontWeight: 600 }
            } : undefined}
          />
          <YAxis 
            dataKey="y"
            type="number"
            name={yLabel || 'Y'}
            tick={isPositioningMode ? false : axisStyle.tick}
            axisLine={{ stroke: axisColor, strokeWidth: 2 }}
            tickLine={isPositioningMode ? false : axisStyle.tickLine}
            domain={isPositioningMode ? [-domainPadding, 100 + domainPadding] : ['auto', 'auto']}
            label={yLabel ? { 
              value: yLabel, 
              angle: -90, 
              position: 'insideButtomLeft',
              offset: isPositioningMode ? 10 : 0,
              style: { fill: axisColor, fontSize: axisLabelFontSize, fontWeight: 600 }
            } : undefined}
          />
          <ZAxis 
            dataKey="size" 
            type="number"
            range={effectiveSizeRange}
            name="Size"
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter 
            data={bubbleData}
            fillOpacity={0.9}
          >
            {bubbleData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={effectiveColors[index % effectiveColors.length]}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              />
            ))}
          </Scatter>

          {/* Custom arrows and labels */}
          {isPositioningMode && (
            <Customized
              component={(props: any) => {
                const { xAxisMap, yAxisMap, formattedGraphicalItems } = props;
                if (!xAxisMap || !yAxisMap) return null;
                
                const xAxis = Object.values(xAxisMap)[0] as any;
                const yAxis = Object.values(yAxisMap)[0] as any;
                if (!xAxis || !yAxis) return null;

                // X-axis arrow at the right end
                const xArrowX = xAxis.x + xAxis.width;
                const xArrowY = xAxis.y;

                // Y-axis arrow at the top end  
                const yArrowX = yAxis.x + yAxis.width;
                const yArrowY = yAxis.y;

                // Get bubble positions from formattedGraphicalItems
                const scatterItem = formattedGraphicalItems?.[0];
                const points = scatterItem?.props?.points || [];

                return (
                  <g>
                    {/* X-axis arrow pointing right */}
                    <polygon
                      points={`${xArrowX},${xArrowY - 5} ${xArrowX + 10},${xArrowY} ${xArrowX},${xArrowY + 5}`}
                      fill={axisColor}
                    />
                    {/* Y-axis arrow pointing up */}
                    <polygon
                      points={`${yArrowX - 5},${yArrowY} ${yArrowX},${yArrowY - 10} ${yArrowX + 5},${yArrowY}`}
                      fill={axisColor}
                    />
                    {/* Bubble labels centered on each bubble */}
                    {points.map((point: any, index: number) => {
                      // Calculate font size based on bubble radius
                      // point.size is the ZAxis value, which maps to area in effectiveSizeRange
                      // The actual rendered radius comes from the ZAxis range mapping
                      // Recharts uses the z value to interpolate within the range
                      const bubbleArea = point.z || effectiveSizeRange[0];
                      const bubbleRadius = Math.sqrt(bubbleArea / Math.PI);
                      // Font size should be proportional to radius, roughly 35-45% of diameter for readability
                      const fontSize = Math.max(10, Math.min(24, bubbleRadius * 0.4));
                      
                      return (
                        <text
                          key={`label-${index}`}
                          x={point.cx}
                          y={point.cy}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={fontSize}
                          fontWeight={600}
                          style={{ 
                            pointerEvents: 'none',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }}
                        >
                          {point.payload?.label || ''}
                        </text>
                      );
                    })}
                  </g>
                );
              }}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
