/**
 * LayoutCover Component (L1 Layout)
 * 
 * Full-screen title slide layout for cover/intro slides.
 * Centers content vertically and horizontally.
 * Supports optional presenter info display for professional presentations.
 * 
 * Usage:
 * ```mdx
 * <LayoutCover>
 *   <Heading level={1}>Presentation Title</Heading>
 *   <Text variant="lead">Subtitle or tagline</Text>
 * </LayoutCover>
 * 
 * // With presenter info
 * <LayoutCover 
 *   presenter="Product & Engineering" 
 *   context="Quarterly Review" 
 *   date="Jan 15, 2026"
 * >
 *   <Heading level={1}>Presentation Title</Heading>
 *   <Text variant="lead">Subtitle or tagline</Text>
 * </LayoutCover>
 * ```
 */

import React, { type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface LayoutCoverProps {
  children: ReactNode;
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
  /** Presenter or team name */
  presenter?: string;
  /** Context such as meeting type, event name, or source */
  context?: string;
  /** Date or time period */
  date?: string;
}

// =============================================================================
// PresenterInfo Subcomponent
// =============================================================================

interface PresenterInfoProps {
  presenter?: string;
  context?: string;
  date?: string;
}

/**
 * PresenterInfo - Internal component for displaying presenter metadata
 * 
 * Renders presenter/team, context, and date information in a clean, 
 * semantically correct format for cover slides.
 */
function PresenterInfo({ presenter, context, date }: PresenterInfoProps): JSX.Element | null {
  const hasContent = presenter || context || date;
  if (!hasContent) return null;

  return (
    <div className="cover-presenter-info">
      {presenter && (
        <span className="presenter-name">{presenter}</span>
      )}
      {context && (
        <span className="presenter-context">{context}</span>
      )}
      {date && (
        <span className="presenter-date">{date}</span>
      )}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * LayoutCover Component
 * 
 * Renders a centered cover slide layout.
 * Content is vertically and horizontally centered with appropriate spacing.
 * 
 * @param children - Slide content (typically Heading + Text)
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 * @param presenter - Optional presenter/team name
 * @param context - Optional context (meeting type, event, etc.)
 * @param date - Optional date string
 */
export function LayoutCover({
  children,
  theme,
  vibe,
  presenter,
  context,
  date,
}: LayoutCoverProps): JSX.Element {
  return (
    <div 
      className="layout-cover"
      data-layout="cover"
      data-theme={theme}
      data-vibe={vibe}
    >
      {children}
      <PresenterInfo presenter={presenter} context={context} date={date} />
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default LayoutCover;
