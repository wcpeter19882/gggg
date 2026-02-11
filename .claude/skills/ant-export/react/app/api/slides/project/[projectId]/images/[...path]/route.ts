import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function getContentManagerPath(): string {
  if (process.env.CONTENT_MANAGER_PATH) return process.env.CONTENT_MANAGER_PATH;
  return path.join(os.tmpdir(), "content-manager");
}

// Serve images from project directory
// URL: /api/slides/project/{projectId}/images/{...path}
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; path: string[] } }
) {
  try {
    const { projectId, path: imagePath } = params;
    
    if (!projectId || !imagePath || imagePath.length === 0) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    
    const basePath = getContentManagerPath();
    const imageFile = path.join(basePath, projectId, "images", ...imagePath);
    
    // Security: ensure the path doesn't escape the project directory
    const normalizedPath = path.normalize(imageFile);
    const projectDir = path.join(basePath, projectId);
    if (!normalizedPath.startsWith(projectDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }
    
    if (!fs.existsSync(imageFile)) {
      return NextResponse.json({ error: "Image not found", path: imageFile }, { status: 404 });
    }
    
    // Read file and determine content type
    const buffer = fs.readFileSync(imageFile);
    const ext = path.extname(imageFile).toLowerCase();
    
    const contentTypeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    };
    
    const contentType = contentTypeMap[ext] || "application/octet-stream";
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
