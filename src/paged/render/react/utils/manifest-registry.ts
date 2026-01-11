/**
 * Manifest Registry
 * 
 * Central registry that collects all template manifests and provides
 * utilities for working with them. This module also handles exporting
 * manifests to JSON for Python consumption.
 */

import { DashboardManifest } from '@/components/templates/TemplateDashboard';
import { TwoColumnManifest } from '@/components/templates/TemplateTwoColumn';
import { SingleColumnManifest } from '@/components/templates/TemplateSingleColumn';
import { CoverManifest } from '@/components/templates/TemplateCover';
import { FullBleedManifest } from '@/components/templates/TemplateFullBleed';

import type { 
  TemplateManifest, 
  ManifestRegistry,
  ComponentType,
  LayoutType,
  SlotValidationResult,
  SlotValidationError,
  SlotValidationWarning
} from './manifest-types';
import type { ReactElement } from 'react';

// =============================================================================
// Registry
// =============================================================================

/**
 * All template manifests indexed by template ID.
 */
export const TEMPLATE_MANIFESTS: Record<string, TemplateManifest> = {
  TemplateDashboard: DashboardManifest,
  TemplateTwoColumn: TwoColumnManifest,
  TemplateSingleColumn: SingleColumnManifest,
  TemplateCover: CoverManifest,
  TemplateFullBleed: FullBleedManifest,
};

/**
 * Get a complete manifest registry object suitable for JSON export.
 */
export function getManifestRegistry(): ManifestRegistry {
  return {
    templates: TEMPLATE_MANIFESTS,
    metadata: {
      generatedAt: new Date().toISOString(),
      schemaVersion: '1.0.0',
      templateCount: Object.keys(TEMPLATE_MANIFESTS).length,
    },
  };
}

/**
 * Get a specific template manifest by ID.
 */
export function getTemplateManifest(templateId: string): TemplateManifest | undefined {
  return TEMPLATE_MANIFESTS[templateId];
}

/**
 * Get all template IDs.
 */
export function getTemplateIds(): string[] {
  return Object.keys(TEMPLATE_MANIFESTS);
}

/**
 * Get templates filtered by category.
 */
export function getTemplatesByCategory(category: TemplateManifest['category']): TemplateManifest[] {
  return Object.values(TEMPLATE_MANIFESTS).filter(m => m.category === category);
}

/**
 * Search templates by tags.
 */
export function searchTemplatesByTag(tag: string): TemplateManifest[] {
  return Object.values(TEMPLATE_MANIFESTS).filter(m => 
    m.metadata?.tags?.includes(tag)
  );
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validate a React element against a slot manifest.
 * This performs runtime validation to ensure content meets slot constraints.
 */
export function validateSlotContent(
  slotName: string,
  content: React.ReactNode,
  manifest: TemplateManifest
): SlotValidationResult {
  const slotManifest = manifest.slots[slotName];
  
  if (!slotManifest) {
    return {
      valid: false,
      errors: [{
        type: 'disallowed-component',
        message: `Slot '${slotName}' is not defined in template '${manifest.id}'`,
        slotName,
      }],
      warnings: [],
    };
  }
  
  const errors: SlotValidationError[] = [];
  const warnings: SlotValidationWarning[] = [];
  
  // Extract component types from content
  const components = extractComponentTypes(content);
  
  // Check 1: Validate component types
  for (const componentType of components) {
    if (!slotManifest.allowedComponents.includes(componentType)) {
      errors.push({
        type: 'disallowed-component',
        message: `Component '${componentType}' is not allowed in slot '${slotName}'. Allowed: [${slotManifest.allowedComponents.join(', ')}]`,
        slotName,
        componentType,
      });
    }
    
    if (slotManifest.bannedComponents?.includes(componentType)) {
      errors.push({
        type: 'disallowed-component',
        message: `Component '${componentType}' is explicitly banned in slot '${slotName}'`,
        slotName,
        componentType,
      });
    }
  }
  
  // Check 2: Validate element count
  const elementCount = components.length;
  
  if (slotManifest.maxElements && elementCount > slotManifest.maxElements) {
    errors.push({
      type: 'max-elements-exceeded',
      message: `Slot '${slotName}' contains ${elementCount} elements, but maximum is ${slotManifest.maxElements}`,
      slotName,
    });
  }
  
  if (slotManifest.minElements && elementCount < slotManifest.minElements) {
    errors.push({
      type: 'min-elements-not-met',
      message: `Slot '${slotName}' contains ${elementCount} elements, but minimum is ${slotManifest.minElements}`,
      slotName,
    });
  }
  
  // Check 3: Warnings for orientation mismatch (non-blocking)
  if (slotManifest.orientation && elementCount > 0) {
    // This is a heuristic - we could enhance it with actual component metadata
    const hasWideComponents = components.some(c => 
      ['ChartBar', 'ChartLine', 'ChartPie', 'TableData', 'NetworkGraph', 'ProcessStrip'].includes(c)
    );
    
    if (slotManifest.orientation === 'portrait' && hasWideComponents) {
      warnings.push({
        type: 'orientation-mismatch',
        message: `Slot '${slotName}' is portrait-oriented but contains wide components`,
        slotName,
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract component type strings from React nodes.
 * This is a best-effort extraction - it won't catch dynamically rendered components.
 */
function extractComponentTypes(content: React.ReactNode): ComponentType[] {
  const types: ComponentType[] = [];
  
  if (!content) return types;
  
  // Handle arrays
  if (Array.isArray(content)) {
    for (const item of content) {
      types.push(...extractComponentTypes(item));
    }
    return types;
  }
  
  // Handle React elements
  if (typeof content === 'object' && 'type' in content) {
    const element = content as ReactElement;
    
    // Try to get the component name
    const typeName = typeof element.type === 'function'
      ? element.type.name || (element.type as any).displayName
      : typeof element.type === 'string'
      ? element.type
      : undefined;
    
    if (typeName && isValidComponentType(typeName)) {
      types.push(typeName as ComponentType);
    }
    
    // Recurse into children
    if (element.props?.children) {
      types.push(...extractComponentTypes(element.props.children));
    }
  }
  
  return types;
}

/**
 * Check if a string is a valid ComponentType.
 */
function isValidComponentType(name: string): boolean {
  const validTypes: string[] = [
    'Heading', 'Text', 'Callout', 'Highlight',
    'SmartList', 'StepList', 'ProcessStrip',
    'MetricGroup', 'MetricStrip', 'MetricCard', 'MetricBadges', 'BigNum',
    'ChartBar', 'ChartLine', 'ChartPie',
    'TableData', 'QuoteBlock', 'ImageBlock', 'CardGroup', 'NetworkGraph',
    'Timeline'
  ];
  return validTypes.includes(name);
}

// =============================================================================
// Export for Python Consumption
// =============================================================================

/**
 * Generate a JSON string of the manifest registry.
 * This can be written to a file for Python to consume.
 */
export function exportManifestRegistryJSON(): string {
  return JSON.stringify(getManifestRegistry(), null, 2);
}

/**
 * Generate Python-compatible prompt instructions from a manifest.
 * This creates the system prompt text that guides the Agent.
 */
export function generateSystemPrompt(manifest: TemplateManifest): string {
  const lines: string[] = [];
  
  lines.push(`# LAYOUT RULES: ${manifest.id}`);
  lines.push(manifest.description);
  lines.push('');
  lines.push('## SLOTS');
  
  for (const [slotName, slotManifest] of Object.entries(manifest.slots)) {
    lines.push(`- **${slotName}**: ${slotManifest.description}`);
    
    if (slotManifest.orientation) {
      lines.push(`  * ORIENTATION: ${slotManifest.orientation}`);
    }
    
    lines.push(`  * ACCEPTS: ${slotManifest.allowedComponents.join(', ')}`);
    
    if (slotManifest.bannedComponents && slotManifest.bannedComponents.length > 0) {
      lines.push(`  * BANNED: ${slotManifest.bannedComponents.join(', ')}`);
    }
    
    if (slotManifest.allowedLayouts) {
      lines.push(`  * LAYOUTS: ${slotManifest.allowedLayouts.join(', ')}`);
    }
    
    if (slotManifest.maxElements) {
      lines.push(`  * MAX ELEMENTS: ${slotManifest.maxElements}`);
    }
    
    if (slotManifest.minElements) {
      lines.push(`  * MIN ELEMENTS: ${slotManifest.minElements}`);
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Generate system prompts for all templates.
 */
export function generateAllSystemPrompts(): Record<string, string> {
  const prompts: Record<string, string> = {};
  
  for (const [id, manifest] of Object.entries(TEMPLATE_MANIFESTS)) {
    prompts[id] = generateSystemPrompt(manifest);
  }
  
  return prompts;
}
