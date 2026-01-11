/**
 * Template Playground Page
 * 
 * Interactive environment for testing and experimenting with V2 Templates.
 * Allows developers to:
 * - Modify manifest rules in real-time
 * - Inject mock content to test layouts
 * - Enable visual debugging overlays
 * - Export finalized manifests
 */

'use client';

import dynamic from 'next/dynamic';

import React, { useState } from 'react';
import { TemplateExperiment } from './TemplateExperiment';
import { ManifestConfigurator } from './ManifestConfigurator';
import { ContentInjector } from './ContentInjector';

// Import Templates
import TemplateDashboard, { DashboardManifest } from '@/components/templates/TemplateDashboard';
import TemplateTwoColumn, { TwoColumnManifest } from '@/components/templates/TemplateTwoColumn';
import TemplateSingleColumn, { SingleColumnManifest } from '@/components/templates/TemplateSingleColumn';
import TemplateCover, { CoverManifest } from '@/components/templates/TemplateCover';
import TemplateFullBleed, { FullBleedManifest } from '@/components/templates/TemplateFullBleed';

import type { TemplateManifest } from '@/utils/manifest-types';

// =============================================================================
// Template Registry
// =============================================================================

const TEMPLATE_REGISTRY = [
  { id: 'TemplateDashboard', component: TemplateDashboard, manifest: DashboardManifest },
  { id: 'TemplateTwoColumn', component: TemplateTwoColumn, manifest: TwoColumnManifest },
  { id: 'TemplateSingleColumn', component: TemplateSingleColumn, manifest: SingleColumnManifest },
  { id: 'TemplateCover', component: TemplateCover, manifest: CoverManifest },
  { id: 'TemplateFullBleed', component: TemplateFullBleed, manifest: FullBleedManifest },
];

// =============================================================================
// Page Component
// =============================================================================

export default function PlaygroundPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATE_REGISTRY[0].id);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [visualDebug, setVisualDebug] = useState(false);
  
  const selectedTemplate = TEMPLATE_REGISTRY.find(t => t.id === selectedTemplateId);
  
  if (!selectedTemplate) {
    return <div>Template not found</div>;
  }
  
  const experiment = TemplateExperiment({
    component: selectedTemplate.component,
    sourceManifest: selectedTemplate.manifest,
    onManifestChange: (manifest) => {
      console.log('Manifest updated:', manifest);
    },
  });
  
  // Reset activeSlot to first available slot when template changes
  React.useEffect(() => {
    const firstSlot = Object.keys(selectedTemplate.manifest.slots)[0];
    setActiveSlot(firstSlot);
    experiment.clearAllContent();
  }, [selectedTemplateId]);
  
  const handleExportManifest = () => {
    const json = experiment.exportManifest();
    
    // Copy to clipboard
    navigator.clipboard.writeText(json).then(() => {
      alert('Manifest copied to clipboard!');
    }).catch(() => {
      // Fallback: show in modal
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${experiment.manifest.id}-manifest.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#fafafa'
    }}>
      {/* Top Bar */}
      <div style={{ 
        padding: '16px 24px',
        backgroundColor: 'white',
        borderBottom: '2px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
            Template Playground
          </h1>
          <p style={{ fontSize: '13px', color: '#666' }}>
            Design System V2 • Interactive Template Testing
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Template Selector */}
          <select
            value={selectedTemplateId}
            onChange={(e) => {
              setSelectedTemplateId(e.target.value);
              // Don't call resetManifest here - let useEffect handle state reset
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {TEMPLATE_REGISTRY.map(template => (
              <option key={template.id} value={template.id}>
                {template.id}
              </option>
            ))}
          </select>
          
          {/* Visual Debug Toggle */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: visualDebug ? '#e3f2fd' : '#f5f5f5',
            border: `1px solid ${visualDebug ? '#2196f3' : '#ddd'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <input
              type="checkbox"
              checked={visualDebug}
              onChange={(e) => {
                setVisualDebug(e.target.checked);
                experiment.setVisualDebug(e.target.checked);
              }}
              style={{ marginRight: '6px' }}
            />
            Visual Debug
          </label>
          
          {/* Reset Button */}
          <button
            onClick={() => experiment.resetManifest()}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
          
          {/* Export Button */}
          <button
            onClick={handleExportManifest}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Export Manifest
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: Manifest Configurator */}
        <div style={{ 
          width: '320px', 
          borderRight: '1px solid #ddd',
          backgroundColor: 'white',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '12px 16px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            MANIFEST CONFIGURATION
          </div>
          <ManifestConfigurator
            manifest={experiment.manifest}
            onUpdateSlotAllowedComponents={experiment.updateSlotAllowedComponents}
            onUpdateSlotBannedComponents={experiment.updateSlotBannedComponents}
            onUpdateSlotAllowedLayouts={experiment.updateSlotAllowedLayouts}
            onUpdateTemplateDescription={experiment.updateTemplateDescription}
            onUpdateSlotDescription={experiment.updateSlotDescription}
          />
        </div>
        
        {/* Center Panel: Template Preview */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '12px 16px',
            backgroundColor: '#2c2c2c',
            color: 'white',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>LIVE PREVIEW</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>
              {Object.keys(experiment.slotContent).length} slot(s) with content
            </span>
          </div>
          
          <div style={{ 
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            {/* Template Canvas */}
            <div style={{ 
              width: '960px',
              height: '540px',
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <experiment.TemplateComponent {...experiment.templateProps} />
              
              {/* Visual Debug Overlay */}
              {visualDebug && (
                <div style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  border: '4px solid rgba(33, 150, 243, 0.5)',
                  backgroundColor: 'rgba(33, 150, 243, 0.05)'
                }}>
                  {/* Slot Boundaries */}
                  {Object.keys(experiment.manifest.slots).map(slotName => (
                    <div
                      key={slotName}
                      style={{
                        position: 'absolute',
                        border: '2px dashed rgba(76, 175, 80, 0.7)',
                        backgroundColor: 'rgba(76, 175, 80, 0.05)',
                        fontSize: '10px',
                        color: '#4caf50',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        top: 0,
                        left: 0,
                        // Note: Proper positioning would require ref measurements
                      }}
                    >
                      {slotName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel: Content Injector */}
        <div style={{ 
          width: '300px',
          borderLeft: '1px solid #ddd',
          backgroundColor: 'white',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <ContentInjector
            manifest={experiment.manifest}
            activeSlot={activeSlot}
            onSelectSlot={setActiveSlot}
            onInjectContent={experiment.injectContent}
            onClearSlot={experiment.clearSlotContent}
            onClearAll={experiment.clearAllContent}
            slotContent={experiment.slotContent}
          />
        </div>
      </div>
    </div>
  );
}
