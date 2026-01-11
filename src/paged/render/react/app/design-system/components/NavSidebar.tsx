import React from 'react';

const SECTIONS = [
  { id: 'layouts', label: 'Layouts (L1)' },
  { id: 'widgets', label: 'Blocks (L2)' },
  { id: 'templates', label: 'Atoms (L3)' },
];

export function NavSidebar() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="w-56 h-screen sticky top-0 bg-white border-r border-neutral-200 p-4 flex flex-col hidden lg:flex">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-neutral-900">
          Design System
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Component Library</p>
      </div>

      <ul className="space-y-0.5">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className="w-full text-left px-3 py-2 rounded text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4 border-t border-neutral-200">
         <p className="text-xs text-neutral-400">
            Slide: 1920×1080
         </p>
      </div>
    </nav>
  );
}
