"use client";

/**
 * LayoutDashboard Component (L1 Layout)
 *
 * Multi-panel dashboard layout for KPI and metric displays.
 * Supports flexible grid arrangements with named slots.
 *
 * Sync Mode (default):
 * - Components in Main and Sidebar are aligned by row
 * - Headlines/lead text get their own rows
 * - Mismatched counts use N:1 or 1:N distribution
 *
 * Usage:
 * ```mdx
 * <LayoutDashboard>
 *   <Header>
 *     <Heading level={2}>Dashboard Title</Heading>
 *   </Header>
 *   <Main>
 *     <BigNum value="$1.2M" label="Revenue" />
 *     <Text variant="lead">Key summary</Text>
 *   </Main>
 *   <Sidebar>
 *     <MetricGroup metrics={metrics} />
 *     <ChartBar data={chartData} />
 *   </Sidebar>
 * </LayoutDashboard>
 * ```
 */

import React, { type ReactNode, Children, isValidElement } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';
import { TimelineHeader } from './TimelineHeader';

const CHART_HEIGHT_PROP_TYPES = new Set([
  'ChartBar',
  'ChartLine',
  'ChartArea',
  'ChartBubble',
  'ChartCustom',
]);

const CHART_SIZE_PROP_TYPES = new Set([
  'ChartPie',
  'ChartRadar',
  'ChartPolar',
]);

function isBigNumType(type: string): boolean {
  return type.toLowerCase().includes('bignum');
}

function isChartType(type: string): boolean {
  const t = type.toLowerCase();
  if (t.startsWith('chart')) return true;
  if (t === 'barstats') return true;
  return false;
}

function enhanceChartElementForFill(comp: ComponentInfo): React.ReactElement {
  const element = comp.element;
  const type = comp.type;
  const props = element.props as Record<string, unknown>;

  if (CHART_HEIGHT_PROP_TYPES.has(type) && props.height === undefined) {
    return React.cloneElement(element, { height: 'full' } as never);
  }
  if (CHART_SIZE_PROP_TYPES.has(type) && props.size === undefined) {
    return React.cloneElement(element, { size: 'full' } as never);
  }
  return element;
}

function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (!isValidElement(node)) return '';
  return nodeToText((node.props as { children?: ReactNode }).children);
}

function isWhitespaceNode(node: ReactNode): boolean {
  return typeof node === 'string' && !node.trim();
}

function isHeadingLevel2Element(node: ReactNode): node is React.ReactElement<{ children?: ReactNode; level?: unknown }> {
  if (!isValidElement(node)) return false;
  if (typeof node.type === 'string') return node.type === 'h2';
  const t = node.type as unknown as { name?: string; displayName?: string };
  const name = t.displayName ?? t.name ?? '';
  const props = node.props as { level?: unknown };
  return (name === 'Heading' || props.level !== undefined) && props.level === 2;
}

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
  /** Disable sync mode - use independent flex columns */
  nosync?: boolean;
}

export interface DashboardSlotProps {
  children: ReactNode;
}

interface ComponentInfo {
  element: React.ReactElement;
  type: string;
  index: number;
  isHeadline: boolean;
}

interface GridRow {
  type: 'headline-full' | 'matched' | 'main-only' | 'sidebar-only' | 'one-to-many' | 'many-to-one';
  main: ComponentInfo[];
  sidebar: ComponentInfo[];
}

// =============================================================================
// Sub-Components (Slots) - exported for standalone use in MDX
// =============================================================================

/** Dashboard Header Slot */
export function Header({ children }: DashboardSlotProps): JSX.Element {
  return <div className="dashboard-header">{children}</div>;
}
Header.displayName = 'Header';

/** Dashboard Main Content Slot (1/3 width - summary/key metrics) */
export function Main({ children }: DashboardSlotProps): JSX.Element {
  return (
    <div className="dashboard-main">
      <div className="dashboard-main-content">{children}</div>
    </div>
  );
}
Main.displayName = 'Main';

/** Dashboard Sidebar Slot (2/3 width - detailed content/appendix) */
export function Sidebar({ children }: DashboardSlotProps): JSX.Element {
  return (
    <div className="dashboard-sidebar">
      <div className="dashboard-sidebar-inner">{children}</div>
    </div>
  );
}
Sidebar.displayName = 'Sidebar';

/** Dashboard Footer Slot */
export function Footer({ children }: DashboardSlotProps): JSX.Element {
  return <div className="dashboard-footer">{children}</div>;
}
Footer.displayName = 'Footer';

// =============================================================================
// Helper Functions
// =============================================================================

/** Headline components that should get their own row */
const HEADLINE_TYPES = ['Heading', 'Title', 'SectionTitle', 'h1', 'h2', 'h3'];

/** Get component type name from element */
function getComponentType(element: React.ReactElement): string {
  const type = element.type;
  if (typeof type === 'string') return type;
  if (typeof type === 'function') {
    return (type as { displayName?: string }).displayName || type.name || 'Unknown';
  }
  return 'Unknown';
}

/** Check if component is a headline type */
function isHeadlineComponent(type: string, props?: Record<string, unknown>): boolean {
  if (type === 'Text' && props?.variant === 'lead') {
    return true;
  }
  return HEADLINE_TYPES.some(h => type.toLowerCase().includes(h.toLowerCase()));
}

/** Extract component info from children */
function extractComponents(children: ReactNode): ComponentInfo[] {
  const components: ComponentInfo[] = [];
  let index = 0;

  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const type = getComponentType(child);
      const props = child.props as Record<string, unknown>;
      components.push({
        element: child,
        type,
        index,
        isHeadline: isHeadlineComponent(type, props),
      });
      index++;
    }
  });

  return components;
}

/** Check if a component is a "light" trailing component that should group with previous */
function isTrailingComponent(comp: ComponentInfo): boolean {
  if (comp.type === 'Text') {
    return true;
  }
  return false;
}

/** Group trailing components with their preceding "heavy" components */
function groupTrailingComponents(components: ComponentInfo[]): ComponentInfo[][] {
  const groups: ComponentInfo[][] = [];
  let currentGroup: ComponentInfo[] = [];

  for (const comp of components) {
    if (isTrailingComponent(comp) && currentGroup.length > 0) {
      currentGroup.push(comp);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [comp];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/** Build grid rows from main and sidebar components with sync matching */
function buildSyncedGridRows(mainComponents: ComponentInfo[], sidebarComponents: ComponentInfo[]): GridRow[] {
  const rows: GridRow[] = [];

  // Separate headlines from body content
  const mainHeadlines: ComponentInfo[] = [];
  const mainBody: ComponentInfo[] = [];
  const sidebarHeadlines: ComponentInfo[] = [];
  const sidebarBody: ComponentInfo[] = [];

  let mainHeadlinesDone = false;
  let sidebarHeadlinesDone = false;

  for (const comp of mainComponents) {
    if (!mainHeadlinesDone && comp.isHeadline) {
      mainHeadlines.push(comp);
    } else {
      mainHeadlinesDone = true;
      mainBody.push(comp);
    }
  }

  for (const comp of sidebarComponents) {
    if (!sidebarHeadlinesDone && comp.isHeadline) {
      sidebarHeadlines.push(comp);
    } else {
      sidebarHeadlinesDone = true;
      sidebarBody.push(comp);
    }
  }

  // Process headlines
  const maxHeadlines = Math.max(mainHeadlines.length, sidebarHeadlines.length);
  for (let i = 0; i < maxHeadlines; i++) {
    const mainH = mainHeadlines[i];
    const sidebarH = sidebarHeadlines[i];

    if (mainH && sidebarH) {
      rows.push({ type: 'matched', main: [mainH], sidebar: [sidebarH] });
    } else if (mainH) {
      rows.push({ type: 'headline-full', main: [mainH], sidebar: [] });
    } else if (sidebarH) {
      rows.push({ type: 'headline-full', main: [], sidebar: [sidebarH] });
    }
  }

  // Group trailing components before matching
  const mainGroups = groupTrailingComponents(mainBody);
  const sidebarGroups = groupTrailingComponents(sidebarBody);

  const mainGroupCount = mainGroups.length;
  const sidebarGroupCount = sidebarGroups.length;

  if (mainGroupCount === 0 && sidebarGroupCount === 0) {
    return rows;
  }

  // Special-case: if Main effectively has a single BigNum, center it and
  // keep Sidebar content in one stack so the BigNum can visually center.
  // This avoids creating empty Main rows that push the BigNum to the top.
  if (mainGroupCount === 1 && sidebarGroupCount > 1) {
    const mainGroup = mainGroups[0];
    const isSingleMainBigNum = mainGroup.length === 1 && isBigNumType(mainGroup[0].type);
    const isSingleMainChart = mainGroup.length === 1 && isChartType(mainGroup[0].type);
    if (isSingleMainBigNum || isSingleMainChart) {
      rows.push({
        type: 'one-to-many',
        main: mainGroup,
        sidebar: sidebarGroups.flat(),
      });
      return rows;
    }
  }

  if (mainGroupCount === sidebarGroupCount) {
    for (let i = 0; i < mainGroupCount; i++) {
      rows.push({ type: 'matched', main: mainGroups[i], sidebar: sidebarGroups[i] });
    }
  } else if (mainGroupCount > sidebarGroupCount && sidebarGroupCount > 0) {
    const ratio = mainGroupCount / sidebarGroupCount;
    let mainIdx = 0;

    for (let sidebarIdx = 0; sidebarIdx < sidebarGroupCount; sidebarIdx++) {
      const nextBoundary = Math.round((sidebarIdx + 1) * ratio);
      const mainCombined: ComponentInfo[] = [];

      while (mainIdx < nextBoundary && mainIdx < mainGroupCount) {
        mainCombined.push(...mainGroups[mainIdx]);
        mainIdx++;
      }

      rows.push({
        type: mainCombined.length > 1 ? 'many-to-one' : 'matched',
        main: mainCombined,
        sidebar: sidebarGroups[sidebarIdx],
      });
    }

    while (mainIdx < mainGroupCount) {
      rows.push({ type: 'main-only', main: mainGroups[mainIdx], sidebar: [] });
      mainIdx++;
    }
  } else if (sidebarGroupCount > mainGroupCount && mainGroupCount > 0) {
    const ratio = sidebarGroupCount / mainGroupCount;
    let sidebarIdx = 0;

    for (let mainIdx = 0; mainIdx < mainGroupCount; mainIdx++) {
      const nextBoundary = Math.round((mainIdx + 1) * ratio);
      const sidebarCombined: ComponentInfo[] = [];

      while (sidebarIdx < nextBoundary && sidebarIdx < sidebarGroupCount) {
        sidebarCombined.push(...sidebarGroups[sidebarIdx]);
        sidebarIdx++;
      }

      rows.push({
        type: sidebarCombined.length > 1 ? 'one-to-many' : 'matched',
        main: mainGroups[mainIdx],
        sidebar: sidebarCombined,
      });
    }

    while (sidebarIdx < sidebarGroupCount) {
      rows.push({ type: 'sidebar-only', main: [], sidebar: sidebarGroups[sidebarIdx] });
      sidebarIdx++;
    }
  } else if (mainGroupCount > 0) {
    for (const group of mainGroups) {
      rows.push({ type: 'main-only', main: group, sidebar: [] });
    }
  } else {
    for (const group of sidebarGroups) {
      rows.push({ type: 'sidebar-only', main: [], sidebar: group });
    }
  }

  return rows;
}

// =============================================================================
// Sync Body Renderer
// =============================================================================

interface SyncBodyProps {
  rows: GridRow[];
}

function SyncBody({ rows }: SyncBodyProps): JSX.Element {
  return (
    <div
      className="dashboard-body dashboard-body-sync"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 640px) 1fr',
        gap: '40px',
        alignContent: 'center',
        alignItems: 'stretch',
        flex: 1,
        minHeight: 0,
      }}
    >
      {rows.map((row, rowIndex) => {
        const rowKey = `row-${rowIndex}`;

        // Full-width headline row
        if (row.type === 'headline-full') {
          const headline = row.main[0] || row.sidebar[0];
          return (
            <div
              key={rowKey}
              className="dashboard-row dashboard-row-headline"
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              {headline.element}
            </div>
          );
        }

        // Main-only row
        if (row.type === 'main-only') {
          return (
            <React.Fragment key={rowKey}>
              <div
                className="dashboard-cell dashboard-cell-main"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {row.main.map((comp, i) => (
                  <div key={`main-${i}`} className="dashboard-cell-item">
                    {comp.element}
                  </div>
                ))}
              </div>
              <div className="dashboard-cell dashboard-cell-sidebar dashboard-cell-empty" />
            </React.Fragment>
          );
        }

        // Sidebar-only row
        if (row.type === 'sidebar-only') {
          return (
            <React.Fragment key={rowKey}>
              <div className="dashboard-cell dashboard-cell-main dashboard-cell-empty" />
              <div
                className="dashboard-cell dashboard-cell-sidebar"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {row.sidebar.map((comp, i) => (
                  <div key={`sidebar-${i}`} className="dashboard-cell-item">
                    {comp.element}
                  </div>
                ))}
              </div>
            </React.Fragment>
          );
        }

        // Matched or N:1 / 1:N rows
        const mainType = row.main[0]?.type;
        const mainIsSingleBigNum = row.main.length === 1 && !!mainType && isBigNumType(mainType);
        const mainIsSingleChart = row.main.length === 1 && !!mainType && isChartType(mainType);
        const shouldCenterMain = row.sidebar.length > 0 && (mainIsSingleBigNum || mainIsSingleChart);
        const shouldFillMain = row.sidebar.length > 0 && mainIsSingleChart;

        return (
          <React.Fragment key={rowKey}>
            <div
              className="dashboard-cell dashboard-cell-main"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignSelf: 'stretch',
                justifyContent: shouldCenterMain ? 'center' : undefined,
                alignItems: shouldCenterMain ? (shouldFillMain ? 'stretch' : 'center') : undefined,
                minHeight: shouldFillMain ? 0 : undefined,
              }}
            >
              {row.main.map((comp, i) => (
                <div
                  key={`main-${i}`}
                  className="dashboard-cell-item"
                  style={
                    shouldFillMain
                      ? { display: 'flex', flex: 1, minHeight: 0, alignItems: 'stretch' }
                      : undefined
                  }
                >
                  {shouldFillMain ? enhanceChartElementForFill(comp) : comp.element}
                </div>
              ))}
            </div>
            <div
              className="dashboard-cell dashboard-cell-sidebar"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignSelf: 'stretch',
                background: 'var(--theme-surface, #f8fafc)',
                borderRadius: '1rem',
                padding: '1.25rem',
              }}
            >
              {row.sidebar.map((comp, i) => (
                <div key={`sidebar-${i}`} className="dashboard-cell-item">
                  {comp.element}
                </div>
              ))}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

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
 * @param nosync - Disable sync mode (use traditional flex layout)
 */
export function LayoutDashboard({
  children,
  variant = 'default',
  theme,
  vibe,
  nosync = false,
}: LayoutDashboardProps): JSX.Element {
  // Extract slots from children
  let header: ReactNode = null;
  let mainSlot: React.ReactElement | null = null;
  let sidebarSlot: React.ReactElement | null = null;
  let footer: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const displayName = (child.type as any).displayName;
    const componentType = child.type;

    // Match both standalone and compound component patterns
    if (displayName === 'Header' || displayName === 'LayoutDashboard.Header' || componentType === Header) {
      header = child;
    } else if (displayName === 'Main' || displayName === 'LayoutDashboard.Main' || componentType === Main) {
      mainSlot = child;
    } else if (displayName === 'Sidebar' || displayName === 'LayoutDashboard.Sidebar' || componentType === Sidebar) {
      sidebarSlot = child;
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

  // Extract main children for both modes (needed for subtitle detection)
  const mainChildren = (mainSlot as React.ReactElement | null)?.props?.children;
  const sidebarChildren = (sidebarSlot as React.ReactElement | null)?.props?.children;

  let mainComponents = extractComponents(mainChildren);

  // LayoutTimeline-style headline/subtitle (shared by both sync and nosync modes):
  // We look for a Heading in the Header slot and optionally a subtitle (Lead text).
  let renderedHeader: ReactNode = header;

  if (isValidElement(header)) {
    const headerEl = header as React.ReactElement;
    const headerChilds = Children.toArray((headerEl.props as { children?: ReactNode }).children);
    
    let headline = '';
    let subtitle: string | null = null;
    let foundHeading = false;

    // 1. Scan Header slot for headline and subtitle
    for (const child of headerChilds) {
       if (isValidElement(child)) {
          const type = getComponentType(child as React.ReactElement);
          const props = (child as React.ReactElement).props as { level?: number; variant?: string; children?: ReactNode };

          const isHeading = type.includes('Heading') || ['h1', 'h2', 'h3'].includes(type) || props.level === 1 || props.level === 2;
          const isLead = type === 'Text' || props.variant === 'lead';

          if (!foundHeading && isHeading) {
              headline = nodeToText(props.children).trim();
              foundHeading = true;
          } else if (subtitle === null && isLead) {
              subtitle = nodeToText(props.children).trim() || null;
          }
       }
    }

    // 2. If headline found, try to find subtitle in Main if not in Header
    if (headline) {
        if (!subtitle) {
          const leadCandidate = mainComponents
            .slice(0, 3)
            .find((c) => c.type === 'Text' && (c.element.props as { variant?: unknown }).variant === 'lead');

          if (leadCandidate) {
              subtitle = nodeToText((leadCandidate.element.props as { children?: ReactNode }).children).trim() || null;
              // Remove found subtitle from main content to avoid duplication
              mainComponents = mainComponents.filter((c) => c.index !== leadCandidate.index);
          }
        }

        renderedHeader = (
          <div
            className="dashboard-header"
            style={{
              marginBottom: 'var(--theme-spacing-gap)',
            }}
          >
            <TimelineHeader headline={headline} subtitle={subtitle} />
          </div>
        );
    }
  }

  const hasHeader = !!renderedHeader;

  // NoSync mode: Use traditional layout
  if (nosync) {
    return (
      <div
        className={`layout-dashboard layout-dashboard-nosync ${variantClass}`}
        data-layout="dashboard"
        data-sync="false"
        data-variant={variant}
        data-theme={theme}
        data-vibe={vibe}
        style={{
          paddingTop: hasHeader ? '0' : 'var(--theme-spacing-padding)',
          paddingLeft: 'var(--theme-spacing-padding)',
          paddingRight: 'var(--theme-spacing-padding)',
          paddingBottom: 'var(--theme-spacing-padding)',
        }}
      >
        {renderedHeader}
        <div className="dashboard-body">
          {mainSlot}
          {sidebarSlot}
        </div>
        {footer}
      </div>
    );
  }

  // Sync mode: Build grid rows and render
  const sidebarComponents = extractComponents(sidebarChildren);
  const rows = buildSyncedGridRows(mainComponents, sidebarComponents);

  return (
    <div
      className={`layout-dashboard layout-dashboard-sync ${variantClass}`}
      data-layout="dashboard"
      data-sync="true"
      data-variant={variant}
      data-theme={theme}
      data-vibe={vibe}
      style={{
        paddingTop: hasHeader ? '0' : 'var(--theme-spacing-padding)',
        paddingLeft: 'var(--theme-spacing-padding)',
        paddingRight: 'var(--theme-spacing-padding)',
        paddingBottom: 'var(--theme-spacing-padding)',
      }}
    >
      {renderedHeader}
      <SyncBody rows={rows} />
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
