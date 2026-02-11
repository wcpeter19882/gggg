import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function getContentManagerPath(): string {
  if (process.env.CONTENT_MANAGER_PATH) return process.env.CONTENT_MANAGER_PATH;
  return path.join(os.tmpdir(), "content-manager");
}

interface Slide { id?: string; mdx?: string; layout?: string; state?: string; story?: string; rank?: number; intent?: string; density?: string; }

interface PipelineStatus {
  phase: "storyline" | "layout" | "complete" | "unknown";
  totalSlides: number;
  slidesWithMdx: number;
  slidesWithStory: number;
}

// Theme definition interface (matches themes/*.ts structure)
interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt?: string;
  primary: string;
  secondary?: string;
  accent?: string;
  text: string;
  textMuted: string;
  border?: string;
  info?: string;
  success?: string;
  warning?: string;
  danger?: string;
  accent1?: string;
  accent2?: string;
  accent3?: string;
  accent4?: string;
  accent5?: string;
  accent6?: string;
}

interface ThemeTypography {
  fontDisplay: string;
  fontBody: string;
  fontMono?: string;
  sizeDisplay: string;
  sizeHeading: string;
  sizeBody: string;
  sizeCaption: string;
  lineHeight?: string;
  letterSpacing?: string;
}

interface ThemeVisuals {
  radius?: { sm?: string; md?: string; lg?: string; xl?: string; full?: string };
  shadow?: { sm?: string; md?: string; lg?: string; none?: string };
  borderWidth?: string;
}

interface ThemeDefinition {
  name: string;
  displayName: string;
  isDark: boolean;
  background?: { color: string; image?: string };
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing?: { gap?: string; padding?: string; margin?: string };
  visuals?: ThemeVisuals;
}

interface ContentJson { 
  slides?: Slide[]; 
  theme?: { id?: string }; // Only theme ID reference, full theme comes from .ts file
  story?: { title?: string; subtitle?: string; author?: string; date?: string }; // Story metadata
}

/**
 * Parse a TypeScript theme file and extract the theme object
 * This is a simple parser that extracts the exported theme object
 */
function parseThemeFile(filePath: string): ThemeDefinition | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Extract the theme object using regex
    // Matches: export const xxxTheme: ThemeDefinition = { ... }
    const themeMatch = content.match(/export\s+const\s+(\w+)Theme[^=]*=\s*(\{[\s\S]*?\n\};)/);
    if (!themeMatch) return null;
    
    // Parse the object literal (simplified - handles common cases)
    let objStr = themeMatch[2];
    
    // Remove trailing semicolon
    objStr = objStr.replace(/;\s*$/, '');
    
    // Remove TypeScript comments first (before any string processing)
    objStr = objStr.replace(/\/\/.*$/gm, '');
    objStr = objStr.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Handle trailing commas (not valid JSON)
    objStr = objStr.replace(/,(\s*[}\]])/g, '$1');
    
    // Quote unquoted property keys (JavaScript allows unquoted keys, JSON doesn't)
    // Matches: key: at start of line or after { or ,
    objStr = objStr.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    
    // For string values using single quotes, convert to double quotes
    // Match: ': 'value',' or ': 'value'}' patterns (simple single-quoted strings)
    objStr = objStr.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    // Parse as JSON
    const theme = JSON.parse(objStr) as ThemeDefinition;
    return theme;
  } catch (error) {
    console.error(`Failed to parse theme file ${filePath}:`, error);
    return null;
  }
}

/**
 * Find and load theme files from project directory
 * Returns a map of theme name -> theme definition
 */
function loadProjectThemes(projectPath: string): Map<string, ThemeDefinition> {
  const themes = new Map<string, ThemeDefinition>();
  
  try {
    const files = fs.readdirSync(projectPath);
    for (const file of files) {
      if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        const filePath = path.join(projectPath, file);
        const theme = parseThemeFile(filePath);
        if (theme) {
          themes.set(theme.name, theme);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to load project themes from ${projectPath}:`, error);
  }
  
  return themes;
}

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params;
    if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    const basePath = getContentManagerPath();
    const projectPath = path.join(basePath, projectId);
    const contentJsonPath = path.join(projectPath, "content.json");
    if (!fs.existsSync(contentJsonPath)) return NextResponse.json({ error: "content.json not found", path: contentJsonPath }, { status: 404 });
    const content: ContentJson = JSON.parse(fs.readFileSync(contentJsonPath, "utf-8"));
    let slidesData = content.slides || [];
    if (!Array.isArray(slidesData)) slidesData = (slidesData as any).slides || [];
    // Include active and draft slides (draft = being regenerated)
    const displaySlides = slidesData.filter(s => s.state === "active" || s.state === "draft").sort((a, b) => (a.rank || 0) - (b.rank || 0));
    
    // Calculate pipeline status
    const slidesWithMdx = displaySlides.filter(s => (s.mdx || s.layout || "").trim().length > 0).length;
    const slidesWithStory = displaySlides.filter(s => (s.story || "").trim().length > 0).length;
    const slidesDraft = displaySlides.filter(s => s.state === "draft").length;
    const totalSlides = displaySlides.length;
    
    let phase: PipelineStatus["phase"] = "unknown";
    if (totalSlides === 0) {
      phase = "storyline"; // Still generating storyline
    } else if (slidesWithMdx === 0) {
      phase = "storyline"; // Have slides but no MDX yet
    } else if (slidesDraft > 0) {
      phase = "layout"; // Some slides being regenerated
    } else if (slidesWithMdx < totalSlides) {
      phase = "layout"; // Some MDX generated, still in progress
    } else {
      phase = "complete"; // All slides have MDX
    }
    
    const pipelineStatus: PipelineStatus = { phase, totalSlides, slidesWithMdx, slidesWithStory };
    
    // Return story metadata even if no slides with MDX yet
    if (displaySlides.length === 0) {
      return NextResponse.json({ 
        error: "No active slides", 
        pipelineStatus,
        storyMeta: content.story,
        projectId 
      }, { status: 200 }); // Return 200 so client can show progress
    }
    const slides = displaySlides.map((s, i) => ({ 
      slideNumber: i + 1, 
      id: s.id, 
      jsx: s.mdx || s.layout || "", 
      story: s.story || "",
      intent: s.intent || "",
      density: s.density || "",
      state: s.state || "active"
    }));
    
    // Load project-specific themes from .ts files in project directory
    const projectThemes = loadProjectThemes(projectPath);
    
    // Get theme ID from content.json (just the reference)
    const themeId = content.theme?.id || "businessLight";
    
    // Check if we have a project-specific theme for this ID
    const projectTheme = projectThemes.get(themeId);
    
    // Convert all project themes to client-friendly format
    const allProjectThemes: Record<string, any> = {};
    projectThemes.forEach((theme, themeName) => {
      allProjectThemes[themeName] = {
        id: theme.name,
        name: theme.displayName,
        isDark: theme.isDark,
        colors: theme.colors,
        fonts: {
          display: theme.typography.fontDisplay,
          body: theme.typography.fontBody,
          mono: theme.typography.fontMono,
        },
        typography: {
          sizeDisplay: theme.typography.sizeDisplay,
          sizeHeading: theme.typography.sizeHeading,
          sizeBody: theme.typography.sizeBody,
          sizeCaption: theme.typography.sizeCaption,
          lineHeight: theme.typography.lineHeight,
        },
        background: theme.background,
        visuals: theme.visuals,
      };
    });
    
    return NextResponse.json({ 
      slides, 
      slideCount: slides.length, 
      theme: themeId, 
      projectId,
      pipelineStatus,
      storyMeta: content.story,
      // Include the full theme definition if found in project directory
      customTheme: projectTheme ? {
        id: projectTheme.name,
        name: projectTheme.displayName,
        isDark: projectTheme.isDark,
        colors: projectTheme.colors,
        fonts: {
          display: projectTheme.typography.fontDisplay,
          body: projectTheme.typography.fontBody,
          mono: projectTheme.typography.fontMono,
        },
        typography: {
          sizeDisplay: projectTheme.typography.sizeDisplay,
          sizeHeading: projectTheme.typography.sizeHeading,
          sizeBody: projectTheme.typography.sizeBody,
          sizeCaption: projectTheme.typography.sizeCaption,
          lineHeight: projectTheme.typography.lineHeight,
        },
        background: projectTheme.background,
        visuals: projectTheme.visuals,
      } : undefined,
      // List all available project themes
      availableThemes: Array.from(projectThemes.keys()),
      // Full data for all project themes (for client-side switching)
      projectThemes: allProjectThemes,
    });
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