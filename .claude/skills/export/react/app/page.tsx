'use client';

/**
 * Index Page - Presentation Viewer
 * 
 * Entry point for the presentation. Displays the slide deck with navigation.
 */

import React from 'react';
import { SlideContainer, SlideWrapper } from '@/components';
import { LayoutCover, LayoutSplit, LayoutGrid, LayoutTimeline } from '@/components/layouts';
import { Heading, Text, Callout, Highlight } from '@/components/atoms';
import { SmartList, ChartBar, MetricGroup, StepList, ProcessStrip } from '@/components/blocks';

/**
 * Demo Presentation
 * 
 * This is a sample presentation demonstrating the available components.
 * In production, slides would be loaded from MDX files.
 */
export default function HomePage(): JSX.Element {
  return (
    <SlideContainer currentSlide={1}>
      {/* Slide 1: Timeline Demo */}
      <SlideWrapper index={0} isActive={false}>
        <LayoutTimeline headline="Company Timeline">
          <LayoutTimeline.Item year="2020">
            <Heading level={3}>Product Launch</Heading>
            <Text>Released v1.0 to market</Text>
          </LayoutTimeline.Item>
          <LayoutTimeline.Item year="2021">
            <Heading level={3}>Team Growth</Heading>
            <Text>Expanded to 25 members</Text>
          </LayoutTimeline.Item>
          <LayoutTimeline.Item year="2022" highlighted={true}>
            <Heading level={3}>Series A</Heading>
            <Text>Raised $10M funding</Text>
          </LayoutTimeline.Item>
          <LayoutTimeline.Item year="2023">
            <Heading level={3}>Enterprise</Heading>
            <Text>Fortune 500 tier</Text>
          </LayoutTimeline.Item>
          <LayoutTimeline.Item year="2024">
            <Heading level={3}>Global</Heading>
            <Text>50 countries reached</Text>
          </LayoutTimeline.Item>
        </LayoutTimeline>
      </SlideWrapper>
      
      {/* Slide 2: Cover with Highlights */}
      <SlideWrapper index={1} isActive={true}>
        <LayoutCover>
          <Heading level={1}>React MDX Renderer</Heading>
          <Text variant="lead">
            We achieved <Highlight color="success">10x growth</Highlight> this quarter with <Highlight color="primary" bold>$1.2M</Highlight> in revenue.
          </Text>
        </LayoutCover>
      </SlideWrapper>
      
      {/* Slide 3: Split Layout */}
      <SlideWrapper index={2} isActive={false}>
        <LayoutSplit ratio="2:1">
          <LayoutSplit.Left>
            <Heading level={2}>Key Features</Heading>
            <SmartList 
              items={[
                'Semantic components only',
                'No raw HTML or CSS',
                'Theme-aware styling',
                'Compound component patterns',
              ]}
            />
          </LayoutSplit.Left>
          <LayoutSplit.Right>
            <Callout intent="info" title="Pro Tip">
              All styling is handled internally via CSS variables.
            </Callout>
          </LayoutSplit.Right>
        </LayoutSplit>
      </SlideWrapper>
      
      {/* Slide 4: Grid with Metrics */}
      <SlideWrapper index={3} isActive={false}>
        <LayoutGrid cols={2}>
          <LayoutGrid.Col>
            <Heading level={2}>Performance</Heading>
            <MetricGroup 
              metrics={[
                { value: '<2s', label: 'Render Time', change: -15 },
                { value: '<500KB', label: 'Export Size' },
              ]}
              cols={1}
            />
          </LayoutGrid.Col>
          <LayoutGrid.Col>
            <Heading level={2}>Usage</Heading>
            <ChartBar 
              title="Adoption Rate"
              data={[
                { label: 'Q1', value: 100 },
                { label: 'Q2', value: 250 },
                { label: 'Q3', value: 400 },
                { label: 'Q4', value: 600 },
              ]}
              height="md"
            />
          </LayoutGrid.Col>
        </LayoutGrid>
      </SlideWrapper>
    </SlideContainer>
  );
}
