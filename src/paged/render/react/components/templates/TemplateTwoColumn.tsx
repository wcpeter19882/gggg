/**
 * TemplateTwoColumn Component (V2 Template)
 * 
 * Two-column template with explicit header, left, right, and footer slots.
 * Supports configurable column ratio.
 * 
 * This replaces LayoutSplit with explicit slot-based props instead of
 * compound children inspection.
 * 
 * Usage:
 * ```tsx
 * <TemplateTwoColumn
 *   ratio="2:1"
 *   header={<Heading level={2}>Comparison</Heading>}
 *   left={
 *     <SlotLayoutStack gap="md">
 *       <Text>Left column content...</Text>
 *     </SlotLayoutStack>
 *   }
 *   right={
 *     <SlotLayoutFit>
 *       <ChartBar data={[...]} />
 *     </SlotLayoutFit>
 *   }
 * />
 * ```
 */

import React, { type ReactNode } from 'react';
import type { ThemeName, VibeLevel } from '@/utils/types';
import type { TemplateManifest } from '@/utils/manifest-types';

// =============================================================================
// Types
// =============================================================================

export type TwoColumnRatio = '1:1' | '1:2' | '2:1' | '1:3' | '3:1';

export interface TemplateTwoColumnProps {
  /** Optional Header area spanning both columns */
  header?: ReactNode;
  
  /** Left Column Slot */
  left: ReactNode;
  
  /** Right Column Slot */
  right: ReactNode;
  
  /** Optional Footer area spanning both columns */
  footer?: ReactNode;
  
  /** Column width ratio */
  ratio?: TwoColumnRatio;
  
  /** Theme override */
  theme?: ThemeName;
  
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// Ratio Mapping
// =============================================================================

const ratioClassMap: Record<TwoColumnRatio, string> = {
  '1:1': 'template-two-column--ratio-1-1',
  '2:1': 'template-two-column--ratio-2-1',
  '1:2': 'template-two-column--ratio-1-2',
  '3:1': 'template-two-column--ratio-3-1',
  '1:3': 'template-two-column--ratio-1-3',
};

// =============================================================================
// Component
// =============================================================================

/**
 * TemplateTwoColumn Component
 * 
 * A semantic template that defines a two-column slide structure.
 * Each column accepts SlotLayouts for flexible content arrangement.
 */
export function TemplateTwoColumn({
  header,
  left,
  right,
  footer,
  ratio = '1:1',
  theme,
  vibe,
}: TemplateTwoColumnProps): JSX.Element {
  const ratioClass = ratioClassMap[ratio];
  
  return (
    <div
      className={`template-two-column ${ratioClass}`}
      data-template="two-column"
      data-ratio={ratio}
      data-theme={theme}
      data-vibe={vibe}
    >
      {header && (
        <div className="template-slot template-slot--header">
          {header}
        </div>
      )}
      
      <div className="template-columns">
        <div className="template-slot template-slot--left">
          {left}
        </div>
        
        <div className="template-slot template-slot--right">
          {right}
        </div>
      </div>
      
      {footer && (
        <div className="template-slot template-slot--footer">
          {footer}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Manifest
// =============================================================================

/**
 * TemplateTwoColumn Manifest
 * 
 * Defines constraints for a balanced two-column comparison/split layout.
 */
export const TwoColumnManifest: TemplateManifest = {
  id: 'TemplateTwoColumn',
  category: 'comparison',
  description: 'Use for side-by-side comparisons, contrasts, or split content. Both columns have equal visual weight.',
  slots: {
    header: {
      description: 'Optional header spanning both columns for slide title.',
      allowedComponents: ['Heading', 'Text'],
      maxElements: 2
    },
    left: {
      description: 'Left column for first content block. Accepts mixed content types.',
      allowedComponents: [
        'Heading', 'Text', 'Callout',
        'SmartList', 'StepList',
        'ChartBar', 'ChartLine', 'ChartPie',
        'MetricGroup', 'BigNum',
        'ImageBlock', 'QuoteBlock'
      ],
      allowedLayouts: ['SlotLayoutStack', 'SlotLayoutFit'],
      maxElements: 5
    },
    right: {
      description: 'Right column for second content block. Mirrors left column capabilities.',
      allowedComponents: [
        'Heading', 'Text', 'Callout',
        'SmartList', 'StepList',
        'ChartBar', 'ChartLine', 'ChartPie',
        'MetricGroup', 'BigNum',
        'ImageBlock', 'QuoteBlock'
      ],
      allowedLayouts: ['SlotLayoutStack', 'SlotLayoutFit'],
      maxElements: 5
    },
    footer: {
      description: 'Optional footer spanning both columns.',
      allowedComponents: ['Text', 'Callout'],
      maxElements: 1
    }
  },
  metadata: {
    tags: ['comparison', 'split', 'dual', 'side-by-side'],
    version: '1.0.0'
  }
} as const;

export default TemplateTwoColumn;
