/**
 * Theme type definitions for Ant Design slide renderer
 */

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  info: string;
  warning: string;
  success: string;
  danger: string;
}

export interface ThemeTypography {
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  sizeDisplay: string;
  sizeHeading: string;
  sizeBody: string;
  sizeCaption: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface ThemeSpacing {
  gap: string;
  padding: string;
  margin: string;
}

export interface ThemeVisuals {
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    none: string;
  };
  borderWidth: string;
}

export interface ThemeBackground {
  /** Background color (hex) */
  color: string;
  /** Background image path (relative to project, e.g., "images/cover_bg.png") */
  image?: string;
}

export interface ThemeDefinition {
  name: string;
  displayName: string;
  isDark?: boolean;
  /** Default slide background */
  background?: ThemeBackground;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  visuals: ThemeVisuals;
  components?: Record<string, Record<string, unknown>>;
}
