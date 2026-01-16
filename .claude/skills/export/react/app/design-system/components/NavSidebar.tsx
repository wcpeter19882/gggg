import React from 'react';

const SECTIONS = [
  { id: 'templates', label: 'Templates' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'widgets', label: 'Widgets' },
];

export function NavSidebar() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="w-64 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col hidden lg:flex">
      <div className="mb-8">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Design System
        </h1>
        <p className="text-sm text-gray-500 mt-2">Slide Rendering Components</p>
      </div>

      <ul className="space-y-1">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
         <p className="text-xs text-gray-400">
            Use these components to build consistant slide decks.
         </p>
      </div>
    </nav>
  );
}
