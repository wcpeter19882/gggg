/**
 * Diagram Theme System
 * 
 * Cytoscape.js stylesheet that interprets semantic classes from the LLM.
 * Maps semantic meaning (start, end, database, decision) to visual styles.
 */

// import type { StylesheetCSS } from 'cytoscape';

/**
 * Base diagram theme - professional, clean aesthetic
 */
// Use 'any' to avoid type issues with different cytoscape versions
export const diagramTheme: any[] = [
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
      'text-max-width': '120px',
      'background-color': '#ffffff',
      'border-width': 1.5,
      'border-color': '#cbd5e1',
      'shape': 'round-rectangle',
      'font-family': 'Inter, system-ui, -apple-system, sans-serif',
      'font-size': '12px',
      'color': '#1e293b',
      'width': 140,  // Fixed width instead of deprecated 'label'
      'height': 40,  // Fixed height instead of deprecated 'label'
      'padding': '12px',
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
      'font-size': '10px',
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
      'font-weight': 'bold',
      'font-size': '13px',
      'padding': '24px',
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
      'font-size': '12px',
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
      'font-size': '10px',
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

export default diagramTheme;
