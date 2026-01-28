'use client';

/**
 * ComponentModeDisplay - Read-only display of which components use custom implementation
 * 
 * Components in CUSTOM_COMPONENTS list use custom; others use original.
 * Edit CUSTOM_COMPONENTS in antd/switchable.tsx to change.
 */

import React, { useState } from 'react';
import { useComponentConfig } from './ComponentConfig';

interface ComponentModeDisplayProps {
  className?: string;
}

// All known component names (for display purposes)
const ANTD_COMPONENTS = [
  'Alert', 'List', 'Card', 'Statistic', 'Descriptions', 'Steps', 'Timeline',
  'Table', 'Progress', 'Tag', 'Badge', 'Image', 'Blockquote',
  'Row', 'Col', 'Flex', 'Divider', 'Layout', 'Header', 'Footer', 'Sider', 'Content',
];

const HEROUI_COMPONENTS = [
  'HCard', 'CardHeader', 'CardBody', 'CardFooter', 'Chip', 'Button',
  'Avatar', 'HDivider', 'HProgress', 'HBadge',
];

export function ComponentModeToggle({ className = '' }: ComponentModeDisplayProps) {
  const { isCustomComponent, customComponents } = useComponentConfig();
  const [expanded, setExpanded] = useState(false);

  const antdCustomCount = ANTD_COMPONENTS.filter(name => customComponents.has(name)).length;
  const heroUICustomCount = HEROUI_COMPONENTS.filter(name => customComponents.has(name)).length;

  return (
    <div className={`component-mode-display ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px',
      background: 'rgba(0,0,0,0.9)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '12px',
      maxHeight: expanded ? '400px' : 'auto',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 'bold' }}>🔧 Custom Components ({customComponents.size})</span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ 
            marginLeft: 'auto', 
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            background: '#374151',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      
      {/* Summary */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
        <span>
          <span style={{ color: '#22c55e' }}>Ant:</span> {antdCustomCount}/{ANTD_COMPONENTS.length} custom
        </span>
        <span>
          <span style={{ color: '#f59e0b' }}>HeroUI:</span> {heroUICustomCount}/{HEROUI_COMPONENTS.length} custom
        </span>
      </div>

      {/* Component List */}
      {expanded && (
        <>
          <div style={{ borderTop: '1px solid #444', paddingTop: '8px', marginTop: '4px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Ant Design</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {ANTD_COMPONENTS.map(name => {
                const isCustom = customComponents.has(name);
                return (
                  <span
                    key={name}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '3px',
                      border: '1px solid #555',
                      background: isCustom ? '#166534' : '#7f1d1d',
                      color: '#fff',
                      fontSize: '10px',
                    }}
                    title={`${name}: ${isCustom ? 'custom' : 'original'}`}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #444', paddingTop: '8px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>HeroUI</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {HEROUI_COMPONENTS.map(name => {
                const isCustom = customComponents.has(name);
                return (
                  <span
                    key={name}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '3px',
                      border: '1px solid #555',
                      background: isCustom ? '#166534' : '#7f1d1d',
                      color: '#fff',
                      fontSize: '10px',
                    }}
                    title={`${name}: ${isCustom ? 'custom' : 'original'}`}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            Edit CUSTOM_COMPONENTS in antd/switchable.tsx
          </div>
        </>
      )}
    </div>
  );
}

export default ComponentModeToggle;
