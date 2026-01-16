/**
 * Core Components Index
 * 
 * Internal infrastructure components
 */

export { ThemeProvider, useTheme, useThemeOptional, ThemedContainer } from './ThemeContext';
export type { ThemeProviderProps, ThemedContainerProps } from './ThemeContext';

export { SlideWrapper, SlideContainer } from './SlideWrapper';
export type { SlideWrapperProps, SlideContainerProps } from './SlideWrapper';

export { MDXProvider, mdxComponents, getAvailableComponents, isRegisteredComponent } from './MDXProvider';
export type { MDXProviderProps } from './MDXProvider';

export { SlideNavigation, useSlideNavigation } from './SlideNavigation';
export type { SlideNavigationProps, UseSlideNavigationOptions, UseSlideNavigationResult } from './SlideNavigation';

export { ThemeSelector } from './ThemeSelector';
export type { ThemeSelectorProps } from './ThemeSelector';
