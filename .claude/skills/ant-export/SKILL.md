---
name: ant-slides-export
description: |
  Export Ant Design slides to JSX format and start preview server.
  Use when: Rendering final slides using Ant Design components.
  Triggers: "export ant slides", "ant preview", "render ant", "view ant slides"
---

# Ant Design Slides Export

You are a subagent responsible for exporting Ant Design slides to JSX and starting the preview server.

**Note:** This skill is for *exporting and previewing* slides. For *generating* slide JSX content, see `ant-paged-layout` skill.

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

---

## Workflow

### Input

Read constitution to verify final output requirements:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

**Apply constitution rules during export:**
- Verify slide count matches target_slides (if set)
- Confirm no content_exclusions appear in final JSX
- Ensure content_requirements are covered

### Output

Export slides and start preview server:
```
mcp_export-mdx_export_mdx({
  project_dir: "{project_dir}",
  start_server: true
})
```

This tool:
1. Reads active slides from content.json
2. Generates slides.jsx file (Ant Design JSX)
3. Starts Next.js preview server on port 3001

The tool returns:
```json
{
  "status": "success",
  "jsx_file": "path/to/slides.jsx",
  "slide_count": 10,
  "chars": 5000,
  "project_id": "golden_set_8fd4f96a",
  "theme": "teamsDark",
  "server_url": "http://localhost:3001/slides/golden_set_8fd4f96a",
  "server_status": "started"
}
```

After export, open the preview URL:
```
http://localhost:3001/slides/{project_id}
```

### Summary

After export, return:
```
Exported N slides using Ant Design renderer
- File: {jsx_file} (N chars)
- Server: {server_url}
- Theme: {theme}
```

---

## URL Structure

The server uses project-based URLs (port 3001 to avoid conflict with main renderer):

- **All Projects**: `http://localhost:3001/slides/` - Lists all available projects
- **Specific Project**: `http://localhost:3001/slides/{projectId}/` - View slides

Project ID is the folder name under the content-manager path (e.g., `golden_set_8fd4f96a`).

## Server Configuration

The Ant Design React renderer is located at:
```
.claude/skills/ant-export/react/
```

Server uses `CONTENT_MANAGER_PATH` environment variable:
- Default: `$TEMP/content-manager/` (Windows) or `/tmp/content-manager/` (Unix)
- Contains all project folders

Each project folder contains:
- `content.json` - Slides data with Ant Design JSX content
- `slides.jsx` - Generated JSX file (for reference)

## Troubleshooting

### Server not starting
- Check if port 3001 is in use: `Get-Process -Name node`
- Kill existing processes: `Get-Process -Name node | Stop-Process -Force`
- Restart server with correct env var

### Slides not loading
- Verify `CONTENT_MANAGER_PATH` points to correct folder
- Check that `content.json` has slides with `state: "active"` and `mdx` field
- Try accessing `/api/slides/projects` to list available projects

### Project not found
- Check that project folder exists in the content-manager path
- Verify project ID in URL matches folder name exactly
