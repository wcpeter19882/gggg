'use client';

/**
 * Component Preview Page
 * Route: /preview/component?path=RUN_ID&name=COMPONENT_NAME
 * 
 * Fetches state.json from the specified run output and renders a single generated component in isolation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { transform } from 'sucrase';
import * as FramerMotion from 'framer-motion';
import * as Lucide from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface GeneratedComponent {
  name: string;
  code?: string;
  props_interface?: string;
}

interface ApiResponse {
  slides: any[];
  source: string;
  path: string;
  generatedComponents?: Record<string, GeneratedComponent>;
  error?: string;
}

// =============================================================================
// Runtime Component Compiler
// =============================================================================

function compileComponent(
  comp: GeneratedComponent
): React.ComponentType<any> | null {
  if (!comp.code || !comp.name) return null;
  
  try {
    const tsxCode = comp.code;
    
    const { code: jsCode } = transform(tsxCode, {
      transforms: ['typescript', 'jsx', 'imports'],
    });
    
    // Execute code in a CommonJS-like environment
    const componentFn = new Function('exports', 'require', 'React', jsCode);
    
    const exportsObj: Record<string, any> = {};
    
    const requireFn = (mod: string) => {
      if (mod === 'react') return React;
      if (mod === 'framer-motion') return FramerMotion;
      if (mod === 'lucide-react') return Lucide;
      throw new Error(`Cannot require module '${mod}' in generated component`);
    };
    
    componentFn(exportsObj, requireFn, React);
    
    const Component = exportsObj[comp.name];
    if (Component) {
      return Component;
    } else {
      console.warn(`[path] Component '${comp.name}' not found in exports. Available:`, Object.keys(exportsObj));
      return null;
    }
  } catch (err) {
    console.error(`[path] Failed to compile ${comp.name}:`, err);
    return null;
  }
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function ComponentPreviewPage(): JSX.Element {
  const searchParams = useSearchParams();
  const runPath = searchParams.get('path');
  const compName = searchParams.get('name'); // This matches GeneratedComponent.name

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (!runPath || !compName) {
      setError('Missing path or name parameters');
      setLoading(false);
      return;
    }

    async function loadComponent() {
      try {
        setLoading(true);
        // Reuse the existing slides API which returns the full state.json including generatedComponents
        const response = await fetch(`/api/slides/${runPath}`);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.error) throw new Error(data.error);
        if (!data.generatedComponents) throw new Error('No generated components found in this run');

        // Find component by name (or ID if name matches)
        // The API returns a map of ID -> Component
        // But the user might pass the Name. We need to check both.
        let targetComp: GeneratedComponent | undefined;
        
        // Exact match on ID?
        if (data.generatedComponents[compName]) {
            targetComp = data.generatedComponents[compName];
        } else {
            // Find by name property
            targetComp = Object.values(data.generatedComponents).find(c => c.name === compName);
        }

        if (!targetComp) {
            // Try lenient search (case insensitive)
            targetComp = Object.values(data.generatedComponents).find(c => c.name.toLowerCase() === compName.toLowerCase());
        }

        if (!targetComp) {
          throw new Error(`Component '${compName}' not found in run '${runPath}'`);
        }
        
        const Compiled = compileComponent(targetComp);
        if (!Compiled) {
          throw new Error(`Failed to compile component '${compName}'`);
        }

        setComponent(() => Compiled);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadComponent();
  }, [runPath, compName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          <span className="text-sm font-medium">Loading component...</span>
        </div>
      </div>
    );
  }

  if (error || !Component) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-8">
        <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-lg p-6 text-center">
          <Lucide.AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-200 mb-2">Preview Error</h2>
          <p className="text-sm text-red-400 font-mono bg-red-950/30 p-2 rounded break-all">
            {error || 'Component failed to render'}
          </p>
          <div className="mt-4 text-xs text-slate-500">
            Path: {runPath} <br/>
            Name: {compName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        {/* Render component in a container that mimics a typical slide area or just centering */}
        <div className="w-full max-w-4xl aspect-video relative">
            <Component />
        </div>
      </div>
    </div>
  );
}
