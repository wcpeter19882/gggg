/**
 * Lazy Loading Utilities for Recharts
 * 
 * Provides code-splitting for chart components to reduce initial bundle size.
 * Recharts is a large dependency (~150KB) that should be loaded on-demand.
 * 
 * Usage:
 * ```tsx
 * import { LazyChartBar } from '@/utils/lazy-charts';
 * 
 * function MyComponent() {
 *   return (
 *     <Suspense fallback={<ChartSkeleton />}>
 *       <LazyChartBar data={data} />
 *     </Suspense>
 *   );
 * }
 * ```
 */

import dynamic from 'next/dynamic';
import React from 'react';

// =============================================================================
// Loading Placeholder
// =============================================================================

/**
 * ChartSkeleton - Placeholder while chart loads
 */
export function ChartSkeleton({ 
  height = 250 
}: { 
  height?: number 
}): JSX.Element {
  return (
    <div 
      className="chart-skeleton animate-pulse bg-theme-surface rounded-lg"
      style={{ 
        height, 
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="progressbar"
      aria-label="Loading chart..."
    >
      <div className="text-theme-text-muted text-sm">Loading chart...</div>
    </div>
  );
}

// =============================================================================
// Lazy-Loaded Chart Components
// =============================================================================

/**
 * Lazy-loaded ChartBar component
 * Only loads Recharts when the component is rendered
 */
export const LazyChartBar = dynamic(
  () => import('@/components/blocks/ChartBar').then((mod) => mod.ChartBar),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false, // Disable SSR for charts (requires client-side rendering)
  }
);

/**
 * Lazy-loaded ChartLine component
 */
export const LazyChartLine = dynamic(
  () => import('@/components/blocks/ChartLine').then((mod) => mod.ChartLine),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded ChartPie component
 */
export const LazyChartPie = dynamic(
  () => import('@/components/blocks/ChartPie').then((mod) => mod.ChartPie),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// =============================================================================
// Exports
// =============================================================================

export default {
  LazyChartBar,
  LazyChartLine,
  LazyChartPie,
  ChartSkeleton,
};
