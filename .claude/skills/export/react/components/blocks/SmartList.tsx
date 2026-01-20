/**
 * SmartList Component (L2 Block)
 * 
 * Semantic list component with multiple visual variants for different scenarios.
 * Supports nested items, optional icons, and integrated slots.
 * 
 * Variants:
 * - default: Clean bullet/numbered list
 * - cards: Each item in a subtle card with left accent border
 * - highlight: Key phrase highlighted with accent background
 * - checklist: Checkmark icons with success styling
 * - timeline: Vertical timeline with dot connectors
 * - compact: Dense layout for sidebars
 * 
 * Usage:
 * ```mdx
 * <SmartList items={["Item 1", "Item 2", "Item 3"]} />
 * 
 * <SmartList 
 *   variant="cards"
 *   items={[
 *     { text: "Key insight with details", highlight: "Key insight" },
 *     { text: "Another point to emphasize", highlight: "Another point" }
 *   ]} 
 * />
 * 
 * <SmartList 
 *   variant="highlight"
 *   items={[
 *     { text: "Revenue increased by 40%", highlight: "40%" },
 *     { text: "Customer satisfaction at 85%", highlight: "85%" }
 *   ]} 
 * />
 * ```
 */

import React from 'react';
import type { ListItem } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export type SmartListVariant = 'default' | 'cards' | 'highlight' | 'checklist' | 'timeline' | 'compact';

export interface CalloutData {
  /** Callout intent: info, warning, success, error */
  intent?: 'info' | 'warning' | 'success' | 'error';
  /** Callout title */
  title?: string;
  /** Callout text content */
  text: string;
}

export interface SmartListItem {
  /** Main text content */
  text: string;
  /** Text to highlight within the item */
  highlight?: string;
  /** Optional icon */
  icon?: string;
  /** Nested items */
  items?: (string | SmartListItem)[];
  /** Optional secondary/description text */
  description?: string;
}

export interface SmartListProps {
  /** List items - can be strings or SmartListItem objects */
  items: (string | ListItem | SmartListItem)[];
  /** Visual variant */
  variant?: SmartListVariant;
  /** Whether to render as ordered list */
  ordered?: boolean;
  /** Custom bullet icon */
  icon?: string;
  /** Optional title above the list */
  title?: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Optional integrated callout */
  callout?: CalloutData;
  /** Optional footer text */
  footer?: string;
  /** Optional unique identifier */
  id?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Render text with optional highlight
 */
function renderTextWithHighlight(text: string, highlight?: string): React.ReactNode {
  if (!highlight || !text.includes(highlight)) {
    return text;
  }
  
  const parts = text.split(highlight);
  return (
    <>
      {parts[0]}
      <mark className="smart-list-highlight">{highlight}</mark>
      {parts.slice(1).join(highlight)}
    </>
  );
}

/**
 * Get icon for variant
 */
function getVariantIcon(variant: SmartListVariant): string | undefined {
  switch (variant) {
    case 'checklist':
      return '✓';
    case 'timeline':
      return '●';
    default:
      return undefined;
  }
}

// =============================================================================
// List Item Components
// =============================================================================

interface ListItemComponentProps {
  item: string | ListItem | SmartListItem;
  icon?: string;
  variant: SmartListVariant;
  index: number;
}

function ListItemComponent({ item, icon, variant, index }: ListItemComponentProps): JSX.Element {
  const isString = typeof item === 'string';
  const text = isString ? item : item.text;
  const itemIcon = isString ? icon : ((item as SmartListItem).icon || icon);
  const highlight = isString ? undefined : (item as SmartListItem).highlight;
  const description = isString ? undefined : (item as SmartListItem).description;
  const nestedItems = isString ? undefined : (item as SmartListItem).items;
  
  // Variant-specific rendering
  if (variant === 'cards') {
    return (
      <li className="smart-list-item smart-list-card">
        <div className="smart-list-card-content">
          {itemIcon && <span className="smart-list-icon" aria-hidden="true">{itemIcon}</span>}
          <div className="smart-list-card-text">
            <span className="smart-list-text">{renderTextWithHighlight(text, highlight)}</span>
            {description && <span className="smart-list-description">{description}</span>}
          </div>
        </div>
        {nestedItems && nestedItems.length > 0 && (
          <SmartList items={nestedItems} icon={icon} variant="compact" />
        )}
      </li>
    );
  }
  
  if (variant === 'timeline') {
    return (
      <li className="smart-list-item smart-list-timeline-item">
        <div className="smart-list-timeline-dot"></div>
        <div className="smart-list-timeline-content">
          <span className="smart-list-text">{renderTextWithHighlight(text, highlight)}</span>
          {description && <span className="smart-list-description">{description}</span>}
        </div>
      </li>
    );
  }
  
  if (variant === 'checklist') {
    return (
      <li className="smart-list-item smart-list-check-item">
        <span className="smart-list-check-icon" aria-hidden="true">✓</span>
        <span className="smart-list-text">{renderTextWithHighlight(text, highlight)}</span>
      </li>
    );
  }
  
  if (variant === 'highlight') {
    return (
      <li className="smart-list-item smart-list-highlight-item">
        {itemIcon && <span className="smart-list-icon" aria-hidden="true">{itemIcon}</span>}
        <span className="smart-list-text">{renderTextWithHighlight(text, highlight)}</span>
      </li>
    );
  }
  
  // Default and compact variants
  return (
    <li className="smart-list-item">
      {itemIcon && <span className="smart-list-icon" aria-hidden="true">{itemIcon}</span>}
      <div className="smart-list-content">
        <span className="smart-list-text">{renderTextWithHighlight(text, highlight)}</span>
        {description && <span className="smart-list-description">{description}</span>}
        {nestedItems && nestedItems.length > 0 && (
          <SmartList items={nestedItems} icon={icon} variant={variant} />
        )}
      </div>
    </li>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * SmartList Component
 * 
 * Renders a semantic list with theme-aware styling and multiple visual variants.
 * 
 * @param items - Array of list items (strings or SmartListItem objects)
 * @param variant - Visual variant: default, cards, highlight, checklist, timeline, compact
 * @param ordered - Whether to render as ordered list (ol vs ul)
 * @param icon - Custom bullet icon
 * @param title - Optional title above the list
 * @param subtitle - Optional subtitle below title
 * @param callout - Optional integrated callout
 * @param footer - Optional footer text
 * @param id - Optional unique identifier
 */
export function SmartList({
  items,
  variant = 'default',
  ordered = false,
  icon,
  title,
  subtitle,
  callout,
  footer,
  id,
}: SmartListProps): JSX.Element {
  const ListElement = ordered ? 'ol' : 'ul';
  const variantClass = `smart-list-variant-${variant}`;
  const listClassName = `smart-list ${variantClass}${ordered ? ' smart-list-ordered' : ''}`;
  
  // Use variant-specific icon if not provided
  const effectiveIcon = icon || getVariantIcon(variant);
  
  // Determine callout class based on intent
  const calloutClass = callout 
    ? `block-callout callout-${callout.intent || 'info'}`
    : '';
  
  return (
    <div className={`smart-list-block ${variantClass}`} id={id} data-variant={variant}>
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main List Content */}
      <ListElement className={listClassName}>
        {items.map((item, index) => (
          <ListItemComponent 
            key={index} 
            item={item} 
            icon={effectiveIcon}
            variant={variant}
            index={index}
          />
        ))}
      </ListElement>
      
      {/* Integrated Callout */}
      {callout && (
        <div className={calloutClass}>
          {callout.title && <strong className="callout-title">{callout.title}</strong>}
          <span className="callout-text">{callout.text}</span>
        </div>
      )}
      
      {/* Footer */}
      {footer && (
        <div className="block-footer">
          <span className="footer-text">{footer}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default SmartList;
