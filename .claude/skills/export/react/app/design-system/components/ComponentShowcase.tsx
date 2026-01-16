
import React, { useState } from 'react';
import { PropControl, PropConfig } from './PropControl';

interface ComponentShowcaseProps {
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
  propConfigs?: PropConfig[];
  children?: React.ReactNode;
}

export function ComponentShowcase({
  title,
  description,
  component: Component,
  defaultProps = {},
  propConfigs = [],
  children
}: ComponentShowcaseProps) {
  const [props, setProps] = useState(() => {
    // Start with defaultValue from propConfigs
    const configDefaults = propConfigs.reduce((acc, config) => {
      if (config.defaultValue !== undefined) {
        acc[config.name] = config.defaultValue;
      }
      return acc;
    }, {} as Record<string, any>);

    // Override with explicit defaultProps
    return { ...configDefaults, ...defaultProps };
  });
  const [showCode, setShowCode] = useState(false);

  const handlePropChange = (name: string, value: any) => {
    setProps((prev) => ({ ...prev, [name]: value }));
  };

  const codeSnippet = `<${Component.displayName || Component.name || 'Component'}
${Object.entries(props)
  .map(([key, value]) => `  ${key}={${JSON.stringify(value)}}`)
  .join('\n')}
/>`;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 mb-8 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
        <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
        </div>
        <button
            onClick={() => setShowCode(!showCode)}
            className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
            {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Preview Area */}
        <div className="flex-1 p-6 flex items-center justify-center min-h-[300px] overflow-auto" style={{ backgroundColor: 'var(--theme-bg)' }}>
            <div className="w-full max-w-4xl">
                 <Component {...props}>
                    {children}
                 </Component>
            </div>
        </div>

        {/* Controls Area */}
        {propConfigs.length > 0 && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Properties</h4>
            {propConfigs.map((config) => (
              <PropControl
                key={config.name}
                config={config}
                value={props[config.name]}
                onChange={(val) => handlePropChange(config.name, val)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Code Snippet */}
        {showCode && (
            <div className="bg-gray-800 p-4 overflow-x-auto">
                <pre className="text-xs text-gray-100 font-mono">
                    {codeSnippet}
                </pre>
            </div>
        )}
    </div>
  );
}
