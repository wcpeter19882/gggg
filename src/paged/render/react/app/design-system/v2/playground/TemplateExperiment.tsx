/**
 * TemplateExperiment Wrapper
 * 
 * A stateful container that wraps a Template component for interactive testing.
 * Manages a "shadow manifest" that can be modified in real-time to experiment
 * with different slot rules and content combinations.
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { TemplateManifest, ComponentType, LayoutType } from '@/utils/manifest-types';

// =============================================================================
// Types
// =============================================================================

export interface TemplateExperimentProps {
  /** The Template Component to test (e.g., TemplateDashboard) */
  component: React.ComponentType<any>;
  
  /** The initial Manifest to use as starting state */
  sourceManifest: TemplateManifest;
  
  /** Optional pre-defined content scenarios for quick testing */
  scenarios?: Record<string, Record<string, React.ReactNode>>;
  
  /** Optional callback when manifest is modified */
  onManifestChange?: (manifest: TemplateManifest) => void;
}

export interface ExperimentState {
  /** Current (possibly modified) manifest */
  manifest: TemplateManifest;
  
  /** Active content injected into each slot */
  slotContent: Record<string, React.ReactNode>;
  
  /** Visual debug mode enabled */
  visualDebug: boolean;
  
  /** Selected scenario (if any) */
  activeScenario?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TemplateExperiment
 * 
 * The main playground wrapper that orchestrates manifest editing,
 * content injection, and visual debugging.
 */
export function TemplateExperiment({
  component: TemplateComponent,
  sourceManifest,
  scenarios,
  onManifestChange,
}: TemplateExperimentProps) {
  // State: Shadow Manifest (can be modified)
  const [draftManifest, setDraftManifest] = useState<TemplateManifest>(sourceManifest);
  
  // State: Slot Content (what's currently rendered in each slot)
  const [slotContent, setSlotContent] = useState<Record<string, React.ReactNode>>({});
  
  // State: Visual Debug Mode
  const [visualDebug, setVisualDebug] = useState(false);
  
  // State: Active Scenario
  const [activeScenario, setActiveScenario] = useState<string | undefined>();
  
  // Notify parent of manifest changes
  const handleManifestUpdate = (newManifest: TemplateManifest) => {
    setDraftManifest(newManifest);
    onManifestChange?.(newManifest);
  };
  
  // Update a specific slot's allowed components
  const updateSlotAllowedComponents = (slotName: string, components: ComponentType[]) => {
    const newManifest = {
      ...draftManifest,
      slots: {
        ...draftManifest.slots,
        [slotName]: {
          ...draftManifest.slots[slotName],
          allowedComponents: components,
        },
      },
    };
    handleManifestUpdate(newManifest);
  };
  
  // Update a specific slot's banned components
  const updateSlotBannedComponents = (slotName: string, components: ComponentType[]) => {
    const newManifest = {
      ...draftManifest,
      slots: {
        ...draftManifest.slots,
        [slotName]: {
          ...draftManifest.slots[slotName],
          bannedComponents: components,
        },
      },
    };
    handleManifestUpdate(newManifest);
  };
  
  // Update a specific slot's allowed layouts
  const updateSlotAllowedLayouts = (slotName: string, layouts: LayoutType[]) => {
    const newManifest = {
      ...draftManifest,
      slots: {
        ...draftManifest.slots,
        [slotName]: {
          ...draftManifest.slots[slotName],
          allowedLayouts: layouts,
        },
      },
    };
    handleManifestUpdate(newManifest);
  };
  
  // Update template description
  const updateTemplateDescription = (description: string) => {
    const newManifest = {
      ...draftManifest,
      description,
    };
    handleManifestUpdate(newManifest);
  };
  
  // Update slot description
  const updateSlotDescription = (slotName: string, description: string) => {
    const newManifest = {
      ...draftManifest,
      slots: {
        ...draftManifest.slots,
        [slotName]: {
          ...draftManifest.slots[slotName],
          description,
        },
      },
    };
    handleManifestUpdate(newManifest);
  };
  
  // Inject content into a specific slot
  const injectContent = (slotName: string, content: React.ReactNode) => {
    setSlotContent(prev => ({
      ...prev,
      [slotName]: content,
    }));
  };
  
  // Clear content from a specific slot
  const clearSlotContent = (slotName: string) => {
    setSlotContent(prev => {
      const { [slotName]: _, ...rest } = prev;
      return rest;
    });
  };
  
  // Clear all slot content
  const clearAllContent = () => {
    setSlotContent({});
  };
  
  // Load a predefined scenario
  const loadScenario = (scenarioName: string) => {
    if (scenarios && scenarios[scenarioName]) {
      setSlotContent(scenarios[scenarioName]);
      setActiveScenario(scenarioName);
    }
  };
  
  // Reset to original manifest
  const resetManifest = () => {
    handleManifestUpdate(sourceManifest);
    clearAllContent();
    setActiveScenario(undefined);
  };
  
  // Export current manifest as JSON
  const exportManifest = () => {
    return JSON.stringify(draftManifest, null, 2);
  };
  
  // Build props for the template (map slot content)
  const templateProps = useMemo(() => {
    const props: Record<string, React.ReactNode> = {};
    
    // Map each slot in the manifest to the content (or undefined if empty)
    for (const slotName of Object.keys(draftManifest.slots)) {
      props[slotName] = slotContent[slotName];
    }
    
    return props;
  }, [draftManifest, slotContent]);
  
  return {
    // State
    manifest: draftManifest,
    slotContent,
    visualDebug,
    activeScenario,
    
    // Actions
    updateSlotAllowedComponents,
    updateSlotBannedComponents,
    updateSlotAllowedLayouts,
    updateTemplateDescription,
    updateSlotDescription,
    injectContent,
    clearSlotContent,
    clearAllContent,
    loadScenario,
    resetManifest,
    exportManifest,
    setVisualDebug,
    
    // Template Props (ready to spread)
    templateProps,
    
    // Component
    TemplateComponent,
  };
}
