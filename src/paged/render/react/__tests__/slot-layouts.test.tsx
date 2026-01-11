/**
 * SlotLayout Primitives Tests
 * 
 * Tests for V2 Architecture Layer 3 components:
 * - SlotLayoutStack
 * - SlotLayoutGrid
 * - SlotLayoutFit
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SlotLayoutStack,
  SlotLayoutGrid,
  SlotLayoutFit,
} from '@/components/slot-layouts';

// =============================================================================
// SlotLayoutStack Tests
// =============================================================================

describe('SlotLayoutStack Component', () => {
  it('renders children content', () => {
    render(
      <SlotLayoutStack>
        <h2>Title</h2>
        <p>Paragraph</p>
      </SlotLayoutStack>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
  });

  it('applies slot-layout-stack class', () => {
    const { container } = render(
      <SlotLayoutStack>Content</SlotLayoutStack>
    );

    expect(container.querySelector('.slot-layout-stack')).toBeInTheDocument();
  });

  it('sets data-slot-layout attribute', () => {
    const { container } = render(
      <SlotLayoutStack>Content</SlotLayoutStack>
    );

    expect(container.querySelector('[data-slot-layout="stack"]')).toBeInTheDocument();
  });

  it('applies default gap (md)', () => {
    const { container } = render(
      <SlotLayoutStack>Content</SlotLayoutStack>
    );

    expect(container.querySelector('[data-gap="md"]')).toBeInTheDocument();
    expect(container.querySelector('.gap-4')).toBeInTheDocument();
  });

  it('applies custom gap', () => {
    const { container } = render(
      <SlotLayoutStack gap="lg">Content</SlotLayoutStack>
    );

    expect(container.querySelector('[data-gap="lg"]')).toBeInTheDocument();
    expect(container.querySelector('.gap-6')).toBeInTheDocument();
  });

  it('applies default alignment (stretch)', () => {
    const { container } = render(
      <SlotLayoutStack>Content</SlotLayoutStack>
    );

    expect(container.querySelector('[data-align="stretch"]')).toBeInTheDocument();
    expect(container.querySelector('.items-stretch')).toBeInTheDocument();
  });

  it('applies custom alignment', () => {
    const { container } = render(
      <SlotLayoutStack align="center">Content</SlotLayoutStack>
    );

    expect(container.querySelector('[data-align="center"]')).toBeInTheDocument();
    expect(container.querySelector('.items-center')).toBeInTheDocument();
  });

  it('applies default justify (start)', () => {
    const { container } = render(
      <SlotLayoutStack>Content</SlotLayoutStack>
    );

    expect(container.querySelector('[data-justify="start"]')).toBeInTheDocument();
    expect(container.querySelector('.justify-start')).toBeInTheDocument();
  });

  it('applies custom justify', () => {
    const { container } = render(
      <SlotLayoutStack justify="between">Content</SlotLayoutStack>
    );

    expect(container.querySelector('[data-justify="between"]')).toBeInTheDocument();
    expect(container.querySelector('.justify-between')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(
      <SlotLayoutStack className="custom-class">Content</SlotLayoutStack>
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('has flex-col class for vertical stacking', () => {
    const { container } = render(
      <SlotLayoutStack>Content</SlotLayoutStack>
    );

    expect(container.querySelector('.flex-col')).toBeInTheDocument();
  });
});

// =============================================================================
// SlotLayoutGrid Tests
// =============================================================================

describe('SlotLayoutGrid Component', () => {
  it('renders children content', () => {
    render(
      <SlotLayoutGrid>
        <div>Cell 1</div>
        <div>Cell 2</div>
      </SlotLayoutGrid>
    );

    expect(screen.getByText('Cell 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 2')).toBeInTheDocument();
  });

  it('applies slot-layout-grid class', () => {
    const { container } = render(
      <SlotLayoutGrid>Content</SlotLayoutGrid>
    );

    expect(container.querySelector('.slot-layout-grid')).toBeInTheDocument();
  });

  it('sets data-slot-layout attribute', () => {
    const { container } = render(
      <SlotLayoutGrid>Content</SlotLayoutGrid>
    );

    expect(container.querySelector('[data-slot-layout="grid"]')).toBeInTheDocument();
  });

  it('applies default cols (2)', () => {
    const { container } = render(
      <SlotLayoutGrid>Content</SlotLayoutGrid>
    );

    expect(container.querySelector('[data-cols="2"]')).toBeInTheDocument();
    expect(container.querySelector('.grid-cols-2')).toBeInTheDocument();
  });

  it('applies custom cols', () => {
    const { container } = render(
      <SlotLayoutGrid cols={3}>Content</SlotLayoutGrid>
    );

    expect(container.querySelector('[data-cols="3"]')).toBeInTheDocument();
    expect(container.querySelector('.grid-cols-3')).toBeInTheDocument();
  });

  it('applies 4 columns', () => {
    const { container } = render(
      <SlotLayoutGrid cols={4}>Content</SlotLayoutGrid>
    );

    expect(container.querySelector('[data-cols="4"]')).toBeInTheDocument();
    expect(container.querySelector('.grid-cols-4')).toBeInTheDocument();
  });

  it('applies default gap (md)', () => {
    const { container } = render(
      <SlotLayoutGrid>Content</SlotLayoutGrid>
    );

    expect(container.querySelector('[data-gap="md"]')).toBeInTheDocument();
    expect(container.querySelector('.gap-4')).toBeInTheDocument();
  });

  it('applies custom gap', () => {
    const { container } = render(
      <SlotLayoutGrid gap="lg">Content</SlotLayoutGrid>
    );

    expect(container.querySelector('[data-gap="lg"]')).toBeInTheDocument();
    expect(container.querySelector('.gap-6')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(
      <SlotLayoutGrid className="custom-class">Content</SlotLayoutGrid>
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('has grid class', () => {
    const { container } = render(
      <SlotLayoutGrid>Content</SlotLayoutGrid>
    );

    expect(container.querySelector('.grid')).toBeInTheDocument();
  });
});

// =============================================================================
// SlotLayoutFit Tests
// =============================================================================

describe('SlotLayoutFit Component', () => {
  it('renders children content', () => {
    render(
      <SlotLayoutFit>
        <div>Chart Content</div>
      </SlotLayoutFit>
    );

    expect(screen.getByText('Chart Content')).toBeInTheDocument();
  });

  it('applies slot-layout-fit class', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('.slot-layout-fit')).toBeInTheDocument();
  });

  it('sets data-slot-layout attribute', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-slot-layout="fit"]')).toBeInTheDocument();
  });

  it('applies default mode (cover)', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-mode="cover"]')).toBeInTheDocument();
  });

  it('applies custom mode', () => {
    const { container } = render(
      <SlotLayoutFit mode="contain">Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-mode="contain"]')).toBeInTheDocument();
  });

  it('applies fill mode', () => {
    const { container } = render(
      <SlotLayoutFit mode="fill">Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-mode="fill"]')).toBeInTheDocument();
  });

  it('applies default align (center)', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-align="center"]')).toBeInTheDocument();
    expect(container.querySelector('.justify-center')).toBeInTheDocument();
  });

  it('applies custom align', () => {
    const { container } = render(
      <SlotLayoutFit align="start">Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-align="start"]')).toBeInTheDocument();
    expect(container.querySelector('.justify-start')).toBeInTheDocument();
  });

  it('applies default valign (center)', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-valign="center"]')).toBeInTheDocument();
    expect(container.querySelector('.items-center')).toBeInTheDocument();
  });

  it('applies custom valign', () => {
    const { container } = render(
      <SlotLayoutFit valign="end">Content</SlotLayoutFit>
    );

    expect(container.querySelector('[data-valign="end"]')).toBeInTheDocument();
    expect(container.querySelector('.items-end')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(
      <SlotLayoutFit className="custom-class">Content</SlotLayoutFit>
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('has full width and height classes', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('.w-full')).toBeInTheDocument();
    expect(container.querySelector('.h-full')).toBeInTheDocument();
  });

  it('has overflow-hidden class', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('.overflow-hidden')).toBeInTheDocument();
  });

  it('sets CSS custom property for fit mode', () => {
    const { container } = render(
      <SlotLayoutFit mode="contain">Content</SlotLayoutFit>
    );

    const element = container.querySelector('.slot-layout-fit');
    expect(element).toHaveStyle({ '--slot-fit-mode': 'contain' });
  });

  it('wraps children in inner container', () => {
    const { container } = render(
      <SlotLayoutFit>Content</SlotLayoutFit>
    );

    expect(container.querySelector('.slot-layout-fit-inner')).toBeInTheDocument();
  });
});
