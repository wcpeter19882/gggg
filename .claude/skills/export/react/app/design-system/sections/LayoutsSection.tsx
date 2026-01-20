import React from 'react';
import { ComponentShowcase } from '../components/ComponentShowcase';
import { LayoutCover } from '@/components/layouts/LayoutCover';
import { LayoutStacked } from '@/components/layouts/LayoutStacked';
import { LayoutSplit } from '@/components/layouts/LayoutSplit';
import { LayoutGrid } from '@/components/layouts/LayoutGrid';
import { LayoutDashboard, Header, Main, Sidebar } from '@/components/layouts/LayoutDashboard';
import { LayoutTimeline } from '@/components/layouts/LayoutTimeline';
// We use placeholder widgets to show how layouts arrange content
import { BigNum } from '@/components/blocks/BigNum';
import { Heading } from '@/components/atoms/Heading';
import { Text } from '@/components/atoms/Text';

const PLACEHOLDER_WIDGET_1 = <BigNum value="Left" label="Region A" />;
const PLACEHOLDER_WIDGET_2 = <BigNum value="Right" label="Region B" />;

export function LayoutsSection() {
  return (
    <section id="layouts" className="space-y-12 pt-16">
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Layouts</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Structural components that define how widgets are positioned on a slide.
        </p>
      </div>

      <ComponentShowcase
        title="LayoutCover"
        description="Used for title slides or section headers. Vertically centered content."
        component={LayoutCover}
        defaultProps={{
            title: "Project Alpha",
            subtitle: "Q3 Strategy Update",
            date: "October 2023",
            author: "Strategic Planning Team"
        }}
        propConfigs={[
          { name: 'title', type: 'text', label: 'Title' },
          { name: 'subtitle', type: 'text', label: 'Subtitle' },
          { name: 'date', type: 'text', label: 'Date' },
          { name: 'author', type: 'text', label: 'Author' }
        ]}
      />

      <ComponentShowcase
        title="LayoutStacked"
        description="Simple single-column vertical stack."
        component={LayoutStacked}
        defaultProps={{
            title: "Executive Summary"
        }}
         propConfigs={[
          { name: 'title', type: 'text', label: 'Layout Title' }
        ]}
      >
        <div className="w-full p-4 bg-blue-100 border border-blue-300 rounded text-center text-blue-800">
            Widget Slot 1
        </div>
        <div className="w-full p-4 bg-green-100 border border-green-300 rounded text-center text-green-800">
             Widget Slot 2
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="LayoutSplit"
        description="Two-column layout with adjustable ratios."
        component={LayoutSplit}
        defaultProps={{
            title: "Comparison",
            subtitle: "Year over Year analysis",
            split: "1-1"
        }}
        propConfigs={[
            { name: 'title', type: 'text', label: 'Title' },
            { name: 'split', type: 'select', options: ['1-1', '2-1', '1-2', '3-1', '1-3'], label: 'Split Ratio' }
        ]}
      >
         {/* LayoutSplit usually takes two children, or designated slots.
             If the component expects specific props for left/right content, pass them.
             Assuming it renders children in order into columns for this showcase. */}
         <div className="p-4 bg-purple-100 h-full rounded flex items-center justify-center">
            Left Content Area
         </div>
         <div className="p-4 bg-orange-100 h-full rounded flex items-center justify-center">
            Right Content Area
         </div>
      </ComponentShowcase>

       <ComponentShowcase
        title="LayoutGrid"
        description="Grid layout for displaying multiple items."
        component={LayoutGrid}
        defaultProps={{
            title: "Key Metrics Grid",
            columns: 2
        }}
        propConfigs={[
            { name: 'title', type: 'text' },
            { name: 'columns', type: 'number', label: 'Columns (2/3/4)' }
        ]}
      >
         <BigNum value="1" label="Grid Item" />
         <BigNum value="2" label="Grid Item" />
         <BigNum value="3" label="Grid Item" />
         <BigNum value="4" label="Grid Item" />
      </ComponentShowcase>

      <ComponentShowcase
        title="LayoutDashboard"
        description="Multi-panel dashboard layout with Header, Main, and Sidebar slots."
        component={LayoutDashboard}
        defaultProps={{
            variant: 'default'
        }}
        propConfigs={[
            { name: 'variant', type: 'select', options: ['default', 'wide-main', 'sidebar-focus'], label: 'Layout Variant' }
        ]}
      >
        <Header>
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
            <Heading level={3}>Dashboard Header</Heading>
          </div>
        </Header>
        <Main>
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded h-32 flex items-center justify-center">
            <Text>Main Content Area</Text>
          </div>
        </Main>
        <Sidebar>
          <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded h-32 flex items-center justify-center">
            <Text>Sidebar</Text>
          </div>
        </Sidebar>
      </ComponentShowcase>

      <ComponentShowcase
        title="LayoutTimeline"
        description="Horizontal timeline with alternating nodes above/below center line."
        component={LayoutTimeline}
        defaultProps={{}}
        propConfigs={[]}
      >
        <LayoutTimeline.Item year="2022">
          <Heading level={3}>Project Start</Heading>
          <Text>Initial research and planning phase</Text>
        </LayoutTimeline.Item>
        <LayoutTimeline.Item year="2023">
          <Heading level={3}>Development</Heading>
          <Text>Core feature implementation</Text>
        </LayoutTimeline.Item>
        <LayoutTimeline.Item year="2024" highlighted>
          <Heading level={3}>Launch</Heading>
          <Text>Public release and expansion</Text>
        </LayoutTimeline.Item>
      </ComponentShowcase>

    </section>
  );
}
