'use client';

/**
 * SlideWrapper - Container for individual slides with theme CSS variables
 */

import React, { type ReactNode } from 'react';
import { useSlideTheme } from './ThemeContext';

export interface SlideWrapperProps {
  children: ReactNode;
  slideNumber?: number;
  totalSlides?: number;
}

export function SlideWrapper({ children, slideNumber, totalSlides }: SlideWrapperProps) {
  const theme = useSlideTheme();
  
  // Generate CSS custom properties from theme
  const cssVars: Record<string, string> = {
    '--theme-bg': theme.colors.bg,
    '--theme-surface': theme.colors.surface,
    '--theme-primary': theme.colors.primary,
    '--theme-secondary': theme.colors.secondary,
    '--theme-accent': theme.colors.accent,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-border': theme.colors.border,
    '--theme-info': theme.colors.info,
    '--theme-warning': theme.colors.warning,
    '--theme-success': theme.colors.success,
    '--theme-danger': theme.colors.danger,
    '--theme-background': theme.colors.bg,
    
    '--theme-font-display': theme.typography.fontDisplay,
    '--theme-font-body': theme.typography.fontBody,
    '--theme-font-mono': theme.typography.fontMono,
    '--theme-size-display': theme.typography.sizeDisplay,
    '--theme-size-heading': theme.typography.sizeHeading,
    '--theme-size-body': theme.typography.sizeBody,
    '--theme-size-caption': theme.typography.sizeCaption,
    
    '--theme-spacing-gap': theme.spacing.gap,
    '--theme-spacing-padding': theme.spacing.padding,
    '--theme-spacing-margin': theme.spacing.margin,
    
    '--theme-radius-sm': theme.visuals.radius.sm,
    '--theme-radius-md': theme.visuals.radius.md,
    '--theme-radius-lg': theme.visuals.radius.lg,
    '--theme-radius-xl': theme.visuals.radius.xl,
    
    '--theme-shadow-sm': theme.visuals.shadow.sm,
    '--theme-shadow-md': theme.visuals.shadow.md,
    '--theme-shadow-lg': theme.visuals.shadow.lg,
  };
  
  return (
    <div 
      className="slide-wrapper"
      style={cssVars as React.CSSProperties}
      data-slide={slideNumber}
      data-theme={theme.name}
    >
      <div className="slide-content">
        {children}
      </div>
      {slideNumber && totalSlides && (
        <div className="slide-footer">
          <span className="slide-number">{slideNumber} / {totalSlides}</span>
        </div>
      )}
    </div>
  );
}

export default SlideWrapper;
