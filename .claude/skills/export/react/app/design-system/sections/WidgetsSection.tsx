import React from 'react';
import { ComponentShowcase } from '../components/ComponentShowcase';
// Import widgets from the codebase
import { BigNum } from '@/components/blocks/BigNum';
import { MetricCard } from '@/components/blocks/MetricCard';
import { ChartBar } from '@/components/blocks/ChartBar';
import { ChartLine } from '@/components/blocks/ChartLine';
import { ChartPie } from '@/components/blocks/ChartPie';
import { SmartList } from '@/components/blocks/SmartList';
import { StepList } from '@/components/blocks/StepList';
import { ProcessStrip } from '@/components/blocks/ProcessStrip';
import { TableData } from '@/components/blocks/TableData';
import { MetricStrip } from '@/components/blocks/MetricStrip';
import { QuoteBlock } from '@/components/blocks/QuoteBlock';

import {
  MOCK_BIGNUM,
  MOCK_METRIC_CARD,
  MOCK_CHART_BAR,
  MOCK_CHART_LINE,
  MOCK_CHART_PIE,
  MOCK_SMART_LIST,
  MOCK_TABLE_DATA,
  MOCK_STEP_LIST,
  MOCK_PROCESS_STRIP,
  MOCK_QUOTE
} from '../data/mocks';

export function WidgetsSection() {
  return (
    <section id="widgets" className="space-y-12">
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Widgets</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Atomic-level display components used to present specific data points.
        </p>
      </div>

      <ComponentShowcase
        title="BigNum"
        description="Displays a single prominent number with label and sublabel."
        component={BigNum}
        defaultProps={{
            value: MOCK_BIGNUM.value,
            label: MOCK_BIGNUM.label,
            sublabel: MOCK_BIGNUM.sublabel
        }}
        propConfigs={[
          { name: 'value', type: 'text', label: 'Value' },
          { name: 'label', type: 'text', label: 'Label' },
          { name: 'sublabel', type: 'text', label: 'Sublabel' }
        ]}
      />

       <ComponentShowcase
        title="MetricStrip"
        description="A horizontal strip of metrics, useful for dashboard summaries."
         component={MetricStrip}
         defaultProps={{
             title: "Key Performance Indicators",
             metrics: [
                { label: "Rev", value: "10M", icon: "💰" },
                { label: "Exp", value: "2M", icon: "💸" },
                { label: "Net", value: "8M", icon: "💎" }
             ]
         }}
         propConfigs={[
             { name: 'title', type: 'text', label: 'Strip Title' },
             { name: 'metrics', type: 'json', label: 'Metrics JSON', description: 'Array of {label, value, icon}' }
         ]}
       />

      <ComponentShowcase
        title="MetricCard"
        description="A card container for grouping related metrics."
        component={MetricCard}
        defaultProps={{
            title: MOCK_METRIC_CARD.title,
            metrics: MOCK_METRIC_CARD.items
        }}
        propConfigs={[
          { name: 'title', type: 'text', label: 'Card Title' },
          { name: 'metrics', type: 'json', label: 'Metrics JSON', description: 'Array of {label, value, icon}'},
          { name: 'layout', type: 'select', options: ['horizontal', 'vertical'], label: 'Layout Direction', defaultValue: 'horizontal' }

        ]}
      />

      <ComponentShowcase
        title="ChartBar"
        description="Standard bar chart for categorical data."
        component={ChartBar}
        defaultProps={MOCK_CHART_BAR}
        propConfigs={[
            { name: 'title', type: 'text', label: 'Chart Title' },
            { name: 'data', type: 'json', label: 'Data Array', description: 'Array of {label, value} objects' }
        ]}
      />

       <ComponentShowcase
          title="SmartList"
          description="A styled list component."
          component={SmartList}
          defaultProps={MOCK_SMART_LIST}
          propConfigs={[
              { name: 'items', type: 'json', label: 'List Items (Array of strings)'}
          ]}
       />

       <ComponentShowcase
          title="TableData"
          description="A basic data table."
          component={TableData}
          defaultProps={MOCK_TABLE_DATA}
          propConfigs={[
              { name: 'headers', type: 'json', label: 'Headers (Array)'},
              { name: 'rows', type: 'json', label: 'Rows (Array of Arrays)'}
          ]}
       />

      <ComponentShowcase
        title="ChartLine"
        description="Line chart for trend visualization over time."
        component={ChartLine}
        defaultProps={MOCK_CHART_LINE}
        propConfigs={[
          { name: 'title', type: 'text', label: 'Chart Title' },
          { name: 'data', type: 'json', label: 'Data Array', description: 'Array of {label, value} objects' },
          { name: 'height', type: 'select', options: ['sm', 'md', 'lg', 'full'], label: 'Height' },
          { name: 'area', type: 'boolean', label: 'Show Area Fill' },
          { name: 'curve', type: 'select', options: ['linear', 'smooth'], label: 'Curve Type' }
        ]}
      />

      <ComponentShowcase
        title="ChartPie"
        description="Pie/donut chart for proportional data."
        component={ChartPie}
        defaultProps={MOCK_CHART_PIE}
        propConfigs={[
          { name: 'title', type: 'text', label: 'Chart Title' },
          { name: 'data', type: 'json', label: 'Data Array', description: 'Array of {label, value} objects' },
          { name: 'variant', type: 'select', options: ['pie', 'donut'], label: 'Variant' },
          { name: 'showLegend', type: 'boolean', label: 'Show Legend' }
        ]}
      />

      <ComponentShowcase
        title="StepList"
        description="Vertical numbered steps with visual connectors."
        component={StepList}
        defaultProps={MOCK_STEP_LIST}
        propConfigs={[
          { name: 'title', type: 'text', label: 'Title' },
          { name: 'items', type: 'json', label: 'Steps', description: 'Array of strings or {label, description} objects' },
          { name: 'startFrom', type: 'number', label: 'Start Number' }
        ]}
      />

      <ComponentShowcase
        title="ProcessStrip"
        description="Horizontal process phases with status indicators."
        component={ProcessStrip}
        defaultProps={MOCK_PROCESS_STRIP}
        propConfigs={[
          { name: 'title', type: 'text', label: 'Title' },
          { name: 'items', type: 'json', label: 'Items', description: 'Array of {label, status} objects (status: done/active/pending)' },
          { name: 'showConnectors', type: 'boolean', label: 'Show Connectors' },
          { name: 'variant', type: 'select', options: ['default', 'compact'], label: 'Variant' }
        ]}
      />

      <ComponentShowcase
        title="QuoteBlock"
        description="Block quote for testimonials and citations."
        component={QuoteBlock}
        defaultProps={MOCK_QUOTE}
        propConfigs={[
          { name: 'author', type: 'text', label: 'Author' },
          { name: 'source', type: 'text', label: 'Source' },
          { name: 'size', type: 'select', options: ['sm', 'md', 'lg'], label: 'Size' },
          { name: 'variant', type: 'select', options: ['default', 'large', 'minimal'], label: 'Variant' }
        ]}
      >
        Stay hungry, stay foolish.
      </ComponentShowcase>

    </section>
  );
}
