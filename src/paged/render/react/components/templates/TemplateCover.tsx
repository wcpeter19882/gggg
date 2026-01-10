/**
 * TemplateCover Component (V2 Template)
 * 
 * Cover/Title slide template with dedicated slots for title, subtitle,
 * metadata, and optional background.
 * 
 * This replaces LayoutCover with explicit semantic slots.
 * 
 * Usage:
 * ```tsx
 * <TemplateCover
 *   title={<Heading level={1}>Annual Report 2025</Heading>}
 *   subtitle={<Text variant="lead">Building the Future Together</Text>}
 *   meta={<Text variant="caption">Acme Corporation • January 2025</Text>}
 *   background={<ImageBlock src="/hero-bg.jpg" />}
 * />
 * ```
 */

import React, { type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export type CoverAlignment = 'center' | 'left' | 'right';

export interface TemplateCoverProps {
  /** Main Title */
  title: ReactNode;
  
  /** Subtitle or Tagline */
  subtitle?: ReactNode;
  
  /** Metadata (Author, Date, Company, etc.) */
  meta?: ReactNode;
  
  /** Optional Background Element (Image, Gradient, Pattern) */
  background?: ReactNode;
  
  /** Content alignment */
  align?: CoverAlignment;
  
  /** Theme override */
  theme?: ThemeName;
  
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TemplateCover Component
 * 
 * A semantic template for title/cover slides.
 * Content is centered by default with optional background media.
 */
export function TemplateCover({
  title,
  subtitle,
  meta,
  background,
  align = 'center',
  theme,
  vibe,
}: TemplateCoverProps): JSX.Element {
  return (
    <div
      className="template-cover"
      data-template="cover"
      data-align={align}
      data-theme={theme}
      data-vibe={vibe}
    >
      {/* Background Layer */}
      {background && (
        <div className="template-cover__background">
          {background}
        </div>
      )}
      
      {/* Content Layer */}
      <div className="template-cover__content">
        <div className="template-slot template-slot--title">
          {title}
        </div>
        
        {subtitle && (
          <div className="template-slot template-slot--subtitle">
            {subtitle}
          </div>
        )}
        
        {meta && (
          <div className="template-slot template-slot--meta">
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplateCover;
