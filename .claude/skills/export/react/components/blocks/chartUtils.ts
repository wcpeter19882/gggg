/**
 * Chart Utilities - Shared functions for chart components
 * Feature: 003-extended-chart-types
 * 
 * Provides:
 * - Earthy color palette array
 * - Default chart props
 * - Data validation helpers
 * - Common chart formatting functions
 */

import type { ChartDataPoint, Size } from '@/utils/types';

// =============================================================================
// EARTHY COLOR PALETTE
// Matches chart-theme.css variables
// =============================================================================

export const CHART_COLORS = [
  '#8B7355',  // Terracotta brown
  '#9CAF88',  // Sage green
  '#D4A574',  // Sand/tan
  '#7C9082',  // Muted teal
  '#C4A77D',  // Warm gold
  '#A69076',  // Dusty rose-brown
  '#B8C4A8',  // Light sage
  '#D9C4B1',  // Cream
];

/**
 * Get color for a data point by index
 * Cycles through CHART_COLORS array
 */
export function getChartColor(index: number, colors?: string[]): string {
  const palette = colors && colors.length > 0 ? colors : CHART_COLORS;
  return palette[index % palette.length];
}

// =============================================================================
// SIZE MAPPINGS
// Consistent height/size values across all chart types
// =============================================================================

export const heightMap: Record<Size, number> = {
  sm: 150,
  md: 250,
  lg: 350,
  full: 400,
};

export const sizeMap: Record<Size, number> = {
  sm: 150,
  md: 250,
  lg: 350,
  full: 400,
};

// =============================================================================
// DATA VALIDATION HELPERS
// =============================================================================

/**
 * Validate that data points have required fields for a chart type
 */
export function validateChartData(
  data: ChartDataPoint[] | undefined,
  chartType: 'area' | 'bar' | 'barStats' | 'bubble' | 'pie' | 'doughnut' | 'polarArea' | 'radar' | 'line'
): boolean {
  if (!data || data.length === 0) return false;
  
  switch (chartType) {
    case 'bubble':
      // Bubble requires x, y, size for each point
      return data.every(d => 
        typeof d.x === 'number' && 
        typeof d.y === 'number' && 
        typeof d.size === 'number'
      );
    case 'radar':
      // Radar needs at least 3 data points for meaningful visualization
      return data.length >= 3 && data.every(d => 
        d.label && typeof d.value === 'number'
      );
    default:
      // Most charts just need label and value
      return data.every(d => 
        d.label && (typeof d.value === 'number' || typeof d.before === 'number' || typeof d.after === 'number')
      );
  }
}

/**
 * Check if data is clustered (has before/after or current/target pairs)
 */
export function isClusteredData(data: ChartDataPoint[]): boolean {
  if (!data || data.length === 0) return false;
  const first = data[0];
  return (
    (first.before !== undefined && first.after !== undefined) ||
    (first.current !== undefined && first.target !== undefined)
  );
}

/**
 * Get cluster keys from data
 */
export function getClusterKeys(data: ChartDataPoint[]): { 
  key1: string; 
  key2: string; 
  label1: string; 
  label2: string 
} {
  const first = data[0];
  if (first.before !== undefined && first.after !== undefined) {
    return { key1: 'before', key2: 'after', label1: 'Before', label2: 'After' };
  }
  if (first.current !== undefined && first.target !== undefined) {
    return { key1: 'current', key2: 'target', label1: 'Current', label2: 'Target' };
  }
  return { key1: 'value', key2: 'value', label1: 'Value', label2: 'Value' };
}

// =============================================================================
// DATA TRANSFORMATION HELPERS
// =============================================================================

/**
 * Ensure data has valid labels (fallback to name if present)
 */
export function normalizeChartData(data: ChartDataPoint[] | undefined): ChartDataPoint[] {
  if (!data) return [];
  return data.map(d => ({
    ...d,
    label: d.label || (d as any).name || '',
  })).filter(d => d.label);
}

/**
 * Prepare bubble chart data with default size if missing
 */
export function prepareBubbleData(
  data: ChartDataPoint[] | undefined,
  defaultSize: number = 50
): Array<{ label: string; x: number; y: number; size: number; color?: string }> {
  if (!data) return [];
  return data.map(d => ({
    label: d.label,
    x: d.x ?? d.value ?? 0,
    y: d.y ?? 0,
    size: d.size ?? defaultSize,
    color: d.color,
  }));
}

/**
 * Prepare radar chart data - ensure at least 3 points
 */
export function prepareRadarData(
  data: ChartDataPoint[] | undefined
): ChartDataPoint[] {
  if (!data || data.length < 3) {
    // If less than 3 points, radar chart won't display well
    // Return empty to trigger fallback
    return [];
  }
  return normalizeChartData(data);
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Format large numbers for display (e.g., 1000 -> 1K)
 */
export function formatChartValue(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Calculate percentage for pie/doughnut charts
 */
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

// =============================================================================
// TOOLTIP STYLES
// Consistent tooltip styling across all chart types
// =============================================================================

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--theme-surface)',
    border: '1px solid var(--theme-border)',
    borderRadius: 'var(--chart-border-radius, 8px)',
    boxShadow: 'var(--chart-shadow, 0 2px 8px rgba(0, 0, 0, 0.08))',
  },
  labelStyle: { 
    color: 'var(--theme-text)' 
  },
  itemStyle: { 
    color: 'var(--theme-text-muted)' 
  },
};

// =============================================================================
// AXIS STYLES
// Consistent axis styling across all chart types
// =============================================================================

export const axisStyle = {
  tick: { 
    fill: 'var(--theme-text-muted)', 
    fontSize: 12 
  },
  axisLine: { 
    stroke: 'var(--theme-border)' 
  },
  tickLine: false,
};

export const gridStyle = {
  strokeDasharray: '3 3',
  stroke: 'var(--theme-border)',
  vertical: false,
};
