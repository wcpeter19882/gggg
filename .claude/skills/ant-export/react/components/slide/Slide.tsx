'use client';

/**
 * Slide Component - Main slide container with Ant Design styling
 * 
 * Wraps content in a properly sized slide with theme support.
 */

import React, { type ReactNode } from 'react';
import { AntProvider } from '../core/AntProvider';
import { useSlideTheme } from '../core/ThemeContext';
import styles from './Slide.module.css';

export type SlideLayout = 'cover' | 'content' | 'split' | 'dashboard';

export interface SlideProps {
  children: ReactNode;
  layout?: SlideLayout;
  className?: string;
}

export function Slide({ 
  children, 
  layout = 'content',
  className = '' 
}: SlideProps) {
  const theme = useSlideTheme();
  
  // Build CSS variables from theme
  const cssVars = {
    '--theme-bg': theme.colors.bg,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-accent': theme.colors.accent,
    '--theme-primary': theme.colors.primary,
    '--theme-surface': theme.colors.surface,
    '--theme-border': theme.colors.border,
    '--theme-success': theme.colors.success,
    '--theme-warning': theme.colors.warning,
    '--theme-danger': theme.colors.danger,
    '--theme-info': theme.colors.info,
    '--theme-shadow-sm': theme.visuals.shadow.sm,
    '--theme-shadow-md': theme.visuals.shadow.md,
    '--theme-radius-sm': theme.visuals.radius.sm,
    '--theme-radius-md': theme.visuals.radius.md,
    '--theme-radius-lg': theme.visuals.radius.lg,
    '--theme-spacing-margin': theme.spacing.margin,
  } as React.CSSProperties;
  
  return (
    <AntProvider>
      <div 
        className={`${styles.slide} ${styles[layout]} ${className}`}
        style={cssVars}
      >
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </AntProvider>
  );
}

export default Slide;
