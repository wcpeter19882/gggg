'use client';

/**
 * Chart components using Recharts + Custom SVG
 * 
 * Data Charts: Line, Bar, Column, Pie, Area (using Recharts)
 * Business Graphics: Venn, Pyramid, Funnel (custom SVG)
 */

import React from 'react';
import dynamic from 'next/dynamic';
import styles from './Charts.module.css';
import { useSlideTheme } from '../core/ThemeContext';

// ============================================================
// RECHARTS-BASED DATA CHARTS
// ============================================================

const RechartsLine = dynamic(
  () => import('recharts').then(mod => {
    const { LineChart, Line: RLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return function LineWrapper({ data, xField, yField, height = 300 }: any) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xField} stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
            <RLine type="monotone" dataKey={yField} stroke="#1890ff" strokeWidth={2} dot={{ fill: '#1890ff' }} />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

const RechartsBar = dynamic(
  () => import('recharts').then(mod => {
    const { BarChart, Bar: RBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = mod;
    return function BarWrapper({ data, xField, yField, height = 300, isGroup }: any) {
      if (isGroup && Array.isArray(yField)) {
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey={xField} stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
              <Legend />
              {yField.map((field: string, i: number) => (
                <RBar key={field} dataKey={field} fill={i === 0 ? '#1890ff' : '#52c41a'} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }
      const yFieldName = Array.isArray(yField) ? yField[0] : yField;
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis type="category" dataKey={xField} stroke="rgba(255,255,255,0.6)" fontSize={12} width={80} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
            <RBar dataKey={yFieldName} fill="#1890ff" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

const RechartsColumn = dynamic(
  () => import('recharts').then(mod => {
    const { BarChart, Bar: RBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return function ColumnWrapper({ data, xField, yField, height = 300 }: any) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xField} stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
            <RBar dataKey={yField} fill="#1890ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

const RechartsPie = dynamic(
  () => import('recharts').then(mod => {
    const { PieChart, Pie: RPie, Cell, Tooltip, ResponsiveContainer, Legend } = mod;
    const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
    return function PieWrapper({ data, angleField, colorField, height = 300 }: any) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <RPie data={data} dataKey={angleField} nameKey={colorField} cx="50%" cy="50%" outerRadius={80}
              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}>
              {data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </RPie>
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

const RechartsArea = dynamic(
  () => import('recharts').then(mod => {
    const { AreaChart, Area: RArea, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return function AreaWrapper({ data, xField, yField, height = 300 }: any) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xField} stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
            <RArea type="monotone" dataKey={yField} stroke="#1890ff" fill="url(#areaGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

const RechartsFunnel = dynamic(
  () => import('recharts').then(mod => {
    const { FunnelChart, Funnel: RFunnel, Cell, Tooltip, ResponsiveContainer, LabelList } = mod;
    const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
    return function FunnelWrapper({ data, xField, yField, height = 300 }: any) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <FunnelChart>
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
            <RFunnel dataKey={yField} nameKey={xField} data={data} isAnimationActive>
              <LabelList position="right" fill="#fff" stroke="none" dataKey={xField} />
              {data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </RFunnel>
          </FunnelChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

const RechartsRadar = dynamic(
  () => import('recharts').then(mod => {
    const { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar: RRadar, ResponsiveContainer, Tooltip } = mod;
    return function RadarWrapper({ data, xField, yField, height = 300 }: any) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.2)" />
            <PolarAngleAxis dataKey={xField} stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <PolarRadiusAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }} />
            <RRadar dataKey={yField} stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

// Scatter Chart with Quadrant Support (BCG Matrix, Priority Matrix, etc.)
// Uses autoFit like @ant-design/charts - sizes to container
const RechartsScatter = dynamic(
  () => import('recharts').then(mod => {
    const { ScatterChart, Scatter: RScatter, XAxis, YAxis, Tooltip, ReferenceLine, Cell, ZAxis } = mod;
    const { useState, useEffect, useRef } = require('react');
    const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
    
    return function ScatterWrapper({ 
      data, 
      xField = 'x', 
      yField = 'y', 
      labelField = 'label',
      xLabel = 'X Axis', 
      yLabel = 'Y Axis',
      quadrantLabels = ['Low Priority', 'Quick Wins', 'Major Projects', 'Strategic'],
      width,   // optional fixed width
      height,  // optional fixed height
      autoFit = true  // auto-size to container (default)
    }: any) {
      const containerRef = useRef<HTMLDivElement>(null);
      const [dimensions, setDimensions] = useState({ width: width || 800, height: height || 500 });
      
      useEffect(() => {
        if (!autoFit || (width && height)) return; // Skip if fixed size provided
        if (!containerRef.current) return;
        
        const updateDimensions = () => {
          const container = containerRef.current;
          if (!container) return;
          
          const rect = container.getBoundingClientRect();
          const newWidth = width || Math.round(rect.width) || 800;
          const newHeight = height || Math.round(rect.height) || 500;
          
          if (newWidth > 0 && newHeight > 0) {
            setDimensions({ width: newWidth, height: newHeight });
          }
        };
        
        updateDimensions();
        
        const observer = new ResizeObserver(updateDimensions);
        observer.observe(containerRef.current);
        
        return () => observer.disconnect();
      }, [autoFit, width, height]);
      
      const chartWidth = width || dimensions.width;
      const chartHeight = height || dimensions.height;
      
      // Map data to include color index
      const chartData = data.map((item: any, index: number) => ({
        ...item,
        z: 800, // Larger dots
        fill: item.color || COLORS[index % COLORS.length]
      }));
      
      // Scale font sizes based on chart size - use larger base sizes
      const scale = Math.min(chartWidth / 700, chartHeight / 450);
      const axisStyle = { fill: '#555', fontSize: Math.max(14, Math.round(18 * scale)) };
      const quadrantLabelStyle = { fill: '#666', fontSize: Math.max(14, Math.round(16 * scale)), fontWeight: 600 as const };
      const dotLabelSize = Math.max(14, Math.round(16 * scale));
      const dotSize = Math.max(400, Math.round(500 * scale));
      
      // Chart margins
      const margin = { top: 50, right: 40, bottom: 60, left: 80 };
      const plotWidth = chartWidth - margin.left - margin.right;
      const plotHeight = chartHeight - margin.top - margin.bottom;
      
      return (
        <div 
          ref={containerRef} 
          style={{ 
            width: width ? width : '100%', 
            height: height ? height : '100%',
            minHeight: 300,
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div style={{ position: 'relative', width: chartWidth, height: chartHeight }}>
            {/* Quadrant background colors */}
            <svg style={{ position: 'absolute', top: margin.top, left: margin.left, width: plotWidth, height: plotHeight, zIndex: 0 }}>
              <rect x="0" y="0" width="50%" height="50%" fill="rgba(250, 173, 20, 0.1)" />
              <rect x="50%" y="0" width="50%" height="50%" fill="rgba(82, 196, 26, 0.1)" />
              <rect x="0" y="50%" width="50%" height="50%" fill="rgba(200, 200, 200, 0.1)" />
              <rect x="50%" y="50%" width="50%" height="50%" fill="rgba(24, 144, 255, 0.1)" />
            </svg>
            
            {/* Quadrant labels */}
            <div style={{ position: 'absolute', top: margin.top + 10, left: margin.left + 10, ...quadrantLabelStyle }}>{quadrantLabels[3]}</div>
            <div style={{ position: 'absolute', top: margin.top + 10, right: margin.right + 10, ...quadrantLabelStyle, textAlign: 'right' as const }}>{quadrantLabels[2]}</div>
            <div style={{ position: 'absolute', bottom: margin.bottom + 10, left: margin.left + 10, ...quadrantLabelStyle }}>{quadrantLabels[0]}</div>
            <div style={{ position: 'absolute', bottom: margin.bottom + 10, right: margin.right + 10, ...quadrantLabelStyle, textAlign: 'right' as const }}>{quadrantLabels[1]}</div>
            
            <ScatterChart width={chartWidth} height={chartHeight} margin={margin}>
              <XAxis 
                type="number" 
                dataKey={xField} 
                domain={[0, 100]} 
                tickCount={5}
                stroke="#999" 
                fontSize={14}
                axisLine={{ stroke: '#999' }}
                tickLine={{ stroke: '#999' }}
              />
              <YAxis 
                type="number" 
                dataKey={yField} 
                domain={[0, 100]} 
                tickCount={5}
                stroke="#999" 
                fontSize={14}
                axisLine={{ stroke: '#999' }}
                tickLine={{ stroke: '#999' }}
              />
              <ZAxis type="number" dataKey="z" range={[dotSize, dotSize]} />
              {/* Quadrant dividers at 50% */}
              <ReferenceLine x={50} stroke="#aaa" strokeWidth={1.5} strokeDasharray="6 4" />
              <ReferenceLine y={50} stroke="#aaa" strokeWidth={1.5} strokeDasharray="6 4" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(value: any, name: any) => [value, name === xField ? xLabel : yLabel]}
                labelFormatter={() => ''}
              />
              <RScatter data={chartData} shape="circle">
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RScatter>
            </ScatterChart>
            
            {/* Axis labels */}
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', ...axisStyle, fontWeight: 600 }}>
              {xLabel}
            </div>
            <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'rotate(-90deg) translateX(-50%)', transformOrigin: 'left center', ...axisStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {yLabel}
            </div>
            
            {/* Data point labels */}
            {chartData.map((item: any, index: number) => {
              const xPos = margin.left + ((item[xField] / 100) * plotWidth);
              const yPos = margin.top + ((1 - item[yField] / 100) * plotHeight);
              return (
                <div 
                  key={index}
                  style={{
                    position: 'absolute',
                    left: xPos,
                    top: yPos - Math.round(32 * scale),
                    transform: 'translateX(-50%)',
                    fontSize: dotLabelSize,
                    fontWeight: 700,
                    color: item.fill,
                    textShadow: '0 0 6px #fff, 0 0 6px #fff, 0 0 6px #fff, 0 0 6px #fff',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {item[labelField]}
                </div>
              );
            })}
          </div>
        </div>
      );
    };
  }),
  { ssr: false, loading: () => <div className={styles.loading}>Loading...</div> }
);

// ============================================================
// CUSTOM SVG BUSINESS GRAPHICS
// ============================================================

// Venn Diagram (2-3 circles with overlap)
// Enhanced version: uses theme colors, larger size, better visual hierarchy
interface VennItem { sets: string[]; size: number; label?: string }
export interface VennChartProps {
  data: VennItem[];
  height?: number;
  className?: string;
}

// Helper: convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export function Venn({ data = [], height = 550, className = '' }: VennChartProps) {
  const theme = useSlideTheme();
  const textColor = theme.colors.text;
  
  // Use theme colors for circles
  const themeColors = [
    theme.colors.primary,
    theme.colors.success || theme.colors.secondary,
    theme.colors.accent || theme.colors.warning
  ];
  
  // Typography sizing - larger for better readability
  const labelSize = Math.round(parseInt(theme.typography.sizeCaption) * 1.25); // ~40px
  const smallSize = Math.round(parseInt(theme.typography.sizeCaption) * 1.1); // ~35px
  
  const sets = [...new Set(data.filter(d => d.sets.length === 1).map(d => d.sets[0]))];
  
  // Circle radius - LARGER for more presence
  const radius = 240;
  
  // Positions for 2 or 3 circles - OVERLAPPING layout
  // SMALLER offset = MORE overlap
  const overlapOffset = 105;
  
  // Center of the diagram
  const centerX = 400;
  const centerY = 340;
  
  // Two circles: side by side with overlap
  // Three circles: triangle arrangement with significant overlap
  const cx = sets.length === 2 
    ? [centerX - 120, centerX + 120] 
    : [centerX - overlapOffset, centerX + overlapOffset, centerX];
  const cy = sets.length === 2 
    ? [centerY, centerY] 
    : [centerY - overlapOffset * 0.6, centerY - overlapOffset * 0.6, centerY + overlapOffset * 0.95];
  
  // Label positions - inside each circle, positioned away from center intersection
  const labelX = sets.length === 2 
    ? [cx[0] - 90, cx[1] + 90] 
    : [cx[0] - 100, cx[1] + 100, cx[2]];
  const labelY = sets.length === 2 
    ? [cy[0], cy[1]] 
    : [cy[0] - 90, cy[1] - 90, cy[2] + 120];
  
  // Generate unique gradient IDs
  const gradientIds = sets.map((_, i) => `venn-gradient-${i}-${Math.random().toString(36).slice(2, 8)}`);
  
  // Filter overlaps: only show those with explicit labels (not auto-generated)
  const overlapsWithLabels = data.filter(d => d.sets.length > 1 && d.label);
  
  return (
    <div className={`${styles.chart} ${className}`} style={{ height, minHeight: 400 }}>
      <svg viewBox="0 0 800 680" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
        {/* Gradient definitions for depth effect */}
        <defs>
          {sets.slice(0, 3).map((_, i) => (
            <radialGradient key={gradientIds[i]} id={gradientIds[i]} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor={hexToRgba(themeColors[i], 0.6)} />
              <stop offset="100%" stopColor={hexToRgba(themeColors[i], 0.3)} />
            </radialGradient>
          ))}
          {/* Drop shadow filter */}
          <filter id="venn-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.12" />
          </filter>
        </defs>
        
        {/* Draw circles with gradients and shadows */}
        {sets.slice(0, 3).map((set, i) => (
          <g key={set}>
            <circle 
              cx={cx[i]} 
              cy={cy[i]} 
              r={radius} 
              fill={`url(#${gradientIds[i]})`}
              stroke={themeColors[i]}
              strokeWidth={2.5}
              filter="url(#venn-shadow)"
              style={{ mixBlendMode: 'multiply' }}
            />
            {/* Circle label - INSIDE the circle, away from center */}
            <text 
              x={labelX[i]} 
              y={labelY[i]} 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill={textColor} 
              fontSize={labelSize} 
              fontWeight="700"
            >
              {set}
            </text>
          </g>
        ))}
        
        {/* Overlap labels - only show if explicit label provided */}
        {overlapsWithLabels.map((overlap, i) => {
          // Calculate position based on which sets overlap
          let x = centerX, y = centerY;
          
          if (sets.length === 3) {
            const overlapSets = overlap.sets;
            
            if (overlapSets.length === 3) {
              // Triple overlap - center of all three
              x = centerX;
              y = centerY + 15;
            } else if (overlapSets.length === 2) {
              const setIndices = overlapSets.map(s => sets.indexOf(s));
              
              if (setIndices.includes(0) && setIndices.includes(1)) {
                // Left ∩ Right - top center
                x = centerX;
                y = centerY - 70;
              } else if (setIndices.includes(0) && setIndices.includes(2)) {
                // Left ∩ Bottom - bottom left
                x = centerX - 75;
                y = centerY + 60;
              } else if (setIndices.includes(1) && setIndices.includes(2)) {
                // Right ∩ Bottom - bottom right
                x = centerX + 75;
                y = centerY + 60;
              }
            }
          }
          
          return (
            <text 
              key={i} 
              x={x} 
              y={y} 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill={textColor} 
              fontSize={smallSize} 
              fontWeight="600"
              style={{ 
                textShadow: '0 0 10px rgba(255,255,255,1), 0 0 10px rgba(255,255,255,1)',
                letterSpacing: '-0.01em'
              }}
            >
              {overlap.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Pyramid Chart
interface PyramidItem { label: string; value: number; color?: string }
export interface PyramidChartProps {
  data: PyramidItem[];
  height?: number;
  className?: string;
}

export function Pyramid({ data = [], height = 500, className = '' }: PyramidChartProps) {
  const theme = useSlideTheme();
  const baseFontSize = parseInt(theme.typography.sizeCaption); // 32px base
  
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  const total = data.length;
  const layerHeight = Math.min(100, 350 / total); // Adaptive height
  const startY = 30;
  const svgWidth = 700;
  const svgHeight = startY + total * layerHeight + 40;
  
  return (
    <div className={`${styles.chart} ${className}`} style={{ height, minHeight: 350 }}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%' }}>
        {data.map((item, i) => {
          // Ensure minimum width of 280px for bottom layer so text fits
          const widthPercent = ((total - i) / total);
          const minWidth = 300;
          const maxWidth = svgWidth - 60;
          const width = Math.max(minWidth, maxWidth * widthPercent);
          const x = (svgWidth - width) / 2;
          const y = startY + i * layerHeight;
          
          // Smaller font for longer labels
          const labelLen = item.label?.length || 0;
          const fontSize = labelLen > 15 ? baseFontSize - 6 : baseFontSize;
          
          return (
            <g key={i}>
              <path
                d={`M ${x} ${y} L ${x + width} ${y} L ${x + width - 25} ${y + layerHeight - 6} L ${x + 25} ${y + layerHeight - 6} Z`}
                fill={item.color || COLORS[i % COLORS.length]}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={2}
              />
              <text x={svgWidth / 2} y={y + layerHeight / 2 + fontSize / 3} textAnchor="middle" fill="#fff" fontSize={fontSize} fontWeight="700">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// EXPORT WRAPPERS
// ============================================================

interface BaseChartProps { className?: string; height?: number; }

export interface LineChartProps extends BaseChartProps {
  data: Array<Record<string, any>>; xField: string; yField: string; [key: string]: any;
}
export function Line({ className = '', height = 300, data = [], xField, yField }: LineChartProps) {
  return <div className={`${styles.chart} ${className}`}><RechartsLine data={data} xField={xField} yField={yField} height={height} /></div>;
}

export interface BarChartProps extends BaseChartProps {
  data: Array<Record<string, any>>; xField: string; yField: string | string[]; isGroup?: boolean; [key: string]: any;
}
export function Bar({ className = '', height = 300, data = [], xField, yField, isGroup }: BarChartProps) {
  return <div className={`${styles.chart} ${className}`}><RechartsBar data={data} xField={xField} yField={yField} height={height} isGroup={isGroup} /></div>;
}

export interface ColumnChartProps extends BaseChartProps {
  data: Array<Record<string, any>>; xField: string; yField: string; [key: string]: any;
}
export function Column({ className = '', height = 300, data = [], xField, yField }: ColumnChartProps) {
  return <div className={`${styles.chart} ${className}`}><RechartsColumn data={data} xField={xField} yField={yField} height={height} /></div>;
}

export interface PieChartProps extends BaseChartProps {
  data: Array<Record<string, any>>; angleField: string; colorField: string; [key: string]: any;
}
export function Pie({ className = '', height = 300, data = [], angleField, colorField }: PieChartProps) {
  return <div className={`${styles.chart} ${className}`}><RechartsPie data={data} angleField={angleField} colorField={colorField} height={height} /></div>;
}

export interface AreaChartProps extends BaseChartProps {
  data: Array<Record<string, any>>; xField: string; yField: string; [key: string]: any;
}
export function Area({ className = '', height = 300, data = [], xField, yField }: AreaChartProps) {
  return <div className={`${styles.chart} ${className}`}><RechartsArea data={data} xField={xField} yField={yField} height={height} /></div>;
}

export interface FunnelChartProps extends BaseChartProps {
  data: Array<Record<string, any>>; xField: string; yField: string; [key: string]: any;
}
export function Funnel({ className = '', height = 300, data = [], xField, yField }: FunnelChartProps) {
  return <div className={`${styles.chart} ${className}`}><RechartsFunnel data={data} xField={xField} yField={yField} height={height} /></div>;
}

export interface RadarChartProps extends BaseChartProps {
  data: Array<Record<string, any>>; xField: string; yField: string; [key: string]: any;
}
export function Radar({ className = '', height = 300, data = [], xField, yField }: RadarChartProps) {
  return <div className={`${styles.chart} ${className}`}><RechartsRadar data={data} xField={xField} yField={yField} height={height} /></div>;
}

// Scatter Chart with Quadrant Support
// API compatible with @ant-design/charts: width, height, autoFit
export interface ScatterChartProps {
  data: Array<{ label: string; x: number; y: number; color?: string }>;
  xField?: string;
  yField?: string;
  labelField?: string;
  xLabel?: string;
  yLabel?: string;
  quadrantLabels?: [string, string, string, string]; // [bottomLeft, bottomRight, topLeft, topRight]
  width?: number;    // Fixed width in pixels
  height?: number;   // Fixed height in pixels
  autoFit?: boolean; // Auto-size to container (default: true)
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}
export function Scatter({ 
  className = '', 
  style,
  width,
  height,
  autoFit = true,
  data = [], 
  xField = 'x', 
  yField = 'y', 
  labelField = 'label',
  xLabel = 'X Axis', 
  yLabel = 'Y Axis',
  quadrantLabels = ['Low Priority', 'Quick Wins', 'Major Projects', 'Strategic']
}: ScatterChartProps) {
  return (
    <div className={`${styles.chart} ${className}`} style={style}>
      <RechartsScatter 
        data={data} 
        xField={xField} 
        yField={yField} 
        labelField={labelField}
        xLabel={xLabel} 
        yLabel={yLabel}
        quadrantLabels={quadrantLabels}
        width={width}
        height={height}
        autoFit={autoFit}
      />
    </div>
  );
}

// Export all
export const Charts = { Line, Bar, Column, Pie, Area, Funnel, Venn, Pyramid, Radar, Scatter };
export default Charts;
