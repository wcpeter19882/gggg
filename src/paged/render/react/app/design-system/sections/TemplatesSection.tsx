import React from 'react';
import { ComponentShowcase } from '../components/ComponentShowcase';
import { Heading } from '@/components/atoms/Heading';
import { Text } from '@/components/atoms/Text';
import { Callout } from '@/components/atoms/Callout';
import { Highlight } from '@/components/atoms/Highlight';

export function TemplatesSection() {
  return (
    <section id="templates" className="space-y-8">
       <div className="pb-4 border-b border-neutral-200">
        <h2 className="text-2xl font-bold text-neutral-900">Atoms (L3) & Typography</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Base text components and typography system.
        </p>
      </div>

      {/* Typography Scale Preview */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
         <h3 className="text-lg font-semibold text-neutral-900 mb-4">Typography Scale</h3>
         <div className="space-y-3 border-l-2 border-blue-400 pl-4">
             <div className="text-sm text-neutral-500">Heading 1 (Display)</div>
             <div style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.2 }}>Display Title</div>
             <div className="text-sm text-neutral-500 mt-4">Heading 2 (Section)</div>
             <div style={{ fontSize: '36px', fontWeight: 600, lineHeight: 1.3 }}>Section Title</div>
             <div className="text-sm text-neutral-500 mt-4">Heading 3 (Subsection)</div>
             <div style={{ fontSize: '24px', fontWeight: 600, lineHeight: 1.4 }}>Subsection Title</div>
             <div className="text-sm text-neutral-500 mt-4">Body Text</div>
             <div style={{ fontSize: '18px', lineHeight: 1.6 }}>Standard body text for paragraphs on slides.</div>
             <div className="text-sm text-neutral-500 mt-4">Caption</div>
             <div style={{ fontSize: '14px', color: '#666' }}>Smaller text for footnotes and metadata.</div>
         </div>
      </div>

      <ComponentShowcase
        title="Callout"
        description="Semantic callout/alert component for highlighting important information."
        component={Callout}
        level="atom"
        defaultProps={{
          intent: 'info',
          title: 'Note'
        }}
        propConfigs={[
          { name: 'intent', type: 'select', options: ['info', 'warning', 'success', 'danger'], label: 'Intent' },
          { name: 'title', type: 'text', label: 'Title' }
        ]}
      >
        This is important information that the reader should pay attention to.
      </ComponentShowcase>

      <ComponentShowcase
        title="Highlight"
        description="Inline text highlighting for emphasis."
        component={Highlight}
        level="atom"
        defaultProps={{
          color: 'primary',
          bold: false
        }}
        propConfigs={[
          { name: 'color', type: 'select', options: ['default', 'primary', 'success', 'warning', 'info', 'accent'], label: 'Color' },
          { name: 'bold', type: 'boolean', label: 'Bold' }
        ]}
      >
        Highlighted text stands out
      </ComponentShowcase>
    </section>
  );
}
