/**
 * ProcessStripEx Component (L2 Block)
 * 
 * Enhanced process visualization with card-based steps and result state.
 * Reference style: Horizontal cards with arrows, colored headers for steps, distinct result card.
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ProcessStep {
  /** The main title of the step */
  title: string;
  /** Descriptive text for the step */
  description?: string;
  /** Icon/Emoji for the step header */
  icon?: string;
  /** Status determines styling (default=blue, success=green, warning=yellow) */
  status?: 'default' | 'active' | 'success' | 'warning' | 'primary';
  /** Optional pre-header label (e.g. "Step 1") */
  headerPrefix?: string;
  /** Text to highlight within the description */
  highlight?: string;
}

export type ConnectorType = 'chevron' | 'arrow-right' | 'arrow-left' | 'arrow-double' | 'none';

export interface ProcessStripExProps {
  /** Unique identifier */
  id?: string;
  /** Optional section title */
  title?: string;
  /** The steps to display */
  items: ProcessStep[];
  /** Optional visual variant */
  variant?: 'default' | 'compact';
  /** Connector style between items (default: 'arrow-right') */
  connector?: ConnectorType;
}

// =============================================================================
// Helpers
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
      <mark style={{ 
        backgroundColor: 'rgba(255, 230, 0, 0.3)', 
        color: 'inherit',
        fontWeight: 700,
        padding: '0 2px',
        borderRadius: '2px'
      }}>{highlight}</mark>
      {parts.slice(1).join(highlight)}
    </>
  );
}

const themeColors: Record<string, { header: string; text: string; icon: string }> = {
  default: { 
    header: 'var(--theme-surface-2, #e2e8f0)', 
    text: 'var(--theme-text-bold, #0f172a)',
    icon: 'var(--theme-text, #334155)'
  },
  primary: { 
    header: 'var(--theme-primary-light, #dbeafe)', 
    text: 'var(--theme-text-bold, #0f172a)',
    icon: 'var(--theme-primary, #2563eb)'
  },
  active: { 
    header: 'var(--theme-primary, #3b82f6)', 
    text: '#ffffff',
    icon: '#ffffff'
  },
  success: { 
    header: 'var(--theme-success-light, #dcfce7)', 
    text: 'var(--theme-success-dark, #14532d)',
    icon: 'var(--theme-success, #16a34a)'
  },
  warning: { 
    header: 'var(--theme-warning-light, #fef9c3)', 
    text: 'var(--theme-warning-dark, #713f12)',
    icon: 'var(--theme-warning, #ca8a04)'
  }
};

const ChevronRight = ({ size = 32 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ color: 'var(--theme-text-light, #94a3b8)', flexShrink: 0 }}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const BlockArrowRight = ({ size = 48 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    style={{ color: 'var(--theme-text-light, #94a3b8)', flexShrink: 0 }}
  >
    <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" transform="rotate(90 12 12)" />
  </svg>
);

const BlockArrowLeft = ({ size = 48 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    style={{ color: 'var(--theme-text-light, #94a3b8)', flexShrink: 0 }}
  >
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);

const BlockArrowDouble = ({ size = 48 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    style={{ color: 'var(--theme-text-light, #94a3b8)', flexShrink: 0 }}
  >
    <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
  </svg>
);

// =============================================================================
// Component
// =============================================================================

export function ProcessStripEx({
  id,
  title,
  items,
  variant = 'default',
  connector = 'arrow-right'
}: ProcessStripExProps) {
  
  const renderConnector = (type: ConnectorType) => {
    switch (type) {
      case 'arrow-right': return <BlockArrowRight size={56} />;
      case 'arrow-left': return <BlockArrowLeft size={56} />;
      case 'arrow-double': return <BlockArrowDouble size={56} />;
      case 'chevron': return <ChevronRight size={48} />;
      case 'none': return null;
      default: return <BlockArrowRight size={56} />;
    }
  };
  
  return (
    <div 
      id={id} 
      className="process-stripex-block"
      data-block="process-stripex"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: '1rem'
      }}
    >
      {title && (
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: 'var(--theme-text-heading, #0f172a)'
        }}>
          {title}
        </h3>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: '0.5rem',
        width: '100%'
      }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const status = item.status || 'primary';
          const isResultCard = status === 'success'; 
          
          // Gradient Logic using Theme Primary Color
          // We mix White into Primary based on index relative to "steps before result"
          // Assuming the last item is often the "Result" (success), we gradient the others.
          const stepCount = items.length - (items[items.length - 1].status === 'success' ? 1 : 0);
          const isGradientStep = !isResultCard && index < stepCount;
          
          let headerBg = themeColors.default.header;
          let headerText = themeColors.default.text;

          if (isResultCard) {
            headerBg = 'rgba(34, 197, 94, 0.1)';
            headerText = 'var(--theme-success-dark, #14532d)';
          } else if (isGradientStep) {
            // Calculate intensity: 0 = Lightest, stepCount-1 = Darkest (Primary)
            // mixRatio is % of PRIMARY color. 
            // We clamp the start to 60% intensity to ensure white text is always readable
            // and the style remains consistent (Dark Header + White Text) across all steps.
            // Range: 0.6 -> 1.0
            const distinctSteps = Math.max(stepCount, 1);
            const ratio = 0.6 + (0.4 * (index / Math.max(distinctSteps - 1, 1)));
            const whiteMix = Math.round((1 - ratio) * 100);
            
            headerBg = `color-mix(in srgb, var(--theme-primary, #2563eb), white ${whiteMix}%)`;
            headerText = '#ffffff';
          } else {
             // Fallback for non-gradient, non-result items (if any layout weirdness)
             headerBg = themeColors[status].header;
             headerText = status === 'active' ? '#fff' : themeColors[status].text;
          }

          return (
            <React.Fragment key={index}>
              {/* Card Container */}
              <div style={{
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--theme-surface, #ffffff)',
                border: isResultCard 
                  ? '2px solid var(--theme-success, #22c55e)' 
                  : '1px solid var(--theme-border, #e2e8f0)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
                minHeight: '180px',
                minWidth: '0' 
              }}>
                
                {/* Header */}
                <div style={{
                  padding: '1.5rem 2rem',
                  background: headerBg,
                  color: headerText,
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  lineHeight: 1.2,
                  borderBottom: isResultCard ? 'none' : '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '1rem'
                }}>
                   <span>{item.title}</span>
                </div>

                {/* Body */}
                <div style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  flex: 1,
                  justifyContent: 'flex-start'
                }}>
                   {item.icon && (
                     <div style={{ 
                       fontSize: '3.5rem', 
                       lineHeight: 1,
                       marginBottom: '0.5rem',
                       textAlign: 'center'
                     }}>
                       {item.icon}
                     </div>
                   )}
                   
                   {item.description && (
                     <div style={{
                       fontSize: '1.5rem',
                       lineHeight: 1.5,
                       color: isResultCard ? 'var(--theme-success-dark, #14532d)' : 'var(--theme-text, #334155)',
                       fontWeight: 500,
                       textAlign: 'left',
                       wordWrap: 'break-word',
                       overflowWrap: 'break-word'
                     }}>
                       {renderTextWithHighlight(item.description, item.highlight)}
                     </div>
                   )}
                </div>
              </div>

              {/* Arrow Connector */}
              {!isLast && connector !== 'none' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 0.5rem'
                }}>
                  {renderConnector(connector)}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
