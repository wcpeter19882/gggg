/**
 * MDX L0 Validator
 * 
 * Validates MDX content to ensure it contains NO L0 elements or attributes.
 * L0 (forbidden) includes: div, span, section, className, style, etc.
 * 
 * This validator is used to ensure AI-generated MDX follows the Strictly Semantic
 * architecture where only L1-L3 components are allowed.
 */

import type { ValidationResult, ValidationError } from '@/utils/types';

// =============================================================================
// Forbidden Elements & Attributes (L0)
// =============================================================================

/** HTML elements that are forbidden in Agent-generated MDX */
export const FORBIDDEN_ELEMENTS = [
  'div',
  'span',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'main',
  'figure',
  'figcaption',
  'table',
  'tr',
  'td',
  'th',
  'thead',
  'tbody',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'button',
  'input',
  'form',
  'label',
  'br',
  'hr',
];

/** Attributes that are forbidden in Agent-generated MDX */
export const FORBIDDEN_ATTRIBUTES = [
  'className',
  'class',
  'style',
  'dangerouslySetInnerHTML',
  'onClick',
  'onMouseOver',
  'onMouseOut',
  'onFocus',
  'onBlur',
  'id',
];

// =============================================================================
// Validation Patterns
// =============================================================================

/** Create regex pattern for element detection */
function createElementPattern(element: string): RegExp {
  // Match <element or <element> or <element attributes
  return new RegExp(`<${element}(?:\\s|>|\\/)`, 'gi');
}

/** Create regex pattern for attribute detection */
function createAttributePattern(attribute: string): RegExp {
  // Match attribute= or attribute=
  return new RegExp(`\\s${attribute}\\s*=`, 'gi');
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Get line number from character index
 */
function getLineNumber(content: string, index: number): number {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

/**
 * Get column number from character index
 */
function getColumnNumber(content: string, index: number): number {
  const lastNewline = content.lastIndexOf('\n', index - 1);
  return index - lastNewline;
}

/**
 * Get suggestion for forbidden element
 */
function getElementSuggestion(element: string): string {
  const suggestions: Record<string, string> = {
    div: 'Use LayoutCover, LayoutSplit, or LayoutGrid for layouts',
    span: 'Use Text component with variant prop',
    section: 'Use LayoutCover, LayoutSplit, or LayoutGrid',
    ul: 'Use SmartList component',
    ol: 'Use SmartList with ordered={true}',
    li: 'Use SmartList with items prop',
    table: 'Use TableData component',
    img: 'Use ImageBlock component',
    a: 'Links should be in Text or use CardGroup with link prop',
  };
  
  return suggestions[element] || `Use a semantic L1-L3 component instead of <${element}>`;
}

/**
 * Get suggestion for forbidden attribute
 */
function getAttributeSuggestion(attribute: string): string {
  const suggestions: Record<string, string> = {
    className: 'Styling is handled by theme. Use variant, intent, or size props instead',
    class: 'Styling is handled by theme. Use variant, intent, or size props instead',
    style: 'Inline styles are forbidden. Use theme and vibe props instead',
    dangerouslySetInnerHTML: 'Raw HTML is forbidden. Use semantic components',
    onClick: 'Event handlers are internal only. Use semantic components',
    id: 'IDs are internal only. Use data props if needed',
  };
  
  return suggestions[attribute] || `The ${attribute} attribute is not allowed in Agent-generated MDX`;
}

/**
 * Validate MDX content for L0 violations
 * 
 * @param content - MDX content string to validate
 * @returns ValidationResult with errors if any violations found
 */
export function validateMDX(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check for forbidden elements
  for (const element of FORBIDDEN_ELEMENTS) {
    const pattern = createElementPattern(element);
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      errors.push({
        type: 'element',
        message: `L0 violation: <${element}> is forbidden`,
        line: getLineNumber(content, match.index),
        column: getColumnNumber(content, match.index),
        suggestion: getElementSuggestion(element),
      });
    }
  }
  
  // Check for forbidden attributes
  for (const attribute of FORBIDDEN_ATTRIBUTES) {
    const pattern = createAttributePattern(attribute);
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      errors.push({
        type: 'attribute',
        message: `L0 violation: ${attribute} attribute is forbidden`,
        line: getLineNumber(content, match.index),
        column: getColumnNumber(content, match.index),
        suggestion: getAttributeSuggestion(attribute),
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate MDX and throw if invalid
 * 
 * @param content - MDX content string to validate
 * @throws Error if validation fails
 */
export function assertValidMDX(content: string): void {
  const result = validateMDX(content);
  
  if (!result.valid) {
    const errorMessages = result.errors.map((error) => {
      const location = error.line ? ` (line ${error.line}, col ${error.column})` : '';
      return `${error.message}${location}\n  → ${error.suggestion}`;
    });
    
    throw new Error(
      `MDX Validation Failed:\n\n${errorMessages.join('\n\n')}`
    );
  }
}

/**
 * Format validation errors for display
 * 
 * @param result - ValidationResult to format
 * @returns Formatted error string
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) {
    return '✓ MDX is valid - no L0 violations found';
  }
  
  const errorCount = result.errors.length;
  const header = `✗ MDX validation failed with ${errorCount} error${errorCount > 1 ? 's' : ''}:\n`;
  
  const errorLines = result.errors.map((error, index) => {
    const location = error.line ? ` at line ${error.line}` : '';
    return `\n${index + 1}. ${error.message}${location}\n   Suggestion: ${error.suggestion}`;
  });
  
  return header + errorLines.join('');
}

// =============================================================================
// Re-export types
// =============================================================================

export type { ValidationResult, ValidationError };
