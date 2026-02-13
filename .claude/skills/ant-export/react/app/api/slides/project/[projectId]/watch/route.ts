import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function getContentManagerPath(): string {
  if (process.env.CONTENT_MANAGER_PATH) return process.env.CONTENT_MANAGER_PATH;
  return path.join(os.tmpdir(), "content-manager");
}

/**
 * SSE endpoint to watch content.json for changes
 * Client connects and receives "update" events when file changes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const projectDir = path.join(getContentManagerPath(), projectId);
  const contentJsonPath = path.join(projectDir, "content.json");

  // Check if file exists
  if (!fs.existsSync(contentJsonPath)) {
    return new Response("Project not found", { status: 404 });
  }

  // Get initial mtime for content.json
  let lastMtime = fs.statSync(contentJsonPath).mtimeMs;
  
  // Get initial state for theme files (.ts files in project dir)
  const getThemeFilesState = (): Map<string, number> => {
    const state = new Map<string, number>();
    try {
      const files = fs.readdirSync(projectDir);
      for (const file of files) {
        if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
          const filePath = path.join(projectDir, file);
          state.set(file, fs.statSync(filePath).mtimeMs);
        }
      }
    } catch { /* ignore */ }
    return state;
  };
  let lastThemeState = getThemeFilesState();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(`data: {"type":"connected","projectId":"${projectId}"}\n\n`);

      // Poll for file changes (fs.watch is unreliable on some systems)
      const interval = setInterval(() => {
        try {
          if (!fs.existsSync(contentJsonPath)) {
            controller.enqueue(`data: {"type":"deleted"}\n\n`);
            return;
          }

          let hasChanges = false;

          // Check content.json
          const currentMtime = fs.statSync(contentJsonPath).mtimeMs;
          if (currentMtime > lastMtime) {
            lastMtime = currentMtime;
            hasChanges = true;
          }
          
          // Check theme files (.ts)
          const currentThemeState = getThemeFilesState();
          if (currentThemeState.size !== lastThemeState.size) {
            hasChanges = true; // File added or removed
          } else {
            for (const [file, mtime] of currentThemeState) {
              if (lastThemeState.get(file) !== mtime) {
                hasChanges = true; // File modified
                break;
              }
            }
          }
          lastThemeState = currentThemeState;
          
          if (hasChanges) {
            controller.enqueue(`data: {"type":"update","mtime":${Date.now()}}\n\n`);
          }
        } catch (err) {
          // File might be locked during write, ignore
        }
      }, 1000); // Check every 1 second

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
