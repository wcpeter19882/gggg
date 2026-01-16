/**
 * API Route: /api/slides
 * 
 * Returns pre-serialized MDX slides from content.json
 * 
 * The project path is read from PROJECT_DIR environment variable
 * which is set by export_mdx.py when starting the server.
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { serialize } from 'next-mdx-remote/serialize';

/**
 * Get project path from PROJECT_DIR environment variable
 */
function getProjectPath(): string | null {
  return process.env.PROJECT_DIR || null;
}

interface Slide {
  mdx?: string;
  state?: string;
  story?: string;
}

interface ContentJson {
  slides?: Slide[];
  theme?: {
    id?: string;
  };
}

/**
 * Generate simple MDX from widgets when mdx field is missing
 */
function generateMdxFromWidgets(slide: Slide): string {
  const story = slide.story || 'Slide';
  const widgets = slide.widgets || {};
  
  // Build MDX content from widgets
  const widgetsMdx: string[] = [];
  for (const [slotId, widget] of Object.entries(widgets)) {
    const text = widget.parameters?.text || '';
    if (text) {
      widgetsMdx.push(`  <Text>${text}</Text>`);
    }
  }
  
  // Create simple slide MDX
  return `<Slide layout="center">
  <Title>${story}</Title>
${widgetsMdx.join('\n')}
</Slide>`;
}

/**
 * Fix MDX content to handle multi-line text inside JSX tags
 * MDX doesn't allow blank lines or markdown syntax inside JSX elements
 * This converts multi-line <Text> content to multiple <Text> elements
 */
function fixMdxContent(mdx: string): string {
  // Split multi-line <Text> content into separate <Text> elements
  // Match <Text>content with newlines</Text>
  let fixed = mdx;
  
  // Fix <Text> tags with multi-line content - split into separate Text elements
  fixed = fixed.replace(/<Text>([^]*?)<\/Text>/g, (match, content) => {
    // If content has blank lines, split into separate <Text> elements
    const trimmed = content.trim();
    if (trimmed.includes('\n\n')) {
      // Split by blank lines and create separate Text elements
      const parts = trimmed.split(/\n\n+/).filter((p: string) => p.trim());
      return parts.map((part: string) => {
        // Replace single newlines with spaces for clean text
        const cleanPart = part.trim().replace(/\n/g, ' ');
        return `<Text>${cleanPart}</Text>`;
      }).join('\n  ');
    }
    // Single newlines - just replace with space
    return `<Text>${trimmed.replace(/\n/g, ' ')}</Text>`;
  });
  
  return fixed;
}

export async function GET(request: Request) {
  try {
    // Get project path from PROJECT_DIR environment variable
    const projectPath = getProjectPath();
    
    if (!projectPath) {
      return NextResponse.json(
        { 
          error: 'PROJECT_DIR not set',
          hint: 'Start server with: PROJECT_DIR=/path/to/project npm run dev'
        },
        { status: 500 }
      );
    }
    
    // Read content.json from project directory
    const contentJsonPath = path.join(projectPath, 'content.json');
    
    let contentJson: ContentJson | null = null;
    
    try {
      if (fs.existsSync(contentJsonPath)) {
        const content = fs.readFileSync(contentJsonPath, 'utf-8');
        contentJson = JSON.parse(content);
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to read content.json', path: contentJsonPath },
        { status: 500 }
      );
    }
    
    if (!contentJson) {
      return NextResponse.json(
        { error: 'content.json not found', searched: contentJsonPath },
        { status: 404 }
      );
    }
    
    // Filter to only active slides
    const slides = (contentJson.slides || []).filter(s => s.state === 'active');
    
    // Build individual slide MDX content and serialize each
    const serializedSlides = [];
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // Use MDX content from content.json, or generate from widgets
      let mdxContent = slide.mdx || '';
      
      if (!mdxContent) {
        // Generate MDX from widgets if no mdx field
        mdxContent = generateMdxFromWidgets(slide);
        console.log(`Slide ${i + 1}: Generated MDX from widgets`);
      }
      
      // Fix multi-line text content that MDX doesn't support
      const fixedMdx = fixMdxContent(mdxContent);
      
      // Serialize the MDX content server-side
      try {
        const serialized = await serialize(fixedMdx, {
          mdxOptions: {
            development: process.env.NODE_ENV === 'development',
          },
        });
        serializedSlides.push({
          source: serialized,
          slideNumber: i + 1,
          mdx: fixedMdx,
        });
      } catch (serializeErr) {
        console.error(`Failed to serialize slide ${i + 1}:`, serializeErr);
        // Return error for this slide but continue with others
        serializedSlides.push({
          source: null,
          slideNumber: i + 1,
          mdx: fixedMdx,
          error: serializeErr instanceof Error ? serializeErr.message : 'Serialization failed',
        });
      }
    }
    
    return NextResponse.json({
      slides: serializedSlides,
      slideCount: slides.length,
      source: contentJsonPath,
      theme: contentJson.theme?.id || 'business',
    });
    
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
