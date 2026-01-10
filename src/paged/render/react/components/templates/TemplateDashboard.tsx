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

export default TemplateDashboard;
