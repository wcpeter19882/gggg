/**
 * Components Index
 * 
 * Export all components for easy importing.
 * 
 * By default, exports switchable components that can switch between
 * custom styled and original implementations using ComponentConfigProvider.
 * 
 * Usage:
 * 1. Wrap your app with ComponentConfigProvider
 * 2. Use ComponentModeToggle to switch modes at runtime
 * 3. Or set defaultMode='original' to use original components
 */

// Core providers and context
export * from './core';

// Styled Ant Design components (switchable)
export * from './antd/switchable';

// Styled HeroUI components (switchable)
export * from './heroui/switchable';

// Slide container
export * from './slide';

// Direct access to non-switchable implementations
export { CustomComponents as AntdCustom, OriginalComponents as AntdOriginal } from './antd/switchable';
export { CustomComponents as HeroUICustom, OriginalComponents as HeroUIOriginal } from './heroui/switchable';
