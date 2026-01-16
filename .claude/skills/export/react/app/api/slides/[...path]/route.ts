/**
 * API Route: /api/slides/[...path]
 * 
 * Dynamic route that loads slides from output/$PATH/slides.mdx
 * Example: /api/slides/golden_set_slides -> output/golden_set_slides/slides.mdx
 * 
 * Serializes the entire MDX file once (not per-slide).
 * The MDX uses <Slide index={N}> wrappers for navigation.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { serialize } from 'next-mdx-remote/serialize';

// Workspace root (4 levels up from .claude/skills/export/react)
const WORKSPACE_ROOT = path.join(process.cwd(), '../../../../');

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
 * Count slides in MDX content by counting <Slide index={N}> tags
 */
function countSlides(mdx: string): number {
  const matches = mdx.match(/<Slide\s+index=\{(\d+)\}/g);
  return matches ? matches.length : 0;
}

/**
 * Extract theme from MDX meta export
 */
function extractTheme(mdx: string): string {
  const match = mdx.match(/theme:\s*["']([^"']+)["']/);
  return match ? match[1] : 'default';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct path from URL segments
    const outputPath = params.path.join('/');
    
    // Try multiple path patterns for slides.mdx
    const possiblePaths = [
      path.join(WORKSPACE_ROOT, 'output', outputPath, 'slides.mdx'),
      path.join(WORKSPACE_ROOT, outputPath, 'slides.mdx'),
      // Windows absolute fallbacks
      `C:/Users/yidansun/newProject/gggg/output/${outputPath}/slides.mdx`,
      `C:/Users/wangchao/repos/gggg/output/${outputPath}/slides.mdx`,
    ];
    
    let mdxContent: string | null = null;
    let foundPath = '';
    
    for (const mdxPath of possiblePaths) {
      try {
        if (fs.existsSync(mdxPath)) {
          mdxContent = fs.readFileSync(mdxPath, 'utf-8');
          foundPath = mdxPath;
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!mdxContent) {
      return NextResponse.json(
        { 
          error: `slides.mdx not found for path: ${outputPath}`, 
          searched: possiblePaths 
        },
        { status: 404 }
      );
    }
    
    // Fix and serialize the entire MDX content
    const fixedMdx = fixMdxContent(mdxContent);
    
    try {
      const source = await serialize(fixedMdx, {
        parseFrontmatter: false,
      });
      
      const slideCount = countSlides(mdxContent);
      const theme = extractTheme(mdxContent);
      
      return NextResponse.json({
        source,
        slideCount,
        theme,
        sourcePath: foundPath,
        path: outputPath,
      });
      
    } catch (serializeError) {
      return NextResponse.json({
        error: serializeError instanceof Error ? serializeError.message : String(serializeError),
        mdx: mdxContent.substring(0, 500) + '...',
        sourcePath: foundPath,
      }, { status: 500 });
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
