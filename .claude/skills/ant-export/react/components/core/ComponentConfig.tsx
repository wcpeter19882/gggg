/**
 * ComponentConfig - Read-only configuration display
 * 
 * Displays which implementation (custom/original) each component is using.
 * Uses CUSTOM_COMPONENTS set from antd/switchable.tsx (shared list).
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { CUSTOM_COMPONENTS, isCustom } from '../antd/switchable';

interface ComponentConfigContextType {
  isCustomComponent: (name: string) => boolean;
  customComponents: ReadonlySet<string>;
}

const ComponentConfigContext = createContext<ComponentConfigContextType>({
  isCustomComponent: isCustom,
  customComponents: CUSTOM_COMPONENTS,
});

export function useComponentConfig() {
  return useContext(ComponentConfigContext);
}

interface ComponentConfigProviderProps {
  children: ReactNode;
}

export function ComponentConfigProvider({ children }: ComponentConfigProviderProps) {
  return (
    <ComponentConfigContext.Provider
      value={{
        isCustomComponent: isCustom,
        customComponents: CUSTOM_COMPONENTS,
      }}
    >
      {children}
    </ComponentConfigContext.Provider>
  );
}

export default ComponentConfigProvider;
