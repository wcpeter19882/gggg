'use client';

/**
 * ShowcaseToolbar
 * 
 * Global controls for the design system page:
 * - Theme selector
 * - Vibe selector
 * - Debug bounds toggle
 * 
 * This toolbar only affects what's rendered inside ComponentShowcase,
 * not the design system page itself.
 */

import React from 'react';
import { useShowcase, THEME_OPTIONS, VIBE_OPTIONS } from './ShowcaseContext';

export function ShowcaseToolbar(): JSX.Element {
  const { theme, vibe, showBounds, setTheme, setVibe, setShowBounds } = useShowcase();

  return (
    <div className="showcase-toolbar sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Theme Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-neutral-600">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="text-sm px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vibe Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-neutral-600">Vibe</label>
            <div className="flex items-center gap-1">
              {VIBE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVibe(opt.value)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors ${
                    vibe === opt.value
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Debug Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-600">Show Bounds</label>
            <button
              onClick={() => setShowBounds(!showBounds)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showBounds ? 'bg-blue-500' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  showBounds ? 'translate-x-4.5' : 'translate-x-1'
                }`}
                style={{ transform: showBounds ? 'translateX(18px)' : 'translateX(4px)' }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowcaseToolbar;
