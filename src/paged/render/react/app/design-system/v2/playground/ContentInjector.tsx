/**
 * ContentInjector Component
 * 
 * Panel for testing slot content with "Test" buttons for each component type.
 * Allows quick injection of mock content to validate layout behavior.
 */

'use client';

import React from 'react';
import type { TemplateManifest, ComponentType, LayoutType } from '@/utils/manifest-types';
import { generateMockContent, getAllComponentTypes } from '@/utils/mock-content-registry';
import SlotLayoutStack from '@/components/slot-layouts/SlotLayoutStack';
import SlotLayoutGrid from '@/components/slot-layouts/SlotLayoutGrid';
import SlotLayoutFit from '@/components/slot-layouts/SlotLayoutFit';

// =============================================================================
// Types
// =============================================================================

interface ContentInjectorProps {
  manifest: TemplateManifest;
  activeSlot: string | null;
  onSelectSlot: (slotName: string) => void;
  onInjectContent: (slotName: string, content: React.ReactNode) => void;
  onClearSlot: (slotName: string) => void;
  onClearAll: () => void;
  slotContent: Record<string, React.ReactNode>;
}

// =============================================================================
// Component
// =============================================================================

export function ContentInjector({
  manifest,
  activeSlot,
  onSelectSlot,
  onInjectContent,
  onClearSlot,
  onClearAll,
  slotContent,
}: ContentInjectorProps) {
  const [contentVariant, setContentVariant] = React.useState<'short' | 'normal' | 'long'>('normal');
  const [selectedLayout, setSelectedLayout] = React.useState<LayoutType | 'none'>('none');
  
  const handleInject = (slotName: string, componentType: ComponentType) => {
    let mockContent = generateMockContent(componentType, contentVariant);
    
    // Wrap in selected layout if specified
    if (selectedLayout !== 'none') {
      if (selectedLayout === 'SlotLayoutStack') {
        mockContent = React.createElement(SlotLayoutStack, { gap: 'md', children: mockContent });
      } else if (selectedLayout === 'SlotLayoutGrid') {
        mockContent = React.createElement(SlotLayoutGrid, { cols: 2, gap: 'md', children: mockContent });
      } else if (selectedLayout === 'SlotLayoutFit') {
        mockContent = React.createElement(SlotLayoutFit, { mode: 'cover', children: mockContent });
      }
    }
    
    onInjectContent(slotName, mockContent);
  };
  
  const selectedSlot = activeSlot || Object.keys(manifest.slots)[0];
  const selectedSlotManifest = manifest.slots[selectedSlot];
  
  return (
    <div className="content-injector" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
          Content Injection Testing
        </h4>
        
        {/* Slot Selector */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
            Target Slot:
          </label>
          <select
            value={selectedSlot}
            onChange={(e) => onSelectSlot(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            {Object.keys(manifest.slots).map(slotName => (
              <option key={slotName} value={slotName}>
                {slotName} {slotContent[slotName] ? '(has content)' : '(empty)'}
              </option>
            ))}
          </select>
        </div>
        
        {/* Content Variant */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
            Content Size:
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['short', 'normal', 'long'] as const).map(variant => (
              <button
                key={variant}
                onClick={() => setContentVariant(variant)}
                style={{
                  flex: 1,
                  padding: '6px',
                  backgroundColor: contentVariant === variant ? '#2196f3' : 'white',
                  color: contentVariant === variant ? 'white' : '#666',
                  border: `1px solid ${contentVariant === variant ? '#2196f3' : '#ddd'}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: contentVariant === variant ? 'bold' : 'normal'
                }}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>
        
        {/* Layout Wrapper */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
            Wrap in Layout:
          </label>
          <select
            value={selectedLayout}
            onChange={(e) => setSelectedLayout(e.target.value as LayoutType | 'none')}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: selectedLayout !== 'none' ? '#e3f2fd' : 'white'
            }}
          >
            <option value="none">No wrapper (Direct)</option>
            <option value="SlotLayoutStack">SlotLayoutStack</option>
            <option value="SlotLayoutGrid">SlotLayoutGrid</option>
            <option value="SlotLayoutFit">SlotLayoutFit</option>
          </select>
        </div>
        
        {/* Clear Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onClearSlot(selectedSlot)}
            disabled={!slotContent[selectedSlot]}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: slotContent[selectedSlot] ? 'pointer' : 'not-allowed',
              opacity: slotContent[selectedSlot] ? 1 : 0.5
            }}
          >
            Clear Slot
          </button>
          <button
            onClick={onClearAll}
            disabled={Object.keys(slotContent).length === 0}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: Object.keys(slotContent).length > 0 ? 'pointer' : 'not-allowed',
              opacity: Object.keys(slotContent).length > 0 ? 1 : 0.5
            }}
          >
            Clear All
          </button>
        </div>
      </div>
      
      {/* Component Test Buttons */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {selectedSlotManifest && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                {selectedSlotManifest.description}
              </div>
              {selectedSlotManifest.orientation && (
                <div style={{ fontSize: '11px', marginBottom: '8px' }}>
                  <span style={{ 
                    padding: '2px 6px', 
                    backgroundColor: selectedSlotManifest.orientation === 'portrait' ? '#e3f2fd' : '#fff3e0',
                    color: selectedSlotManifest.orientation === 'portrait' ? '#1976d2' : '#f57c00',
                    borderRadius: '3px',
                    fontWeight: 'bold'
                  }}>
                    {selectedSlotManifest.orientation.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Allowed Components */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#4caf50' }}>
                ✓ Allowed Components
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedSlotManifest.allowedComponents.map(componentType => (
                  <button
                    key={componentType}
                    onClick={() => handleInject(selectedSlot, componentType)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      border: '1px solid #4caf50',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e8f5e9';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <span>{componentType}</span>
                    <span style={{ fontSize: '10px', color: '#666' }}>Test →</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Banned Components */}
            {selectedSlotManifest.bannedComponents && selectedSlotManifest.bannedComponents.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#f44336' }}>
                  ✗ Banned Components (Not Recommended)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedSlotManifest.bannedComponents.map(componentType => (
                    <button
                      key={componentType}
                      onClick={() => handleInject(selectedSlot, componentType)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffebee',
                        border: '1px solid #f44336',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        opacity: 0.7
                      }}
                      title="This component is banned for this slot but can be tested anyway"
                    >
                      <span>{componentType}</span>
                      <span style={{ fontSize: '10px', marginLeft: '8px', color: '#f44336' }}>(Force Test)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
