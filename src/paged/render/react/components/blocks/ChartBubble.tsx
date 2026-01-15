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

// Gradient color pairs for bubbles [start, end]
const GRADIENT_COLORS = [
  { start: '#667eea', end: '#764ba2' },  // Purple-violet
  { start: '#a18cd1', end: '#fbc2eb' },  // Purple-pink light
  { start: '#43e97b', end: '#38f9d7' },  // Green-teal
  { start: '#fa709a', end: '#fee140' },  // Pink-yellow
  { start: '#a8edea', end: '#fed6e3' },  // Teal-pink light
  { start: '#ff9a9e', end: '#fecfef' },  // Salmon-pink
];

// Axis arrow color
const AXIS_COLOR = '#6b7280';

// Base bubble size ranges (will be scaled based on chart size)
const DATA_BUBBLE_SIZE_RANGE: [number, number] = [100, 600];  // Smaller for data viz

/**
 * Calculate bubble size range based on chart dimensions
 * For positioning mode, bubbles should fit within chart area without overflow
 * We use bubbles at 8-12% of chart dimension for good visibility
 */
const calculateBubbleSizeRange = (width: number, height: number, bubbleCount: number): [number, number] => {
  const minDimension = Math.min(width, height);
  // Target bubble diameter: 8-12% of chart for positioning maps
  // Adjust based on number of bubbles to prevent overlap
  const scaleFactor = Math.max(0.5, 1 - (bubbleCount - 2) * 0.1); // Reduce size if many bubbles
  const targetDiameter = minDimension * 0.10 * scaleFactor;
  // ZAxis range is area (πr²), so we need to convert diameter to area
  const minArea = Math.PI * Math.pow(targetDiameter * 0.65, 2);
  const maxArea = Math.PI * Math.pow(targetDiameter * 0.95, 2);
  return [Math.round(minArea), Math.round(maxArea)];
};

/**
 * Calculate domain padding based on bubble size to prevent overflow
 * Returns padding as percentage to add to domain bounds
 */
const calculateDomainPadding = (bubbleCount: number): number => {
  // Add 10-15% padding to domain to accommodate bubble radius
  return Math.max(10, 15 - bubbleCount);
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
 * Generate a unique gradient ID for each bubble
 */
const generateGradientId = (index: number) => `bubble-gradient-${index}`;

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
  
  // Track container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    };
    
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
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

  // Generate gradient IDs
  const gradientIds = React.useMemo(
    () => bubbleData.map((_, i) => generateGradientId(i)),
    [bubbleData.length]
  );
  
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
  
  return (
    <div ref={containerRef} className="chart-block chart-bubble" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '200px' }}>
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Chart Content */}
      <ResponsiveContainer width="60%" aspect={1.5}>
        <ScatterChart
          margin={{ 
            top: 20, 
            right: 20, 
            bottom: 10, 
            left: 10 
          }}
        >
          {/* Gradient definitions */}
          <defs>
            {bubbleData.map((_, index) => {
              const gradientColor = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
              return (
                <radialGradient
                  key={gradientIds[index]}
                  id={gradientIds[index]}
                  cx="30%"
                  cy="30%"
                  r="70%"
                >
                  <stop offset="0%" stopColor={gradientColor.start} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={gradientColor.end} stopOpacity={0.85} />
                </radialGradient>
              );
            })}

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
              <path d="M0,0 L0,10 L10,5 z" fill={AXIS_COLOR} />
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
              <path d="M0,10 L5,0 L10,10 z" fill={AXIS_COLOR} />
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
            axisLine={{ stroke: AXIS_COLOR, strokeWidth: 2 }}
            tickLine={isPositioningMode ? false : axisStyle.tickLine}
            domain={isPositioningMode ? [-domainPadding, 100 + domainPadding] : ['auto', 'auto']}
            label={xLabel ? { 
              value: xLabel, 
              position: 'insideBottom', 
              offset: isPositioningMode ? 0 : -10,
              style: { fill: AXIS_COLOR, fontSize: 15, fontWeight: 500 }
            } : undefined}
          />
          <YAxis 
            dataKey="y"
            type="number"
            name={yLabel || 'Y'}
            tick={isPositioningMode ? false : axisStyle.tick}
            axisLine={{ stroke: AXIS_COLOR, strokeWidth: 2 }}
            tickLine={isPositioningMode ? false : axisStyle.tickLine}
            domain={isPositioningMode ? [-domainPadding, 100 + domainPadding] : ['auto', 'auto']}
            label={yLabel ? { 
              value: yLabel, 
              angle: -90, 
              position: 'insideButtomLeft',
              offset: isPositioningMode ? 10 : 0,
              style: { fill: AXIS_COLOR, fontSize: 15, fontWeight: 500 }
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
            fillOpacity={1}
          >
            {bubbleData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={`url(#${gradientIds[index]})`}
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
                      fill={AXIS_COLOR}
                    />
                    {/* Y-axis arrow pointing up */}
                    <polygon
                      points={`${yArrowX - 5},${yArrowY} ${yArrowX},${yArrowY - 10} ${yArrowX + 5},${yArrowY}`}
                      fill={AXIS_COLOR}
                    />
                    {/* Bubble labels centered on each bubble */}
                    {points.map((point: any, index: number) => (
                      <text
                        key={`label-${index}`}
                        x={point.cx}
                        y={point.cy}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={600}
                        style={{ 
                          pointerEvents: 'none',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}
                      >
                        {point.payload?.label || ''}
                      </text>
                    ))}
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
