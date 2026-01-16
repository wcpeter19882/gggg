/**
 * SmartList Component (L2 Block)
 * 
 * Semantic list component for bullet points and numbered lists.
 * Supports nested items, optional icons, and integrated slots for
 * title, subtitle, callout, and footer content.
 * 
 * Usage:
 * ```mdx
 * <SmartList items={["Item 1", "Item 2", "Item 3"]} />
 * <SmartList 
 *   items={[
 *     { text: "Item with icon", icon: "🚀" },
 *     { text: "Nested item", items: ["Sub 1", "Sub 2"] }
 *   ]} 
 *   ordered={true}
 *   title="Key Points"
 *   subtitle="Summary of findings"
 *   callout={{ intent: "info", text: "Important insight" }}
 * />
 * ```
 */

import React from 'react';
import type { ListItem } from '@/utils/types';

// =============================================================================
// Types
// =============================================================================

export interface CalloutData {
  /** Callout intent: info, warning, success, error */
  intent?: 'info' | 'warning' | 'success' | 'error';
  /** Callout title */
  title?: string;
  /** Callout text content */
  text: string;
}

export interface SmartListProps {
  /** List items - can be strings or ListItem objects */
  items: (string | ListItem)[];
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
}

// =============================================================================
// Helper Components
// =============================================================================

interface ListItemComponentProps {
  item: string | ListItem;
  icon?: string;
}

function ListItemComponent({ item, icon }: ListItemComponentProps): JSX.Element {
  // Simple string item
  if (typeof item === 'string') {
    return (
      <li className="smart-list-item">
        {icon && <span className="smart-list-icon" aria-hidden="true">{icon}</span>}
        <span className="smart-list-text">{item}</span>
      </li>
    );
  }
  
  // Complex ListItem object
  const itemIcon = item.icon || icon;
  
  return (
    <li className="smart-list-item">
      {itemIcon && <span className="smart-list-icon" aria-hidden="true">{itemIcon}</span>}
      <div className="smart-list-content">
        <span className="smart-list-text">{item.text}</span>
        {item.items && item.items.length > 0 && (
          <SmartList items={item.items} icon={icon} />
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
 * Renders a semantic list with theme-aware styling and optional nesting.
 * Supports integrated slots for title, subtitle, callout, and footer.
 * 
 * @param items - Array of list items (strings or ListItem objects)
 * @param ordered - Whether to render as ordered list (ol vs ul)
 * @param icon - Custom bullet icon
 * @param title - Optional title above the list
 * @param subtitle - Optional subtitle below title
 * @param callout - Optional integrated callout
 * @param footer - Optional footer text
 */
export function SmartList({
  items,
  ordered = false,
  icon,
  title,
  subtitle,
  callout,
  footer,
}: SmartListProps): JSX.Element {
  const ListElement = ordered ? 'ol' : 'ul';
  const listClassName = `smart-list${ordered ? ' smart-list-ordered' : ''}`;
  
  // Determine callout class based on intent
  const calloutClass = callout 
    ? `block-callout callout-${callout.intent || 'info'}`
    : '';
  
  return (
    <div className="smart-list-block">
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
            icon={icon}
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
