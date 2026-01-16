/**
 * API Route: /api/slides/projects
 * 
 * Lists all available projects in the content-manager folder.
 * Returns project metadata including slide count and theme.
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Get the content-manager base path
 */
function getContentManagerPath(): string {
  if (process.env.CONTENT_MANAGER_PATH) {
    return process.env.CONTENT_MANAGER_PATH;
  }
  
  // Default to temp folder
  const tempDir = os.tmpdir();
  return path.join(tempDir, 'content-manager');
}

interface ProjectInfo {
  id: string;
  name: string;
  slideCount?: number;
  theme?: string;
}

export async function GET() {
  try {
    const basePath = getContentManagerPath();
    
    // Check if base path exists
    if (!fs.existsSync(basePath)) {
      return NextResponse.json({
        projects: [],
        basePath,
        message: 'Content manager folder does not exist yet'
      });
    }
    
    // List all directories in the content-manager folder
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    const projects: ProjectInfo[] = [];
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const projectPath = path.join(basePath, entry.name);
      const contentJsonPath = path.join(projectPath, 'content.json');
      
      // Check if this is a valid project (has content.json)
      if (!fs.existsSync(contentJsonPath)) continue;
      
      try {
        const content = fs.readFileSync(contentJsonPath, 'utf-8');
        const contentJson = JSON.parse(content);
        
        // Count active slides
        const activeSlides = (contentJson.slides || []).filter(
          (s: { state?: string }) => s.state === 'active'
        );
        
        // Extract project name from folder name (remove hash suffix)
        const nameParts = entry.name.split('_');
        const name = nameParts.length > 1 
          ? nameParts.slice(0, -1).join('_').replace(/_/g, ' ')
          : entry.name;
        
        projects.push({
          id: entry.name,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          slideCount: activeSlides.length,
          theme: contentJson.theme?.id || 'default',
        });
      } catch {
        // Skip invalid projects
        projects.push({
          id: entry.name,
          name: entry.name,
        });
      }
    }
    
    // Sort by most recent (assuming hash suffix changes)
    projects.sort((a, b) => b.id.localeCompare(a.id));
    
    return NextResponse.json({
      projects,
      basePath,
    });
    
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
