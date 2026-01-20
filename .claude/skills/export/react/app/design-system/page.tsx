'use client';

import React from 'react';
import { NavSidebar } from './components/NavSidebar';
import { WidgetsSection } from './sections/WidgetsSection';
import { LayoutsSection } from './sections/LayoutsSection';
import { TemplatesSection } from './sections/TemplatesSection';
import { ThemeSelector } from '@/components/core';

export default function DesignSystemPage() {
  return (
    <div className="flex bg-gray-50 dark:bg-black min-h-screen text-gray-900 dark:text-gray-100 font-sans">
      <ThemeSelector />
      <NavSidebar />

      <main className="flex-1 h-screen overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto px-6 py-12 md:px-12">

          <div className="mb-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Design System
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
              A comprehensive guide to the slide rendering components.
              This system uses a tiered abstraction model: Templates, Layouts, and Widgets.
            </p>
          </div>

          <div className="space-y-24 pb-24">
             <TemplatesSection />
             <LayoutsSection />
             <WidgetsSection />
          </div>

        </div>
      </main>
    </div>
  );
}
