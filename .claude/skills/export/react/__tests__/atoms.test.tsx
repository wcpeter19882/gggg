/**
 * Atoms Component Tests
 * 
 * Tests for L3 Atom components: Heading, Text, Callout
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from '@/components/atoms/Heading';
import { Text } from '@/components/atoms/Text';
import { Callout } from '@/components/atoms/Callout';

describe('Heading Component', () => {
  it('renders h1 by default', () => {
    render(<Heading>Title</Heading>);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Title');
  });
  
  it('renders correct heading level', () => {
    const { rerender } = render(<Heading level={2}>H2</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    
    rerender(<Heading level={3}>H3</Heading>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    
    rerender(<Heading level={4}>H4</Heading>);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
  });
  
  it('applies correct class for level', () => {
    render(<Heading level={2}>Test</Heading>);
    
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('heading-2');
  });
  
  it('renders children content', () => {
    render(<Heading level={1}>Complex <em>Content</em></Heading>);
    
    expect(screen.getByText(/Complex/)).toBeInTheDocument();
    expect(screen.getByText(/Content/)).toBeInTheDocument();
  });
});

describe('Text Component', () => {
  it('renders paragraph by default', () => {
    render(<Text>Body text</Text>);
    
    const text = screen.getByText('Body text');
    expect(text.tagName).toBe('P');
    expect(text).toHaveClass('text-default');
  });
  
  it('renders lead variant', () => {
    render(<Text variant="lead">Lead text</Text>);
    
    const text = screen.getByText('Lead text');
    expect(text.tagName).toBe('P');
    expect(text).toHaveClass('text-lead');
  });
  
  it('renders caption variant as span', () => {
    render(<Text variant="caption">Caption text</Text>);
    
    const text = screen.getByText('Caption text');
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('text-caption');
  });
  
  it('renders code variant as code element', () => {
    render(<Text variant="code">const x = 1</Text>);
    
    const text = screen.getByText('const x = 1');
    expect(text.tagName).toBe('CODE');
    expect(text).toHaveClass('text-code');
  });
});

describe('Callout Component', () => {
  it('renders with info intent by default', () => {
    render(<Callout>Info message</Callout>);
    
    const callout = screen.getByRole('note');
    expect(callout).toHaveClass('callout', 'callout-info');
    expect(callout).toHaveTextContent('Info message');
  });
  
  it('renders warning intent', () => {
    render(<Callout intent="warning">Warning message</Callout>);
    
    const callout = screen.getByRole('note');
    expect(callout).toHaveClass('callout-warning');
  });
  
  it('renders success intent', () => {
    render(<Callout intent="success">Success message</Callout>);
    
    const callout = screen.getByRole('note');
    expect(callout).toHaveClass('callout-success');
  });
  
  it('renders danger intent', () => {
    render(<Callout intent="danger">Error message</Callout>);
    
    const callout = screen.getByRole('note');
    expect(callout).toHaveClass('callout-danger');
  });
  
  it('renders with title', () => {
    render(<Callout title="Important" intent="info">Content</Callout>);
    
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
  
  it('displays appropriate icon', () => {
    render(<Callout intent="info">Test</Callout>);
    
    // Info icon should be present
    const icon = screen.getByText('ℹ️');
    expect(icon).toBeInTheDocument();
  });
  
  it('has accessible label', () => {
    render(<Callout intent="warning">Test</Callout>);
    
    const callout = screen.getByRole('note');
    expect(callout).toHaveAttribute('aria-label', 'warning callout');
  });
});
