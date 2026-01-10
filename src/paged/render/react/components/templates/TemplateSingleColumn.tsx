/**
 * TemplateSingleColumn Component (V2 Template)
 * 
 * Single-column template with explicit header, body, and footer slots.
 * The body slot accepts SlotLayouts (Stack, Grid, Timeline) for flexible arrangement.
 * 
 * This replaces the implicit logic in LayoutStacked, LayoutGrid, and LayoutTimeline.
 * 
 * Usage:
 * ```tsx
 * <TemplateSingleColumn
 *   header={<Heading level={2}>Slide Title</Heading>}
 *   body={
 *     <SlotLayoutStack gap="md">
 *       <Text>Content here...</Text>
 *       <SmartList items={[...]} />
 *     </SlotLayoutStack>
 *   }
 *   footer={<Callout intent="info">Note</Callout>}
 * />
 * ```
 */

import React, { type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface TemplateSingleColumnProps {
  /** Optional Header area (e.g., slide title) */
  header?: ReactNode;
  
  /** 
   * Main Content Area.
   * This is where SlotLayouts live (Stack, Grid, Timeline).
   */
  body: ReactNode;
  
  /** Optional Footer area (e.g., callout, source citation) */
  footer?: ReactNode;
  
  /** Theme override */
  theme?: ThemeName;
  
  /** Vibe modifier */
  vibe?: VibeLevel;
  
  /** Content alignment */
  align?: 'left' | 'center';
}

// =============================================================================
// Component
// =============================================================================

/**
 * TemplateSingleColumn Component
 * 
 * A semantic template that defines a single-column slide structure.
 * Content arrangement within the body slot is delegated to SlotLayouts.
 */
export function TemplateSingleColumn({
  header,
  body,
  footer,
  theme,
  vibe,
  align = 'left',
}: TemplateSingleColumnProps): JSX.Element {
  return (
    <div
      className="template-single-column"
      data-template="single-column"
      data-theme={theme}
      data-vibe={vibe}
      data-align={align}
    >
      {header && (
        <div className="template-slot template-slot--header">
          {header}
        </div>
      )}
      
      <div className="template-slot template-slot--body">
        {body}
      </div>
      
      {footer && (
        <div className="template-slot template-slot--footer">
          {footer}
        </div>
      )}
    </div>
  );
}

export default TemplateSingleColumn;
