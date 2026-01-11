/**
 * SlotLayoutFit Component
 * 
 * A pure structural primitive that forces its child to fill the container.
 * Part of the 4-Layer Architecture (Layer 3: SlotLayout).
 * 
 * This component is designed for visual-heavy content (Charts, Images, Maps)
 * that must consume the entire allocated region. It ensures consistent
 * sizing behavior regardless of the child's intrinsic dimensions.
 * 
 * Usage:
 * ```tsx
 * <SlotLayoutFit mode="cover">
 *   <ChartBar data={chartData} />
 * </SlotLayoutFit>
 * 
 * <SlotLayoutFit mode="contain" align="center" valign="center">
 *   <ImageBlock src="/hero.jpg" alt="Hero" />
 * </SlotLayoutFit>
 * ```
 */

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export type FitMode = 'cover' | 'contain' | 'fill';
export type FitAlign = 'start' | 'center' | 'end';
export type FitValign = 'start' | 'center' | 'end';

export interface SlotLayoutFitProps {
  children: ReactNode;
  /** How the content manages aspect ratio (default: 'cover') */
  mode?: FitMode;
  /** Horizontal alignment if content doesn't fill width (default: 'center') */
  align?: FitAlign;
  /** Vertical alignment if content doesn't fill height (default: 'center') */
  valign?: FitValign;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Alignment Mapping
// =============================================================================

const alignClassMap: Record<FitAlign, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
};

const valignClassMap: Record<FitValign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
};

// =============================================================================
// Object-fit Mapping (for CSS variable)
// =============================================================================

const modeStyleMap: Record<FitMode, string> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'fill',
};

// =============================================================================
// Component
// =============================================================================

/**
 * SlotLayoutFit Component
 * 
 * Renders a container that forces its child to fill the available space.
 * Uses a combination of flex layout for positioning and CSS custom properties
 * for object-fit behavior that children can inherit.
 * 
 * @param children - Single child element to fit
 * @param mode - How content manages aspect ratio (default: 'cover')
 * @param align - Horizontal alignment (default: 'center')
 * @param valign - Vertical alignment (default: 'center')
 * @param className - Additional CSS classes
 */
export function SlotLayoutFit({
  children,
  mode = 'cover',
  align = 'center',
  valign = 'center',
  className = '',
}: SlotLayoutFitProps): JSX.Element {
  const alignClass = alignClassMap[align];
  const valignClass = valignClassMap[valign];

  return (
    <div
      className={`slot-layout-fit relative flex w-full h-full overflow-hidden ${alignClass} ${valignClass} ${className}`.trim()}
      data-slot-layout="fit"
      data-mode={mode}
      data-align={align}
      data-valign={valign}
      style={{
        '--slot-fit-mode': modeStyleMap[mode],
      } as React.CSSProperties}
    >
      {/* 
        Inner wrapper ensures children can use w-full h-full 
        and inherit the fit mode via CSS custom property 
      */}
      <div className="slot-layout-fit-inner w-full h-full">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Display Name
// =============================================================================

SlotLayoutFit.displayName = 'SlotLayoutFit';

// =============================================================================
// Exports
// =============================================================================

export default SlotLayoutFit;
