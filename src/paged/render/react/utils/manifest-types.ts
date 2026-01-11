/**
 * Template Manifest Type Definitions
 * 
 * These types define the "Template Manifest" system - a runtime-accessible
 * specification that serves as the Single Source of Truth (SSOT) for both
 * the React rendering engine and the Python generation layer.
 * 
 * Design Philosophy:
 * - Templates export manifests alongside their component definition
 * - Manifests are JSON-serializable for Python consumption
 * - Manifests provide explicit constraints for agent content generation
 * - Manifests enable runtime validation of slot content
 * 
 * See: TEMPLATE_MANIFEST_ARCHITECTURE.md for full context
 */

// =============================================================================
// Component Types (L1-L3 Atomic Components)
// =============================================================================

/**
 * All component types that can be rendered in template slots.
 * These correspond to the actual React components in our component library.
 */
export type ComponentType =
  // L1: Atoms (Basic building blocks)
  | 'Heading'
  | 'Text'
  | 'Callout'
  | 'Highlight'
  
  // L2: Blocks (Data visualization & content)
  | 'SmartList'
  | 'StepList'
  | 'ProcessStrip'
  | 'MetricGroup'
  | 'MetricStrip'
  | 'MetricCard'
  | 'MetricBadges'
  | 'BigNum'
  | 'ChartBar'
  | 'ChartLine'
  | 'ChartPie'
  | 'TableData'
  | 'QuoteBlock'
  | 'ImageBlock'
  | 'CardGroup'
  | 'NetworkGraph'
  
  // L3: Compound (Complex layouts)
  | 'Timeline';

// =============================================================================
// Layout Types (SlotLayout Primitives)
// =============================================================================

/**
 * SlotLayout strategies for arranging components within a slot.
 * These are the structural primitives defined in Phase 1.
 */
export type LayoutType =
  | 'SlotLayoutStack'   // Vertical flex stacking
  | 'SlotLayoutGrid'    // CSS Grid columns
  | 'SlotLayoutFit';    // Single item that fills container

// =============================================================================
// Slot Manifest (Slot-level Constraints)
// =============================================================================

/**
 * Defines the rules and constraints for a single slot within a template.
 * 
 * This is what the Agent reads to understand:
 * - What components are allowed in this region
 * - What layouts are supported
 * - Visual/density constraints
 */
export interface SlotManifest {
  /**
   * Human-readable description for the Agent.
   * Should explain the slot's purpose and visual characteristics.
   * 
   * Example: "Narrow sidebar column for supporting metrics and context"
   */
  description: string;
  
  /**
   * Visual orientation constraint for the Agent.
   * Helps guide component selection based on slot shape.
   * 
   * - 'portrait': Tall/narrow slots (e.g., sidebars)
   * - 'landscape': Wide/short slots (e.g., full-width areas)
   */
  orientation?: 'portrait' | 'landscape';
  
  /**
   * Explicitly allowed component types in this slot.
   * The Agent MUST only select from this list.
   * 
   * Example: ['BigNum', 'MetricGroup', 'Text']
   */
  allowedComponents: ComponentType[];
  
  /**
   * Explicitly banned components (for negative prompting).
   * Used to override default behaviors or prevent common mistakes.
   * 
   * Example: ['Chart', 'Timeline'] in a narrow sidebar
   * Reason: Charts need horizontal space
   */
  bannedComponents?: ComponentType[];
  
  /**
   * Supported SlotLayout strategies for this slot.
   * If omitted, all layouts are assumed valid.
   * 
   * Example: ['SlotLayoutStack'] for text-heavy regions
   */
  allowedLayouts?: LayoutType[];
  
  /**
   * Recommended maximum number of items in this slot.
   * Used for density calculation and validation.
   * 
   * Example: 1 for header slots, 5 for metric sidebars
   */
  maxElements?: number;
  
  /**
   * Optional minimum number of items.
   * Used to enforce "must have content" rules.
   */
  minElements?: number;
}

// =============================================================================
// Template Manifest (Template-level Definition)
// =============================================================================

/**
 * Template category for high-level classification.
 * Helps the Agent select the right template for the content type.
 */
export type TemplateCategory = 
  | 'data'        // Data visualization and metrics (charts, KPIs)
  | 'narrative'   // Text-heavy storytelling (articles, explanations)
  | 'visual'      // Image-focused (hero slides, covers)
  | 'comparison'; // Side-by-side comparisons

/**
 * The complete manifest for a template component.
 * This is the Single Source of Truth exported alongside the template.
 */
export interface TemplateManifest {
  /**
   * Unique identifier matching the component name.
   * Example: 'TemplateDashboard', 'TemplateTwoColumn'
   */
  id: string;
  
  /**
   * Human-readable description for Agent selection.
   * Should explain when to use this template.
   * 
   * Example: "Use for data-dense KPI displays with charts and metrics"
   */
  description: string;
  
  /**
   * High-level categorization for selection strategy.
   */
  category: TemplateCategory;
  
  /**
   * Slot definitions keyed by slot name (must match component props).
   * 
   * Example:
   * ```
   * slots: {
   *   header: { ... },
   *   main: { ... },
   *   sidebar: { ... }
   * }
   * ```
   */
  slots: Record<string, SlotManifest>;
  
  /**
   * Optional metadata for additional context.
   */
  metadata?: {
    /**
     * Tags for semantic search/filtering.
     * Example: ['metrics', 'dashboard', 'kpi']
     */
    tags?: string[];
    
    /**
     * Version for tracking manifest changes.
     */
    version?: string;
    
    /**
     * Author/maintainer information.
     */
    author?: string;
  };
}

// =============================================================================
// Manifest Registry (Collection of all Manifests)
// =============================================================================

/**
 * Registry of all template manifests in the system.
 * This is what gets exported to JSON for Python consumption.
 */
export interface ManifestRegistry {
  /**
   * All template manifests keyed by template ID.
   */
  templates: Record<string, TemplateManifest>;
  
  /**
   * Metadata about the registry itself.
   */
  metadata: {
    /**
     * Generation timestamp (ISO 8601).
     */
    generatedAt: string;
    
    /**
     * Version of the manifest schema.
     */
    schemaVersion: string;
    
    /**
     * Total number of templates.
     */
    templateCount: number;
  };
}

// =============================================================================
// Validation Result Types
// =============================================================================

/**
 * Result of validating content against a slot manifest.
 */
export interface SlotValidationResult {
  /**
   * Whether the content is valid for this slot.
   */
  valid: boolean;
  
  /**
   * List of validation errors (if any).
   */
  errors: SlotValidationError[];
  
  /**
   * List of validation warnings (non-blocking issues).
   */
  warnings: SlotValidationWarning[];
}

/**
 * A validation error that prevents rendering.
 */
export interface SlotValidationError {
  /**
   * Error type for categorization.
   */
  type: 'disallowed-component' | 'disallowed-layout' | 'max-elements-exceeded' | 'min-elements-not-met';
  
  /**
   * Human-readable error message.
   */
  message: string;
  
  /**
   * Slot name where the error occurred.
   */
  slotName: string;
  
  /**
   * Component type that caused the error (if applicable).
   */
  componentType?: ComponentType;
}

/**
 * A validation warning that doesn't prevent rendering but indicates potential issues.
 */
export interface SlotValidationWarning {
  /**
   * Warning type.
   */
  type: 'orientation-mismatch' | 'high-density' | 'deprecated-component';
  
  /**
   * Human-readable warning message.
   */
  message: string;
  
  /**
   * Slot name where the warning occurred.
   */
  slotName: string;
}

// =============================================================================
// Helper Types for Template Props Validation
// =============================================================================

/**
 * Extract the slot names from a template manifest.
 * Useful for type-safe prop definitions.
 */
export type SlotNames<T extends TemplateManifest> = keyof T['slots'];

/**
 * Type guard to check if a value is a valid ComponentType.
 */
export function isComponentType(value: unknown): value is ComponentType {
  const validTypes: ComponentType[] = [
    'Heading', 'Text', 'Callout', 'Highlight',
    'SmartList', 'StepList', 'ProcessStrip',
    'MetricGroup', 'MetricStrip', 'MetricCard', 'MetricBadges', 'BigNum',
    'ChartBar', 'ChartLine', 'ChartPie',
    'TableData', 'QuoteBlock', 'ImageBlock', 'CardGroup', 'NetworkGraph',
    'Timeline'
  ];
  return typeof value === 'string' && validTypes.includes(value as ComponentType);
}

/**
 * Type guard to check if a value is a valid LayoutType.
 */
export function isLayoutType(value: unknown): value is LayoutType {
  return value === 'SlotLayoutStack' || value === 'SlotLayoutGrid' || value === 'SlotLayoutFit';
}
