import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function getContentManagerPath(): string {
  if (process.env.CONTENT_MANAGER_PATH) return process.env.CONTENT_MANAGER_PATH;
  return join(tmpdir(), 'content-manager');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; path: string[] } }
) {
  const { projectId, path } = params;
  
  // Construct the image path
  const imagePath = path.join('/');
  const basePath = getContentManagerPath();
  const projectDir = join(basePath, projectId);
  const fullPath = join(projectDir, 'images', imagePath);
  
  // Security check: ensure path doesn't escape project directory
  if (!fullPath.startsWith(projectDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  
  // Check if file exists
  if (!existsSync(fullPath)) {
    return NextResponse.json(
      { error: 'Image not found', path: fullPath },
      { status: 404 }
    );
  }
  
  try {
    const imageBuffer = readFileSync(fullPath);
    
    // Determine content type from extension
    const ext = '.' + imagePath.split('.').pop()?.toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error reading image:', error);
    return NextResponse.json(
      { error: 'Failed to read image' },
      { status: 500 }
    );
  }
}
