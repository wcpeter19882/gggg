/**
 * TableData Component (L2 Block)
 * 
 * Semantic data table component for displaying tabular data.
 * Automatically styled based on current theme.
 * Supports integrated slots for title, subtitle, callout, and footer.
 * 
 * Usage:
 * ```mdx
 * <TableData 
 *   headers={["Name", "Role", "Department"]}
 *   rows={[
 *     ["Alice", "Engineer", "R&D"],
 *     ["Bob", "Designer", "Product"],
 *     ["Carol", "Manager", "Operations"]
 *   ]}
 *   title="Team Overview"
 *   subtitle="Current roster"
 *   callout={{ intent: "info", text: "Updated weekly" }}
 * />
 * ```
 */

import React from 'react';
import type { Size } from '@/utils/types';

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

export interface TableDataProps {
  /** Table headers */
  headers: string[];
  /** Table rows (array of arrays) */
  rows: (string | number)[][];
  /** Table title */
  title?: string;
  /** Table subtitle */
  subtitle?: string;
  /** Table size variant */
  size?: Size;
  /** Striped rows */
  striped?: boolean;
  /** Highlight header */
  headerHighlight?: boolean;
  /** Optional integrated callout */
  callout?: CalloutData;
  /** Optional footer text */
  footer?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TableData Component
 * 
 * Renders a styled data table with theme-aware colors.
 * Supports integrated slots for title, subtitle, callout, and footer.
 * 
 * @param headers - Array of column headers
 * @param rows - 2D array of row data
 * @param title - Optional table title
 * @param subtitle - Optional table subtitle
 * @param size - Table text size (sm, md, lg)
 * @param striped - Whether to use striped rows
 * @param headerHighlight - Whether to highlight header row
 * @param callout - Optional integrated callout
 * @param footer - Optional footer text
 */
export function TableData({
  headers,
  rows,
  title,
  subtitle,
  size = 'md',
  striped = true,
  headerHighlight = true,
  callout,
  footer,
}: TableDataProps): JSX.Element {
  // Size classes
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    full: 'text-base',
  }[size];
  
  // Determine callout class based on intent
  const calloutClass = callout 
    ? `block-callout callout-${callout.intent || 'info'}`
    : '';
  
  return (
    <div className="table-block">
      {/* Block Header */}
      {(title || subtitle) && (
        <div className="block-header">
          {title && <h3 className="block-title">{title}</h3>}
          {subtitle && <p className="block-subtitle">{subtitle}</p>}
        </div>
      )}
      
      {/* Main Table Content */}
      <div className="table-wrapper">
        <table 
          className={`data-table ${sizeClass} ${striped ? 'table-striped' : ''}`}
        >
          <thead className={headerHighlight ? 'header-highlight' : ''}>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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

export default TableData;
