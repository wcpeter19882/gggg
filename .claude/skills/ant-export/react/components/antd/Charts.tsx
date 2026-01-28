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

// ============================================================
// CUSTOM SVG BUSINESS GRAPHICS
// ============================================================

// Venn Diagram (2-3 circles with overlap)
interface VennItem { sets: string[]; size: number; label?: string }
export interface VennChartProps {
  data: VennItem[];
  height?: number;
  className?: string;
}

export function Venn({ data = [], height = 450, className = '' }: VennChartProps) {
  const theme = useSlideTheme();
  const textColor = theme.colors.text;
  const labelSize = parseInt(theme.typography.sizeCaption); // 32px
  const smallSize = Math.round(parseInt(theme.typography.sizeCaption) * 0.8); // 26px
  
  const COLORS = ['rgba(24, 144, 255, 0.5)', 'rgba(82, 196, 26, 0.5)', 'rgba(250, 173, 20, 0.5)'];
  const sets = [...new Set(data.filter(d => d.sets.length === 1).map(d => d.sets[0]))];
  
  // Spread circles apart more - positions for 2 or 3 circles
  const cx = sets.length === 2 ? [200, 400] : [180, 420, 300];
  const cy = sets.length === 2 ? [200, 200] : [180, 180, 320];
  const labelX = sets.length === 2 ? [120, 480] : [80, 520, 300];
  const labelY = sets.length === 2 ? [100, 100] : [80, 80, 420];
  
  return (
    <div className={`${styles.chart} ${className}`} style={{ height, minHeight: 350 }}>
      <svg viewBox="0 0 600 450" style={{ width: '100%', height: '100%' }}>
        {sets.slice(0, 3).map((set, i) => {
          return (
            <g key={set}>
              <circle cx={cx[i]} cy={cy[i]} r={120} fill={COLORS[i]} stroke={COLORS[i].replace('0.5', '1')} strokeWidth={3} />
              <text x={labelX[i]} y={labelY[i]} textAnchor="middle" fill={textColor} fontSize={labelSize} fontWeight="bold">{set}</text>
            </g>
          );
        })}
        {/* Overlap labels - positioned in center of diagram */}
        {data.filter(d => d.sets.length > 1).map((overlap, i) => (
          <text key={i} x={300} y={220 + i * 35} textAnchor="middle" fill={textColor} fontSize={smallSize} fontWeight="600">
            {overlap.label || overlap.sets.join(' ∩ ')}
          </text>
        ))}
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

// Matrix 2x2 Chart (BCG, Priority Matrix, etc.)
interface MatrixItem { label: string; x: number; y: number; size?: number; color?: string }
export interface MatrixChartProps {
  data: MatrixItem[];
  xLabel?: string;
  yLabel?: string;
  quadrants?: [string, string, string, string]; // [topLeft, topRight, bottomLeft, bottomRight]
  height?: number;
  className?: string;
}

export function Matrix({ 
  data = [], 
  xLabel = 'X Axis', 
  yLabel = 'Y Axis',
  quadrants = ['High/Low', 'High/High', 'Low/Low', 'Low/High'],
  height = 300, 
  className = '' 
}: MatrixChartProps) {
  const theme = useSlideTheme();
  const textColor = theme.colors.text;
  const textMuted = theme.colors.textMuted;
  const labelSize = parseInt(theme.typography.sizeBody); // 36px
  const smallSize = parseInt(theme.typography.sizeCaption); // 28px
  
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  
  return (
    <div className={`${styles.chart} ${className}`} style={{ height }}>
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
        {/* Quadrant backgrounds */}
        <rect x={50} y={20} width={150} height={120} fill="rgba(250,173,20,0.15)" />
        <rect x={200} y={20} width={150} height={120} fill="rgba(82,196,26,0.15)" />
        <rect x={50} y={140} width={150} height={120} fill="rgba(245,34,45,0.15)" />
        <rect x={200} y={140} width={150} height={120} fill="rgba(24,144,255,0.15)" />
        
        {/* Axes */}
        <line x1={50} y1={140} x2={350} y2={140} stroke={textMuted} strokeWidth={2} />
        <line x1={200} y1={20} x2={200} y2={260} stroke={textMuted} strokeWidth={2} />
        
        {/* Labels */}
        <text x={200} y={280} textAnchor="middle" fill={textMuted} fontSize={smallSize}>{xLabel}</text>
        <text x={20} y={140} textAnchor="middle" fill={textMuted} fontSize={smallSize} transform="rotate(-90, 20, 140)">{yLabel}</text>
        
        {/* Quadrant labels */}
        <text x={125} y={40} textAnchor="middle" fill={textMuted} fontSize={smallSize}>{quadrants[0]}</text>
        <text x={275} y={40} textAnchor="middle" fill={textMuted} fontSize={smallSize}>{quadrants[1]}</text>
        <text x={125} y={250} textAnchor="middle" fill={textMuted} fontSize={smallSize}>{quadrants[2]}</text>
        <text x={275} y={250} textAnchor="middle" fill={textMuted} fontSize={smallSize}>{quadrants[3]}</text>
        
        {/* Data points */}
        {data.map((item, i) => {
          const px = 50 + (item.x / 100) * 300;
          const py = 260 - (item.y / 100) * 240;
          const size = item.size || 24;
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={size} fill={item.color || COLORS[i % COLORS.length]} opacity={0.85} />
              <text x={px} y={py + size + 24} textAnchor="middle" fill={textColor} fontSize={smallSize} fontWeight="500">{item.label}</text>
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

// Export all
export const Charts = { Line, Bar, Column, Pie, Area, Funnel, Venn, Pyramid, Matrix, Radar };
export default Charts;
