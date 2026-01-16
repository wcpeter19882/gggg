/**
 * API Route: /api/slides/[...path]
 * 
 * Dynamic route that loads slides from output/$PATH/state.json
 * Example: /api/slides/golden_set_mdx -> output/golden_set_mdx/state.json
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { serialize } from 'next-mdx-remote/serialize';
import he from 'he';

// Workspace root (4 levels up from src/paged/render/react)
const WORKSPACE_ROOT = path.join(process.cwd(), '../../../../');

interface Slide {
  mdx?: string;
}

interface StateJson {
  slides?: Slide[];
  presentation?: {
    theme?: string;
    title?: string;
  };
}

/**
 * Fix MDX content to handle multi-line text inside JSX tags
 */
function fixMdxContent(mdx: string): string {
  let fixed = mdx;
  
  // Fix <Text> tags with multi-line content
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

/**
 * Decode HTML entities in MDX content.
 */
function decodeHtmlEntities(mdx: string): string {
  return he.decode(mdx);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct path from URL segments
    const outputPath = params.path.join('/');
    
    // Try multiple path patterns
    const possiblePaths = [
      path.join(WORKSPACE_ROOT, 'output', outputPath, 'state.json'),
      path.join(WORKSPACE_ROOT, outputPath, 'state.json'),
      // Windows absolute fallbacks
      `C:/Users/yidansun/newProject/gggg/output/${outputPath}/state.json`,
      `C:/Users/wangchao/repos/gggg/output/${outputPath}/state.json`,
    ];
    
    let stateJson: StateJson | null = null;
    let foundPath = '';
    
    for (const statePath of possiblePaths) {
      try {
        if (fs.existsSync(statePath)) {
          const content = fs.readFileSync(statePath, 'utf-8');
          stateJson = JSON.parse(content);
          foundPath = statePath;
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!stateJson) {
      return NextResponse.json(
        { 
          error: `state.json not found for path: ${outputPath}`, 
          searched: possiblePaths 
        },
        { status: 404 }
      );
    }
    
    const slides = stateJson.slides || [];
    
    // Serialize each slide's MDX
    const serializedSlides = [];
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      if (!slide.mdx) {
        serializedSlides.push({
          source: null,
          slideNumber: i + 1,
          error: 'No MDX content for this slide'
        });
        continue;
      }
      
      try {
        const fixedMdx = fixMdxContent(decodeHtmlEntities(slide.mdx));
        const source = await serialize(fixedMdx, {
          parseFrontmatter: false,
        });
        
        serializedSlides.push({
          source,
          slideNumber: i + 1,
        });
      } catch (error) {
        serializedSlides.push({
          source: null,
          slideNumber: i + 1,
          mdx: slide.mdx,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      slides: serializedSlides,
      slideCount: serializedSlides.length,
      source: foundPath,
      theme: stateJson.presentation?.theme || 'default',
      path: outputPath,
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
