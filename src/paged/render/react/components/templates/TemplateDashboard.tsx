/**
 * TemplateDashboard Component (V2 Template)
 * 
 * Dashboard-style template with header, main content area, and sidebar slots.
 * Ideal for KPI displays, metric dashboards, and data-heavy slides.
 * 
 * This replaces LayoutDashboard with explicit slot-based props.
 * 
 * Usage:
 * ```tsx
 * <TemplateDashboard
 *   variant="wide-main"
 *   header={<Heading level={2}>Q4 Dashboard</Heading>}
 *   main={
 *     <SlotLayoutFit>
 *       <ChartBar data={[...]} />
 *     </SlotLayoutFit>
 *   }
 *   sidebar={
 *     <SlotLayoutStack gap="sm">
 *       <MetricCard label="Revenue" value="$1.2M" />
 *       <MetricCard label="Growth" value="+15%" />
 *     </SlotLayoutStack>
 *   }
 * />
 * ```
 */

import React, { type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';
import type { TemplateManifest } from '@/utils/manifest-types';

// =============================================================================
// Types
// =============================================================================

export type DashboardVariant = 'default' | 'wide-main' | 'sidebar-focus';

export interface TemplateDashboardProps {
  /** Optional Header area (spanning full width) */
  header?: ReactNode;
  
  /** Primary Data/Chart Area */
  main: ReactNode;
  
  /** Secondary Metrics/KPI Area */
  sidebar: ReactNode;
  
  /** Optional Footer area (spanning full width) */
  footer?: ReactNode;
  
  /** Layout variation controlling main/sidebar proportions */
  variant?: DashboardVariant;
  
  /** Theme override */
  theme?: ThemeName;
  
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// Variant Mapping
// =============================================================================

const variantClassMap: Record<DashboardVariant, string> = {
  'default': 'template-dashboard--default',
  'wide-main': 'template-dashboard--wide-main',
  'sidebar-focus': 'template-dashboard--sidebar-focus',
};

// =============================================================================
// Component
// =============================================================================

/**
 * TemplateDashboard Component
 * 
 * A semantic template optimized for data visualization and metrics display.
 * The main area is intended for charts/graphs, while the sidebar holds KPIs.
 */
export function TemplateDashboard({
  header,
  main,
  sidebar,
  footer,
  variant = 'default',
  theme,
  vibe,
}: TemplateDashboardProps): JSX.Element {
  const variantClass = variantClassMap[variant];
  
  return (
    <div
      className={`template-dashboard ${variantClass}`}
      data-template="dashboard"
      data-variant={variant}
      data-theme={theme}
      data-vibe={vibe}
    >
      {header && (
        <div className="template-slot template-slot--header">
          {header}
        </div>
      )}
      
      <div className="template-dashboard-content">
        <div className="template-slot template-slot--main">
          {main}
        </div>
        
        <div className="template-slot template-slot--sidebar">
          {sidebar}
        </div>
      </div>
      
      {footer && (
        <div className="template-slot template-slot--footer">
          {footer}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Manifest (Single Source of Truth for Template Rules)
// =============================================================================

/**
 * TemplateDashboard Manifest
 * 
 * Defines the slot constraints and allowed components for the Dashboard template.
 * This serves as the Single Source of Truth for both the React renderer
 * and the Python generation layer.
 */
export const DashboardManifest: TemplateManifest = {
  id: 'TemplateDashboard',
  category: 'data',
  description: 'Use for data-dense KPI displays, performance summaries, and status reports. Optimized for charts and metrics.',
  slots: {
    header: {
      description: 'Top area spanning full width. Use for clean slide titles only.',
      allowedComponents: ['Heading', 'Text'],
      maxElements: 2,
      bannedComponents: ['ChartBar', 'ChartLine', 'ChartPie', 'SmartList', 'ProcessStrip', 'Timeline']
    },
    main: {
      description: 'Large central area for primary data visualization. Landscape-oriented for wide charts.',
      orientation: 'landscape',
      allowedComponents: [
        'ChartBar', 'ChartLine', 'ChartPie',
        'TableData', 'NetworkGraph',
        'BigNum', 'MetricGroup', 'MetricStrip'
      ],
      bannedComponents: ['SmartList', 'ProcessStrip', 'Timeline', 'StepList'],
      allowedLayouts: ['SlotLayoutFit', 'SlotLayoutGrid'],
      maxElements: 4
    },
    sidebar: {
      description: 'Narrow vertical column for supporting metrics and context. Portrait-oriented.',
      orientation: 'portrait',
      allowedComponents: [
        'BigNum', 'MetricCard', 'MetricGroup', 'MetricBadges',
        'SmartList', 'Text', 'Callout'
      ],
      bannedComponents: ['ChartBar', 'ChartLine', 'ChartPie', 'Timeline', 'ProcessStrip', 'NetworkGraph', 'TableData'],
      allowedLayouts: ['SlotLayoutStack'],
      maxElements: 5
    },
    footer: {
      description: 'Bottom area spanning full width for notes or citations.',
      allowedComponents: ['Text', 'Callout'],
      maxElements: 1
    }
  },
  metadata: {
    tags: ['data', 'metrics', 'dashboard', 'kpi', 'chart'],
    version: '1.0.0'
  }
} as const;

export default TemplateDashboard;
