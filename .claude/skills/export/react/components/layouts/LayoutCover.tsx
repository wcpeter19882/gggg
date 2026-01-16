/**
 * LayoutCover Component (L1 Layout)
 * 
 * Full-screen title slide layout for cover/intro slides.
 * Centers content vertically and horizontally.
 * 
 * Usage:
 * ```mdx
 * <LayoutCover>
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
 */
export function LayoutCover({
  children,
  theme,
  vibe,
}: LayoutCoverProps): JSX.Element {
  return (
    <div 
      className="layout-cover"
      data-layout="cover"
      data-theme={theme}
      data-vibe={vibe}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default LayoutCover;
