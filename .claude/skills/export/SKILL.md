---
name: slides-export
description: |
  Export slides to MDX format and start preview server.
  Use when: Rendering final slides for viewing.
  Triggers: "export slides", "preview", "render", "view slides"
---

# Slides Export

You are a subagent responsible for exporting slides to MDX and starting the preview server.

## CRITICAL RULES (DO NOT VIOLATE)

**DO NOT:**
- Read .tsx, .ts, .js, .jsx, .py files from src/, static/, or any solution code
- Use file_search, grep_search, or semantic_search tools - all paths are deterministic
- Search for renderer implementations or component code
- Read files outside the project directory except this SKILL file

**DO:**
- Use MCP tools (mcp_export-mdx_export_mdx, mcp_apply-patch_read_section) exclusively
- Trust the documentation here - it contains all export options needed

## Project Directory Location

**Project directories are located at:**
- **Windows**: `%TEMP%/content-manager/{project_id}/`
- **Unix/Mac**: `/tmp/content-manager/{project_id}/`

Example: `%TEMP%/content-manager/golden_set_6c765a24/`

## Your Task

Export active slides from content.json to slides.mdx and start the preview server.

## Step 0: Read Constitution

**ALWAYS read constitution first** - verify final output meets requirements.

Use the MCP tool:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

**Apply constitution rules during export:**
- Verify slide count matches target_slides (if set)
- Confirm no content_exclusions appear in final MDX
- Ensure content_requirements are covered

## Step 1: Export MDX

Use the MCP tool:
```
mcp_export-mdx_export_mdx({
  "project_dir": "{project_dir}",
  "start_server": true
})
```

This tool:
1. Reads active slides from content.json
2. Generates slides.mdx file
3. Starts Next.js preview server (if not already running)

## Step 2: Verify Export

The MCP tool returns:
```json
{
  "status": "success",
  "mdx_file": "path/to/slides.mdx",
  "slide_count": 10,
  "chars": 5000,
  "project_id": "golden_set_8fd4f96a",
  "theme": "business",
  "server_url": "http://localhost:3000/slides/golden_set_8fd4f96a",
  "server_status": "started"
}
```

## URL Structure

The server uses project-based URLs:

- **All Projects**: `http://localhost:3000/slides/` - Lists all available projects
- **Specific Project**: `http://localhost:3000/slides/{projectId}/` - View slides for a project

Project ID is the folder name under the content-manager path (e.g., `golden_set_8fd4f96a`).

## Step 3: Open Browser

After export completes, open the preview URL with the project ID:
```
http://localhost:3000/slides/{project_id}
```

## Server Configuration

The React MDX renderer is located at:
```
.claude/skills/export/react/
```

Server uses `CONTENT_MANAGER_PATH` environment variable:
- Default: `$TEMP/content-manager/` (Windows) or `/tmp/content-manager/` (Unix)
- Contains all project folders

Each project folder contains:
- `content.json` - Slides data with MDX content
- `slides.mdx` - Generated MDX file (for reference)

## Troubleshooting

### "Component not defined" errors
- Check that MDX uses correct component names:
  - `<Left>` and `<Right>` for LayoutSplit (NOT `<Column>`)
  - `<LayoutFullBleed>` (NOT `<LayoutFocus>`)
  - `<Header>`, `<Main>`, `<Sidebar>` for LayoutDashboard
  - `<MetricStrip>` for inline metric rows

### Server not starting
- Check if port 3000 is in use: `Get-Process -Name node`
- Kill existing processes: `Get-Process -Name node | Stop-Process -Force`
- Restart server with correct env var

### Slides not loading
- Verify `CONTENT_MANAGER_PATH` points to correct folder
- Check that `content.json` has slides with `state: "active"` and `mdx` field
- Try accessing `/api/slides/projects` to list available projects

### Project not found
- Check that project folder exists in the content-manager path
- Verify project ID in URL matches folder name exactly

## Example Output

After export, return:
```
Exported 10 slides to MDX
- File: C:\...\slides.mdx (5044 chars)
- Server: http://localhost:3000/slides/golden_set_8fd4f96a
- PID: 12345
```
