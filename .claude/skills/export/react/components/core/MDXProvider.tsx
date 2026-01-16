'use client';

/**
 * MDXProvider Component
 * 
 * Provides the component mapping for MDX rendering.
 * Maps MDX JSX elements to our semantic React components.
 * 
 * This is the bridge between MDX content and React components.
 */

import React, { type ReactNode } from 'react';
import { MDXProvider as BaseMDXProvider } from '@mdx-js/react';

// Import L1 Layout Components
import { LayoutCover } from '@/components/layouts/LayoutCover';
import { LayoutSplit, Left, Right } from '@/components/layouts/LayoutSplit';
import { LayoutGrid } from '@/components/layouts/LayoutGrid';
import { LayoutFullBleed } from '@/components/layouts/LayoutFullBleed';
import { LayoutTimeline } from '@/components/layouts/LayoutTimeline';
import { LayoutDashboard, Header, Main, Sidebar, Footer } from '@/components/layouts/LayoutDashboard';
import { LayoutStacked } from '@/components/layouts/LayoutStacked';

// Timeline Item component (LayoutTimeline.Item)
const Item = LayoutTimeline.Item;

// Import L2 Block Components
import { SmartList } from '@/components/blocks/SmartList';
import { ChartBar } from '@/components/blocks/ChartBar';
import { ChartLine } from '@/components/blocks/ChartLine';
import { ChartPie } from '@/components/blocks/ChartPie';
import { ChartArea } from '@/components/blocks/ChartArea';
import { ChartBubble } from '@/components/blocks/ChartBubble';
import { ChartRadar } from '@/components/blocks/ChartRadar';
import { ChartPolar } from '@/components/blocks/ChartPolar';
import { ChartCustom } from '@/components/blocks/ChartCustom';
import { BarStats } from '@/components/blocks/BarStats';
import { MetricGroup, Metric } from '@/components/blocks/MetricGroup';
import { MetricStrip } from '@/components/blocks/MetricStrip';
import { BigNum } from '@/components/blocks/BigNum';
import { TableData } from '@/components/blocks/TableData';
import { QuoteBlock } from '@/components/blocks/QuoteBlock';
import { ImageBlock } from '@/components/blocks/ImageBlock';
import { CardGroup, Card } from '@/components/blocks/CardGroup';
import { NetworkGraph, Node, Edge, Group } from '@/components/blocks/NetworkGraph';
import { StepList } from '@/components/blocks/StepList';
import { ProcessStrip } from '@/components/blocks/ProcessStrip';

// Import L3 Atom Components
import { Heading } from '@/components/atoms/Heading';
import { Text } from '@/components/atoms/Text';
import { Callout } from '@/components/atoms/Callout';
import { Highlight } from '@/components/atoms/Highlight';

// Import Slide component for MDX navigation
import { Slide } from './SlideContext';

// =============================================================================
// Component Mapping
// =============================================================================

/**
 * Map of component names to React components.
 * These are the components available for use in MDX content.
 * 
 * IMPORTANT: Only L1-L3 components are mapped here.
 * L0 elements (div, span, etc.) are NOT mapped and will render as-is,
 * allowing the validator to detect their usage.
 */
export const mdxComponents = {
  // L1: Layouts
  LayoutCover,
  LayoutSplit,
  LayoutGrid,
  LayoutFullBleed,
  LayoutTimeline,
  LayoutDashboard,
  LayoutStacked,
  
  // Layout Slot Components (standalone use in MDX)
  Left,
  Right,
  Header,
  Main,
  Sidebar,
  Footer,
  Item,
  
  // L2: Blocks
  SmartList,
  ChartBar,
  ChartLine,
  ChartPie,
  ChartArea,
  ChartBubble,
  ChartRadar,
  ChartPolar,
  ChartCustom,
  BarStats,
  MetricGroup,
  MetricStrip,
  BigNum,
  TableData,
  QuoteBlock,
  ImageBlock,
  CardGroup,
  NetworkGraph,
  StepList,
  ProcessStrip,
  
  // NetworkGraph child components (JSX syntax)
  Node,
  Edge,
  Group,
  
  // Alias mappings for NetworkGraph (backward compatibility)
  SmartDiagram: NetworkGraph,
  Diagram: NetworkGraph,
  
  // Block Child Components (standalone use in MDX)
  Metric,
  Card,
  
  // L3: Atoms
  Heading,
  Text,
  Callout,
  Highlight,
  
  // Slide wrapper for navigation (used when rendering full MDX file)
  Slide,
};

// =============================================================================
// Provider Component
// =============================================================================

export interface MDXProviderProps {
  children: ReactNode;
  /** Additional components to merge with defaults */
  components?: Record<string, React.ComponentType<unknown>>;
}

/**
 * MDXProvider Component
 * 
 * Wraps MDX content to provide component mappings.
 * All MDX content should be wrapped in this provider.
 */
export function MDXProvider({
  children,
  components = {},
}: MDXProviderProps): JSX.Element {
  // Merge custom components with defaults
  const mergedComponents = {
    ...mdxComponents,
    ...components,
  };
  
  return (
    <BaseMDXProvider components={mergedComponents}>
      {children}
    </BaseMDXProvider>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get list of all available component names
 */
export function getAvailableComponents(): string[] {
  return Object.keys(mdxComponents);
}

/**
 * Check if a component name is registered
 */
export function isRegisteredComponent(name: string): boolean {
  return name in mdxComponents;
}

// =============================================================================
// Exports
// =============================================================================

export default MDXProvider;
