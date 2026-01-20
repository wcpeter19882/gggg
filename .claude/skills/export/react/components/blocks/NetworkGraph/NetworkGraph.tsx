/**
 * NetworkGraph Component
 * 
 * Responsive, auto-layout diagram renderer using Cytoscape.js.
 * For branching/network structures where nodes connect to multiple targets.
 * For linear sequences, use ProcessStrip instead.
 * 
 * @example
 * ```mdx
 * <NetworkGraph id="diagram_001" type="network" title="System Architecture">
 *   <Node id="api" label="API Gateway" className="start" />
 *   <Node id="auth" label="Auth Service" className="process" />
 *   <Node id="cache" label="Cache" className="process" />
 *   <Node id="db" label="Database" className="end" />
 *   <Edge source="api" target="auth" />
 *   <Edge source="api" target="cache" />
 *   <Edge source="auth" target="db" />
 *   <Edge source="cache" target="db" />
 * </NetworkGraph>
 * ```
 */

'use client';

import React, { useEffect, useRef, useState, useCallback, ReactNode, Children, isValidElement } from 'react';
import { getResponsiveDiagramTheme } from './diagramTheme';

// =============================================================================
// Types
// =============================================================================

export interface CytoscapeElement {
  group: 'nodes' | 'edges';
  data: {
    id: string;
    label?: string;
    parent?: string;
    source?: string;
    target?: string;
  };
  classes?: string;
}

export interface ParsedDiagram {
  elements: CytoscapeElement[];
  type: 'flow' | 'network' | 'tree';
  title?: string;
}

// JSX Child Component Props
export interface NodeProps {
  id: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}

export interface EdgeProps {
  id?: string;
  source: string;
  target: string;
  label?: string;
  className?: string;
}

export interface GroupProps {
  id: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}

// Marker components - these don't render anything, just hold data
export function Node(_props: NodeProps): null { return null; }
export function Edge(_props: EdgeProps): null { return null; }
export function Group(_props: GroupProps): null { return null; }

/** Size preset for diagram height */
export type DiagramSize = 'compact' | 'medium' | 'tall';

/** Size presets mapping to min/max heights */
const SIZE_PRESETS: Record<DiagramSize, { min: number; max: number }> = {
  compact: { min: 200, max: 280 },   // 2-3 nodes
  medium: { min: 300, max: 400 },    // 4-5 nodes
  tall: { min: 420, max: 560 },      // 6+ nodes
};

export interface NetworkGraphProps {
  /** Unique ID for the diagram */
  id?: string;
  /** JSX children (Node, Edge, Group components) */
  children?: ReactNode;
  /** Diagram type: flow, network, or tree */
  type?: 'flow' | 'network' | 'tree';
  /** Diagram title */
  title?: string;
  /** Size preset: compact (2-3 nodes), medium (4-5 nodes), tall (6+ nodes) */
  size?: DiagramSize;
  /** Minimum height in pixels (overrides size preset) */
  minHeight?: number;
  /** Maximum height in pixels (overrides size preset) */
  maxHeight?: number;
  /** Enable user panning */
  pannable?: boolean;
  /** Enable user zooming */
  zoomable?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
}

// =============================================================================
// JSX to Cytoscape Parser
// =============================================================================

function parseJSXChildren(children: ReactNode, parentId?: string): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];
  
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    
    const { type, props } = child;
    const typeName = typeof type === 'function' ? type.name : String(type);
    
    if (typeName === 'Node' || typeName === 'node') {
      const nodeProps = props as NodeProps;
      elements.push({
        group: 'nodes',
        data: {
          id: nodeProps.id,
          label: nodeProps.label || nodeProps.id,
          ...(parentId && { parent: parentId }),
        },
        classes: nodeProps.className || '',
      });
    } else if (typeName === 'Edge' || typeName === 'edge') {
      const edgeProps = props as EdgeProps;
      elements.push({
        group: 'edges',
        data: {
          id: edgeProps.id || `edge_${edgeProps.source}_${edgeProps.target}`,
          label: edgeProps.label || '',
          source: edgeProps.source,
          target: edgeProps.target,
        },
        classes: edgeProps.className || '',
      });
    } else if (typeName === 'Group' || typeName === 'group') {
      const groupProps = props as GroupProps;
      // Add group as a parent node
      elements.push({
        group: 'nodes',
        data: {
          id: groupProps.id,
          label: groupProps.label || groupProps.id,
          ...(parentId && { parent: parentId }),
        },
        classes: groupProps.className || '',
      });
      // Recursively parse group children
      if (groupProps.children) {
        elements.push(...parseJSXChildren(groupProps.children, groupProps.id));
      }
    }
  });
  
  return elements;
}

// =============================================================================
// Layout Configuration
// =============================================================================

interface LayoutConfig {
  name: string;
  rankDir?: 'LR' | 'TB' | 'RL' | 'BT';
  animate: boolean;
  animationDuration: number;
  padding: number;
  nodeDimensionsIncludeLabels: boolean;
  spacingFactor?: number;
  avoidOverlap?: boolean;
  nodeRepulsion?: number;
  idealEdgeLength?: number;
  edgeElasticity?: number;
  gravity?: number;
  roots?: string;
  circle?: boolean;
  directed?: boolean;
}

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
 * Calculate responsive spacing based on container size and aspect ratio
 * Priority: Maximize node size by aggressively reducing spacing in small containers
 */
function getResponsiveSpacing(containerWidth: number, containerHeight: number) {
  const effectiveDim = getEffectiveDimension(containerWidth, containerHeight);
  
  // Scale padding based on effective dimension - minimal for small containers
  const padding = effectiveDim < 300 ? 3 : effectiveDim < 400 ? 5 : effectiveDim < 600 ? 10 : 30;
  
  // Much tighter spacing for smaller containers to protect node size
  const spacingFactor = effectiveDim < 300 ? 0.5 : effectiveDim < 400 ? 0.65 : effectiveDim < 600 ? 0.85 : 1.2;
  
  return { padding, spacingFactor };
}

/**
 * Get layout configuration based on diagram type and aspect ratio
 */
function getLayoutConfig(
  type: ParsedDiagram['type'],
  aspectRatio: number,
  animationDuration: number,
  containerWidth: number,
  containerHeight: number
): LayoutConfig {
  const { padding, spacingFactor } = getResponsiveSpacing(containerWidth, containerHeight);
  
  const baseConfig: LayoutConfig = {
    name: 'dagre',
    animate: true,
    animationDuration,
    padding,
    nodeDimensionsIncludeLabels: true,
    spacingFactor,
  };

  // Determine direction based on aspect ratio
  // > 1.1 = wide/horizontal → LR
  // 0.9-1.1 = square → TB
  // < 0.9 = tall/vertical → TB
  const isHorizontal = aspectRatio > 1.1;
  const rankDir = isHorizontal ? 'LR' : 'TB';

  switch (type) {
    case 'flow':
      return {
        ...baseConfig,
        name: 'dagre',
        rankDir,
        directed: true,
      };

    case 'network':
      // Network uses dagre with direction for better auto-layout
      // This provides structured layout while maintaining relationship visibility
      return {
        ...baseConfig,
        name: 'dagre',
        rankDir,
        directed: false,
        spacingFactor: 1.4,
      };

    case 'tree':
      return {
        ...baseConfig,
        name: 'breadthfirst',
        directed: true,
        circle: false,
        spacingFactor: 1.5,
        // Breadthfirst doesn't use rankDir, but we can control via roots
        // For horizontal, we need to use dagre instead
        ...(isHorizontal ? {
          name: 'dagre',
          rankDir: 'LR',
        } : {}),
      };

    default:
      return {
        ...baseConfig,
        name: 'dagre',
        rankDir,
      };
  }
}

// =============================================================================
// Component
// =============================================================================

export function NetworkGraph({
  id,
  children,
  type: typeProp = 'flow',
  title: titleProp,
  size = 'medium',
  minHeight,
  maxHeight,
  pannable = true,
  zoomable = false,
  animationDuration = 500,
}: NetworkGraphProps): JSX.Element {
  // Resolve height from size preset or explicit values
  const sizePreset = SIZE_PRESETS[size];
  const resolvedMinHeight = minHeight ?? sizePreset.min;
  const resolvedMaxHeight = maxHeight ?? sizePreset.max;
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedDiagram | null>(null);

  // Parse JSX children on mount or when children change
  useEffect(() => {
    try {
      const elements = parseJSXChildren(children);
      
      if (elements.length === 0) {
        setError('No diagram elements found. Use <Node> and <Edge> components.');
        setIsLoading(false);
        return;
      }
      
      setParsedData({
        elements,
        type: typeProp,
        title: titleProp,
      });
      setError(null);
    } catch (err) {
      console.error('Diagram parse error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse diagram');
      setIsLoading(false);
    }
  }, [children, typeProp, titleProp]);

  // Initialize and render Cytoscape
  const initCytoscape = useCallback(async () => {
    if (!containerRef.current || !parsedData) return;

    try {
      // Dynamic import of cytoscape and extensions
      const cytoscapeModule = await import('cytoscape');
      const cytoscape = cytoscapeModule.default;
      
      // Check again after async import - component might have unmounted
      if (!containerRef.current) {
        return;
      }
      
      // Try to load dagre extension
      try {
        // @ts-ignore
        const dagreModule = await import('cytoscape-dagre');
        const dagre = dagreModule.default;
        cytoscape.use(dagre);
      } catch (e) {
        console.warn('cytoscape-dagre not available, using fallback layout');
      }
      
      // Check again after dagre import
      if (!containerRef.current) {
        return;
      }

      // Destroy previous instance
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      // Verify container has className before creating instance
      if (!containerRef.current.className) {
        return;
      }

      // Get container dimensions for responsive theme
      const { offsetWidth: w, offsetHeight: h } = containerRef.current;
      const responsiveTheme = getResponsiveDiagramTheme(w, h);

      // Create new instance
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: parsedData.elements,
        style: responsiveTheme,
        maxZoom: 2,
        minZoom: 0.5,  // Increased from 0.3 to keep text more readable
        userZoomingEnabled: zoomable,
        userPanningEnabled: pannable,
        boxSelectionEnabled: false,
        autoungrabify: true, // Prevent node dragging
      });

      // Apply layout
      const updateLayout = () => {
        if (!cyRef.current || !containerRef.current) return;

        const { offsetWidth: w, offsetHeight: h } = containerRef.current;
        if (w === 0 || h === 0) return;

        const aspectRatio = w / h;
        const diagramType = typeProp || parsedData.type;
        const layoutConfig = getLayoutConfig(diagramType, aspectRatio, animationDuration, w, h);

        // Update theme for current container size
        const responsiveTheme = getResponsiveDiagramTheme(w, h);
        cyRef.current.style(responsiveTheme);

        // Run layout
        const layout = cyRef.current.layout(layoutConfig);
        layout.run();

        // Fit to container after layout completes
        // Use smaller padding to maximize space usage
        const fitPadding = Math.max(10, Math.min(30, Math.min(w, h) * 0.05));
        setTimeout(() => {
          cyRef.current?.fit(undefined, fitPadding);
        }, animationDuration + 50);
      };

      // Initial layout
      updateLayout();

      // Observe resize
      const observer = new ResizeObserver(() => {
        updateLayout();
      });
      observer.observe(containerRef.current);

      setIsLoading(false);

      // Cleanup
      return () => {
        observer.disconnect();
        cyRef.current?.destroy();
      };
    } catch (err) {
      console.error('Cytoscape init error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize diagram');
      setIsLoading(false);
    }
  }, [parsedData, typeProp, pannable, zoomable, animationDuration]);

  // Initialize when parsed data is ready
  useEffect(() => {
    if (parsedData) {
      initCytoscape();
    }
  }, [parsedData, initCytoscape]);

  // Determine title
  const displayTitle = titleProp || parsedData?.title;

  return (
    <div className={`network-graph-wrapper network-graph-size-${size}`}>
      {displayTitle && (
        <div className="network-graph-title">{displayTitle}</div>
      )}
      
      <div 
        ref={containerRef}
        className="network-graph-container"
        style={{
          minHeight: `${resolvedMinHeight}px`,
          maxHeight: `${resolvedMaxHeight}px`,
        }}
      >
        {isLoading && !error && (
          <div className="network-graph-loading">
            <div className="network-graph-spinner" />
            <span>Rendering diagram...</span>
          </div>
        )}
        
        {error && (
          <div className="network-graph-error">
            <div className="network-graph-error-icon">⚠️</div>
            <div className="network-graph-error-message">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Export
// =============================================================================

export default NetworkGraph;
