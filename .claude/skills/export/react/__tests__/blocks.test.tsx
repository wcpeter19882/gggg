/**
 * Blocks Component Tests
 * 
 * Tests for L2 Block components: SmartList, ChartBar, MetricGroup
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SmartList } from '@/components/blocks/SmartList';
import { ChartBar } from '@/components/blocks/ChartBar';
import { MetricGroup } from '@/components/blocks/MetricGroup';

describe('SmartList Component', () => {
  it('renders simple string items', () => {
    render(<SmartList items={['Item 1', 'Item 2', 'Item 3']} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
  
  it('renders unordered list by default', () => {
    const { container } = render(<SmartList items={['A', 'B']} />);
    
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('smart-list');
  });
  
  it('renders ordered list when ordered prop is true', () => {
    const { container } = render(<SmartList items={['A', 'B']} ordered={true} />);
    
    const list = container.querySelector('ol');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('smart-list-ordered');
  });
  
  it('renders items with custom icon', () => {
    render(<SmartList items={['Test']} icon="🚀" />);
    
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });
  
  it('renders complex ListItem objects', () => {
    const items = [
      { text: 'Item with icon', icon: '✓' },
      { text: 'Plain item' },
    ];
    
    render(<SmartList items={items} />);
    
    expect(screen.getByText('Item with icon')).toBeInTheDocument();
    expect(screen.getByText('Plain item')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
  
  it('renders nested items', () => {
    const items = [
      { 
        text: 'Parent', 
        items: ['Child 1', 'Child 2'] 
      },
    ];
    
    render(<SmartList items={items} />);
    
    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
  
  it('handles empty items array', () => {
    const { container } = render(<SmartList items={[]} />);
    
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(list?.children).toHaveLength(0);
  });
});

describe('ChartBar Component', () => {
  const sampleData = [
    { label: 'Q1', value: 100 },
    { label: 'Q2', value: 150 },
    { label: 'Q3', value: 120 },
  ];
  
  it('renders chart container', () => {
    const { container } = render(<ChartBar data={sampleData} />);
    
    expect(container.querySelector('.chart-container')).toBeInTheDocument();
  });
  
  it('renders chart title when provided', () => {
    render(<ChartBar data={sampleData} title="Sales Report" />);
    
    expect(screen.getByText('Sales Report')).toBeInTheDocument();
  });
  
  it('does not render title when not provided', () => {
    const { container } = render(<ChartBar data={sampleData} />);
    
    expect(container.querySelector('.chart-title')).not.toBeInTheDocument();
  });
  
  it('renders ResponsiveContainer for chart', () => {
    const { container } = render(<ChartBar data={sampleData} />);
    
    // Recharts creates SVG elements
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });
  
  it('handles different height sizes', () => {
    const { container, rerender } = render(<ChartBar data={sampleData} height="sm" />);
    
    // Height is set on ResponsiveContainer, we just check it renders
    expect(container.querySelector('.chart-container')).toBeInTheDocument();
    
    rerender(<ChartBar data={sampleData} height="lg" />);
    expect(container.querySelector('.chart-container')).toBeInTheDocument();
  });
  
  it('handles empty data array', () => {
    const { container } = render(<ChartBar data={[]} />);
    
    expect(container.querySelector('.chart-container')).toBeInTheDocument();
  });
});

describe('MetricGroup Component', () => {
  const sampleMetrics = [
    { value: '$2.4M', label: 'Revenue' },
    { value: '89%', label: 'Satisfaction' },
  ];
  
  it('renders all metrics', () => {
    render(<MetricGroup metrics={sampleMetrics} />);
    
    expect(screen.getByText('$2.4M')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('89%')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction')).toBeInTheDocument();
  });
  
  it('renders metric cards', () => {
    const { container } = render(<MetricGroup metrics={sampleMetrics} />);
    
    const cards = container.querySelectorAll('.metric-card');
    expect(cards).toHaveLength(2);
  });
  
  it('applies grid columns based on cols prop', () => {
    const { container } = render(<MetricGroup metrics={sampleMetrics} cols={3} />);
    
    const group = container.querySelector('.metric-group');
    expect(group).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
  });
  
  it('renders positive change indicator', () => {
    const metrics = [
      { value: '100', label: 'Users', change: 15 },
    ];
    
    render(<MetricGroup metrics={metrics} />);
    
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('+15%').closest('.metric-change')).toHaveClass('metric-change-positive');
  });
  
  it('renders negative change indicator', () => {
    const metrics = [
      { value: '50', label: 'Churn', change: -8 },
    ];
    
    render(<MetricGroup metrics={metrics} />);
    
    expect(screen.getByText('-8%')).toBeInTheDocument();
    expect(screen.getByText('-8%').closest('.metric-change')).toHaveClass('metric-change-negative');
  });
  
  it('renders change label', () => {
    const metrics = [
      { value: '100', label: 'Growth', change: 10, changeLabel: 'vs last month' },
    ];
    
    render(<MetricGroup metrics={metrics} />);
    
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });
  
  it('renders metric icon when provided', () => {
    const metrics = [
      { value: '99.9%', label: 'Uptime', icon: '🟢' },
    ];
    
    render(<MetricGroup metrics={metrics} />);
    
    expect(screen.getByText('🟢')).toBeInTheDocument();
  });
  
  it('handles empty metrics array', () => {
    const { container } = render(<MetricGroup metrics={[]} />);
    
    const group = container.querySelector('.metric-group');
    expect(group).toBeInTheDocument();
    expect(group?.children).toHaveLength(0);
  });
});
