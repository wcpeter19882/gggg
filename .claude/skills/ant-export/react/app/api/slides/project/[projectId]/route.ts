import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function getContentManagerPath(): string {
  if (process.env.CONTENT_MANAGER_PATH) return process.env.CONTENT_MANAGER_PATH;
  return path.join(os.tmpdir(), "content-manager");
}

interface Slide { id?: string; mdx?: string; layout?: string; state?: string; story?: string; rank?: number; }
interface ContentJson { slides?: Slide[]; theme?: { id?: string }; }

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    const basePath = getContentManagerPath();
    const contentJsonPath = path.join(basePath, projectId, "content.json");
    if (!fs.existsSync(contentJsonPath)) return NextResponse.json({ error: "content.json not found", path: contentJsonPath }, { status: 404 });
    const content: ContentJson = JSON.parse(fs.readFileSync(contentJsonPath, "utf-8"));
    let slidesData = content.slides || [];
    if (!Array.isArray(slidesData)) slidesData = (slidesData as any).slides || [];
    const activeSlides = slidesData.filter(s => s.state === "active").sort((a, b) => (a.rank || 0) - (b.rank || 0));
    if (activeSlides.length === 0) return NextResponse.json({ error: "No active slides" }, { status: 404 });
    const slides = activeSlides.map((s, i) => ({ slideNumber: i + 1, id: s.id, jsx: s.mdx || s.layout || "", story: s.story || "" }));
    return NextResponse.json({ slides, slideCount: slides.length, theme: content.theme?.id || "businessLight", projectId });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 500 }); }
}

// PUT: Update a slide's JSX in content.json
export async function PUT(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    
    const body = await request.json();
    const { slideId, jsx } = body;
    
    if (!slideId) return NextResponse.json({ error: "Slide ID required" }, { status: 400 });
    if (typeof jsx !== "string") return NextResponse.json({ error: "JSX content required" }, { status: 400 });
    
    const basePath = getContentManagerPath();
    const contentJsonPath = path.join(basePath, projectId, "content.json");
    
    if (!fs.existsSync(contentJsonPath)) {
      return NextResponse.json({ error: "content.json not found", path: contentJsonPath }, { status: 404 });
    }
    
    const content = JSON.parse(fs.readFileSync(contentJsonPath, "utf-8"));
    let slidesData = content.slides || [];
    if (!Array.isArray(slidesData)) slidesData = (slidesData as any).slides || [];
    
    // Find and update the slide
    const slideIndex = slidesData.findIndex((s: Slide) => s.id === slideId);
    if (slideIndex === -1) {
      return NextResponse.json({ error: `Slide not found: ${slideId}` }, { status: 404 });
    }
    
    // Update the mdx field (primary JSX storage)
    slidesData[slideIndex].mdx = jsx;
    
    // Write back to content.json
    content.slides = slidesData;
    fs.writeFileSync(contentJsonPath, JSON.stringify(content, null, 2), "utf-8");
    
    return NextResponse.json({ 
      success: true, 
      slideId, 
      message: `Updated slide ${slideId} in content.json` 
    });
  } catch (error) { 
    return NextResponse.json({ error: String(error) }, { status: 500 }); 
  }
}