/**
 * LayoutGrid Component (L1 Layout)
 *
 * Multi-column grid layout using Compound Components pattern.
 * Content is placed in .Col slots.
 *
 * Usage:
 * ```mdx
 * <LayoutGrid cols={3}>
 *   <LayoutGrid.Col>
 *     <Heading level={3}>Column 1</Heading>
 *     <Text>Content</Text>
 *   </LayoutGrid.Col>
 *   <LayoutGrid.Col>
 *     <Heading level={3}>Column 2</Heading>
 *     <Text>Content</Text>
 *   </LayoutGrid.Col>
 *   <LayoutGrid.Col>
 *     <Heading level={3}>Column 3</Heading>
 *     <Text>Content</Text>
 *   </LayoutGrid.Col>
 * </LayoutGrid>
 * ```
 */

import React, { type ReactNode, Children, isValidElement } from 'react';
import type { GridCols, ThemeName, VibeLevel } from '@/utils/types';

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

export interface LayoutGridProps {
  children: ReactNode;
  /** Number of columns (2-4) */
  cols?: GridCols;
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;

  /** Slide headline (LayoutTimeline-style) */
  headline?: string;
  /** Optional subtitle under headline (LayoutTimeline-style) */
  subtitle?: string;
}

export interface LayoutGridColProps {
  children: ReactNode;
}

// =============================================================================
// Slot Component
// =============================================================================

/**
 * Column slot for LayoutGrid
 */
function Col({ children }: LayoutGridColProps): JSX.Element {
  return <div className="layout-grid-col">{children}</div>;
}
Col.displayName = 'LayoutGrid.Col';

// =============================================================================
// Column Class Mapping
// =============================================================================

const colsClassMap: Record<GridCols, string> = {
  2: 'layout-grid-2',
  3: 'layout-grid-3',
  4: 'layout-grid-4',
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * LayoutGrid Component
 *
 * Renders a multi-column grid layout.
 * Supports both Compound Components pattern (with LayoutGrid.Col)
 * and direct children without Col wrappers.
 *
 * @param children - LayoutGrid.Col components or direct children
 * @param cols - Number of columns (2, 3, or 4)
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutGrid({
  children,
  cols = 3,
  theme,
  vibe,
  headline,
  subtitle,
}: LayoutGridProps): JSX.Element {
  // Extract Col components from children
  const columns: ReactNode[] = [];
  const directChildren: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      directChildren.push(child);
      return;
    }

    const displayName = (child.type as { displayName?: string }).displayName;

    if (displayName === 'LayoutGrid.Col') {
      columns.push(child);
    } else {
      // Wrap non-Col children in a div for proper grid placement
      directChildren.push(child);
    }
  });

  // Get columns class
  const colsClass = colsClassMap[cols] || colsClassMap[3];

  // Use Col children if available, otherwise use direct children
  let content = columns.length > 0 ? columns : directChildren;

  // If LayoutGrid is used without Col slots, allow MDX authors to write:
  // <LayoutGrid>
  //   <Heading level={2}>...</Heading>
  //   <Text variant="lead">...</Text>
  //   ...
  // </LayoutGrid>
  // and still get the LayoutTimeline-style headline/subtitle rendering.
  let resolvedHeadline = headline;
  let resolvedSubtitle = subtitle;
  if (!resolvedHeadline && columns.length === 0) {
    const meaningful: Array<{ node: ReactNode; index: number }> = [];
    directChildren.forEach((node, index) => {
      if (node === null || node === undefined) return;
      if (isWhitespaceNode(node)) return;
      meaningful.push({ node, index });
    });

    const first = meaningful[0];
    const second = meaningful[1];
    if (first && isHeadingLevel2(first.node)) {
      const hText = nodeToText(first.node.props.children).trim();
      if (hText) {
        resolvedHeadline = hText;
        if (!resolvedSubtitle && second && isLeadText(second.node)) {
          const sText = nodeToText(second.node.props.children).trim();
          if (sText) resolvedSubtitle = sText;
        }

        const indicesToRemove = new Set<number>([
          first.index,
          ...(resolvedSubtitle && second && isLeadText(second.node) ? [second.index] : []),
        ]);
        content = directChildren.filter((_, idx) => !indicesToRemove.has(idx));
      }
    }
  }

  return (
    <div
      className={`layout-grid ${colsClass}`}
      data-layout="grid"
      data-cols={cols}
      data-theme={theme}
      data-vibe={vibe}
    >
      {resolvedHeadline && (
        // Wrapper avoids the `.layout-grid > [class*="heading-"]` rule.
        <div style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
          <h1
            className="heading-1"
            style={{
              margin: '1.0rem 1.0rem 0 1.0rem',
              textAlign: 'left',
              fontSize: '4rem',
              fontWeight: 700,
              color: 'var(--theme-text)',
              textWrap: 'wrap',
              width: '100%',
              maxWidth: 'none',
            }}
          >
            {resolvedHeadline}
          </h1>
          {resolvedSubtitle && (
            <p
              style={{
                margin: '0.5rem 1.0rem 0 1.0rem',
                textAlign: 'left',
                fontSize: '1.5rem',
                fontStyle: 'italic',
                color: 'var(--theme-text-muted)',
              }}
            >
              {resolvedSubtitle}
            </p>
          )}
        </div>
      )}
      {content}
    </div>
  );
}

// =============================================================================
// Attach Slot Component
// =============================================================================

LayoutGrid.Col = Col;

// =============================================================================
// Exports
// =============================================================================

export default LayoutGrid;
