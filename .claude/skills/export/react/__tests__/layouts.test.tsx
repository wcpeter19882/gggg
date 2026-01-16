/**
 * Layouts Component Tests
 * 
 * Tests for L1 Layout components: LayoutCover, LayoutSplit, LayoutGrid
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayoutCover } from '@/components/layouts/LayoutCover';
import { LayoutSplit } from '@/components/layouts/LayoutSplit';
import { LayoutGrid } from '@/components/layouts/LayoutGrid';

describe('LayoutCover Component', () => {
  it('renders children content', () => {
    render(
      <LayoutCover>
        <h1>Title</h1>
        <p>Subtitle</p>
      </LayoutCover>
    );
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });
  
  it('applies layout-cover class', () => {
    const { container } = render(
      <LayoutCover>Content</LayoutCover>
    );
    
    expect(container.querySelector('.layout-cover')).toBeInTheDocument();
  });
  
  it('sets data-layout attribute', () => {
    const { container } = render(
      <LayoutCover>Content</LayoutCover>
    );
    
    expect(container.querySelector('[data-layout="cover"]')).toBeInTheDocument();
  });
  
  it('applies theme override when provided', () => {
    const { container } = render(
      <LayoutCover theme="cyber">Content</LayoutCover>
    );
    
    expect(container.querySelector('[data-theme="cyber"]')).toBeInTheDocument();
  });
  
  it('applies vibe override when provided', () => {
    const { container } = render(
      <LayoutCover vibe="expressive">Content</LayoutCover>
    );
    
    expect(container.querySelector('[data-vibe="expressive"]')).toBeInTheDocument();
  });
});

describe('LayoutSplit Component', () => {
  it('renders left and right slots', () => {
    render(
      <LayoutSplit>
        <LayoutSplit.Left>Left content</LayoutSplit.Left>
        <LayoutSplit.Right>Right content</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(screen.getByText('Left content')).toBeInTheDocument();
    expect(screen.getByText('Right content')).toBeInTheDocument();
  });
  
  it('applies 1:1 ratio by default', () => {
    const { container } = render(
      <LayoutSplit>
        <LayoutSplit.Left>L</LayoutSplit.Left>
        <LayoutSplit.Right>R</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(container.querySelector('.layout-split-1-1')).toBeInTheDocument();
  });
  
  it('applies 2:1 ratio correctly', () => {
    const { container } = render(
      <LayoutSplit ratio="2:1">
        <LayoutSplit.Left>L</LayoutSplit.Left>
        <LayoutSplit.Right>R</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(container.querySelector('.layout-split-2-1')).toBeInTheDocument();
  });
  
  it('applies 1:2 ratio correctly', () => {
    const { container } = render(
      <LayoutSplit ratio="1:2">
        <LayoutSplit.Left>L</LayoutSplit.Left>
        <LayoutSplit.Right>R</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(container.querySelector('.layout-split-1-2')).toBeInTheDocument();
  });
  
  it('applies 3:1 ratio correctly', () => {
    const { container } = render(
      <LayoutSplit ratio="3:1">
        <LayoutSplit.Left>L</LayoutSplit.Left>
        <LayoutSplit.Right>R</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(container.querySelector('.layout-split-3-1')).toBeInTheDocument();
  });
  
  it('sets data-ratio attribute', () => {
    const { container } = render(
      <LayoutSplit ratio="2:1">
        <LayoutSplit.Left>L</LayoutSplit.Left>
        <LayoutSplit.Right>R</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(container.querySelector('[data-ratio="2:1"]')).toBeInTheDocument();
  });
  
  it('handles missing Left slot gracefully', () => {
    const { container } = render(
      <LayoutSplit>
        <LayoutSplit.Right>Only Right</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(screen.getByText('Only Right')).toBeInTheDocument();
    expect(container.querySelector('.layout-split')).toBeInTheDocument();
  });
  
  it('handles missing Right slot gracefully', () => {
    const { container } = render(
      <LayoutSplit>
        <LayoutSplit.Left>Only Left</LayoutSplit.Left>
      </LayoutSplit>
    );
    
    expect(screen.getByText('Only Left')).toBeInTheDocument();
    expect(container.querySelector('.layout-split')).toBeInTheDocument();
  });
  
  it('applies theme and vibe overrides', () => {
    const { container } = render(
      <LayoutSplit theme="minimal" vibe="clean">
        <LayoutSplit.Left>L</LayoutSplit.Left>
        <LayoutSplit.Right>R</LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(container.querySelector('[data-theme="minimal"]')).toBeInTheDocument();
    expect(container.querySelector('[data-vibe="clean"]')).toBeInTheDocument();
  });
});

describe('LayoutGrid Component', () => {
  it('renders column slots', () => {
    render(
      <LayoutGrid cols={3}>
        <LayoutGrid.Col>Column 1</LayoutGrid.Col>
        <LayoutGrid.Col>Column 2</LayoutGrid.Col>
        <LayoutGrid.Col>Column 3</LayoutGrid.Col>
      </LayoutGrid>
    );
    
    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    expect(screen.getByText('Column 3')).toBeInTheDocument();
  });
  
  it('applies 3 columns by default', () => {
    const { container } = render(
      <LayoutGrid>
        <LayoutGrid.Col>A</LayoutGrid.Col>
        <LayoutGrid.Col>B</LayoutGrid.Col>
        <LayoutGrid.Col>C</LayoutGrid.Col>
      </LayoutGrid>
    );
    
    expect(container.querySelector('.layout-grid-3')).toBeInTheDocument();
  });
  
  it('applies 2 columns when specified', () => {
    const { container } = render(
      <LayoutGrid cols={2}>
        <LayoutGrid.Col>A</LayoutGrid.Col>
        <LayoutGrid.Col>B</LayoutGrid.Col>
      </LayoutGrid>
    );
    
    expect(container.querySelector('.layout-grid-2')).toBeInTheDocument();
  });
  
  it('applies 4 columns when specified', () => {
    const { container } = render(
      <LayoutGrid cols={4}>
        <LayoutGrid.Col>A</LayoutGrid.Col>
        <LayoutGrid.Col>B</LayoutGrid.Col>
        <LayoutGrid.Col>C</LayoutGrid.Col>
        <LayoutGrid.Col>D</LayoutGrid.Col>
      </LayoutGrid>
    );
    
    expect(container.querySelector('.layout-grid-4')).toBeInTheDocument();
  });
  
  it('sets data-cols attribute', () => {
    const { container } = render(
      <LayoutGrid cols={4}>
        <LayoutGrid.Col>A</LayoutGrid.Col>
      </LayoutGrid>
    );
    
    expect(container.querySelector('[data-cols="4"]')).toBeInTheDocument();
  });
  
  it('renders only Col components', () => {
    const { container } = render(
      <LayoutGrid cols={2}>
        <LayoutGrid.Col>Valid</LayoutGrid.Col>
        <div>Invalid</div>
        <LayoutGrid.Col>Also Valid</LayoutGrid.Col>
      </LayoutGrid>
    );
    
    const cols = container.querySelectorAll('.layout-grid-col');
    expect(cols).toHaveLength(2);
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Also Valid')).toBeInTheDocument();
    // The div should not be rendered inside the grid
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
  });
  
  it('handles empty grid gracefully', () => {
    const { container } = render(
      <LayoutGrid cols={3} />
    );
    
    expect(container.querySelector('.layout-grid')).toBeInTheDocument();
  });
  
  it('applies theme and vibe overrides', () => {
    const { container } = render(
      <LayoutGrid theme="academic" vibe="balanced" cols={2}>
        <LayoutGrid.Col>A</LayoutGrid.Col>
        <LayoutGrid.Col>B</LayoutGrid.Col>
      </LayoutGrid>
    );
    
    expect(container.querySelector('[data-theme="academic"]')).toBeInTheDocument();
    expect(container.querySelector('[data-vibe="balanced"]')).toBeInTheDocument();
  });
});

describe('Layout Integration', () => {
  it('nested layouts render correctly', () => {
    render(
      <LayoutSplit ratio="2:1">
        <LayoutSplit.Left>
          <LayoutGrid cols={2}>
            <LayoutGrid.Col>Nested 1</LayoutGrid.Col>
            <LayoutGrid.Col>Nested 2</LayoutGrid.Col>
          </LayoutGrid>
        </LayoutSplit.Left>
        <LayoutSplit.Right>
          Right Side
        </LayoutSplit.Right>
      </LayoutSplit>
    );
    
    expect(screen.getByText('Nested 1')).toBeInTheDocument();
    expect(screen.getByText('Nested 2')).toBeInTheDocument();
    expect(screen.getByText('Right Side')).toBeInTheDocument();
  });
});
