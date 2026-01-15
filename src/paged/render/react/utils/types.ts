/**
 * Shared TypeScript Types for React MDX Presentation Renderer
 *
 * This file defines the type interfaces that are used across the application.
 * Component-specific props are defined in their respective component files.
 *
 * IMPORTANT: These types are for INTERNAL use. Agent-facing types are defined
 * in the component props themselves (L1-L3 components only).
 */

import { ReactNode } from 'react';

// =============================================================================
// SEMANTIC TYPES (Agent-facing)
// =============================================================================

/** Semantic size variants */
export type Size = 'sm' | 'md' | 'lg' | 'full';

/** Visual style variants */
export type Variant = 'default' | 'primary' | 'outline' | 'ghost';

/** Semantic intent for callouts and alerts */
export type Intent = 'info' | 'warning' | 'success' | 'danger';

/** Split ratio for two-column layouts */
export type SplitRatio = '1:1' | '2:1' | '1:2' | '3:1' | '1:3';

/** Grid column count */
export type GridCols = 2 | 3 | 4;

/**
 * Card layout variants
 *
 * - default: icon/image and text stacked in one column
 * - left: icon/image on the left with a divider
 * - top: icon/image in a separate top circle
 */
export type CardLayout = 'default' | 'left' | 'top';

/** Card media (icon/image) size variants */
export type CardMediaSize = 'sm' | 'md' | 'lg';

/** Heading levels */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Text variants */
export type TextVariant = 'default' | 'lead' | 'caption' | 'code';

// =============================================================================
// DATA TYPES
// =============================================================================

/**
 * Supported chart types for MDX rendering
 * Extended chart types: area, bar, barStats, bubble, doughnut, pie, line, polarArea, radar
 */
export type ChartType =
  | 'area'        // Area chart (filled line)
  | 'bar'         // Vertical bar chart
  | 'barStats'    // Horizontal bar chart with stats/labels
  | 'bubble'      // Bubble/scatter chart with size dimension
  | 'doughnut'    // Doughnut (ring) chart
  | 'pie'         // Pie chart
  | 'line'        // Line chart (existing)
  | 'polarArea'   // Polar area chart (radial segments)
  | 'radar';      // Radar/spider chart

/** Chart data point - supports single value, clustered (before/after), and bubble (x/y/size) */
export interface ChartDataPoint {
  label: string;
  value?: number;
  /** For clustered bar charts: before value */
  before?: number;
  /** For clustered bar charts: after value */
  after?: number;
  /** Alternative naming for clustered charts */
  current?: number;
  target?: number;
  /** For bubble charts: X coordinate */
  x?: number;
  /** For bubble charts: Y coordinate */
  y?: number;
  /** For bubble charts: Bubble size */
  size?: number;
  /** Override color for this data point */
  color?: string;
}

/** Metric data for MetricGroup */
export interface MetricData {
  value: string;
  label: string;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

/** Table column definition */
export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

/** List item with optional icon and sub-items */
export interface ListItem {
  text: string;
  icon?: string;
  items?: ListItem[];
}

/** Card data for CardGroup */
export interface CardData {
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  link?: string;
  /** Optional per-card layout override */
  layout?: CardLayout;
  /** Optional per-card media (icon/image) size override */
  mediaSize?: CardMediaSize;
}

// =============================================================================
// THEME TYPES
// =============================================================================

/** Theme name identifiers */
export type ThemeName =
  | 'base'
  | 'business'
  | 'cyber'
  | 'minimal'
  | 'academic'
  | 'creative'
  | 'duolingo'
  | 'dark';

/** Vibe intensity levels */
export type VibeLevel =
  | 'minimal'      // 0 - Clean, no decorations
  | 'clean'        // 1 - Subtle accents
  | 'balanced'     // 2 - Default, moderate styling
  | 'decorative'   // 3 - Rich visual elements
  | 'expressive';  // 4 - Maximum visual impact

/** Theme color palette */
export interface ThemeColors {
  bg: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  // Intent colors
  info: string;
  warning: string;
  success: string;
  danger: string;
}

/** Theme typography settings */
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

/** Theme spacing settings */
export interface ThemeSpacing {
  gap: string;
  padding: string;
  margin: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}

/** Theme visual settings */
export interface ThemeVisuals {
  radius: string | {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadow: string | {
    sm: string;
    md: string;
    lg: string;
    none: string;
  };
  borderWidth: string;
  borderStyle?: string;
}

/** Component specific theme overrides */
export interface ThemeComponentOverrides {
  metricCard?: {
    radius?: string;
    bg?: string;
    border?: string;
    shadow?: string;
  };
  chart?: {
    bg?: string;
    radius?: string;
  };
  // Add other components as needed
}

/** Complete theme definition */
export interface ThemeDefinition {
  name: ThemeName;
  displayName: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  visuals: ThemeVisuals;
  components?: ThemeComponentOverrides;
}

// =============================================================================
// SLIDE TYPES
// =============================================================================

/** Slide layout type */
export type LayoutType =
  | 'cover'
  | 'split'
  | 'grid'
  | 'fullbleed'
  | 'timeline'
  | 'dashboard';

/** Slide metadata */
export interface SlideMeta {
  id: string;
  title?: string;
  layout: LayoutType;
  theme?: ThemeName;
  vibe?: VibeLevel;
  notes?: string;
}

/** Presentation metadata */
export interface PresentationMeta {
  title: string;
  author?: string;
  date?: string;
  theme: ThemeName;
  vibe: VibeLevel;
  slideCount: number;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/** Theme context value */
export interface ThemeContextValue {
  theme: ThemeDefinition;
  themeName: ThemeName;
  vibe: VibeLevel;
  setTheme: (name: ThemeName) => void;
  setCustomTheme: (theme: ThemeDefinition | null) => void;
  setVibe: (level: VibeLevel) => void;
}

/** Slide context value */
export interface SlideContextValue {
  currentSlide: number;
  totalSlides: number;
  meta: PresentationMeta;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/** L0 validation error */
export interface ValidationError {
  type: 'element' | 'attribute' | 'pattern';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// COMPONENT COMMON PROPS
// =============================================================================

/** Base props for all components */
export interface BaseComponentProps {
  children?: ReactNode;
}

/** Props for themed components */
export interface ThemedComponentProps extends BaseComponentProps {
  /** Theme override */
  theme?: ThemeName;
  /** Vibe modifier */
  vibe?: VibeLevel;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Extract props from a React component */
export type PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;
