/**
 * ManifestConfigurator Component
 * 
 * Interactive UI for editing template manifest rules.
 * Displays each slot with controls for toggling allowed/banned components,
 * layouts, and other constraints.
 */

'use client';

import React from 'react';
import type { TemplateManifest, ComponentType, LayoutType, SlotManifest } from '@/utils/manifest-types';
import { getAllComponentTypes } from '@/utils/mock-content-registry';

// =============================================================================
// Types
// =============================================================================

interface ManifestConfiguratorProps {
  manifest: TemplateManifest;
  onUpdateSlotAllowedComponents: (slotName: string, components: ComponentType[]) => void;
  onUpdateSlotBannedComponents: (slotName: string, components: ComponentType[]) => void;
  onUpdateSlotAllowedLayouts: (slotName: string, layouts: LayoutType[]) => void;
  onUpdateTemplateDescription: (description: string) => void;
  onUpdateSlotDescription: (slotName: string, description: string) => void;
}

interface SlotConfigProps {
  slotName: string;
  slotManifest: SlotManifest;
  onUpdateAllowedComponents: (components: ComponentType[]) => void;
  onUpdateBannedComponents: (components: ComponentType[]) => void;
  onUpdateAllowedLayouts: (layouts: LayoutType[]) => void;
  onUpdateDescription: (description: string) => void;
}

// =============================================================================
// Slot Configuration Component
// =============================================================================

function SlotConfig({
  slotName,
  slotManifest,
  onUpdateAllowedComponents,
  onUpdateBannedComponents,
  onUpdateAllowedLayouts,
  onUpdateDescription,
}: SlotConfigProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [descriptionDraft, setDescriptionDraft] = React.useState(slotManifest.description);
  
  const allComponentTypes = getAllComponentTypes();
  const allLayoutTypes: LayoutType[] = ['SlotLayoutStack', 'SlotLayoutGrid', 'SlotLayoutFit'];
  
  const toggleAllowedComponent = (componentType: ComponentType) => {
    const current = slotManifest.allowedComponents;
    const updated = current.includes(componentType)
      ? current.filter(c => c !== componentType)
      : [...current, componentType];
    onUpdateAllowedComponents(updated);
  };
  
  const toggleBannedComponent = (componentType: ComponentType) => {
    const current = slotManifest.bannedComponents || [];
    const updated = current.includes(componentType)
      ? current.filter(c => c !== componentType)
      : [...current, componentType];
    onUpdateBannedComponents(updated);
  };
  
  const toggleAllowedLayout = (layoutType: LayoutType) => {
    const current = slotManifest.allowedLayouts || allLayoutTypes;
    const updated = current.includes(layoutType)
      ? current.filter(l => l !== layoutType)
      : [...current, layoutType];
    onUpdateAllowedLayouts(updated);
  };
  
  return (
    <div className="slot-config" style={{ 
      marginBottom: '16px', 
      border: '1px solid #ddd', 
      borderRadius: '4px',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid #ddd' : 'none'
        }}
      >
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: '14px' }}>{slotName}</strong>
          {!isEditingDescription ? (
            <div 
              style={{ fontSize: '11px', color: '#666', marginTop: '4px', cursor: 'text' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingDescription(true);
              }}
              title="Click to edit description (used in LLM prompts)"
            >
              {slotManifest.description} ✏️
            </div>
          ) : (
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={() => {
                setIsEditingDescription(false);
                onUpdateDescription(descriptionDraft);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setIsEditingDescription(false);
                  onUpdateDescription(descriptionDraft);
                } else if (e.key === 'Escape') {
                  setIsEditingDescription(false);
                  setDescriptionDraft(slotManifest.description);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '4px',
                fontSize: '11px',
                border: '1px solid #2196f3',
                borderRadius: '3px',
                resize: 'vertical',
                minHeight: '40px'
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '18px', marginLeft: '8px' }}>{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '12px' }}>
          {/* Orientation Badge */}
          {slotManifest.orientation && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: slotManifest.orientation === 'portrait' ? '#e3f2fd' : '#fff3e0',
                color: slotManifest.orientation === 'portrait' ? '#1976d2' : '#f57c00',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {slotManifest.orientation.toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Element Limits */}
          {(slotManifest.minElements || slotManifest.maxElements) && (
            <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
              <strong>Elements:</strong>{' '}
              {slotManifest.minElements && `min: ${slotManifest.minElements} `}
              {slotManifest.maxElements && `max: ${slotManifest.maxElements}`}
            </div>
          )}
          
          {/* Allowed Components */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#4caf50' }}>
              ✓ Allowed Components
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allComponentTypes.map(componentType => {
                const isAllowed = slotManifest.allowedComponents.includes(componentType);
                return (
                  <label
                    key={componentType}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      backgroundColor: isAllowed ? '#e8f5e9' : '#f5f5f5',
                      border: `1px solid ${isAllowed ? '#4caf50' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      onChange={() => toggleAllowedComponent(componentType)}
                      style={{ marginRight: '4px' }}
                    />
                    {componentType}
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Banned Components */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#f44336' }}>
              ✗ Banned Components
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allComponentTypes.map(componentType => {
                const isBanned = slotManifest.bannedComponents?.includes(componentType) || false;
                return (
                  <label
                    key={componentType}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      backgroundColor: isBanned ? '#ffebee' : '#f5f5f5',
                      border: `1px solid ${isBanned ? '#f44336' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isBanned}
                      onChange={() => toggleBannedComponent(componentType)}
                      style={{ marginRight: '4px' }}
                    />
                    {componentType}
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Allowed Layouts */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#2196f3' }}>
              📐 Allowed Layouts
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {allLayoutTypes.map(layoutType => {
                const isAllowed = slotManifest.allowedLayouts?.includes(layoutType) ?? true;
                return (
                  <label
                    key={layoutType}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      backgroundColor: isAllowed ? '#e3f2fd' : '#f5f5f5',
                      border: `1px solid ${isAllowed ? '#2196f3' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      onChange={() => toggleAllowedLayout(layoutType)}
                      style={{ marginRight: '6px' }}
                    />
                    {layoutType.replace('SlotLayout', '')}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Configurator Component
// =============================================================================

export function ManifestConfigurator({
  manifest,
  onUpdateSlotAllowedComponents,
  onUpdateSlotBannedComponents,
  onUpdateSlotAllowedLayouts,
  onUpdateTemplateDescription,
  onUpdateSlotDescription,
}: ManifestConfiguratorProps) {
  const [isEditingTemplateDescription, setIsEditingTemplateDescription] = React.useState(false);
  const [templateDescriptionDraft, setTemplateDescriptionDraft] = React.useState(manifest.description);
  
  // Update draft when manifest changes (e.g., template switch)
  React.useEffect(() => {
    setTemplateDescriptionDraft(manifest.description);
  }, [manifest.description]);
  
  return (
    <div className="manifest-configurator" style={{ height: '100%', overflowY: 'auto', padding: '16px' }}>
      {/* Template Info */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #ddd' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          {manifest.id}
        </h3>
        {!isEditingTemplateDescription ? (
          <div 
            style={{ fontSize: '13px', color: '#666', marginBottom: '8px', cursor: 'text', padding: '4px' }}
            onClick={() => setIsEditingTemplateDescription(true)}
            title="Click to edit template description (used in LLM prompts)"
          >
            {manifest.description} ✏️
          </div>
        ) : (
          <textarea
            value={templateDescriptionDraft}
            onChange={(e) => setTemplateDescriptionDraft(e.target.value)}
            onBlur={() => {
              setIsEditingTemplateDescription(false);
              onUpdateTemplateDescription(templateDescriptionDraft);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setIsEditingTemplateDescription(false);
                onUpdateTemplateDescription(templateDescriptionDraft);
              } else if (e.key === 'Escape') {
                setIsEditingTemplateDescription(false);
                setTemplateDescriptionDraft(manifest.description);
              }
            }}
            autoFocus
            style={{
              width: '100%',
              marginBottom: '8px',
              padding: '6px',
              fontSize: '13px',
              border: '2px solid #2196f3',
              borderRadius: '4px',
              resize: 'vertical',
              minHeight: '60px',
              fontFamily: 'inherit'
            }}
          />
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ 
            padding: '4px 8px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {manifest.category.toUpperCase()}
          </span>
          {manifest.metadata?.tags?.map(tag => (
            <span 
              key={tag}
              style={{ 
                padding: '4px 8px', 
                backgroundColor: '#e3f2fd', 
                color: '#1976d2',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Slot Configurations */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#666' }}>
          SLOT CONFIGURATIONS
        </h4>
        {Object.entries(manifest.slots).map(([slotName, slotManifest]) => (
          <SlotConfig
            key={slotName}
            slotName={slotName}
            slotManifest={slotManifest}
            onUpdateAllowedComponents={(components) => 
              onUpdateSlotAllowedComponents(slotName, components)
            }
            onUpdateBannedComponents={(components) => 
              onUpdateSlotBannedComponents(slotName, components)
            }
            onUpdateAllowedLayouts={(layouts) => 
              onUpdateSlotAllowedLayouts(slotName, layouts)
            }
            onUpdateDescription={(description) =>
              onUpdateSlotDescription(slotName, description)
            }
          />
        ))}
      </div>
    </div>
  );
}
