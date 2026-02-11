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

  // Get initial mtime
  let lastMtime = fs.statSync(contentJsonPath).mtimeMs;

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

          const currentMtime = fs.statSync(contentJsonPath).mtimeMs;
          if (currentMtime > lastMtime) {
            lastMtime = currentMtime;
            controller.enqueue(`data: {"type":"update","mtime":${currentMtime}}\n\n`);
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
