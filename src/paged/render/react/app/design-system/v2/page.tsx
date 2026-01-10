'use client';

/**
 * Design System V2 Page
 * 
 * Sandbox for testing the new 4-layer architecture:
 * - Template: The skeleton (macro grid)
 * - Slot: Semantic regions
 * - SlotLayout: Structural strategy (Stack, Grid, Fit)
 * - Component: Atomic content
 * 
 * Each template is showcased with skeleton placeholders to visualize
 * the slot structure clearly.
 */

import React, { useState } from 'react';
import { ShowcaseProvider, useShowcase } from '../components/ShowcaseContext';
import { ShowcaseToolbar } from '../components/ShowcaseToolbar';
import { SlidePreview } from '../components/SlidePreview';

// V2 Templates
import { TemplateSingleColumn } from '@/components/templates/TemplateSingleColumn';
import { TemplateTwoColumn } from '@/components/templates/TemplateTwoColumn';
import { TemplateDashboard } from '@/components/templates/TemplateDashboard';
import { TemplateCover } from '@/components/templates/TemplateCover';
import { TemplateFullBleed } from '@/components/templates/TemplateFullBleed';

// V2 SlotLayouts
import { SlotLayoutStack } from '@/components/slot-layouts/SlotLayoutStack';
import { SlotLayoutGrid } from '@/components/slot-layouts/SlotLayoutGrid';
import { SlotLayoutFit } from '@/components/slot-layouts/SlotLayoutFit';

// Atom Components
import { Heading } from '@/components/atoms/Heading';
import { Text } from '@/components/atoms/Text';
import { Callout } from '@/components/atoms/Callout';
import { Highlight } from '@/components/atoms/Highlight';

// Block Components
import { SmartList } from '@/components/blocks/SmartList';
import { StepList } from '@/components/blocks/StepList';
import { QuoteBlock } from '@/components/blocks/QuoteBlock';
import { BigNum } from '@/components/blocks/BigNum';
import { MetricGroup } from '@/components/blocks/MetricGroup';
import { MetricCard } from '@/components/blocks/MetricCard';
import { MetricStrip } from '@/components/blocks/MetricStrip';
import { MetricBadges } from '@/components/blocks/MetricBadges';
import { CardGroup } from '@/components/blocks/CardGroup';
import { BarStats } from '@/components/blocks/BarStats';
import { ChartBar } from '@/components/blocks/ChartBar';
import { ChartLine } from '@/components/blocks/ChartLine';
import { ChartPie } from '@/components/blocks/ChartPie';
import { ChartArea } from '@/components/blocks/ChartArea';
import { ChartPolar } from '@/components/blocks/ChartPolar';
import { ChartRadar } from '@/components/blocks/ChartRadar';
import { ChartBubble } from '@/components/blocks/ChartBubble';
import { ChartCustom } from '@/components/blocks/ChartCustom';
import { ImageBlock } from '@/components/blocks/ImageBlock';
import { ProcessStrip } from '@/components/blocks/ProcessStrip';
import { TableData } from '@/components/blocks/TableData';
import { NetworkGraph, Node as GraphNode, Edge as GraphEdge } from '@/components/blocks/NetworkGraph';

// Component Mocks
import * as mocks from './componentMocks';

// =============================================================================
// V2 Sidebar Navigation
// =============================================================================

const V2_SECTIONS = [
  { id: 'templates', label: 'Templates' },
  { id: 'slotlayouts', label: 'SlotLayouts' },
  { id: 'components', label: 'Components' },
  { id: 'atoms', label: '  → Atoms', indent: true },
  { id: 'blocks-text', label: '  → Text & Display', indent: true },
  { id: 'blocks-metrics', label: '  → Metrics', indent: true },
  { id: 'blocks-charts', label: '  → Charts', indent: true },
  { id: 'blocks-special', label: '  → Special', indent: true },
];

function V2NavSidebar() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="w-56 h-screen sticky top-0 bg-white border-r border-neutral-200 p-4 flex flex-col hidden lg:flex">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-neutral-900">
          Design System
        </h1>
        <p className="text-xs text-neutral-500 mt-1">V2 Architecture</p>
      </div>

      <ul className="space-y-0.5">
        {V2_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-colors ${
                (section as any).indent ? 'text-xs pl-6' : ''
              }`}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4 border-t border-neutral-200">
         <p className="text-xs text-neutral-400">
            Slide: 1920×1080
         </p>
      </div>
    </nav>
  );
}

// =============================================================================
// Skeleton Placeholder Components
// =============================================================================

interface SkeletonProps {
  label: string;
  variant?: 'header' | 'body' | 'footer' | 'title' | 'subtitle' | 'meta' | 'media' | 'sidebar' | 'main' | 'left' | 'right' | 'overlay';
  height?: string;
}

/**
 * Skeleton placeholder for visualizing template slots
 */
function Skeleton({ label, variant = 'body', height }: SkeletonProps): JSX.Element {
  const variantStyles: Record<string, string> = {
    header: 'bg-blue-500/20 border-blue-500/40',
    body: 'bg-green-500/20 border-green-500/40',
    footer: 'bg-amber-500/20 border-amber-500/40',
    title: 'bg-purple-500/30 border-purple-500/50',
    subtitle: 'bg-purple-400/20 border-purple-400/40',
    meta: 'bg-gray-400/20 border-gray-400/40',
    media: 'bg-slate-600/30 border-slate-600/50',
    sidebar: 'bg-cyan-500/20 border-cyan-500/40',
    main: 'bg-emerald-500/20 border-emerald-500/40',
    left: 'bg-indigo-500/20 border-indigo-500/40',
    right: 'bg-rose-500/20 border-rose-500/40',
    overlay: 'bg-white/20 border-white/40',
  };

  const style = variantStyles[variant] || variantStyles.body;

  return (
    <div 
      className={`skeleton-placeholder flex items-center justify-center rounded-lg border-2 border-dashed ${style}`}
      style={{ 
        height: height || '100%',
        minHeight: height || '80px',
      }}
    >
      <span className="text-lg font-mono font-semibold opacity-80 px-4 py-2 rounded bg-black/20">
        {label}
      </span>
    </div>
  );
}

/**
 * Demo content box for SlotLayout showcases
 */
function DemoBox({ label, color = 'blue' }: { label: string; color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose' }): JSX.Element {
  const colorMap = {
    blue: 'bg-blue-500/30 border-blue-500/50 text-blue-900',
    green: 'bg-green-500/30 border-green-500/50 text-green-900',
    purple: 'bg-purple-500/30 border-purple-500/50 text-purple-900',
    amber: 'bg-amber-500/30 border-amber-500/50 text-amber-900',
    rose: 'bg-rose-500/30 border-rose-500/50 text-rose-900',
  };

  return (
    <div className={`flex items-center justify-center rounded-lg border-2 border-dashed p-4 ${colorMap[color]}`}>
      <span className="text-base font-mono font-semibold">{label}</span>
    </div>
  );
}

/**
 * Skeleton lines for simulating text content
 */
function SkeletonLines({ count = 3 }: { count?: number }): JSX.Element {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="h-3 bg-current opacity-20 rounded"
          style={{ width: i === count - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton chart placeholder
 */
function SkeletonChart(): JSX.Element {
  return (
    <div className="flex items-end justify-around gap-2 h-full p-4">
      {[40, 70, 55, 85, 60, 75].map((h, i) => (
        <div 
          key={i} 
          className="w-8 bg-current opacity-20 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton metric cards
 */
function SkeletonMetrics(): JSX.Element {
  return (
    <div className="flex flex-col gap-3 h-full justify-center">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg bg-current opacity-10">
          <div className="h-2 w-12 bg-current opacity-30 rounded mb-2" />
          <div className="h-5 w-16 bg-current opacity-40 rounded" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Template Showcase Component (Props beside preview)
// =============================================================================

interface TemplateShowcaseProps {
  title: string;
  description: string;
  children: React.ReactNode;
  propInfo?: string;
}

function TemplateShowcase({ title, description, children, propInfo }: TemplateShowcaseProps): JSX.Element {
  const { theme, vibe, showBounds } = useShowcase();

  return (
    <div className="template-showcase bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {theme} · {vibe}
          </span>
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
            v2 template
          </span>
        </div>
      </div>

      {/* Preview + Props Side by Side */}
      <div className="flex">
        {/* Preview */}
        <div className="flex-1 p-3 bg-neutral-100">
          <SlidePreview theme={theme} vibe={vibe} showBounds={showBounds} fillContainer>
            {children}
          </SlidePreview>
        </div>

        {/* Props Info (beside preview) */}
        {propInfo && (
          <div className="w-80 border-l border-neutral-200 bg-neutral-50 p-4 overflow-auto">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Props & Slots</div>
            <pre className="text-xs font-mono text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {propInfo}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Component In Context Showcase Component
// =============================================================================

interface ComponentInContextShowcaseProps {
  title: string;
  description: string;
  children: React.ReactNode;
  slotLayout: 'Stack' | 'Grid' | 'Fit';
  propInfo?: string;
}

function ComponentInContextShowcase({ 
  title, 
  description, 
  children, 
  slotLayout,
  propInfo 
}: ComponentInContextShowcaseProps): JSX.Element {
  const { theme, vibe, showBounds } = useShowcase();

  return (
    <div className="component-showcase bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {theme} · {vibe}
          </span>
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
            {slotLayout}
          </span>
        </div>
      </div>

      {/* Preview + Props Side by Side */}
      <div className="flex">
        {/* Preview */}
        <div className="flex-1 p-3 bg-neutral-100">
          <SlidePreview theme={theme} vibe={vibe} showBounds={showBounds} fillContainer>
            {children}
          </SlidePreview>
        </div>

        {/* Props Info (beside preview) */}
        {propInfo && (
          <div className="w-80 border-l border-neutral-200 bg-neutral-50 p-4 overflow-auto">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Props</div>
            <pre className="text-xs font-mono text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {propInfo}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SlotLayout Showcase Component (Props beside preview)
// =============================================================================

interface SlotLayoutShowcaseProps {
  title: string;
  description: string;
  children: React.ReactNode;
  propInfo?: string;
}

function SlotLayoutShowcase({ title, description, children, propInfo }: SlotLayoutShowcaseProps): JSX.Element {
  return (
    <div className="slotlayout-showcase bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
        </div>
        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
          slotlayout
        </span>
      </div>

      {/* Preview + Props Side by Side */}
      <div className="flex">
        {/* Preview */}
        <div className="flex-1 p-6 bg-neutral-100">
          <div className="bg-white rounded-lg border border-neutral-200 p-6 min-h-[200px]">
            {children}
          </div>
        </div>

        {/* Props Info (beside preview) */}
        {propInfo && (
          <div className="w-80 border-l border-neutral-200 bg-neutral-50 p-4 overflow-auto">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Props</div>
            <pre className="text-xs font-mono text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {propInfo}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function DesignSystemV2Page() {
  return (
    <ShowcaseProvider defaultTheme="business" defaultVibe="balanced">
      <div className="design-system-page flex min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <V2NavSidebar />

        <div className="flex-1 flex flex-col">
          <ShowcaseToolbar />

          <main className="flex-1 overflow-y-auto">
            <div className="w-full px-6 py-6">
              {/* Header */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-neutral-900">
                    Design System V2
                  </h1>
                  <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                    4-Layer Architecture
                  </span>
                </div>
                <p className="text-base text-neutral-600 max-w-3xl">
                  Schema-driven architecture for deterministic slide rendering.
                  Templates define <strong>WHERE</strong> content goes, SlotLayouts define <strong>HOW</strong> content arranges, 
                  and Components are <strong>WHAT</strong> gets rendered.
                </p>
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
                  <strong>4-Layer Architecture:</strong> Template → Slot → SlotLayout → Component
                </div>
              </div>

              {/* ============================================================= */}
              {/* TEMPLATES SECTION */}
              {/* ============================================================= */}
              <section id="templates" className="mb-16">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Templates</h2>
                  <p className="text-neutral-600">
                    Macro grid skeletons that define semantic slot regions. Templates determine WHERE content is placed.
                  </p>
                </div>

                <div className="space-y-10">
                
                {/* TemplateSingleColumn */}
                <TemplateShowcase
                  title="TemplateSingleColumn"
                  description="Single-column template with header, body, and footer slots. Replaces LayoutStacked, LayoutGrid, LayoutTimeline."
                  propInfo={`interface TemplateSingleColumnProps {
  header?: ReactNode;  // Optional header area
  body: ReactNode;     // Main content area (required)
  footer?: ReactNode;  // Optional footer area
  align?: 'left' | 'center';
  theme?: ThemeName;
  vibe?: VibeLevel;
}`}
                >
                  <TemplateSingleColumn
                    header={<Skeleton label="header" variant="header" height="80px" />}
                    body={
                      <div className="flex flex-col gap-4 h-full">
                        <Skeleton label="body (SlotLayout goes here)" variant="body" height="100%" />
                      </div>
                    }
                    footer={<Skeleton label="footer" variant="footer" height="60px" />}
                  />
                </TemplateShowcase>

                {/* TemplateTwoColumn */}
                <TemplateShowcase
                  title="TemplateTwoColumn"
                  description="Two-column template with configurable ratio. Replaces LayoutSplit."
                  propInfo={`interface TemplateTwoColumnProps {
  header?: ReactNode;  // Optional header spanning both columns
  left: ReactNode;     // Left column slot (required)
  right: ReactNode;    // Right column slot (required)
  footer?: ReactNode;  // Optional footer spanning both columns
  ratio?: '1:1' | '1:2' | '2:1' | '1:3' | '3:1';
  theme?: ThemeName;
  vibe?: VibeLevel;
}`}
                >
                  <TemplateTwoColumn
                    ratio="2:1"
                    header={<Skeleton label="header" variant="header" height="80px" />}
                    left={<Skeleton label="left (ratio: 2)" variant="left" />}
                    right={<Skeleton label="right (ratio: 1)" variant="right" />}
                    footer={<Skeleton label="footer" variant="footer" height="60px" />}
                  />
                </TemplateShowcase>

                {/* TemplateDashboard */}
                <TemplateShowcase
                  title="TemplateDashboard"
                  description="Dashboard-style template optimized for data visualization. Replaces LayoutDashboard."
                  propInfo={`interface TemplateDashboardProps {
  header?: ReactNode;  // Optional header (full width)
  main: ReactNode;     // Primary data/chart area (required)
  sidebar: ReactNode;  // Secondary metrics area (required)
  footer?: ReactNode;  // Optional footer (full width)
  variant?: 'default' | 'wide-main' | 'sidebar-focus';
  theme?: ThemeName;
  vibe?: VibeLevel;
}`}
                >
                  <TemplateDashboard
                    variant="wide-main"
                    header={<Skeleton label="header" variant="header" height="80px" />}
                    main={
                      <div className="h-full flex flex-col">
                        <Skeleton label="main (chart area)" variant="main" height="100%" />
                      </div>
                    }
                    sidebar={
                      <div className="h-full">
                        <Skeleton label="sidebar (metrics)" variant="sidebar" height="100%" />
                      </div>
                    }
                  />
                </TemplateShowcase>

                {/* TemplateCover */}
                <TemplateShowcase
                  title="TemplateCover"
                  description="Cover/title slide template with dedicated semantic slots. Replaces LayoutCover."
                  propInfo={`interface TemplateCoverProps {
  title: ReactNode;       // Main title (required)
  subtitle?: ReactNode;   // Subtitle or tagline
  meta?: ReactNode;       // Metadata (author, date, etc.)
  background?: ReactNode; // Optional background element
  align?: 'center' | 'left' | 'right';
  theme?: ThemeName;
  vibe?: VibeLevel;
}`}
                >
                  <TemplateCover
                    title={<Skeleton label="title" variant="title" height="100px" />}
                    subtitle={<Skeleton label="subtitle" variant="subtitle" height="50px" />}
                    meta={<Skeleton label="meta" variant="meta" height="30px" />}
                  />
                </TemplateShowcase>

                {/* TemplateFullBleed */}
                <TemplateShowcase
                  title="TemplateFullBleed"
                  description="Full-bleed template with background media and content overlay. Replaces LayoutFullBleed."
                  propInfo={`interface TemplateFullBleedProps {
  media: ReactNode;      // Background media (required)
  overlay: ReactNode;    // Content overlay (required)
  overlayPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | ...;
  overlayOpacity?: number; // Scrim opacity (0-1)
  theme?: ThemeName;
  vibe?: VibeLevel;
}`}
                >
                  <TemplateFullBleed
                    media={<Skeleton label="media (background)" variant="media" />}
                    overlay={
                      <div className="text-white">
                        <Skeleton label="overlay (content)" variant="overlay" height="200px" />
                      </div>
                    }
                    overlayPosition="center"
                    overlayOpacity={0.5}
                  />
                </TemplateShowcase>

                </div>
              </section>

              {/* ============================================================= */}
              {/* SLOTLAYOUTS SECTION */}
              {/* ============================================================= */}
              <section id="slotlayouts" className="mb-16">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">SlotLayouts</h2>
                  <p className="text-neutral-600">
                    Pure structural primitives that arrange components within slots. SlotLayouts determine HOW content is arranged.
                  </p>
                </div>

                <div className="space-y-10">

                  {/* SlotLayoutStack */}
                  <SlotLayoutShowcase
                    title="SlotLayoutStack"
                    description="Vertical flex stacking with configurable gap, alignment, and justification."
                    propInfo={`interface SlotLayoutStackProps {
  children: ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  className?: string;
}

// Gap values:
// none: 0px | xs: 4px | sm: 8px
// md: 16px | lg: 24px | xl: 32px`}
                  >
                    <div className="flex gap-8">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2">gap="md" align="stretch"</div>
                        <SlotLayoutStack gap="md" align="stretch">
                          <DemoBox label="Item 1" color="blue" />
                          <DemoBox label="Item 2" color="blue" />
                          <DemoBox label="Item 3" color="blue" />
                        </SlotLayoutStack>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2">gap="lg" align="center"</div>
                        <SlotLayoutStack gap="lg" align="center">
                          <DemoBox label="Item 1" color="green" />
                          <DemoBox label="Item 2" color="green" />
                          <DemoBox label="Item 3" color="green" />
                        </SlotLayoutStack>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2">gap="sm" justify="between"</div>
                        <div className="h-[220px]">
                          <SlotLayoutStack gap="sm" justify="between" className="h-full">
                            <DemoBox label="Top" color="purple" />
                            <DemoBox label="Middle" color="purple" />
                            <DemoBox label="Bottom" color="purple" />
                          </SlotLayoutStack>
                        </div>
                      </div>
                    </div>
                  </SlotLayoutShowcase>

                  {/* SlotLayoutGrid */}
                  <SlotLayoutShowcase
                    title="SlotLayoutGrid"
                    description="CSS Grid layout for arranging items in columns."
                    propInfo={`interface SlotLayoutGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Gap values:
// sm: 8px | md: 16px | lg: 24px`}
                  >
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-semibold text-neutral-500 mb-2">cols={2} gap="md"</div>
                        <SlotLayoutGrid cols={2} gap="md">
                          <DemoBox label="Cell 1" color="amber" />
                          <DemoBox label="Cell 2" color="amber" />
                          <DemoBox label="Cell 3" color="amber" />
                          <DemoBox label="Cell 4" color="amber" />
                        </SlotLayoutGrid>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500 mb-2">cols={4} gap="sm"</div>
                        <SlotLayoutGrid cols={4} gap="sm">
                          <DemoBox label="1" color="rose" />
                          <DemoBox label="2" color="rose" />
                          <DemoBox label="3" color="rose" />
                          <DemoBox label="4" color="rose" />
                        </SlotLayoutGrid>
                      </div>
                    </div>
                  </SlotLayoutShowcase>

                  {/* SlotLayoutFit */}
                  <SlotLayoutShowcase
                    title="SlotLayoutFit"
                    description="Forces child to fill container. Ideal for visual-heavy content (charts, images)."
                    propInfo={`interface SlotLayoutFitProps {
  children: ReactNode;
  mode?: 'cover' | 'contain' | 'fill';
  align?: 'start' | 'center' | 'end';
  valign?: 'start' | 'center' | 'end';
  className?: string;
}

// CSS custom property --slot-fit-mode
// is set for children to inherit.`}
                  >
                    <div className="flex gap-8">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2">mode="cover" (default)</div>
                        <div className="h-[160px] border border-dashed border-neutral-300 rounded-lg overflow-hidden">
                          <SlotLayoutFit mode="cover">
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                              Cover Mode
                            </div>
                          </SlotLayoutFit>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2">mode="contain" align="center"</div>
                        <div className="h-[160px] border border-dashed border-neutral-300 rounded-lg overflow-hidden bg-neutral-50">
                          <SlotLayoutFit mode="contain" align="center" valign="center">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                              Contain
                            </div>
                          </SlotLayoutFit>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-neutral-500 mb-2">mode="fill"</div>
                        <div className="h-[160px] border border-dashed border-neutral-300 rounded-lg overflow-hidden">
                          <SlotLayoutFit mode="fill">
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-semibold">
                              Fill Mode
                            </div>
                          </SlotLayoutFit>
                        </div>
                      </div>
                    </div>
                  </SlotLayoutShowcase>

                </div>
              </section>

              {/* ============================================================= */}
              {/* COMPONENTS SECTION */}
              {/* ============================================================= */}
              <section id="components" className="mb-16">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Components</h2>
                  <p className="text-neutral-600">
                    Atomic content units demonstrated within Templates and SlotLayouts. Components are the WHAT that gets rendered.
                  </p>
                </div>

                {/* ATOMS SUBSECTION */}
                <div id="atoms" className="mb-12">
                  <h3 className="text-xl font-semibold text-neutral-800 mb-4">Atoms (L1)</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    Typography and inline content components. Atoms are the smallest building blocks.
                  </p>

                  <div className="space-y-6">
                    {/* Heading */}
                    <ComponentInContextShowcase
                      title="Heading"
                      description="Semantic heading component with 6 levels (h1-h6)"
                      slotLayout="Stack"
                      propInfo={`level: 1 | 2 | 3 | 4 | 5 | 6
children: ReactNode`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={1}>Main Title</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Heading level={2}>Section Heading</Heading>
                            <Heading level={3}>Subsection Heading</Heading>
                            <Text>Headings provide semantic structure and visual hierarchy to your slides.</Text>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* Text */}
                    <ComponentInContextShowcase
                      title="Text"
                      description="Semantic text component with variants for different text styles"
                      slotLayout="Stack"
                      propInfo={`variant: 'default' | 'lead' | 'caption' | 'code'
children: ReactNode`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Text Variants</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Text variant="lead">{mocks.textMock.children}</Text>
                            <Text variant="default">This is default body text for regular content.</Text>
                            <Text variant="caption">Caption text for supporting information</Text>
                            <Text variant="code">const example = "inline code";</Text>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* Callout */}
                    <ComponentInContextShowcase
                      title="Callout"
                      description="Alert/info box with intent-based styling"
                      slotLayout="Stack"
                      propInfo={`intent: 'info' | 'warning' | 'success' | 'danger'
title?: string
children: ReactNode`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Callout Examples</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Callout intent="info" title="Information">
                              This is an informational callout for general notices.
                            </Callout>
                            <Callout intent="success" title="Success">
                              Operation completed successfully!
                            </Callout>
                            <Callout intent="warning" title="Warning">
                              Please review these important considerations.
                            </Callout>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* Highlight */}
                    <ComponentInContextShowcase
                      title="Highlight"
                      description="Inline text emphasis with color variants"
                      slotLayout="Stack"
                      propInfo={`color: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'accent'
bold?: boolean
children: ReactNode`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Inline Highlights</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Text>
                              Our revenue grew to <Highlight color="success" bold>$1.2M</Highlight> this quarter.
                            </Text>
                            <Text>
                              Key metric: <Highlight color="primary" bold>47K active users</Highlight> across the platform.
                            </Text>
                            <Text>
                              Warning: <Highlight color="warning">System maintenance</Highlight> scheduled for tomorrow.
                            </Text>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>
                  </div>
                </div>

                {/* TEXT & DISPLAY BLOCKS SUBSECTION */}
                <div id="blocks-text" className="mb-12">
                  <h3 className="text-xl font-semibold text-neutral-800 mb-4">Blocks - Text & Display</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    Content blocks for lists, steps, and quotations.
                  </p>

                  <div className="space-y-6">
                    {/* SmartList */}
                    <ComponentInContextShowcase
                      title="SmartList"
                      description="Semantic list with support for nested items and icons"
                      slotLayout="Stack"
                      propInfo={`id: string
items: string[] | ListItem[]
ordered?: boolean
icon?: string`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Key Features</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Text variant="lead">Our platform delivers enterprise-grade capabilities:</Text>
                            <SmartList {...mocks.smartListMock} />
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* StepList */}
                    <ComponentInContextShowcase
                      title="StepList"
                      description="Vertical numbered steps for processes and workflows"
                      slotLayout="Stack"
                      propInfo={`id: string
items: string[] | StepItem[]
startNumber?: number`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Development Process</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Text variant="lead">Our agile methodology follows these key phases:</Text>
                            <StepList {...mocks.stepListMock} />
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* QuoteBlock */}
                    <ComponentInContextShowcase
                      title="QuoteBlock"
                      description="Styled testimonial or citation block"
                      slotLayout="Stack"
                      propInfo={`id: string
children: ReactNode
author?: string
role?: string
size?: 'sm' | 'md' | 'lg'`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Customer Testimonial</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <QuoteBlock {...mocks.quoteBlockMock} />
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>
                  </div>
                </div>

                {/* METRICS BLOCKS SUBSECTION */}
                <div id="blocks-metrics" className="mb-12">
                  <h3 className="text-xl font-semibold text-neutral-800 mb-4">Blocks - Metrics</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    KPI and metric display components for data-driven presentations.
                  </p>

                  <div className="space-y-6">
                    {/* BigNum */}
                    <ComponentInContextShowcase
                      title="BigNum"
                      description="Hero metric display for standout statistics"
                      slotLayout="Stack"
                      propInfo={`id: string
value: string
label: string
sublabel?: string
trend?: string`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>User Growth</Heading>}
                        body={
                          <SlotLayoutStack gap="md" align="center">
                            <BigNum {...mocks.bigNumMock} />
                            <Text variant="caption">Sustained growth across all markets</Text>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* MetricGroup */}
                    <ComponentInContextShowcase
                      title="MetricGroup"
                      description="Grid of multiple metrics with values and change indicators"
                      slotLayout="Stack"
                      propInfo={`id: string
cols: 1 | 2 | 3 | 4
children: Metric[]`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Q4 Performance</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Text variant="lead">Key performance indicators showing strong quarterly results.</Text>
                            <MetricGroup id={mocks.metricGroupMock.id} cols={mocks.metricGroupMock.cols}>
                              {mocks.metricGroupMock.children.map((metric: any, idx: number) => (
                                <div key={idx} className="metric">
                                  <div className="metric-value">{metric.value}</div>
                                  <div className="metric-label">{metric.label}</div>
                                  {metric.change && <div className="metric-change">+{metric.change}%</div>}
                                </div>
                              ))}
                            </MetricGroup>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* MetricCard */}
                    <ComponentInContextShowcase
                      title="MetricCard"
                      description="Segmented summary card with categorized metrics"
                      slotLayout="Stack"
                      propInfo={`id: string
title?: string
items: MetricCardItem[]
orientation: 'vertical' | 'horizontal'`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Engagement Summary</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <MetricCard {...mocks.metricCardMock} />
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* MetricStrip */}
                    <ComponentInContextShowcase
                      title="MetricStrip"
                      description="Inline horizontal compact metrics row"
                      slotLayout="Stack"
                      propInfo={`id: string
items: MetricStripItem[]`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Company Overview</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Text variant="lead">Global reach and impact</Text>
                            <MetricStrip {...mocks.metricStripMock} />
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* MetricBadges */}
                    <ComponentInContextShowcase
                      title="MetricBadges"
                      description="Compact badge array for multiple small metrics"
                      slotLayout="Stack"
                      propInfo={`id: string
items: BadgeItem[]`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Credentials & Stats</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <MetricBadges {...mocks.metricBadgesMock} />
                            <Text variant="caption">Industry-leading certifications and performance</Text>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* CardGroup */}
                    <ComponentInContextShowcase
                      title="CardGroup"
                      description="Grid of cards with consistent styling"
                      slotLayout="Stack"
                      propInfo={`id: string
columns: 2 | 3 | 4
children: Card[]`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Platform Benefits</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <CardGroup id={mocks.cardGroupMock.id} columns={mocks.cardGroupMock.columns}>
                              {mocks.cardGroupMock.children.map((card: any, idx: number) => (
                                <div key={idx} className="card">
                                  <div className="card-icon">{card.icon}</div>
                                  <div className="card-title">{card.title}</div>
                                  <div className="card-description">{card.description}</div>
                                </div>
                              ))}
                            </CardGroup>
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* BarStats */}
                    <ComponentInContextShowcase
                      title="BarStats"
                      description="Horizontal bar chart for rankings and comparisons"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: ChartDataPoint[]
sortDescending?: boolean`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Regional Performance</Heading>}
                        body={
                          <SlotLayoutFit>
                            <BarStats {...mocks.barStatsMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>
                  </div>
                </div>

                {/* CHARTS BLOCKS SUBSECTION */}
                <div id="blocks-charts" className="mb-12">
                  <h3 className="text-xl font-semibold text-neutral-800 mb-4">Blocks - Charts</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    Data visualization components for presenting numeric data.
                  </p>

                  <div className="space-y-6">
                    {/* ChartBar */}
                    <ComponentInContextShowcase
                      title="ChartBar"
                      description="Vertical or horizontal bar chart for categorical comparisons"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: ChartDataPoint[]
orientation?: 'vertical' | 'horizontal'`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Revenue by Quarter</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartBar {...mocks.chartBarMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ChartLine */}
                    <ComponentInContextShowcase
                      title="ChartLine"
                      description="Line chart for trend visualization over time"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: ChartDataPoint[]
smooth?: boolean`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Growth Trajectory</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartLine {...mocks.chartLineMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ChartPie */}
                    <ComponentInContextShowcase
                      title="ChartPie"
                      description="Pie or donut chart for proportional data"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: ChartDataPoint[]
variant?: 'pie' | 'donut'`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Market Distribution</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartPie {...mocks.chartPieMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ChartArea */}
                    <ComponentInContextShowcase
                      title="ChartArea"
                      description="Filled area chart for cumulative trends"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: ChartDataPoint[]
gradient?: boolean`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Cumulative Growth</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartArea {...mocks.chartAreaMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ChartPolar */}
                    <ComponentInContextShowcase
                      title="ChartPolar"
                      description="Polar area chart for cyclical patterns"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: ChartDataPoint[]`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Seasonal Distribution</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartPolar {...mocks.chartPolarMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ChartRadar */}
                    <ComponentInContextShowcase
                      title="ChartRadar"
                      description="Spider/radar chart for multivariate comparison"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: ChartDataPoint[] (min 3 points)`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Feature Comparison</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartRadar {...mocks.chartRadarMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ChartBubble */}
                    <ComponentInContextShowcase
                      title="ChartBubble"
                      description="3D scatter plot with x, y, and size dimensions"
                      slotLayout="Fit"
                      propInfo={`id: string
title?: string
data: {label, x, y, size}[]`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Market Positioning</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartBubble {...mocks.chartBubbleMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ChartCustom */}
                    <ComponentInContextShowcase
                      title="ChartCustom"
                      description="Custom visualizations (rose, waffle, pictogram, gauge, etc.)"
                      slotLayout="Fit"
                      propInfo={`id: string
type: 'rose' | 'waffle' | 'pictogram' | 'gauge' | 'funnel' | 'treemap' | 'radial'
data: ChartDataPoint[]
colorScheme?: string`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Wind Distribution</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ChartCustom 
                              id={mocks.chartCustomMock.id}
                              type={mocks.chartCustomMock.type}
                              title={mocks.chartCustomMock.title}
                              data={mocks.chartCustomMock.data}
                              colorScheme={mocks.chartCustomMock.colorScheme}
                            />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>
                  </div>
                </div>

                {/* SPECIAL BLOCKS SUBSECTION */}
                <div id="blocks-special" className="mb-12">
                  <h3 className="text-xl font-semibold text-neutral-800 mb-4">Blocks - Special</h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    Specialized components for media, processes, tables, and diagrams.
                  </p>

                  <div className="space-y-6">
                    {/* ImageBlock */}
                    <ComponentInContextShowcase
                      title="ImageBlock"
                      description="Semantic image component with optional caption"
                      slotLayout="Fit"
                      propInfo={`id: string
src: string
alt: string
caption?: string
fit?: 'contain' | 'cover' | 'fill'`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Product Interface</Heading>}
                        body={
                          <SlotLayoutFit>
                            <ImageBlock {...mocks.imageBlockMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* ProcessStrip */}
                    <ComponentInContextShowcase
                      title="ProcessStrip"
                      description="Horizontal process phases with status indicators"
                      slotLayout="Stack"
                      propInfo={`id: string
title?: string
items: string[] | ProcessItem[]
showConnectors?: boolean`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Project Timeline</Heading>}
                        body={
                          <SlotLayoutStack gap="md">
                            <Text variant="lead">Current development progress</Text>
                            <ProcessStrip {...mocks.processStripMock} />
                          </SlotLayoutStack>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* TableData */}
                    <ComponentInContextShowcase
                      title="TableData"
                      description="Semantic data table with theme-aware styling"
                      slotLayout="Fit"
                      propInfo={`id: string
headers: string[]
rows: (string | number)[][]
striped?: boolean`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>Regional Breakdown</Heading>}
                        body={
                          <SlotLayoutFit>
                            <TableData {...mocks.tableDataMock} />
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>

                    {/* NetworkGraph */}
                    <ComponentInContextShowcase
                      title="NetworkGraph"
                      description="Auto-layout diagram for network structures"
                      slotLayout="Fit"
                      propInfo={`id: string
type: 'flow' | 'network' | 'tree'
size: 'compact' | 'medium' | 'tall'
children: Node[], Edge[], Group[]`}
                    >
                      <TemplateSingleColumn
                        header={<Heading level={2}>System Architecture</Heading>}
                        body={
                          <SlotLayoutFit>
                            <NetworkGraph 
                              id={mocks.networkGraphMock.id}
                              type={mocks.networkGraphMock.type}
                              size={mocks.networkGraphMock.size}
                              title={mocks.networkGraphMock.title}
                            >
                              <GraphNode id="api" label="API Gateway" className="api" />
                              <GraphNode id="auth" label="Auth Service" className="process" />
                              <GraphNode id="cache" label="Cache Layer" className="process" />
                              <GraphNode id="db" label="Database" className="database" />
                              <GraphEdge source="api" target="auth" />
                              <GraphEdge source="api" target="cache" />
                              <GraphEdge source="auth" target="db" />
                              <GraphEdge source="cache" target="db" />
                            </NetworkGraph>
                          </SlotLayoutFit>
                        }
                      />
                    </ComponentInContextShowcase>
                  </div>
                </div>
              </section>

              {/* Architecture Reference */}
              <div className="mt-16 p-6 bg-neutral-100 border border-neutral-200 rounded-lg">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Architecture Reference</h2>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="p-4 bg-white rounded border border-neutral-200">
                    <div className="font-semibold text-purple-700 mb-2">1. Template</div>
                    <p className="text-neutral-600">Macro grid skeleton. Defines WHERE content goes via named slots.</p>
                  </div>
                  <div className="p-4 bg-white rounded border border-neutral-200">
                    <div className="font-semibold text-blue-700 mb-2">2. Slot</div>
                    <p className="text-neutral-600">Semantic region. Contract between Template and content.</p>
                  </div>
                  <div className="p-4 bg-white rounded border border-neutral-200">
                    <div className="font-semibold text-green-700 mb-2">3. SlotLayout</div>
                    <p className="text-neutral-600">Structural strategy. HOW components are arranged (Stack, Grid, Fit).</p>
                  </div>
                  <div className="p-4 bg-white rounded border border-neutral-200">
                    <div className="font-semibold text-amber-700 mb-2">4. Component</div>
                    <p className="text-neutral-600">Atomic content. Charts, Metrics, Text, etc.</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ShowcaseProvider>
  );
}
