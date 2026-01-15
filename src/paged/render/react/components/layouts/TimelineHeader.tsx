import React from 'react';

/**
 * Shared Timeline-style Header Component
 * 
 * Renders a consistent large (4rem) headline with optional subtitle.
 * Used across LayoutDashboard, LayoutSplit, and LayoutStacked to ensure visual consistency.
 */
export function TimelineHeader({ headline, subtitle }: { headline: string; subtitle?: string | null }): JSX.Element {
  return (
    <div style={{ textAlign: 'left' }}>
      <h1
        className="heading-1"
        style={{
          margin: '1.0rem 1.0rem 0 1.0rem',
          textAlign: 'left',
          fontSize: '4rem',
          fontWeight: 700,
          color: 'var(--theme-text)',
          textWrap: 'wrap',
          width: '100%',
          maxWidth: 'none',
        }}
      >
        {headline}
      </h1>
      {subtitle && (
        <p
          style={{
            margin: '0.5rem 1.0rem 0 1.0rem',
            textAlign: 'left',
            fontSize: '1.5rem',
            fontStyle: 'italic',
            color: 'var(--theme-text-muted)',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
