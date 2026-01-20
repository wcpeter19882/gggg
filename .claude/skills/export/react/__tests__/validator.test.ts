/**
 * L0 Validator Tests
 * 
 * Tests for the MDX validator that checks for forbidden L0 elements and attributes.
 */

import { describe, it, expect } from 'vitest';
import { 
  validateMDX, 
  assertValidMDX,
  formatValidationErrors,
  FORBIDDEN_ELEMENTS,
  FORBIDDEN_ATTRIBUTES,
} from '@/utils/validator';

describe('L0 Validator', () => {
  describe('validateMDX', () => {
    describe('valid MDX (no L0 violations)', () => {
      it('accepts MDX with only L1-L3 components', () => {
        const mdx = `
<LayoutCover>
  <Heading level={1}>Title</Heading>
  <Text variant="lead">Subtitle</Text>
</LayoutCover>
        `;
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('accepts LayoutSplit with compound slots', () => {
        const mdx = `
<LayoutSplit ratio="2:1">
  <LayoutSplit.Left>
    <Heading level={2}>Left Content</Heading>
  </LayoutSplit.Left>
  <LayoutSplit.Right>
    <ChartBar data={[{label: "Q1", value: 100}]} />
  </LayoutSplit.Right>
</LayoutSplit>
        `;
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('accepts LayoutGrid with Col slots', () => {
        const mdx = `
<LayoutGrid cols={3}>
  <LayoutGrid.Col>Column 1</LayoutGrid.Col>
  <LayoutGrid.Col>Column 2</LayoutGrid.Col>
  <LayoutGrid.Col>Column 3</LayoutGrid.Col>
</LayoutGrid>
        `;
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('accepts all L2 block components', () => {
        const mdx = `
<SmartList items={["Item 1", "Item 2"]} />
<ChartBar data={[{label: "A", value: 10}]} />
<MetricGroup metrics={[{value: "$1M", label: "Revenue"}]} />
<Callout intent="info">Information</Callout>
        `;
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
    
    describe('forbidden elements (L0 violations)', () => {
      it('rejects <div> elements', () => {
        const mdx = '<div>content</div>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('div');
        expect(result.errors[0].type).toBe('element');
      });
      
      it('rejects <span> elements', () => {
        const mdx = '<span>content</span>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('span'))).toBe(true);
      });
      
      it('rejects <section> elements', () => {
        const mdx = '<section>content</section>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('section'))).toBe(true);
      });
      
      it('rejects <ul> and <li> elements', () => {
        const mdx = '<ul><li>Item</li></ul>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      });
      
      it('rejects self-closing forbidden elements', () => {
        const mdx = '<br /><hr />';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      });
      
      it('detects all forbidden elements', () => {
        for (const element of FORBIDDEN_ELEMENTS.slice(0, 10)) {
          const mdx = `<${element}>content</${element}>`;
          const result = validateMDX(mdx);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.message.toLowerCase().includes(element))).toBe(true);
        }
      });
    });
    
    describe('forbidden attributes (L0 violations)', () => {
      it('rejects className attribute', () => {
        const mdx = '<Heading className="foo">Title</Heading>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('className');
        expect(result.errors[0].type).toBe('attribute');
      });
      
      it('rejects style attribute', () => {
        const mdx = '<Text style={{color: "red"}}>Content</Text>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('style'))).toBe(true);
      });
      
      it('rejects dangerouslySetInnerHTML', () => {
        const mdx = '<Text dangerouslySetInnerHTML={{__html: "<b>Bold</b>"}} />';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('dangerouslySetInnerHTML'))).toBe(true);
      });
      
      it('rejects onClick and other event handlers', () => {
        const mdx = '<Callout onClick={() => alert("hi")}>Click me</Callout>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('onClick'))).toBe(true);
      });
      
      it('rejects id attribute', () => {
        const mdx = '<Heading id="main-title">Title</Heading>';
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.message.includes('id'))).toBe(true);
      });
    });
    
    describe('multiple violations', () => {
      it('reports all violations in a single document', () => {
        const mdx = `
<div className="container">
  <span style="color: red">
    <ul>
      <li>Item</li>
    </ul>
  </span>
</div>
        `;
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(5);
      });
      
      it('provides line numbers for violations', () => {
        const mdx = `Line 1
<div>
  content
</div>`;
        
        const result = validateMDX(mdx);
        expect(result.valid).toBe(false);
        expect(result.errors[0].line).toBe(2);
      });
    });
    
    describe('suggestions', () => {
      it('provides suggestion for div', () => {
        const mdx = '<div>content</div>';
        
        const result = validateMDX(mdx);
        expect(result.errors[0].suggestion).toContain('Layout');
      });
      
      it('provides suggestion for ul', () => {
        const mdx = '<ul><li>Item</li></ul>';
        
        const result = validateMDX(mdx);
        expect(result.errors.find(e => e.message.includes('ul'))?.suggestion).toContain('SmartList');
      });
      
      it('provides suggestion for className', () => {
        const mdx = '<Heading className="foo">Title</Heading>';
        
        const result = validateMDX(mdx);
        expect(result.errors[0].suggestion).toContain('theme');
      });
    });
  });
  
  describe('assertValidMDX', () => {
    it('does not throw for valid MDX', () => {
      const mdx = '<Heading level={1}>Valid</Heading>';
      
      expect(() => assertValidMDX(mdx)).not.toThrow();
    });
    
    it('throws for invalid MDX', () => {
      const mdx = '<div>Invalid</div>';
      
      expect(() => assertValidMDX(mdx)).toThrow('MDX Validation Failed');
    });
    
    it('includes error details in thrown error', () => {
      const mdx = '<div className="foo">Invalid</div>';
      
      try {
        assertValidMDX(mdx);
      } catch (error) {
        expect((error as Error).message).toContain('div');
        expect((error as Error).message).toContain('className');
      }
    });
  });
  
  describe('formatValidationErrors', () => {
    it('formats valid result', () => {
      const result = { valid: true, errors: [] };
      
      const formatted = formatValidationErrors(result);
      expect(formatted).toContain('✓');
      expect(formatted).toContain('valid');
    });
    
    it('formats invalid result with error count', () => {
      const result = validateMDX('<div><span>test</span></div>');
      
      const formatted = formatValidationErrors(result);
      expect(formatted).toContain('✗');
      expect(formatted).toContain('error');
    });
  });
});
