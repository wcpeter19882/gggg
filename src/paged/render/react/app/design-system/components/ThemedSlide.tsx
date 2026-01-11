'use client';

import React from 'react';
import { ThemeProvider } from '@/components/core/ThemeContext';
import { SlideWrapper } from '@/components/core/SlideWrapper';
import type { ThemeName, VibeLevel } from '@/utils/types';

interface ThemedSlideProps {
  children: React.ReactNode;
  theme: ThemeName;
  vibe: VibeLevel;
}

/**
 * A self-contained, themeable slide for showcasing components.
 * It creates its own ThemeProvider to isolate theme/vibe settings.
 */
export function ThemedSlide({ children, theme, vibe }: ThemedSlideProps) {
  return (
    <ThemeProvider theme={theme} vibe={vibe}>
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
        <SlideWrapper>
          {children}
        </SlideWrapper>
      </div>
    </ThemeProvider>
  );
}
