/**
 * Diagram Theme System
 * 
 * Cytoscape.js stylesheet that interprets semantic classes from the LLM.
 * Maps semantic meaning (start, end, database, decision) to visual styles.
 */

// import type { StylesheetCSS } from 'cytoscape';

/**
 * Calculate effective dimension based on aspect ratio
 * For horizontal layouts (wide), weight width more heavily
 * For vertical layouts (tall), weight height more heavily
 */
function getEffectiveDimension(containerWidth: number, containerHeight: number): number {
  const aspectRatio = containerWidth / containerHeight;
  
  if (aspectRatio > 1.5) {
    // Very wide: weight width 70%, height 30%
    return containerWidth * 0.7 + containerHeight * 0.3;
  } else if (aspectRatio > 1.1) {
    // Wide: weight width 60%, height 40%
    return containerWidth * 0.6 + containerHeight * 0.4;
  } else if (aspectRatio < 0.67) {
    // Very tall: weight height 70%, width 30%
    return containerHeight * 0.7 + containerWidth * 0.3;
  } else if (aspectRatio < 0.9) {
    // Tall: weight height 60%, width 40%
    return containerHeight * 0.6 + containerWidth * 0.4;
  } else {
    // Square-ish: use average
    return (containerWidth + containerHeight) / 2;
  }
}

/**
 * Calculate responsive font size based on container dimensions and aspect ratio
 * Priority: Keep text readable, reduce spacing instead of shrinking text too much
 */
export function getResponsiveFontSize(containerWidth: number, containerHeight: number): number {
  const effectiveDim = getEffectiveDimension(containerWidth, containerHeight);
  
  // Base font size from theme caption (24px default)
  // For small containers, use minimum readable size
  // For medium/large containers, scale up appropriately
  if (effectiveDim < 300) return 14;       // Small: minimum readable
  if (effectiveDim < 400) return 16;       // Small-medium
  if (effectiveDim < 500) return 18;       // Medium
  if (effectiveDim < 600) return 20;       // Medium-large
  return 22;                                // Large: approaching theme caption
}

/**
 * Calculate responsive node dimensions
 * Priority: Keep nodes as large as possible, especially in small containers
 */
export function getResponsiveNodeSize(containerWidth: number, containerHeight: number) {
  const effectiveDim = getEffectiveDimension(containerWidth, containerHeight);
  
  // Keep nodes larger in small containers, reduce less aggressively
  if (effectiveDim < 300) return { width: 120, height: 38, padding: 5 };
  if (effectiveDim < 400) return { width: 130, height: 40, padding: 6 };
  if (effectiveDim < 500) return { width: 135, height: 41, padding: 8 };
  if (effectiveDim < 600) return { width: 140, height: 42, padding: 10 };
  return { width: 145, height: 44, padding: 12 };
}

/**
 * Generate responsive diagram theme based on container size
 */
export function getResponsiveDiagramTheme(containerWidth: number, containerHeight: number): any[] {
  const fontSize = getResponsiveFontSize(containerWidth, containerHeight);
  const edgeFontSize = Math.max(12, fontSize - 4); // Edge labels slightly smaller
  const parentFontSize = Math.max(14, fontSize + 2); // Parent labels slightly larger
  const nodeSize = getResponsiveNodeSize(containerWidth, containerHeight);
  
  return [
  // ==========================================================================
  // Global Node Styles
  // ==========================================================================
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': `${nodeSize.width - 20}px`,
      'background-color': '#ffffff',
      'border-width': 1.5,
      'border-color': '#cbd5e1',
      'shape': 'round-rectangle',
      'font-family': 'Inter, system-ui, -apple-system, sans-serif',
      'font-size': `${fontSize}px`,
      'font-weight': 'normal',
      'color': '#1e293b',
      'width': nodeSize.width,
      'height': 'label',  // Auto-size height to fit wrapped text content
      'padding': `${nodeSize.padding}px`,
    }
  },

  // ==========================================================================
  // Global Edge Styles
  // ==========================================================================
  {
    selector: 'edge',
    style: {
      'width': 2,
      'curve-style': 'bezier',
      'line-color': '#94a3b8',
      'target-arrow-color': '#94a3b8',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.2,
      'label': 'data(label)',
      'font-size': `${edgeFontSize}px`,
      'font-family': 'Inter, system-ui, sans-serif',
      'color': '#64748b',
      'text-background-opacity': 1,
      'text-background-color': '#ffffff',
      'text-background-padding': '2px',
      'text-rotation': 'autorotate',
    }
  },

  // ==========================================================================
  // Compound Nodes (Groups/Containers)
  // ==========================================================================
  {
    selector: ':parent',
    style: {
      'text-valign': 'top',
      'text-halign': 'center',
      'text-margin-y': '-8px',
      'background-color': '#f8fafc',
      'border-color': '#e2e8f0',
      'border-style': 'dashed',
      'border-width': 2,
      'font-weight': '600',  // Semi-bold instead of bold
      'font-size': `${parentFontSize}px`,
      'padding': `${Math.max(16, nodeSize.padding * 2)}px`,
      'shape': 'round-rectangle',
    }
  },

  // ==========================================================================
  // Semantic Node Classes
  // ==========================================================================
  
  // Start node - Green pill/ellipse
  {
    selector: '.start',
    style: {
      'background-color': '#d1fae5',
      'border-color': '#10b981',
      'border-width': 2,
      'shape': 'ellipse',
      'color': '#065f46',
    }
  },

  // End node - Red pill/ellipse
  {
    selector: '.end',
    style: {
      'background-color': '#fee2e2',
      'border-color': '#ef4444',
      'border-width': 2,
      'shape': 'ellipse',
      'color': '#991b1b',
    }
  },

  // Decision node - Yellow diamond
  {
    selector: '.decision',
    style: {
      'background-color': '#fef3c7',
      'border-color': '#f59e0b',
      'border-width': 2,
      'shape': 'diamond',
      'color': '#92400e',
      'width': '80px',
      'height': '80px',
      'text-valign': 'center',
    }
  },

  // Database node - Blue cylinder
  {
    selector: '.database',
    style: {
      'background-color': '#dbeafe',
      'border-color': '#3b82f6',
      'border-width': 2,
      'shape': 'barrel',
      'color': '#1e40af',
      'height': '50px',
    }
  },

  // Process node - Purple rectangle
  {
    selector: '.process',
    style: {
      'background-color': '#f3e8ff',
      'border-color': '#a855f7',
      'border-width': 2,
      'color': '#6b21a8',
    }
  },

  // API/Service node - Indigo
  {
    selector: '.api, .service',
    style: {
      'background-color': '#e0e7ff',
      'border-color': '#6366f1',
      'border-width': 2,
      'color': '#3730a3',
    }
  },

  // User/Actor node - Cyan
  {
    selector: '.user, .actor',
    style: {
      'background-color': '#cffafe',
      'border-color': '#06b6d4',
      'border-width': 2,
      'shape': 'ellipse',
      'color': '#0e7490',
    }
  },

  // Success state - Green
  {
    selector: '.success',
    style: {
      'background-color': '#dcfce7',
      'border-color': '#22c55e',
      'border-width': 2,
      'color': '#166534',
    }
  },

  // Error state - Red
  {
    selector: '.error',
    style: {
      'background-color': '#fee2e2',
      'border-color': '#ef4444',
      'border-width': 2,
      'color': '#991b1b',
    }
  },

  // Warning state - Amber
  {
    selector: '.warning',
    style: {
      'background-color': '#fef3c7',
      'border-color': '#f59e0b',
      'border-width': 2,
      'color': '#92400e',
    }
  },

  // Document node
  {
    selector: '.document',
    style: {
      'background-color': '#fef9c3',
      'border-color': '#eab308',
      'border-width': 2,
      'shape': 'tag',
      'color': '#854d0e',
    }
  },

  // Cloud node
  {
    selector: '.cloud',
    style: {
      'background-color': '#f0f9ff',
      'border-color': '#0ea5e9',
      'border-width': 2,
      'shape': 'ellipse',
      'color': '#0369a1',
    }
  },

  // Storage node
  {
    selector: '.storage',
    style: {
      'background-color': '#faf5ff',
      'border-color': '#c084fc',
      'border-width': 2,
      'shape': 'barrel',
      'color': '#7e22ce',
    }
  },

  // ==========================================================================
  // Semantic Edge Classes
  // ==========================================================================

  // Success/positive flow
  {
    selector: 'edge.success',
    style: {
      'line-color': '#22c55e',
      'target-arrow-color': '#22c55e',
    }
  },

  // Error/negative flow
  {
    selector: 'edge.error',
    style: {
      'line-color': '#ef4444',
      'target-arrow-color': '#ef4444',
      'line-style': 'dashed',
    }
  },

  // Optional/conditional flow
  {
    selector: 'edge.optional, edge.conditional',
    style: {
      'line-style': 'dashed',
      'line-color': '#94a3b8',
    }
  },

  // Async flow
  {
    selector: 'edge.async',
    style: {
      'line-style': 'dotted',
      'line-color': '#8b5cf6',
      'target-arrow-color': '#8b5cf6',
    }
  },

  // Bidirectional
  {
    selector: 'edge.bidirectional',
    style: {
      'source-arrow-shape': 'triangle',
      'source-arrow-color': '#94a3b8',
    }
  },

  // ==========================================================================
  // Interactive States
  // ==========================================================================
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#7c3aed',
      'background-color': '#f5f3ff',
    }
  },

  {
    selector: 'edge:selected',
    style: {
      'width': 3,
      'line-color': '#7c3aed',
      'target-arrow-color': '#7c3aed',
    }
  },
];
}

/**
 * Base diagram theme for backward compatibility
 * @deprecated Use getResponsiveDiagramTheme() instead
 */
export const diagramTheme = getResponsiveDiagramTheme(800, 600);

/**
 * Dark theme variant
 */
export const diagramThemeDark: any[] = [
  // Override base styles for dark mode
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '120px',
      'background-color': '#1e293b',
      'border-width': 1.5,
      'border-color': '#475569',
      'shape': 'round-rectangle',
      'font-family': 'Inter, system-ui, sans-serif',
      'font-size': '100px',
      'color': '#f1f5f9',
      'width': 'label',
      'height': 'label',
      'padding': '12px',
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'curve-style': 'bezier',
      'line-color': '#64748b',
      'target-arrow-color': '#64748b',
      'target-arrow-shape': 'triangle',
      'label': 'data(label)',
      'font-size': 'var(--theme-size-caption)',
      'color': '#94a3b8',
      'text-background-opacity': 1,
      'text-background-color': '#0f172a',
      'text-background-padding': '2px',
    }
  },
  {
    selector: ':parent',
    style: {
      'text-valign': 'top',
      'text-halign': 'center',
      'background-color': '#0f172a',
      'border-color': '#334155',
      'border-style': 'dashed',
      'border-width': 2,
      'font-weight': 'bold',
      'padding': '24px',
    }
  },
];

export default getResponsiveDiagramTheme;
