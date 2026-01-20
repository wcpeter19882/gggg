import React from 'react';

export type PropType = 'text' | 'number' | 'boolean' | 'select' | 'json';

export interface PropConfig {
  name: string;
  type: PropType;
  label?: string;
  description?: string;
  options?: string[]; // For select type
  defaultValue?: any;
}

interface PropControlProps {
  config: PropConfig;
  value: any;
  onChange: (value: any) => void;
}

export function PropControl({ config, value, onChange }: PropControlProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let newValue: any = e.target.value;

    if (config.type === 'number') {
      newValue = Number(e.target.value);
    } else if (config.type === 'boolean') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {config.label || config.name}
      </label>

      {config.description && (
        <p className="text-xs text-gray-500 mb-1">{config.description}</p>
      )}

      {config.type === 'boolean' ? (
         <div className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">{value ? 'True' : 'False'}</span>
         </div>
      ) : config.type === 'select' ? (
        <select
          value={value}
          onChange={handleChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          {config.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : config.type === 'json' ? (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
                try {
                    const parsed = JSON.parse(e.target.value);
                    onChange(parsed);
                } catch(err) {
                    // Start editing creates invalid json temporarily, just update text
                    // requires parent to handle string input if strict
                    onChange(e.target.value);
                }
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border font-mono text-xs h-24 bg-white dark:bg-gray-800 dark:border-gray-700"
          />
      ) : (
        <input
          type={config.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={handleChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white dark:bg-gray-800 dark:border-gray-700"
        />
      )}
    </div>
  );
}
