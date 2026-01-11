/**
 * Mock Content Registry
 * 
 * Factory functions for generating mock content for each component type.
 * Used by the Template Playground to test slot layouts and validate manifests.
 * 
 * Uses REAL Design System components with MOCK DATA for accurate visual testing.
 */

'use client';

import React from 'react';
import type { ComponentType } from './manifest-types';

// Import real components
import Heading from '@/components/atoms/Heading';
import Text from '@/components/atoms/Text';
import Callout from '@/components/atoms/Callout';
import Highlight from '@/components/atoms/Highlight';
import SmartList from '@/components/blocks/SmartList';
import StepList from '@/components/blocks/StepList';
import ProcessStrip from '@/components/blocks/ProcessStrip';
import MetricGroup from '@/components/blocks/MetricGroup';
import MetricStrip from '@/components/blocks/MetricStrip';
import MetricCard from '@/components/blocks/MetricCard';
import MetricBadges from '@/components/blocks/MetricBadges';
import BigNum from '@/components/blocks/BigNum';
import TableData from '@/components/blocks/TableData';
import QuoteBlock from '@/components/blocks/QuoteBlock';
import ImageBlock from '@/components/blocks/ImageBlock';
import CardGroup from '@/components/blocks/CardGroup';
import Timeline from '@/components/layouts/LayoutTimeline';

// Lazy-loaded chart components
import { LazyChartBar, LazyChartLine, LazyChartPie } from '@/utils/lazy-charts';

// NetworkGraph is not used anymore
// import dynamic from 'next/dynamic';
// const NetworkGraph = dynamic(() => import('@/components/blocks/NetworkGraph'), { ssr: false });

// =============================================================================
// Mock Data Generators
// =============================================================================

/**
 * Generate mock data for chart components
 */
function getMockChartData(variant: 'short' | 'normal' | 'long') {
  const pointCount = variant === 'short' ? 3 : variant === 'long' ? 8 : 5;
  return Array(pointCount).fill(0).map((_, i) => ({
    label: `Q${i + 1}`,
    value: Math.floor(Math.random() * 100) + 20
  }));
}

/**
 * Generate mock content for a specific component type.
 */
export function generateMockContent(componentType: ComponentType, variant: 'short' | 'normal' | 'long' = 'normal'): React.ReactNode {
  const generators: Record<ComponentType, () => React.ReactNode> = {
    // L1: Atoms
    'Heading': () => React.createElement(Heading, { level: 2, children: 
      variant === 'short' ? 'Title' : variant === 'long' ? 'This is a Very Long Heading That Might Cause Layout Issues' : 'Sample Heading'
    }),
    'Text': () => React.createElement(Text, { variant: 'default', children:
      variant === 'short' 
        ? 'Sample text.' 
        : variant === 'long'
        ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
        : 'This is sample body text for testing layout and typography.'
    }),
    'Callout': () => React.createElement(Callout, { intent: 'info', children:
      'Important: This is a callout message for testing purposes'
    }),
    'Highlight': () => React.createElement(Highlight, { children:
      'Highlighted text content for emphasis'
    }),
    
    // L2: Blocks - Lists
    'SmartList': () => React.createElement(SmartList, {
      items: Array(variant === 'short' ? 2 : variant === 'long' ? 8 : 4).fill(0).map((_: any, i: any) => `List item ${i + 1}: Sample content`)
    }),
    'StepList': () => React.createElement(StepList, {
      items: Array(variant === 'short' ? 2 : variant === 'long' ? 6 : 3).fill(0).map((_: any, i: any) => `Step ${i + 1}: Complete this action item`)
    }),
    'ProcessStrip': () => React.createElement(ProcessStrip, {
      items: Array(variant === 'short' ? 2 : variant === 'long' ? 5 : 3).fill(0).map((_: any, i: any) => ({
        label: `Phase ${i + 1}`,
        description: 'Process step'
      }))
    }),
    
    // L2: Blocks - Metrics
    'MetricGroup': () => React.createElement('div', { className: 'mock-metricgroup', 'data-mock': 'MetricGroup', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
      ...Array(variant === 'short' ? 2 : variant === 'long' ? 6 : 4).fill(0).map((_: any, i: any) => 
        React.createElement('div', { key: i, style: { padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' } },
          React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold' } }, `${(i + 1) * 100}`),
          React.createElement('div', { style: { fontSize: '12px', color: '#666' } }, `Metric ${i + 1}`)
        )
      )
    ),
    'MetricStrip': () => React.createElement(MetricStrip, {
      metrics: Array(variant === 'short' ? 2 : variant === 'long' ? 5 : 3).fill(0).map((_: any, i: any) => ({
        label: `Label ${i + 1}`,
        value: `${(i + 1) * 10}%`
      }))
    }),
    'MetricCard': () => React.createElement(MetricCard, {
      metrics: [{
        icon: '👥',
        label: 'Total Users',
        value: '1,234'
      }]
    }),
    'MetricBadges': () => React.createElement(MetricBadges, {
      badges: Array(variant === 'short' ? 2 : variant === 'long' ? 6 : 4).fill(0).map((_: any, i: any) => ({
        label: `Badge ${i + 1}`,
        value: `${(i + 1) * 10}`
      }))
    }),
    'BigNum': () => React.createElement(BigNum, {
      value: '42',
      label: 'The Answer'
    }),

    // L2: Blocks - Charts
    'ChartBar': () => React.createElement(LazyChartBar, {
      data: getMockChartData(variant),
      title: 'Bar Chart Sample'
    }),
    'ChartLine': () => React.createElement(LazyChartLine, {
      data: getMockChartData(variant),
      title: 'Line Chart Sample'
    }),
    'ChartPie': () => React.createElement(LazyChartPie, {
      data: getMockChartData(variant),
      title: 'Pie Chart Sample'
    }),
    
    // L2: Blocks - Other
    'TableData': () => React.createElement(TableData, {
      headers: ['Column 1', 'Column 2', 'Value'],
      rows: Array(variant === 'short' ? 2 : variant === 'long' ? 8 : 4).fill(0).map((_: any, i: any) => [
        `Item ${i + 1}`,
        `Data ${i + 1}`,
        `$${(i + 1) * 100}`
      ])
    }),
    'QuoteBlock': () => React.createElement(QuoteBlock, {
      children: variant === 'short' 
        ? 'Great quote.'
        : variant === 'long'
        ? 'This is an exceptionally long quote that demonstrates how the layout handles extended content. It might span multiple lines and test the boundaries of the container. We want to see how it wraps and whether it maintains readability.'
        : 'This is an inspiring quote that demonstrates wisdom and insight.',
      author: 'Author Name'
    }),
    'ImageBlock': () => React.createElement(ImageBlock, {
      src: 'https://via.placeholder.com/800x600/e0e0e0/666666?text=Image+Placeholder',
      alt: 'Sample image for testing',
      fit: 'cover'
    }),
    'CardGroup': () => React.createElement(CardGroup, {
      cards: Array(variant === 'short' ? 2 : variant === 'long' ? 6 : 3).fill(0).map((_: any, i: any) => ({
        title: `Card ${i + 1}`,
        description: 'Card description text for testing layout',
        icon: '📊'
      }))
    }),
    'NetworkGraph': () => React.createElement('div', { 'data-mock': 'NetworkGraph', style: { padding: '20px', backgroundColor: '#f5f5f5' } },
      'Network Graph Placeholder'
    ),
    
    // L3: Compound
    'Timeline': () => React.createElement('div', { className: 'mock-timeline', 'data-mock': 'Timeline', style: { position: 'relative', paddingLeft: '40px' } },
      ...Array(variant === 'short' ? 2 : variant === 'long' ? 6 : 4).fill(0).map((_: any, i: any) => 
        React.createElement('div', { key: i, style: { position: 'relative', marginBottom: '24px', paddingBottom: '24px', borderLeft: '2px solid #2196f3' } },
          React.createElement('div', { style: { position: 'absolute', left: '-8px', top: '0', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#2196f3' } }),
          React.createElement('div', { style: { paddingLeft: '24px' } },
            React.createElement('div', { style: { fontSize: '14px', fontWeight: 'bold' } }, `Q${i + 1} 2025`),
            React.createElement('div', { style: { fontSize: '12px', color: '#666', marginTop: '4px' } }, `Milestone event description ${i + 1}`)
          )
        )
      )
    )
  };
  
  const generator = generators[componentType];
  return generator ? generator() : null;
}

export function generateMockContentBatch(
  componentType: ComponentType, 
  count: number,
  variant: 'short' | 'normal' | 'long' = 'normal'
): React.ReactNode[] {
  return Array(count).fill(0).map((_: any, i: any) => 
    React.createElement('div', { key: `${componentType}-${i}` }, generateMockContent(componentType, variant))
  );
}

/**
 * Get all available component types for testing.
 */
export function getAllComponentTypes(): ComponentType[] {
  return [
    'Heading', 'Text', 'Callout', 'Highlight',
    'SmartList', 'StepList', 'ProcessStrip',
    'MetricGroup', 'MetricStrip', 'MetricCard', 'MetricBadges', 'BigNum',
    'ChartBar', 'ChartLine', 'ChartPie',
    'TableData', 'QuoteBlock', 'ImageBlock', 'CardGroup', 'NetworkGraph',
    'Timeline'
  ];
}
