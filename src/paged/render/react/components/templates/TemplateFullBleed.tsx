/**
 * TemplateFullBleed Component (V2 Template)
 * 
 * Full-bleed template with background media and content overlay.
 * Ideal for hero slides, section dividers, and impactful visual slides.
 * 
 * This replaces LayoutFullBleed with explicit slot-based props.
 * 
 * Usage:
 * ```tsx
 * <TemplateFullBleed
 *   media={<ImageBlock src="/hero.jpg" fit="cover" />}
 *   overlay={
 *     <SlotLayoutStack align="center">
 *       <Heading level={1}>Big Statement</Heading>
 *       <Text variant="lead">Supporting message</Text>
 *     </SlotLayoutStack>
 *   }
 *   overlayPosition="center"
 *   overlayOpacity={0.6}
 * />
 * ```
 */

import React, { type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export type OverlayPosition = 
  | 'center' 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface TemplateFullBleedProps {
  /** Background Media (Image, Video, Gradient) */
  media: ReactNode;
  
  /** Content Overlay */
  overlay: ReactNode;
  
  /** Position of the overlay content */
  overlayPosition?: OverlayPosition;
  
  /** Opacity of the backdrop/scrim (0-1) */
  overlayOpacity?: number;
  
  /** Theme override */
  theme?: ThemeName;
  
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// Position Mapping
// =============================================================================

const positionClassMap: Record<OverlayPosition, string> = {
  'center': 'template-fullbleed__overlay--center',
  'top': 'template-fullbleed__overlay--top',
  'bottom': 'template-fullbleed__overlay--bottom',
  'left': 'template-fullbleed__overlay--left',
  'right': 'template-fullbleed__overlay--right',
  'top-left': 'template-fullbleed__overlay--top-left',
  'top-right': 'template-fullbleed__overlay--top-right',
  'bottom-left': 'template-fullbleed__overlay--bottom-left',
  'bottom-right': 'template-fullbleed__overlay--bottom-right',
};

// =============================================================================
// Component
// =============================================================================

/**
 * TemplateFullBleed Component
 * 
 * A semantic template for full-bleed visual slides.
 * The media fills the entire canvas with content overlaid on top.
 */
export function TemplateFullBleed({
  media,
  overlay,
  overlayPosition = 'center',
  overlayOpacity = 0.5,
  theme,
  vibe,
}: TemplateFullBleedProps): JSX.Element {
  const positionClass = positionClassMap[overlayPosition];
  
  return (
    <div
      className="template-fullbleed"
      data-template="fullbleed"
      data-overlay-position={overlayPosition}
      data-theme={theme}
      data-vibe={vibe}
    >
      {/* Media Layer (Full Bleed) */}
      <div className="template-fullbleed__media">
        {media}
      </div>
      
      {/* Scrim/Backdrop Layer */}
      <div 
        className="template-fullbleed__scrim"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Content Overlay Layer */}
      <div className={`template-fullbleed__overlay ${positionClass}`}>
        <div className="template-slot template-slot--overlay">
          {overlay}
        </div>
      </div>
    </div>
  );
}

export default TemplateFullBleed;
