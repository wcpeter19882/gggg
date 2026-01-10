/**
 * Templates Components Index (V2 Architecture)
 * 
 * Semantic Templates - The top-level "Skeletons" that define
 * the macro grid structure of slides.
 * 
 * Templates define WHERE content goes (explicit named slots),
 * NOT HOW content is arranged (that's SlotLayouts' job).
 */

// Single Column Template
export { TemplateSingleColumn, default as TemplateSingleColumnDefault } from './TemplateSingleColumn';
export type { TemplateSingleColumnProps } from './TemplateSingleColumn';

// Two Column Template
export { TemplateTwoColumn, default as TemplateTwoColumnDefault } from './TemplateTwoColumn';
export type { TemplateTwoColumnProps, TwoColumnRatio } from './TemplateTwoColumn';

// Dashboard Template
export { TemplateDashboard, default as TemplateDashboardDefault } from './TemplateDashboard';
export type { TemplateDashboardProps, DashboardVariant } from './TemplateDashboard';

// Cover Template
export { TemplateCover, default as TemplateCoverDefault } from './TemplateCover';
export type { TemplateCoverProps, CoverAlignment } from './TemplateCover';

// Full Bleed Template
export { TemplateFullBleed, default as TemplateFullBleedDefault } from './TemplateFullBleed';
export type { TemplateFullBleedProps, OverlayPosition } from './TemplateFullBleed';
