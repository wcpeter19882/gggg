/**
 * LayoutFullBleed Component (L1 Layout)
 * 
 * Full-screen layout with background image and overlay.
 * Ideal for hero slides, section dividers, and impactful visuals.
 * 
 * Usage:
 * ```mdx
 * <LayoutFullBleed image="/path/to/image.jpg" overlay={0.5}>
 *   <Heading level={1}>Hero Title</Heading>
 *   <Text variant="lead">Impactful message</Text>
 * </LayoutFullBleed>
 * ```
 */

import React, { type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface LayoutFullBleedProps {
  children: ReactNode;
  /** Background image URL */
  image?: string;
  /** Overlay opacity (0-1) */
  overlay?: number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Vertical alignment */
  valign?: 'top' | 'center' | 'bottom';
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// Component
// =============================================================================

/**
 * LayoutFullBleed Component
 * 
 * Renders a full-bleed layout with optional background image and overlay.
 * Content is overlaid on top with customizable positioning.
 * 
 * @param children - Slide content
 * @param image - Background image URL
 * @param overlay - Overlay opacity (default: 0.5)
 * @param align - Horizontal text alignment (default: center)
 * @param valign - Vertical alignment (default: center)
 * @param theme - Optional theme override
 * @param vibe - Optional vibe modifier
 */
export function LayoutFullBleed({
  children,
  image,
  overlay = 0.5,
  align = 'center',
  valign = 'center',
  theme,
  vibe,
}: LayoutFullBleedProps): JSX.Element {
  // Compute alignment classes
  const alignClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align];
  
  const valignClass = {
    top: 'justify-start',
    center: 'justify-center',
    bottom: 'justify-end',
  }[valign];
  
  return (
    <div 
      className="layout-fullbleed"
      data-layout="fullbleed"
      data-theme={theme}
      data-vibe={vibe}
      style={{
        '--fullbleed-overlay': overlay,
      } as React.CSSProperties}
    >
      {/* Background Image */}
      {image && (
        <img 
          src={image} 
          alt="" 
          className="layout-fullbleed-bg"
          aria-hidden="true"
        />
      )}
      
      {/* Overlay */}
      <div className="layout-fullbleed-overlay" />
      
      {/* Content */}
      <div className={`layout-fullbleed-content flex flex-col ${alignClass} ${valignClass}`}>
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default LayoutFullBleed;
