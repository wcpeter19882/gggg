'use client';

/**
 * AntProvider - ConfigProvider wrapper with slide theme integration
 * 
 * Maps our slide theme tokens to Ant Design's ConfigProvider theme.
 */

import React, { type ReactNode } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import { useSlideTheme } from './ThemeContext';

export interface AntProviderProps {
  children: ReactNode;
}

export function AntProvider({ children }: AntProviderProps) {
  const slideTheme = useSlideTheme();
  
  return (
    <ConfigProvider
      theme={{
        algorithm: slideTheme.isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          // Color tokens
          colorPrimary: slideTheme.colors.primary,
          colorBgContainer: slideTheme.colors.surface,
          colorBgBase: slideTheme.colors.bg,
          colorText: slideTheme.colors.text,
          colorTextSecondary: slideTheme.colors.textMuted,
          colorBorder: slideTheme.colors.border,
          colorSuccess: slideTheme.colors.success,
          colorWarning: slideTheme.colors.warning,
          colorError: slideTheme.colors.danger,
          colorInfo: slideTheme.colors.info,
          
          // Typography tokens
          fontFamily: slideTheme.typography.fontBody,
          fontSize: parseInt(slideTheme.typography.sizeCaption), // Use caption as base (28px)
          lineHeight: parseFloat(slideTheme.typography.lineHeight),
          
          // Visual tokens
          borderRadius: parseInt(slideTheme.visuals.radius.md),
          borderRadiusSM: parseInt(slideTheme.visuals.radius.sm),
          borderRadiusLG: parseInt(slideTheme.visuals.radius.lg),
        },
        components: {
          // Typography component tokens - use theme sizes
          Typography: {
            titleMarginBottom: '0.5em',
            titleMarginTop: 0,
            fontSizeHeading1: parseInt(slideTheme.typography.sizeDisplay),
            fontSizeHeading2: parseInt(slideTheme.typography.sizeHeading),
            fontSizeHeading3: parseInt(slideTheme.typography.sizeBody) + 12, // 40px
            fontSizeHeading4: parseInt(slideTheme.typography.sizeBody) + 4,  // 32px
            fontSizeHeading5: parseInt(slideTheme.typography.sizeCaption) + 4, // 26px
          },
          // Statistic component tokens - for BigNum styling
          Statistic: {
            contentFontSize: 48,
            titleFontSize: 14,
          },
          // Card component tokens
          Card: {
            borderRadiusLG: parseInt(slideTheme.visuals.radius.lg),
          },
          // Alert component tokens - for Callout styling
          Alert: {
            borderRadiusLG: parseInt(slideTheme.visuals.radius.lg),
          },
          // Steps component tokens - for ProcessStrip styling
          Steps: {
            iconSize: 32,
            iconFontSize: 14,
          },
          // Table component tokens
          Table: {
            borderRadius: parseInt(slideTheme.visuals.radius.md),
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default AntProvider;
