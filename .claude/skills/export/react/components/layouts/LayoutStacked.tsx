/**
 * LayoutStacked Component (L1 Layout)
 *
 * Single-column layout for dense text content.
 * Content is distributed vertically across the page with explicit
 * header, body, and footer sections.
 *
 * Usage:
 * ```mdx
 * <LayoutStacked>
 *   <Heading level={2}>Title</Heading>
 *   <Text>Paragraph 1...</Text>
 *   <SmartList items={[...]} />
 *   <Text>Paragraph 2...</Text>
 *   <Callout intent="info">Important note</Callout>
 * </LayoutStacked>
 * ```
 */

import React, { type ReactNode, Children, isValidElement } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';
import { TimelineHeader } from './TimelineHeader';

function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (!isValidElement(node)) return '';
  return nodeToText((node.props as { children?: ReactNode }).children);
}

function elementTypeName(el: React.ReactElement): string {
  const t = el.type as unknown as { name?: string; displayName?: string };
  return t.displayName ?? t.name ?? '';
}

function isWhitespaceNode(node: ReactNode): boolean {
  return typeof node === 'string' && !node.trim();
}

function isHeadingLevel2(node: ReactNode): node is React.ReactElement<{ children?: ReactNode; level?: unknown }> {
  if (!isValidElement(node)) return false;
  const name = elementTypeName(node);
  const props = node.props as { level?: unknown };
  return (name === 'Heading' || props.level !== undefined) && props.level === 2;
}

function isLeadText(node: ReactNode): node is React.ReactElement<{ children?: ReactNode; variant?: unknown }> {
  if (!isValidElement(node)) return false;
  const name = elementTypeName(node);
  const props = node.props as { variant?: unknown };
  return (name === 'Text' || props.variant !== undefined) && props.variant === 'lead';
}

// =============================================================================
// Types
// =============================================================================

export interface LayoutStackedProps {
  children: ReactNode;
  /** Text alignment */
  align?: 'left' | 'center';
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * LayoutStacked Component
 *
 * Renders a single-column layout with explicit header, body, and footer sections.
 * - Header: First child (typically a Heading)
 * - Body: Middle children (content), wrapped in content-body div
 * - Footer: Last child (typically a Callout)
 *
 * @param children - Content elements (headings, text, lists, callouts)
 * @param align - Text alignment ('left' or 'center')
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutStacked({
  children,
  align = 'center',
  theme,
  vibe,
}: LayoutStackedProps): JSX.Element {
  const alignClass = align === 'center' ? 'align-center' : 'align-left';

  // Convert children to array
  const childArray = Children.toArray(children);

  const meaningful: Array<{ node: ReactNode; index: number }> = [];
  childArray.forEach((node, index) => {
    if (node === null || node === undefined) return;
    if (isWhitespaceNode(node)) return;
    meaningful.push({ node, index });
  });

  // Handle different element counts:
  // - 1 element: show in content-body only (no header/footer)
  // - 2 elements: header + body (no footer)
  // - 3+ elements: header + body + footer
  
  if (meaningful.length === 1) {
    // Single element: just show in content-body
    return (
      <div
        className={`layout-stacked ${alignClass}`}
        data-layout="stacked"
        data-align={align}
        data-theme={theme}
        data-vibe={vibe}
        style={{
          padding: 'var(--theme-spacing-padding)',
        }}
      >
        <div className="content-body">
          {meaningful[0].node}
        </div>
      </div>
    );
  }
  
  if (meaningful.length === 2) {
    // Two elements: header + body (no footer)
    const header = meaningful[0].node;
    const body = meaningful[1].node;
    
    let resolvedHeadline: string | null = null;
    if (isHeadingLevel2(header)) {
      const hText = nodeToText((header.props as { children?: ReactNode }).children).trim();
      if (hText) resolvedHeadline = hText;
    }
    const useTimelineHeader = Boolean(resolvedHeadline);
    
    return (
      <div
        className={`layout-stacked ${alignClass}`}
        data-layout="stacked"
        data-align={align}
        data-theme={theme}
        data-vibe={vibe}
        style={{
          paddingTop: useTimelineHeader ? '0' : 'var(--theme-spacing-padding)',
          paddingLeft: 'var(--theme-spacing-padding)',
          paddingRight: 'var(--theme-spacing-padding)',
          paddingBottom: 'var(--theme-spacing-padding)',
        }}
      >
        <div className="layout-header">
          {useTimelineHeader ? (
            <div style={{ textAlign: 'left', marginBottom: 'var(--theme-spacing-gap)' }}>
              <TimelineHeader headline={resolvedHeadline!} subtitle={null} />
            </div>
          ) : (
            header
          )}
        </div>
        <div className="content-body">
          {body}
        </div>
      </div>
    );
  }
  
  // 3+ elements: header (first), body (middle), footer (last)
  if (meaningful.length >= 3) {
    const headerIndex = meaningful[0].index;
    const header = childArray[headerIndex];

    let resolvedHeadline: string | null = null;
    let resolvedSubtitle: string | null = null;
    let subtitleIndex: number | null = null;

    const second = meaningful[1];
    if (isHeadingLevel2(header)) {
      const hText = nodeToText((header.props as { children?: ReactNode }).children).trim();
      if (hText) {
        resolvedHeadline = hText;
        if (second && isLeadText(second.node)) {
          const sText = nodeToText((second.node.props as { children?: ReactNode }).children).trim();
          if (sText) {
            resolvedSubtitle = sText;
            subtitleIndex = second.index;
          }
        }
      }
    }

    const useTimelineHeader = Boolean(resolvedHeadline);
    
    // Calculate effective remaining elements after header extraction
    // If subtitle is extracted, it doesn't count as a separate element
    const effectiveRemaining = meaningful.filter((m, i) => {
      if (i === 0) return false; // header
      if (subtitleIndex !== null && m.index === subtitleIndex) return false; // subtitle merged into header
      return true;
    });
    
    // Determine footer: only use footer if we have 2+ effective remaining elements
    const hasFooter = effectiveRemaining.length >= 2;
    const footerIndex = hasFooter ? effectiveRemaining[effectiveRemaining.length - 1].index : -1;
    const footer = hasFooter ? childArray[footerIndex] : null;
    
    const body = childArray.filter((node, idx) => {
      if (idx === headerIndex) return false;
      if (hasFooter && idx === footerIndex) return false;
      if (subtitleIndex !== null && idx === subtitleIndex) return false;
      if (isWhitespaceNode(node)) return false;
      return true;
    });

    return (
      <div
        className={`layout-stacked ${alignClass}`}
        data-layout="stacked"
        data-align={align}
        data-theme={theme}
        data-vibe={vibe}
        style={{
          paddingTop: useTimelineHeader ? '0' : 'var(--theme-spacing-padding)',
          paddingLeft: 'var(--theme-spacing-padding)',
          paddingRight: 'var(--theme-spacing-padding)',
          paddingBottom: 'var(--theme-spacing-padding)',
        }}
      >
        <div className="layout-header">
          {useTimelineHeader ? (
             <div style={{ textAlign: 'left', marginBottom: 'var(--theme-spacing-gap)' }}>
                <TimelineHeader headline={resolvedHeadline!} subtitle={resolvedSubtitle} />
            </div>
          ) : (
            header
          )}
        </div>
        <div className="content-body">
          {body}
        </div>
        {hasFooter && (
          <div className="layout-footer">
            {footer}
          </div>
        )}
      </div>
    );
  }

  // Fallback for fewer children: just wrap all in body
  return (
    <div
      className={`layout-stacked ${alignClass}`}
      data-layout="stacked"
      data-align={align}
      data-theme={theme}
      data-vibe={vibe}
      style={{
        padding: 'var(--theme-spacing-padding)',
      }}
    >
      <div className="content-body">
        {children}
      </div>
    </div>
  );
}

LayoutStacked.displayName = 'LayoutStacked';
