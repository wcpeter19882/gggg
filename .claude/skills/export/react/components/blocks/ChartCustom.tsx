'use client';

/**
 * ChartCustom Component (L2 Block)
 * 
 * Flexible custom chart component supporting multiple visualization paradigms.
 * Users can specify both the chart type (bar, line, area, pie, scatter) and
 * custom visual styles (shapes, patterns) via natural language descriptions.
 * 
 * Usage:
 * ```mdx
 * // Scatter with custom shapes
 * <ChartCustom 
 *   type="scatter"
 *   shape="water droplet"
 *   data={[{ label: "Jan", value: 100 }, { label: "Feb", value: 150 }]}
 * />
 * 
 * // Bar chart with rounded/pill style
 * <ChartCustom 
 *   type="bar"
 *   style="rounded"
 *   data={[{ label: "A", value: 50 }, { label: "B", value: 80 }]}
 * />
 * 
 * // Pictogram/icon chart
 * <ChartCustom 
 *   type="pictogram"
 *   shape="person"
 *   data={[{ label: "Team A", value: 5 }, { label: "Team B", value: 8 }]}
 * />
 * ```
 */

import React from 'react';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
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
  heightMap, 
  normalizeChartData,
  tooltipStyle,
  axisStyle,
  gridStyle,
} from './chartUtils';

// =============================================================================
// Types
// =============================================================================

export type ChartParadigm = 
  | 'scatter'      // Points with custom shapes
  | 'bar'          // Vertical bars with custom styles
  | 'horizontal-bar' // Horizontal bars
  | 'line'         // Line with custom point shapes
  | 'area'         // Area with custom fill patterns
  | 'pie'          // Pie/donut with custom segments
  | 'pictogram'    // Icon-based chart (repeat shapes for values)
  | 'lollipop'     // Lollipop chart (line + shape)
  | 'bubble'       // Bubble chart variation
  | 'waffle'       // Waffle/grid chart
  | 'radial'       // Radial/circular bar chart
  | 'rose'         // Nightingale rose chart (coxcomb)
  | 'funnel'       // Funnel chart
  | 'gauge'        // Gauge/speedometer chart
  | 'treemap'      // Treemap chart
  | 'unknown'      // Fallback for unrecognized types
  ;

export type BarStyle = 'default' | 'rounded' | 'pill' | 'gradient' | 'striped' | '3d';

export interface ChartCustomProps {
  /** Unique identifier for the chart */
  id?: string;
  /** Chart paradigm/type */
  type?: ChartParadigm;
  /** Shape description for point-based charts */
  shape?: string;
  /** Style variant for bar/area charts */
  style?: BarStyle | string;
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart height size */
  height?: Size;
  /** Color scheme for the visualization */
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'teal' | 'pink' | 'rainbow';
  /** Show grid lines */
  showGrid?: boolean;
  /** Show values on chart */
  showValues?: boolean;
  /** Donut variant for pie charts */
  donut?: boolean;
}

// =============================================================================
// Theme-Aware Color System
// Uses CSS variables that automatically adapt to theme changes
// =============================================================================

/**
 * Get theme colors using CSS variables
 * Falls back to provided colorScheme for multi-color charts (gradients)
 */
function getThemeColors(colorScheme?: string): { 
  primary: string; 
  secondary: string; 
  gradient: string[];
  textMuted: string;
  border: string;
  surface: string;
} {
  // Base theme colors from CSS variables
  const baseColors = {
    primary: 'var(--theme-primary)',
    secondary: 'var(--theme-accent, var(--theme-primary))',
    textMuted: 'var(--theme-text-muted)',
    border: 'var(--theme-border)',
    surface: 'var(--theme-surface)',
  };

  // For multi-color gradients, we use theme-derived colors
  // These use color-mix to create variations from theme colors
  const gradientColors: Record<string, string[]> = {
    // Default: uses theme primary with variations for multi-segment charts
    default: [
      'var(--theme-primary)',
      'color-mix(in srgb, var(--theme-primary) 85%, var(--theme-accent, var(--theme-secondary)))',
      'color-mix(in srgb, var(--theme-primary) 70%, var(--theme-accent, var(--theme-secondary)))',
      'var(--theme-accent, var(--theme-secondary))',
      'color-mix(in srgb, var(--theme-accent, var(--theme-secondary)) 80%, var(--theme-primary))',
      'color-mix(in srgb, var(--theme-accent, var(--theme-secondary)) 60%, var(--theme-primary))',
    ],
    // Rainbow uses semantic colors from theme
    rainbow: [
      'var(--theme-danger, #EF4444)',
      'var(--theme-warning, #F97316)',
      'var(--theme-primary)',
      'var(--theme-success, #22C55E)',
      'var(--theme-accent, #3B82F6)',
      'color-mix(in srgb, var(--theme-primary) 50%, var(--theme-accent))',
    ],
  };

  return {
    ...baseColors,
    gradient: gradientColors[colorScheme || 'default'] || gradientColors.default,
  };
}

// =============================================================================
// Custom Shape Renderers
// =============================================================================

interface CustomShapeProps {
  cx: number;
  cy: number;
  fill: string;
  payload: { label: string; value: number; x: number; y: number };
  size?: number;
}

/**
 * Water Droplet Shape
 */
const WaterDroplet: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 20 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const s = size * scale;
  
  return (
    <svg x={cx - s/2} y={cy - s * 1.2} width={s} height={s * 1.5} overflow="visible">
      <defs>
        <radialGradient id={`droplet-grad-${payload.label}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <path
        d={`M ${s/2} 0 
            Q ${s} ${s * 0.6}, ${s/2} ${s * 1.4}
            Q 0 ${s * 0.6}, ${s/2} 0`}
        fill={`url(#droplet-grad-${payload.label})`}
        stroke={fill}
        strokeWidth="1"
      />
    </svg>
  );
};

/**
 * Star Shape
 */
const Star: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 20 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const s = size * scale;
  const points = 5;
  const outerR = s / 2;
  const innerR = outerR * 0.4;
  
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    path += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
  }
  path += 'Z';
  
  return <path d={path} fill={fill} opacity={0.85} />;
};

/**
 * Heart Shape
 */
const Heart: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 20 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const s = size * scale;
  
  return (
    <svg x={cx - s/2} y={cy - s/2} width={s} height={s} viewBox="0 0 24 24" overflow="visible">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={fill}
        opacity={0.85}
      />
    </svg>
  );
};

/**
 * Cloud Shape
 */
const Cloud: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 24 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const s = size * scale;
  
  return (
    <svg x={cx - s/2} y={cy - s/3} width={s} height={s * 0.7} viewBox="0 0 64 40" overflow="visible">
      <path
        d="M52 28c6.6 0 12-5.4 12-12s-5.4-12-12-12c-1.4 0-2.8.2-4 .7C45.5 2.5 41 0 36 0c-7.7 0-14 5.4-15.5 12.5C18.5 11.5 16 11 14 11 6.3 11 0 17.3 0 25s6.3 14 14 14h38c6.6 0 12-5.4 12-12 0-.4 0-.7-.1-1H52z"
        fill={fill}
        opacity={0.75}
      />
    </svg>
  );
};

/**
 * Flame Shape
 */
const Flame: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 22 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const s = size * scale;
  
  return (
    <svg x={cx - s/2} y={cy - s} width={s} height={s * 1.3} viewBox="0 0 24 32" overflow="visible">
      <defs>
        <linearGradient id={`flame-grad-${payload.label}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>
      </defs>
      <path
        d="M12 0C12 0 4 10 4 18c0 4.4 3.6 8 8 8s8-3.6 8-8C20 10 12 0 12 0zM12 22c-2.2 0-4-1.8-4-4 0-2 2-5 4-8 2 3 4 6 4 8 0 2.2-1.8 4-4 4z"
        fill={`url(#flame-grad-${payload.label})`}
        opacity={0.9}
      />
    </svg>
  );
};

/**
 * Leaf Shape
 */
const Leaf: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 20 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const s = size * scale;
  
  return (
    <svg x={cx - s/2} y={cy - s/2} width={s} height={s} viewBox="0 0 24 24" overflow="visible">
      <path
        d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
        fill={fill}
        opacity={0.85}
      />
    </svg>
  );
};

/**
 * Diamond Shape
 */
const Diamond: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 18 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const s = size * scale;
  
  return (
    <polygon
      points={`${cx},${cy - s/2} ${cx + s/2},${cy} ${cx},${cy + s/2} ${cx - s/2},${cy}`}
      fill={fill}
      opacity={0.85}
    />
  );
};

/**
 * Hexagon Shape
 */
const Hexagon: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 18 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const r = (size * scale) / 2;
  
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
  
  return <polygon points={points} fill={fill} opacity={0.85} />;
};

/**
 * Default Circle Shape
 */
const Circle: React.FC<CustomShapeProps> = ({ cx, cy, fill, payload, size = 16 }) => {
  const scale = Math.max(0.5, Math.min(2, (payload.value || 50) / 100));
  const r = (size * scale) / 2;
  
  return <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.85} />;
};

// =============================================================================
// Shape Registry
// =============================================================================

const shapeRegistry: Record<string, React.FC<CustomShapeProps>> = {
  'water droplet': WaterDroplet,
  'droplet': WaterDroplet,
  'drop': WaterDroplet,
  'star': Star,
  'heart': Heart,
  'love': Heart,
  'cloud': Cloud,
  'flame': Flame,
  'fire': Flame,
  'leaf': Leaf,
  'diamond': Diamond,
  'hexagon': Hexagon,
  'hex': Hexagon,
  'circle': Circle,
  'dot': Circle,
};

/**
 * Get shape component by name (fuzzy matching)
 */
function getShapeComponent(shapeName: string): React.FC<CustomShapeProps> {
  const normalized = shapeName.toLowerCase().trim();
  
  // Direct match
  if (shapeRegistry[normalized]) {
    return shapeRegistry[normalized];
  }
  
  // Partial match
  for (const [key, component] of Object.entries(shapeRegistry)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return component;
    }
  }
  
  // Default to circle
  return Circle;
}

// =============================================================================
// Chart Type Detection from Natural Language
// =============================================================================

/**
 * Parse natural language description to determine chart paradigm
 * Uses keyword matching with fallback to closest match
 */
function parseChartType(description: string): { paradigm: ChartParadigm; confidence: number; originalRequest: string } {
  const desc = description.toLowerCase();
  
  // Keyword to paradigm mapping with confidence scores
  const keywordMap: Array<{ keywords: string[]; paradigm: ChartParadigm; confidence: number }> = [
    // High confidence - exact matches
    { keywords: ['pictogram', 'icon chart', 'isotype'], paradigm: 'pictogram', confidence: 1.0 },
    { keywords: ['lollipop'], paradigm: 'lollipop', confidence: 1.0 },
    { keywords: ['waffle', 'grid chart', 'square chart'], paradigm: 'waffle', confidence: 1.0 },
    { keywords: ['rose', 'nightingale', 'coxcomb', 'polar area', 'flower chart'], paradigm: 'rose', confidence: 1.0 },
    { keywords: ['funnel', 'conversion funnel', 'sales funnel'], paradigm: 'funnel', confidence: 1.0 },
    { keywords: ['gauge', 'speedometer', 'meter', 'dial'], paradigm: 'gauge', confidence: 1.0 },
    { keywords: ['treemap', 'tree map', 'nested rectangles'], paradigm: 'treemap', confidence: 1.0 },
    { keywords: ['radial bar', 'circular bar', 'progress ring', 'progress bar'], paradigm: 'radial', confidence: 1.0 },
    { keywords: ['horizontal bar', 'bar horizontal'], paradigm: 'horizontal-bar', confidence: 1.0 },
    { keywords: ['bubble'], paradigm: 'bubble', confidence: 1.0 },
    
    // Medium confidence - common terms
    { keywords: ['bar', 'column', 'histogram'], paradigm: 'bar', confidence: 0.9 },
    { keywords: ['line', 'trend', 'time series'], paradigm: 'line', confidence: 0.9 },
    { keywords: ['area', 'filled line', 'stream', 'stacked area'], paradigm: 'area', confidence: 0.9 },
    { keywords: ['pie', 'donut', 'doughnut', 'circle chart'], paradigm: 'pie', confidence: 0.9 },
    { keywords: ['scatter', 'point', 'dot plot', 'xy plot'], paradigm: 'scatter', confidence: 0.9 },
    { keywords: ['radial', 'circular', 'ring'], paradigm: 'radial', confidence: 0.7 },
  ];
  
  // Find best match
  let bestMatch: { paradigm: ChartParadigm; confidence: number } = { paradigm: 'unknown', confidence: 0 };
  
  for (const mapping of keywordMap) {
    for (const keyword of mapping.keywords) {
      if (desc.includes(keyword)) {
        if (mapping.confidence > bestMatch.confidence) {
          bestMatch = { paradigm: mapping.paradigm, confidence: mapping.confidence };
        }
      }
    }
  }
  
  // If no match found, try to infer from context
  if (bestMatch.paradigm === 'unknown') {
    // Check for chart-like terms to at least show something
    if (desc.includes('chart') || desc.includes('graph') || desc.includes('visual')) {
      bestMatch = { paradigm: 'bar', confidence: 0.3 }; // Default fallback with low confidence
    }
  }
  
  return { 
    paradigm: bestMatch.paradigm, 
    confidence: bestMatch.confidence,
    originalRequest: description 
  };
}

/**
 * Parse bar style from description
 */
function parseBarStyle(description: string): BarStyle {
  const desc = description.toLowerCase();
  
  if (desc.includes('round') || desc.includes('pill') || desc.includes('capsule')) {
    return 'rounded';
  }
  if (desc.includes('gradient') || desc.includes('fade')) {
    return 'gradient';
  }
  if (desc.includes('stripe') || desc.includes('pattern')) {
    return 'striped';
  }
  if (desc.includes('3d') || desc.includes('shadow') || desc.includes('depth')) {
    return '3d';
  }
  
  return 'default';
}

// =============================================================================
// Paradigm-Specific Renderers
// =============================================================================

interface ParadigmProps {
  data: Array<{ label: string; value: number }>;
  colors: { 
    primary: string; 
    secondary: string; 
    gradient: string[];
    textMuted: string;
    border: string;
    surface: string;
  };
  shape: string;
  style: BarStyle | string;
  showGrid: boolean;
  showValues: boolean;
  donut: boolean;
  ShapeComponent: React.FC<CustomShapeProps>;
}

/**
 * Scatter Chart with Custom Shapes
 * Uses fixed dimensions to avoid ResponsiveContainer sizing issues
 */
const ScatterParadigm: React.FC<ParadigmProps> = ({ data, colors, showGrid, ShapeComponent }) => {
  // Transform data for scatter chart - needs numeric x and y
  const scatterData = data.map((d, i) => ({ 
    ...d, 
    x: i + 1, 
    y: d.value,
  }));
  
  // Custom shape renderer
  const renderShape = (props: any) => {
    const { cx, cy, payload } = props;
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;
    const colorIndex = scatterData.findIndex(d => d.label === payload?.label);
    return (
      <ShapeComponent 
        cx={cx} 
        cy={cy} 
        fill={colors.gradient[Math.max(0, colorIndex) % colors.gradient.length]} 
        payload={payload} 
        size={20} 
      />
    );
  };

  return (
    <ScatterChart 
      width={320} 
      height={200} 
      margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
    >
      {showGrid && <CartesianGrid {...gridStyle} />}
      <XAxis 
        dataKey="x" 
        type="number"
        domain={[0, 'dataMax + 1']}
        tickFormatter={(value) => {
          const item = scatterData.find(d => d.x === value);
          return item?.label || '';
        }}
        {...axisStyle}
      />
      <YAxis 
        dataKey="y" 
        type="number"
        {...axisStyle} 
      />
      <Tooltip 
        content={({ active, payload }) => {
          if (active && payload?.length) {
            const d = payload[0].payload;
            return (
              <div style={tooltipStyle.contentStyle}>
                <p className="font-medium">{d.label}</p>
                <p className="text-sm">Value: {d.value}</p>
              </div>
            );
          }
          return null;
        }} 
      />
      <Scatter 
        data={scatterData} 
        shape={renderShape}
        fill={colors.primary}
      />
    </ScatterChart>
  );
};

/**
 * Bar Chart with Custom Styles
 */
const BarParadigm: React.FC<ParadigmProps & { horizontal?: boolean }> = ({ 
  data, colors, style, showGrid, showValues, horizontal = false 
}) => {
  const radius: [number, number, number, number] = style === 'rounded' || style === 'pill' ? [8, 8, 0, 0] : [0, 0, 0, 0];
  const horizontalRadius: [number, number, number, number] = style === 'rounded' || style === 'pill' ? [0, 8, 8, 0] : [0, 0, 0, 0];
  
  const Chart = horizontal ? BarChart : BarChart;
  
  return (
    <BarChart 
      data={data} 
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 20, right: 30, bottom: 20, left: horizontal ? 80 : 20 }}
    >
      {showGrid && <CartesianGrid {...gridStyle} />}
      {horizontal ? (
        <>
          <XAxis type="number" {...axisStyle} />
          <YAxis dataKey="label" type="category" {...axisStyle} width={70} />
        </>
      ) : (
        <>
          <XAxis dataKey="label" {...axisStyle} />
          <YAxis {...axisStyle} />
        </>
      )}
      <Tooltip contentStyle={tooltipStyle.contentStyle} />
      <Bar 
        dataKey="value" 
        radius={horizontal ? horizontalRadius : radius}
        fill={colors.primary}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors.gradient[index % colors.gradient.length]} />
        ))}
        {showValues && <LabelList dataKey="value" position={horizontal ? 'right' : 'top'} fill={colors.textMuted} />}
      </Bar>
    </BarChart>
  );
};

/**
 * Line Chart with Custom Point Shapes
 */
const LineParadigm: React.FC<ParadigmProps> = ({ data, colors, showGrid, ShapeComponent }) => {
  const renderDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    return <ShapeComponent cx={cx} cy={cy} fill={colors.primary} payload={payload} size={16} />;
  };

  return (
    <LineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
      {showGrid && <CartesianGrid {...gridStyle} />}
      <XAxis dataKey="label" {...axisStyle} />
      <YAxis {...axisStyle} />
      <Tooltip contentStyle={tooltipStyle.contentStyle} />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke={colors.primary}
        strokeWidth={2}
        dot={renderDot}
        activeDot={{ r: 8, fill: colors.secondary }}
      />
    </LineChart>
  );
};

/**
 * Area Chart with Custom Styling
 */
const AreaParadigm: React.FC<ParadigmProps> = ({ data, colors, showGrid, ShapeComponent }) => {
  const gradientId = `area-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <ShapeComponent cx={cx} cy={cy} fill={colors.primary} payload={payload} size={14} />;
  };

  return (
    <AreaChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
          <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      {showGrid && <CartesianGrid {...gridStyle} />}
      <XAxis dataKey="label" {...axisStyle} />
      <YAxis {...axisStyle} />
      <Tooltip contentStyle={tooltipStyle.contentStyle} />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke={colors.primary}
        strokeWidth={2}
        fill={`url(#${gradientId})`}
        dot={renderDot}
      />
    </AreaChart>
  );
};

/**
 * Pie Chart with Custom Styling
 */
const PieParadigm: React.FC<ParadigmProps> = ({ data, colors, showValues, donut }) => {
  return (
    <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="label"
        cx="50%"
        cy="50%"
        innerRadius={donut ? '50%' : 0}
        outerRadius="80%"
        paddingAngle={2}
        label={showValues ? ({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)` : false}
        labelLine={showValues}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors.gradient[index % colors.gradient.length]} />
        ))}
      </Pie>
      <Tooltip contentStyle={tooltipStyle.contentStyle} />
    </PieChart>
  );
};

/**
 * Lollipop Chart (Line + Custom Shape)
 */
const LollipopParadigm: React.FC<ParadigmProps> = ({ data, colors, ShapeComponent }) => {
  return (
    <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, bottom: 20, left: 80 }}>
      <CartesianGrid {...gridStyle} horizontal={false} />
      <XAxis type="number" {...axisStyle} />
      <YAxis dataKey="label" type="category" {...axisStyle} width={70} />
      <Tooltip contentStyle={tooltipStyle.contentStyle} />
      <Bar dataKey="value" fill={colors.primary} barSize={4} radius={[0, 2, 2, 0]}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors.gradient[index % colors.gradient.length]} />
        ))}
      </Bar>
      {/* Custom shapes at end of bars rendered via customized */}
    </BarChart>
  );
};

/**
 * Pictogram/Icon Chart (Repeating shapes)
 */
const PictogramParadigm: React.FC<ParadigmProps> = ({ data, colors, ShapeComponent }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const unitValue = maxValue > 10 ? Math.ceil(maxValue / 10) : 1;
  
  return (
    <div className="flex flex-col gap-4 p-4">
      {data.map((item, rowIndex) => {
        const iconCount = Math.round(item.value / unitValue);
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm w-20 text-right" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</span>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: iconCount }).map((_, i) => (
                <svg key={i} width="24" height="24" viewBox="-12 -12 24 24">
                  <ShapeComponent 
                    cx={0} 
                    cy={0} 
                    fill={colors.gradient[rowIndex % colors.gradient.length]} 
                    payload={{ label: item.label, value: item.value, x: 0, y: 0 }}
                    size={20}
                  />
                </svg>
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{item.value}</span>
          </div>
        );
      })}
      <div className="text-xs mt-2" style={{ color: 'var(--theme-text-muted)' }}>Each icon = {unitValue} unit{unitValue > 1 ? 's' : ''}</div>
    </div>
  );
};

/**
 * Waffle/Grid Chart
 */
const WaffleParadigm: React.FC<ParadigmProps> = ({ data, colors }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const gridSize = 10; // 10x10 = 100 cells
  const cells: Array<{ color: string; label: string }> = [];
  
  data.forEach((item, dataIndex) => {
    const cellCount = Math.round((item.value / total) * 100);
    for (let i = 0; i < cellCount && cells.length < 100; i++) {
      cells.push({ 
        color: colors.gradient[dataIndex % colors.gradient.length],
        label: item.label 
      });
    }
  });
  
  // Fill remaining cells
  while (cells.length < 100) {
    cells.push({ color: colors.border, label: 'empty' });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-sm transition-transform hover:scale-110"
            style={{ backgroundColor: cell.color }}
            title={cell.label}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: colors.gradient[index % colors.gradient.length] }}
            />
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{item.label} ({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Radial/Progress Bar Chart
 */
const RadialParadigm: React.FC<ParadigmProps> = ({ data, colors }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 200, height: 200 }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const radius = 80 - index * 18;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;
          
          return (
            <svg key={item.label} className="absolute inset-0" width="200" height="200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={colors.border}
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={colors.gradient[index % colors.gradient.length]}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 100 100)"
              />
            </svg>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors.gradient[index % colors.gradient.length] }}
            />
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Rose/Nightingale Chart (Coxcomb - equal angles, varying radius)
 */
const RoseParadigm: React.FC<ParadigmProps> = ({ data, colors }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 80;
  const anglePerSlice = (2 * Math.PI) / data.length;
  
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((item, index) => {
          const radius = (item.value / maxValue) * maxRadius;
          const startAngle = index * anglePerSlice - Math.PI / 2;
          const endAngle = (index + 1) * anglePerSlice - Math.PI / 2;
          
          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          
          const largeArc = anglePerSlice > Math.PI ? 1 : 0;
          
          const path = `
            M ${centerX} ${centerY}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            Z
          `;
          
          return (
            <path
              key={item.label}
              d={path}
              fill={colors.gradient[index % colors.gradient.length]}
              stroke={colors.border}
              strokeWidth="1"
              opacity={0.85}
            >
              <title>{item.label}: {item.value}</title>
            </path>
          );
        })}
        {/* Center circle */}
        <circle cx={centerX} cy={centerY} r="5" fill={colors.border} />
      </svg>
      <div className="flex flex-wrap gap-4 justify-center">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: colors.gradient[index % colors.gradient.length] }}
            />
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Funnel Chart - Inverted triangle with horizontal sections
 * Uses theme colors for fill, text, and borders
 */
const FunnelParadigm: React.FC<ParadigmProps> = ({ data, colors, showValues }) => {
  // Sort data by value descending (largest at top)
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const maxValue = sortedData[0]?.value || 1;
  const totalHeight = 240;
  const topWidth = 280;
  const bottomWidth = 60;
  const sectionHeight = totalHeight / sortedData.length;
  
  // Calculate the width at each level (linear taper from top to bottom)
  const getWidthAtLevel = (level: number) => {
    const ratio = level / sortedData.length;
    return topWidth - (topWidth - bottomWidth) * ratio;
  };
  
  return (
    <div className="flex flex-col items-center p-4">
      <svg 
        width={topWidth + 40} 
        height={totalHeight + 20} 
        viewBox={`0 0 ${topWidth + 40} ${totalHeight + 20}`}
        className="overflow-visible"
      >
        {sortedData.map((item, index) => {
          const topY = index * sectionHeight;
          const bottomY = (index + 1) * sectionHeight;
          const topWidthAtLevel = getWidthAtLevel(index);
          const bottomWidthAtLevel = getWidthAtLevel(index + 1);
          const centerX = (topWidth + 40) / 2;
          
          // Create trapezoid path for this section
          const path = `
            M ${centerX - topWidthAtLevel / 2} ${topY + 10}
            L ${centerX + topWidthAtLevel / 2} ${topY + 10}
            L ${centerX + bottomWidthAtLevel / 2} ${bottomY + 10}
            L ${centerX - bottomWidthAtLevel / 2} ${bottomY + 10}
            Z
          `;
          
          const percentage = ((item.value / maxValue) * 100).toFixed(0);
          
          return (
            <g key={item.label}>
              {/* Section fill - uses theme gradient colors */}
              <path
                d={path}
                fill={colors.gradient[index % colors.gradient.length]}
                stroke={colors.border}
                strokeWidth="1"
                className="transition-opacity hover:opacity-80"
              />
              {/* Label - uses contrasting color for readability */}
              <text
                x={centerX}
                y={topY + sectionHeight / 2 + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium"
                style={{ 
                  fontSize: '11px',
                  fill: 'white',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                }}
              >
                {item.label}
                {showValues && ` (${percentage}%)`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Gauge/Speedometer Chart
 */
const GaugeParadigm: React.FC<ParadigmProps> = ({ data, colors }) => {
  // Use first data point as the gauge value
  const item = data[0] || { label: 'Value', value: 0 };
  const maxValue = data.length > 1 ? Math.max(...data.map(d => d.value)) : 100;
  const percentage = Math.min((item.value / maxValue) * 100, 100);
  
  const centerX = 100;
  const centerY = 100;
  const radius = 70;
  const startAngle = -135 * (Math.PI / 180);
  const endAngle = -45 * (Math.PI / 180);
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + (percentage / 100) * totalAngle;
  
  // Arc path
  const arcStart = {
    x: centerX + radius * Math.cos(startAngle),
    y: centerY + radius * Math.sin(startAngle),
  };
  const arcEnd = {
    x: centerX + radius * Math.cos(endAngle),
    y: centerY + radius * Math.sin(endAngle),
  };
  const arcCurrent = {
    x: centerX + radius * Math.cos(currentAngle),
    y: centerY + radius * Math.sin(currentAngle),
  };
  
  // Needle
  const needleLength = 55;
  const needleEnd = {
    x: centerX + needleLength * Math.cos(currentAngle),
    y: centerY + needleLength * Math.sin(currentAngle),
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="200" height="140" viewBox="0 0 200 140">
        {/* Background arc */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke={colors.border}
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${arcCurrent.x} ${arcCurrent.y}`}
          fill="none"
          stroke={colors.primary}
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke="var(--theme-text)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={centerX} cy={centerY} r="8" fill={colors.border} />
        <circle cx={centerX} cy={centerY} r="4" fill={colors.primary} />
        {/* Value text */}
        <text x={centerX} y={centerY + 35} textAnchor="middle" fill="var(--theme-text)" fontSize="20" fontWeight="bold">
          {item.value}
        </text>
        <text x={centerX} y={centerY + 50} textAnchor="middle" fill="var(--theme-text-muted)" fontSize="10">
          {item.label}
        </text>
      </svg>
    </div>
  );
};

/**
 * Treemap Chart
 */
const TreemapParadigm: React.FC<ParadigmProps> = ({ data, colors }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Simple squarified treemap layout
  const width = 280;
  const height = 180;
  let x = 0;
  let y = 0;
  let remainingWidth = width;
  let remainingHeight = height;
  let isHorizontal = true;
  
  const rects = sortedData.map((item, index) => {
    const ratio = item.value / total;
    let rectWidth, rectHeight, rectX, rectY;
    
    if (isHorizontal) {
      rectWidth = remainingWidth * ratio * (total / sortedData.slice(index).reduce((s, d) => s + d.value, 0));
      rectHeight = remainingHeight;
      rectX = x;
      rectY = y;
      x += rectWidth;
      if (index % 2 === 1) {
        isHorizontal = !isHorizontal;
        remainingWidth = width - x;
      }
    } else {
      rectWidth = remainingWidth;
      rectHeight = remainingHeight * ratio * (total / sortedData.slice(index).reduce((s, d) => s + d.value, 0));
      rectX = x;
      rectY = y;
      y += rectHeight;
      if (index % 2 === 1) {
        isHorizontal = !isHorizontal;
        remainingHeight = height - y;
      }
    }
    
    return { ...item, x: rectX, y: rectY, width: rectWidth, height: rectHeight, index };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {rects.map((rect) => (
          <g key={rect.label}>
            <rect
              x={rect.x}
              y={rect.y}
              width={Math.max(rect.width - 2, 0)}
              height={Math.max(rect.height - 2, 0)}
              fill={colors.gradient[rect.index % colors.gradient.length]}
              rx="4"
            >
              <title>{rect.label}: {rect.value}</title>
            </rect>
            {rect.width > 40 && rect.height > 25 && (
              <text
                x={rect.x + rect.width / 2}
                y={rect.y + rect.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
                fontWeight="500"
              >
                {rect.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: colors.gradient[index % colors.gradient.length] }}
            />
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Unknown/Fallback Chart - renders data in a generic way with a note
 */
const UnknownParadigm: React.FC<ParadigmProps & { originalRequest?: string }> = ({ 
  data, colors, originalRequest 
}) => {
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Warning banner */}
      <div style={{ 
        backgroundColor: 'color-mix(in srgb, var(--theme-warning, #F59E0B) 15%, transparent)',
        border: '1px solid color-mix(in srgb, var(--theme-warning, #F59E0B) 50%, transparent)',
        borderRadius: 'var(--theme-radius, 8px)',
        padding: '0.75rem',
        textAlign: 'center',
        maxWidth: '28rem'
      }}>
        <p style={{ color: 'var(--theme-warning, #F59E0B)', fontSize: '0.875rem', fontWeight: 500 }}>
          ⚠️ Chart type not recognized
        </p>
        {originalRequest && (
          <p style={{ color: 'var(--theme-warning, #F59E0B)', opacity: 0.7, fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Requested: "{originalRequest}"
          </p>
        )}
        <p style={{ color: 'var(--theme-text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          Showing data as a simple bar chart. Consider using: bar, line, area, pie, scatter, waffle, radial, rose, funnel, gauge, treemap, pictogram, or lollipop.
        </p>
      </div>
      
      {/* Fallback: simple horizontal bars */}
      <div className="w-full max-w-md space-y-2">
        {data.map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.value));
          const widthPercent = (item.value / maxValue) * 100;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs w-20 text-right truncate" style={{ color: 'var(--theme-text-muted)' }}>{item.label}</span>
              <div className="flex-1 h-6 rounded overflow-hidden" style={{ backgroundColor: colors.border }}>
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: colors.gradient[index % colors.gradient.length],
                  }}
                />
              </div>
              <span className="text-xs w-12" style={{ color: 'var(--theme-text-muted)' }}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Component
// =============================================================================

/**
 * ChartCustom Component
 * 
 * Flexible chart component supporting multiple visualization paradigms.
 * Can render scatter, bar, line, area, pie, pictogram, lollipop, waffle, and radial charts
 * with customizable shapes and styles.
 */
export function ChartCustom({
  id,
  type,
  shape = 'circle',
  style = 'default',
  data,
  title,
  subtitle,
  height = 'md',
  colorScheme = 'blue',
  showGrid = true,
  showValues = false,
  donut = false,
}: ChartCustomProps): JSX.Element {
  // Normalize data and ensure value is always a number
  const normalizedData = normalizeChartData(data).map(d => ({
    label: d.label,
    value: d.value ?? 0,
  }));
  
  // Determine chart paradigm
  const parseResult = parseChartType(shape + ' ' + (style || ''));
  const paradigm: ChartParadigm = type || parseResult.paradigm;
  const originalRequest = parseResult.originalRequest;
  const barStyle = typeof style === 'string' ? parseBarStyle(style) : style;
  
  // Get theme-aware colors and shape component
  const colors = getThemeColors(colorScheme === 'rainbow' ? 'rainbow' : 'default');
  const ShapeComponent = getShapeComponent(shape);
  
  // Common props for paradigm renderers
  const paradigmProps: ParadigmProps = {
    data: normalizedData,
    colors,
    shape,
    style: barStyle,
    showGrid,
    showValues,
    donut,
    ShapeComponent,
  };

  // Render appropriate paradigm
  const renderParadigm = () => {
    switch (paradigm) {
      case 'bar':
        return <BarParadigm {...paradigmProps} />;
      case 'horizontal-bar':
        return <BarParadigm {...paradigmProps} horizontal />;
      case 'line':
        return <LineParadigm {...paradigmProps} />;
      case 'area':
        return <AreaParadigm {...paradigmProps} />;
      case 'pie':
        return <PieParadigm {...paradigmProps} />;
      case 'lollipop':
        return <LollipopParadigm {...paradigmProps} />;
      case 'pictogram':
        return <PictogramParadigm {...paradigmProps} />;
      case 'waffle':
        return <WaffleParadigm {...paradigmProps} />;
      case 'radial':
        return <RadialParadigm {...paradigmProps} />;
      case 'rose':
        return <RoseParadigm {...paradigmProps} />;
      case 'funnel':
        return <FunnelParadigm {...paradigmProps} />;
      case 'gauge':
        return <GaugeParadigm {...paradigmProps} />;
      case 'treemap':
        return <TreemapParadigm {...paradigmProps} />;
      case 'unknown':
        return <UnknownParadigm {...paradigmProps} originalRequest={originalRequest} />;
      case 'scatter':
      case 'bubble':
      default:
        return <ScatterParadigm {...paradigmProps} />;
    }
  };

  // Some paradigms render their own custom SVG/HTML layouts (not Recharts)
  // 'scatter' uses custom SVG to avoid ResponsiveContainer sizing issues with Recharts ScatterChart
  const isCustomRendered = ['scatter', 'pictogram', 'waffle', 'radial', 'rose', 'funnel', 'gauge', 'treemap', 'unknown'].includes(paradigm);
  
  // Get explicit pixel height
  const chartHeight = heightMap[height] || 250;

  return (
    <div id={id} className="w-full">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>{title}</h3>}
          {subtitle && <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{subtitle}</p>}
        </div>
      )}
      
      {isCustomRendered ? (
        <div style={{ minHeight: chartHeight }} className="flex items-center justify-center">
          {renderParadigm()}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          {renderParadigm()}
        </ResponsiveContainer>
      )}
      
      {/* Chart type indicator */}
      <div className="mt-2 text-xs text-center" style={{ color: 'var(--theme-text-muted)' }}>
        {paradigm}{shape !== 'circle' ? ` • ${shape}` : ''}{barStyle !== 'default' ? ` • ${barStyle}` : ''}
      </div>
    </div>
  );
}

export default ChartCustom;
