/**
 * LayoutDashboard Component (L1 Layout)
 * 
 * Multi-panel dashboard layout for KPI and metric displays.
 * Supports flexible grid arrangements with named slots.
 * 
 * Usage:
 * ```mdx
 * <LayoutDashboard>
 *   <LayoutDashboard.Header>
 *     <Heading level={2}>Dashboard Title</Heading>
 *   </LayoutDashboard.Header>
 *   <LayoutDashboard.Main>
 *     <ChartBar data={chartData} />
 *   </LayoutDashboard.Main>
 *   <LayoutDashboard.Sidebar>
 *     <MetricGroup metrics={metrics} />
 *   </LayoutDashboard.Sidebar>
 * </LayoutDashboard>
 * ```
 */

import React, { type ReactNode, Children, isValidElement } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface LayoutDashboardProps {
  children: ReactNode;
  /** Layout variant */
  variant?: 'default' | 'wide-main' | 'sidebar-focus';
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
}

export interface DashboardSlotProps {
  children: ReactNode;
}

// =============================================================================
// Sub-Components (Slots) - exported for standalone use in MDX
// =============================================================================

/** Dashboard Header Slot */
export function Header({ children }: DashboardSlotProps): JSX.Element {
  return <div className="dashboard-header">{children}</div>;
}
Header.displayName = 'Header';

/** Dashboard Main Content Slot */
export function Main({ children }: DashboardSlotProps): JSX.Element {
  return <div className="dashboard-main">{children}</div>;
}
Main.displayName = 'Main';

/** Dashboard Sidebar Slot */
export function Sidebar({ children }: DashboardSlotProps): JSX.Element {
  return <div className="dashboard-sidebar">{children}</div>;
}
Sidebar.displayName = 'Sidebar';

/** Dashboard Footer Slot */
export function Footer({ children }: DashboardSlotProps): JSX.Element {
  return <div className="dashboard-footer">{children}</div>;
}
Footer.displayName = 'Footer';

// =============================================================================
// Component
// =============================================================================

/**
 * LayoutDashboard Component
 * 
 * Renders a dashboard-style layout with header, main, sidebar, and footer slots.
 * 
 * @param children - Dashboard slots (Header, Main, Sidebar, Footer)
 * @param variant - Layout variant affecting proportions
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutDashboard({
  children,
  variant = 'default',
  theme,
  vibe,
}: LayoutDashboardProps): JSX.Element {
  // Extract slots from children
  let header: ReactNode = null;
  let main: ReactNode = null;
  let sidebar: ReactNode = null;
  let footer: ReactNode = null;
  
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    
    const displayName = (child.type as any).displayName;
    const componentType = child.type;

    // Match both standalone and compound component patterns
    if (displayName === 'Header' || displayName === 'LayoutDashboard.Header' || componentType === Header) {
      header = child;
    } else if (displayName === 'Main' || displayName === 'LayoutDashboard.Main' || componentType === Main) {
      main = child;
    } else if (displayName === 'Sidebar' || displayName === 'LayoutDashboard.Sidebar' || componentType === Sidebar) {
      sidebar = child;
    } else if (displayName === 'Footer' || displayName === 'LayoutDashboard.Footer' || componentType === Footer) {
      footer = child;
    }
  });
  
  // Variant classes
  const variantClass = {
    default: 'dashboard-default',
    'wide-main': 'dashboard-wide-main',
    'sidebar-focus': 'dashboard-sidebar-focus',
  }[variant];
  
  return (
    <div 
      className={`layout-dashboard ${variantClass}`}
      data-layout="dashboard"
      data-variant={variant}
      data-theme={theme}
      data-vibe={vibe}
    >
      {header}
      <div className="dashboard-body">
        {main}
        {sidebar}
      </div>
      {footer}
    </div>
  );
}

// Attach sub-components
LayoutDashboard.Header = Header;
LayoutDashboard.Main = Main;
LayoutDashboard.Sidebar = Sidebar;
LayoutDashboard.Footer = Footer;

// =============================================================================
// Exports
// =============================================================================

export default LayoutDashboard;
