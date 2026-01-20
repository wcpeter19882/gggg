/**
 * XML to Cytoscape Parser
 * 
 * Converts semantic XML diagram data into Cytoscape.js elements format.
 * The XML schema focuses on topology and semantics, not visuals.
 * 
 * @example
 * ```xml
 * <diagram type="flow" title="Data Pipeline">
 *   <node id="input" label="Raw Data" class="start" />
 *   <node id="process" label="Transform" />
 *   <node id="output" label="Clean Data" class="end" />
 *   <edge source="input" target="process" />
 *   <edge source="process" target="output" />
 * </diagram>
 * ```
 */

export interface CytoscapeElement {
  group: 'nodes' | 'edges';
  data: {
    id: string;
    label?: string;
    parent?: string;
    source?: string;
    target?: string;
    [key: string]: string | undefined;
  };
  classes?: string;
}

export interface ParsedDiagram {
  elements: CytoscapeElement[];
  type: 'flow' | 'network' | 'tree';
  title?: string;
}

/**
 * Parse diagram XML string into Cytoscape elements
 * 
 * @param xmlString - The XML string containing diagram definition
 * @returns Parsed diagram with elements and type
 */
export function parseDiagramXML(xmlString: string): ParsedDiagram {
  // Handle case where xmlString might be wrapped in extra tags or have whitespace
  const cleanXml = xmlString.trim();
  
  // Use DOMParser in browser, or a fallback regex parser for simple cases
  if (typeof DOMParser !== 'undefined') {
    return parseWithDOMParser(cleanXml);
  } else {
    return parseWithRegex(cleanXml);
  }
}

/**
 * Parse using browser DOMParser
 */
function parseWithDOMParser(xmlString: string): ParsedDiagram {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.error('XML Parse Error:', parseError.textContent);
    return { elements: [], type: 'flow' };
  }
  
  // Try to find <diagram> root (case-insensitive)
  let root = doc.querySelector('diagram') || doc.querySelector('Diagram');
  
  // If no explicit diagram wrapper, use the document element directly
  // This handles cases where XML content doesn't have a <diagram> wrapper
  if (!root) {
    const docEl = doc.documentElement;
    // Check if the root element itself has nodes/edges children
    const hasNodes = docEl.querySelector('node, Node, edge, Edge, group, Group');
    if (hasNodes) {
      root = docEl;
    } else {
      console.warn('No <diagram> root found and no diagram elements detected');
      return { elements: [], type: 'flow' };
    }
  }

  const elements: CytoscapeElement[] = [];
  const type = (root.getAttribute('type') as ParsedDiagram['type']) || 'flow';
  const title = root.getAttribute('title') || undefined;

  // Recursive parser for nested structures (groups)
  const parseRecursive = (parentEl: Element, parentId?: string) => {
    Array.from(parentEl.children).forEach(el => {
      const tag = el.tagName.toLowerCase();
      const attr = (name: string) => el.getAttribute(name);

      const id = attr('id');
      const label = attr('label');
      const nodeClass = attr('class') || '';

      if (tag === 'node' || tag === 'group') {
        const data: CytoscapeElement['data'] = { 
          id: id || `node_${elements.length}`,
          label: label || id || ''
        };
        
        if (parentId) {
          data.parent = parentId; // Compound node logic
        }

        elements.push({
          group: 'nodes',
          data,
          classes: nodeClass
        });

        // If it's a group, recurse into children
        if (tag === 'group' && data.id) {
          parseRecursive(el, data.id);
        }
      } else if (tag === 'edge') {
        const source = attr('source');
        const target = attr('target');
        
        if (source && target) {
          elements.push({
            group: 'edges',
            data: {
              id: id || `edge_${source}_${target}`,
              label: label || '',
              source,
              target
            },
            classes: nodeClass
          });
        }
      }
    });
  };

  parseRecursive(root);
  
  return { elements, type, title };
}

/**
 * Fallback regex parser for SSR or non-browser environments
 */
function parseWithRegex(xmlString: string): ParsedDiagram {
  const elements: CytoscapeElement[] = [];
  
  // Extract type from diagram tag (case-insensitive)
  const typeMatch = xmlString.match(/<[dD]iagram[^>]*type="([^"]+)"/i);
  const type = (typeMatch?.[1] as ParsedDiagram['type']) || 'flow';
  
  const titleMatch = xmlString.match(/<[dD]iagram[^>]*title="([^"]+)"/i);
  const title = titleMatch?.[1];

  // Parse nodes (case-insensitive)
  const nodeRegex = /<[nN]ode\s+([^>]*)\/?\s*>/gi;
  let match;
  
  while ((match = nodeRegex.exec(xmlString)) !== null) {
    const attrs = parseAttributes(match[1]);
    if (attrs.id) {
      elements.push({
        group: 'nodes',
        data: {
          id: attrs.id,
          label: attrs.label || attrs.id
        },
        classes: attrs.class || ''
      });
    }
  }

  // Parse edges (case-insensitive)
  const edgeRegex = /<[eE]dge\s+([^>]*)\/?\s*>/gi;
  
  while ((match = edgeRegex.exec(xmlString)) !== null) {
    const attrs = parseAttributes(match[1]);
    if (attrs.source && attrs.target) {
      elements.push({
        group: 'edges',
        data: {
          id: attrs.id || `edge_${attrs.source}_${attrs.target}`,
          label: attrs.label || '',
          source: attrs.source,
          target: attrs.target
        },
        classes: attrs.class || ''
      });
    }
  }

  return { elements, type, title };
}

/**
 * Parse XML attributes from string
 */
function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)="([^"]*)"/g;
  let match;
  
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  
  return attrs;
}

export default parseDiagramXML;
