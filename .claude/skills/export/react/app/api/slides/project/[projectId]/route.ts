/**
 * API Route: /api/slides/project/[projectId]
 * 
 * Returns pre-serialized MDX slides from content.json for a specific project.
 * 
 * The base path is read from CONTENT_MANAGER_PATH environment variable.
 * Default: $TEMP/content-manager/ (Windows) or /tmp/content-manager/ (Unix)
 * 
 * Project content is at: $CONTENT_MANAGER_PATH/{projectId}/content.json
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { serialize } from 'next-mdx-remote/serialize';

/**
 * Get the content-manager base path
 * Priority:
 * 1. CONTENT_MANAGER_PATH env var
 * 2. Default temp folder location
 */
function getContentManagerPath(): string {
  if (process.env.CONTENT_MANAGER_PATH) {
    return process.env.CONTENT_MANAGER_PATH;
  }
  
  // Default to temp folder
  const tempDir = os.tmpdir();
  return path.join(tempDir, 'content-manager');
}

interface Slide {
  id?: string;
  mdx?: string;
  state?: string;
  story?: string;
  widgets?: Record<string, { parameters?: { text?: string } }>;
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
  for (const [, widget] of Object.entries(widgets)) {
    const text = widget.parameters?.text || '';
    if (text) {
      widgetsMdx.push(`  <Text>${text}</Text>`);
    }
  }
  
  // Create simple slide MDX
  return `<LayoutStacked>
  <Heading level={1}>${story}</Heading>
${widgetsMdx.join('\n')}
</LayoutStacked>`;
}

/**
 * Fix MDX content to handle multi-line text inside JSX tags
 * MDX doesn't allow blank lines or markdown syntax inside JSX elements
 */
function fixMdxContent(mdx: string): string {
  let fixed = mdx;
  
  // Fix <Text> tags with multi-line content - split into separate Text elements
  fixed = fixed.replace(/<Text>([^]*?)<\/Text>/g, (match, content) => {
    const trimmed = content.trim();
    if (trimmed.includes('\n\n')) {
      const parts = trimmed.split(/\n\n+/).filter((p: string) => p.trim());
      return parts.map((part: string) => {
        const cleanPart = part.trim().replace(/\n/g, ' ');
        return `<Text>${cleanPart}</Text>`;
      }).join('\n  ');
    }
    return `<Text>${trimmed.replace(/\n/g, ' ')}</Text>`;
  });
  
  return fixed;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Get base path and construct project path
    const basePath = getContentManagerPath();
    const projectPath = path.join(basePath, projectId);
    const contentJsonPath = path.join(projectPath, 'content.json');
    
    // Check if project exists
    if (!fs.existsSync(projectPath)) {
      // List available projects for debugging
      let availableProjects: string[] = [];
      try {
        if (fs.existsSync(basePath)) {
          availableProjects = fs.readdirSync(basePath)
            .filter(f => fs.statSync(path.join(basePath, f)).isDirectory());
        }
      } catch {
        // Ignore errors listing projects
      }
      
      return NextResponse.json(
        { 
          error: `Project not found: ${projectId}`,
          basePath,
          projectPath,
          availableProjects: availableProjects.slice(0, 10),
          hint: 'Check if the project ID is correct'
        },
        { status: 404 }
      );
    }
    
    // Read content.json
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
        { error: 'content.json not found', path: contentJsonPath },
        { status: 404 }
      );
    }
    
    // Filter to only active slides
    const slides = (contentJson.slides || []).filter(s => s.state === 'active');
    
    if (slides.length === 0) {
      return NextResponse.json(
        { error: 'No active slides found', path: contentJsonPath },
        { status: 404 }
      );
    }
    
    // Build and serialize each slide's MDX
    const serializedSlides = [];
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // Use MDX content from content.json, or generate from widgets
      let mdxContent = slide.mdx || '';
      
      if (!mdxContent) {
        mdxContent = generateMdxFromWidgets(slide);
        console.log(`[${projectId}] Slide ${i + 1}: Generated MDX from widgets`);
      }
      
      // Fix multi-line text content
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
        console.error(`[${projectId}] Failed to serialize slide ${i + 1}:`, serializeErr);
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
      projectId,
      basePath,
    });
    
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
