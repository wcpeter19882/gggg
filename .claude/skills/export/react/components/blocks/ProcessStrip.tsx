/**
 * ProcessStrip Component (L2 Block)
 * 
 * Process/phase visualization with two layout modes:
 * - linear: Horizontal strip with arrows connecting steps
 * - circular: Recycling-icon style with curved arrows forming a cycle
 * 
 * Usage:
 * ```mdx
 * // Linear mode (default) - horizontal strip
 * <ProcessStrip 
 *   id="process_001"
 *   mode="linear"
 *   items={["Plan", "Build", "Test", "Ship"]}
 * />
 * 
 * // Circular mode - recycling icon style
 * <ProcessStrip 
 *   id="process_002"
 *   mode="circular"
 *   items={[
 *     { label: "Plan", status: "done" },
 *     { label: "Build", status: "active" },
 *     { label: "Test", status: "pending" },
 *     { label: "Ship", status: "pending" }
 *   ]}
 * />
 * ```
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export type ProcessStatus = 'done' | 'active' | 'pending' | 'neutral';
export type ProcessMode = 'linear' | 'circular';

export interface ProcessItem {
  /** Stage/phase label */
  label: string;
  /** Status: done, active, pending, neutral */
  status?: ProcessStatus;
  /** Optional icon */
  icon?: string;
}

export interface ProcessStripProps {
  /** Unique identifier */
  id?: string;
  /** Process items - strings or objects with label/status */
  items: (string | ProcessItem)[];
  /** Optional title */
  title?: string;
  /** Show connectors between items (default: true) */
  showConnectors?: boolean;
  /** Variant: default, compact */
  variant?: 'default' | 'compact';
  /** Layout mode: linear (horizontal strip) or circular (cycle diagram) */
  mode?: ProcessMode;
}

// =============================================================================
// Helpers
// =============================================================================

const statusColors: Record<ProcessStatus, string> = {
  done: 'var(--theme-accent, var(--theme-success, #10b981))',
  active: 'var(--theme-primary, #3b82f6)',
  pending: 'var(--theme-border, #9ca3af)',
  neutral: 'var(--theme-text-muted, #6b7280)',
};

/**
 * Calculate point on circle given angle (in radians) and radius
 */
function pointOnCircle(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

/**
 * Create an arc path with an arrowhead at the end
 */
function createArcWithArrow(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  strokeWidth: number,
  arrowSize: number = 10
): { arcPath: string; arrowPath: string; labelPoint: { x: number; y: number } } {
  const start = pointOnCircle(cx, cy, radius, startAngle);
  const end = pointOnCircle(cx, cy, radius, endAngle);
  
  // Arc path (clockwise)
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
  
  // Arrow at the end - tangent to the circle (pointing in direction of travel)
  const tangentAngle = endAngle + Math.PI / 2;
  const arrowBack1 = {
    x: end.x - arrowSize * Math.cos(tangentAngle - 0.4),
    y: end.y - arrowSize * Math.sin(tangentAngle - 0.4),
  };
  const arrowBack2 = {
    x: end.x - arrowSize * Math.cos(tangentAngle + 0.4),
    y: end.y - arrowSize * Math.sin(tangentAngle + 0.4),
  };
  
  const arrowPath = `M ${arrowBack1.x} ${arrowBack1.y} L ${end.x} ${end.y} L ${arrowBack2.x} ${arrowBack2.y}`;
  
  // Label position - at the midpoint of the arc, pushed outward
  const midAngle = (startAngle + endAngle) / 2;
  const labelPoint = pointOnCircle(cx, cy, radius + 45, midAngle);
  
  return { arcPath, arrowPath, labelPoint };
}

// =============================================================================
// Component
// =============================================================================

/**
 * Linear ProcessStrip - horizontal strip with arrows
 */
function LinearProcessStrip({
  id,
  items,
  title,
  showConnectors = true,
  variant = 'default',
}: Omit<ProcessStripProps, 'mode'>): JSX.Element {
  const isCompact = variant === 'compact';
  
  return (
    <div 
      className={`process-strip-block ${isCompact ? 'process-strip-compact' : ''}`}
      id={id} 
      data-block="process-strip"
      data-mode="linear"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem',
      }}
    >
      {title && (
        <h4 style={{
          fontSize: isCompact ? '1.25rem' : '1.5rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: 'var(--theme-text, #1e293b)',
        }}>
          {title}
        </h4>
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
        flexWrap: 'wrap',
      }}>
        {items.map((item, index) => {
          const isString = typeof item === 'string';
          const label = isString ? item : item.label;
          const status: ProcessStatus = isString ? 'neutral' : (item.status || 'neutral');
          const isLast = index === items.length - 1;
          const color = statusColors[status];
          
          // Box styles based on status
          const boxStyle: React.CSSProperties = {
            minWidth: isCompact ? '100px' : '120px',
            padding: isCompact ? '0.75rem 1rem' : '1rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: isCompact ? '1rem' : '1.125rem',
            fontWeight: 600,
            border: `3px solid ${color}`,
            backgroundColor: status === 'done' || status === 'active' ? color : 'var(--theme-surface, #f8fafc)',
            color: status === 'done' || status === 'active' ? '#ffffff' : 'var(--theme-text, #1e293b)',
            boxShadow: status === 'active' ? `0 0 20px ${color}40` : '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
          };
          
          return (
            <React.Fragment key={index}>
              <div style={boxStyle}>
                {status === 'done' && <span>✓</span>}
                <span>{label}</span>
              </div>
              
              {showConnectors && !isLast && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 1rem',
                }}>
                  <svg 
                    width={isCompact ? '40' : '56'} 
                    height="24" 
                    viewBox="0 0 56 24" 
                    fill="none"
                    style={{ color: 'var(--theme-accent, var(--theme-primary, #3b82f6))' }}
                  >
                    <path 
                      d="M0 12H52M52 12L42 4M52 12L42 20" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      opacity="0.6"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Circular ProcessStrip - recycling icon style cycle diagram
 */
function CircularProcessStrip({
  id,
  items,
  title,
  showConnectors = true,
  variant = 'default',
}: Omit<ProcessStripProps, 'mode'>): JSX.Element {
  const isCompact = variant === 'compact';
  const size = isCompact ? 280 : 360;
  const radius = isCompact ? 70 : 95;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = isCompact ? 8 : 12;
  const gapAngle = 0.25;
  
  const itemCount = items.length;
  const segmentAngle = (2 * Math.PI) / itemCount;
  const startOffset = -Math.PI / 2;
  
  return (
    <div 
      className={`process-strip-block ${isCompact ? 'process-strip-compact' : ''}`}
      id={id} 
      data-block="process-strip"
      data-mode="circular"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
      }}
    >
      {title && (
        <h4 style={{
          fontSize: isCompact ? '1.25rem' : '1.5rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          textAlign: 'center',
          color: 'var(--theme-text, #1e293b)',
        }}>
          {title}
        </h4>
      )}
      
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        {items.map((item, index) => {
          const isString = typeof item === 'string';
          const label = isString ? item : item.label;
          const status: ProcessStatus = isString ? 'neutral' : (item.status || 'neutral');
          const color = statusColors[status];
          
          const segStart = startOffset + index * segmentAngle + gapAngle / 2;
          const segEnd = startOffset + (index + 1) * segmentAngle - gapAngle / 2;
          
          const { arcPath, arrowPath, labelPoint } = createArcWithArrow(
            cx, cy, radius, segStart, segEnd, strokeWidth, isCompact ? 12 : 16
          );
          
          const isLeft = labelPoint.x < cx - 10;
          const isRight = labelPoint.x > cx + 10;
          const textAnchor = isLeft ? 'end' : isRight ? 'start' : 'middle';
          
          return (
            <g key={index}>
              <path
                d={arcPath}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{ opacity: status === 'pending' ? 0.4 : 1 }}
              />
              
              {showConnectors && (
                <path
                  d={arrowPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth * 0.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: status === 'pending' ? 0.4 : 1 }}
                />
              )}
              
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                style={{
                  fontSize: isCompact ? '1rem' : '1.25rem',
                  fontWeight: status === 'active' ? 700 : 600,
                  fill: status === 'active' ? color : 'var(--theme-text, #374151)',
                }}
              >
                {label}
              </text>
              
              {status === 'done' && (() => {
                const checkPoint = pointOnCircle(cx, cy, radius, (segStart + segEnd) / 2);
                return (
                  <>
                    <circle
                      cx={checkPoint.x}
                      cy={checkPoint.y}
                      r={isCompact ? 12 : 16}
                      fill={color}
                    />
                    <text
                      x={checkPoint.x}
                      y={checkPoint.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: isCompact ? '0.75rem' : '1rem',
                        fontWeight: 700,
                        fill: '#ffffff',
                      }}
                    >
                      ✓
                    </text>
                  </>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * ProcessStrip Component
 * 
 * Renders process stages in either linear (horizontal) or circular (cycle) mode.
 * Best for project phases, pipelines, and status progressions.
 * 
 * @param id - Unique identifier
 * @param items - Array of stage strings or objects with label/status
 * @param title - Optional title above diagram
 * @param showConnectors - Show arrows/connectors (default: true)
 * @param variant - Visual variant: default or compact
 * @param mode - Layout mode: linear (default) or circular
 */
export function ProcessStrip({
  mode = 'linear',
  ...props
}: ProcessStripProps): JSX.Element {
  if (mode === 'circular') {
    return <CircularProcessStrip {...props} />;
  }
  return <LinearProcessStrip {...props} />;
}

// =============================================================================
// Exports
// =============================================================================

export default ProcessStrip;
