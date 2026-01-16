import React from 'react';
import { ComponentShowcase } from '../components/ComponentShowcase';
// Import SlideWrapper to demonstrate the top-level container
import { SlideWrapper } from '@/components/core/SlideWrapper';
import { Heading } from '@/components/atoms/Heading';
import { Text } from '@/components/atoms/Text';
import { Callout } from '@/components/atoms/Callout';
import { Highlight } from '@/components/atoms/Highlight';

export function TemplatesSection() {
  return (
    <section id="templates" className="space-y-12 pt-16">
       <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Templates & Typography</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          The base container and typography system that defines the look and feel.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
         <h3 className="text-xl font-semibold mb-6">Typography Scale</h3>
         <div className="space-y-4 border-l-4 border-blue-500 pl-6 py-2">
             <Heading level={1}>Heading 1: Display Title</Heading>
             <Heading level={2}>Heading 2: Section Title</Heading>
             <Heading level={3}>Heading 3: Subsection Title</Heading>
             <Text variant="lead">Lead Text: Larger body text for introductions.</Text>
             <Text>Default Body: Standard text size for paragraphs on slides.</Text>
             <Text variant="caption">Caption: Smaller text for footnotes and metadata.</Text>
         </div>
      </div>

      <ComponentShowcase
        title="Callout"
        description="Semantic callout/alert component for highlighting important information."
        component={Callout}
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

       <ComponentShowcase
        title="SlideWrapper (The Core Template)"
        description="The container for every slide. Handles aspect ratio (16:9), scaling, and global styling."
        component={SlideWrapper}
        defaultProps={{
            index: 1,
            isActive: true
        }}
        propConfigs={[
             { name: 'index', type: 'number', label: 'Slide Index' }
        ]}
      >
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <h1 className="text-5xl font-bold mb-4 text-gray-900">Slide Template</h1>
            <p className="text-2xl text-gray-600">
                This is how the SlideWrapper encapsulates content.
            </p>
            <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded">
                Note: In this preview, scaling might differ from full-screen presentation mode.
            </div>
        </div>
      </ComponentShowcase>
    </section>
  );
}
