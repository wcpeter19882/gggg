'use client';

import React from 'react';
import { NavSidebar } from './components/NavSidebar';
import { ShowcaseProvider } from './components/ShowcaseContext';
import { ShowcaseToolbar } from './components/ShowcaseToolbar';
import { WidgetsSection } from './sections/WidgetsSection';
import { LayoutsSection } from './sections/LayoutsSection';
import { TemplatesSection } from './sections/TemplatesSection';

/**
 * Design System Page
 * 
 * Displays all UI components used in slide rendering.
 * 
 * Key features:
 * - Fixed neutral styling (unaffected by theme selection)
 * - Theme/Vibe selector only affects component showcases
 * - Each showcase renders in a scaled 1920×1080 slide preview
 * - Debug mode shows layout boundaries
 */
export default function DesignSystemPage() {
  return (
    <ShowcaseProvider defaultTheme="business" defaultVibe="balanced">
      <div className="design-system-page flex min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <NavSidebar />

        <div className="flex-1 flex flex-col">
          <ShowcaseToolbar />

          <main className="flex-1 overflow-y-auto">
            <div className="w-full px-6 py-6">
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-3xl font-bold text-neutral-900 mb-3">
                  Design System
                </h1>
                <p className="text-base text-neutral-600 max-w-2xl">
                  Component library for slide rendering. Each component is displayed 
                  in a scaled 1920×1080 slide preview. Use the toolbar to switch themes 
                  and vibes, or enable debug bounds to see layout regions.
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-16">
                <LayoutsSection />
                <WidgetsSection />
                <TemplatesSection />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ShowcaseProvider>
  );
}
