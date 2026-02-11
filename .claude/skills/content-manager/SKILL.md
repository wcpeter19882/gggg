---
name: content-manager
description: |
  Orchestrate slide generation pipeline: source → storyline → theme → layout → export.
  Use when: User asks to "generate slides", "create presentation", "make slides".
  Triggers: "generate slides", "create slides", "make presentation"
---

# Content Manager (Orchestrator)

You are the orchestrator for the slide generation pipeline.

## Project Directory Location

**All projects are stored in:**
- **Windows**: `%TEMP%/content-manager/` (e.g., `C:\Users\<user>\AppData\Local\Temp\content-manager\`)
- **Unix/Mac**: `/tmp/content-manager/`

Project folders are named `{source_name}_{hash}` (e.g., `golden_set_6c765a24`).

Full project path example: `%TEMP%/content-manager/golden_set_6c765a24/`

## Pipeline Overview

```
Source Document → Research → Storyline → Theme → Layout → Export
```

Each stage is handled by a specialized subagent.

**EXECUTION ORDER (MANDATORY):** Follow this exact sequence. Do NOT skip Research unless user explicitly opts out.

1. **Create Project** — Initialize project directory
2. **Research Topics** — Enrich with external data (DEFAULT ON)
3. **Select Theme** — Only if not pre-set
4. **Plan Storyline** — Generate draft slides
5. **Generate Layouts** — Apply visual layouts
6. **Export & Preview** — Render and open preview

## Renderer Selection (DEFAULT: Ant Design)

**By default, use Ant Design components:**
- Layout skill: `ant-paged-layout`
- Export skill: `ant-slides-export`
- Preview server: `http://localhost:3001/slides/{project_id}`

**Use original components ONLY if user explicitly requests:**
- "don't use ant design", "no antd", "use original components", "use custom components"
- Layout skill: `paged-layout-content`
- Export skill: `slides-export`
- Preview server: `http://localhost:3000/slides/{project_id}`

## Completion Requirement (CRITICAL)

When the user asks to "generate slides" / "produce a deck", you MUST run the pipeline end-to-end in the same turn:
- Create Project → Research → (Theme if needed) → Plan Storyline → Generate Layouts → Export & Preview
- If constitution.md specifies refinement rounds > 0, run the refinement loop (Validate → Fix → Re-export) until `status=="ok"` or rounds exhausted.

Do NOT pause after project creation or theme selection waiting for user confirmation unless the user explicitly requests a pause or a choice.

## CRITICAL RULES (DO NOT VIOLATE)

**DO NOT:**
- Read .tsx, .ts, .js, .jsx, .py files from src/, static/, or any solution code
- Use file_search, grep_search, or semantic_search tools - all paths are deterministic
- Search for component implementations
- Read files outside the project directory

**DO:**
- Use MCP tools (mcp_create-project, mcp_apply-patch, mcp_export-mdx) exclusively
- Reference skills by name (e.g., "Use the ant-paged-layout skill")
- Trust the skill instructions - they contain all component syntax needed

## Todo Management

Use the built-in `manage_todo_list` tool for tracking pipeline progress.

**Base todos (MANDATORY — include all 6 steps):**
```
manage_todo_list({
  todoList: [
    { id: 1, title: "Create Project", status: "not-started" },
    { id: 2, title: "Research Topics", status: "not-started" },
    { id: 3, title: "Select Theme", status: "not-started" },
    { id: 4, title: "Plan Storyline", status: "not-started" },
    { id: 5, title: "Generate Layouts", status: "not-started" },
    { id: 6, title: "Export & Preview", status: "not-started" }
  ]
})
```

**Skip conditions (mark as "completed" with reason, don't remove from list):**
- **Research**: Only if user says "no research", "internal only", or "confidential"
- **Theme**: If theme is pre-set in constitution or user specifies theme

**Refinement todos (added dynamically if validation finds errors):**

By default, `refinement_rounds = 0` (no auto-refinement after export). However, validation always runs as part of refinement. If errors are found and refinement is requested:
```
// Added when refinement is triggered:
{ id: 7, title: "Validate & Refine (R1)", status: "not-started" },
{ id: 8, title: "Re-export (R1)", status: "not-started" }

// If refinement_rounds = 2 or more issues remain:
{ id: 9, title: "Validate & Refine (R2)", status: "not-started" },
{ id: 10, title: "Re-export (R2)", status: "not-started" }
```

Update status as each step progresses: "not-started" → "in-progress" → "completed"

## Step 1: Create Project

Use the MCP tool:
```
mcp_create-project_create_project({
  "source_path": "{source_file_path}",
  "instruction": "{user_instruction}",
  "force": false
})
```

Note: Project name is derived from source filename. Set `force: true` to overwrite existing.

Returns:
```json
{
  "status": "success",
  "project_id": "golden_set_7a783fe4",
  "project_dir": "C:/Users/.../content-manager/golden_set_7a783fe4",
  "content_json": "C:/Users/.../content.json",
  "source_file": "C:/Users/.../files/golden_set.md"
}
```

Save `project_dir` for all subsequent steps.

## Project Files

Each project contains:
- `content.json` - Main data store (slides, metadata)
- `constitution.md` - User constraints and requirements (free-form markdown)
- `research.md` - Enriched content from research phase
- `files/` - Source files and optional template.pptx

### PowerPoint Template Support (Optional)

If user provides a `.pptx` template file, it will be copied to `{project_dir}/files/template.pptx`.

**When template.pptx exists:**
1. Theme step extracts colors and fonts from the PowerPoint
2. Layout instructions from PowerPoint are generated as `{theme_name}_layout.md`
3. Layout step uses extracted layout patterns instead of defaults
4. Export uses the extracted theme colors

**If no template.pptx:**
- Normal preset theme selection applies
- Default layout patterns are used

### constitution.md

Free-form markdown file containing user constraints that ALL subagents must respect.
Extract requirements by reading the markdown content. Common sections include:
- Target slides / slide count
- Content requirements - Must-include topics
- Content exclusions - Topics to avoid
- Style requirements - Style constraints
- Theme preference - If specified, use that theme name directly
- Refinement rounds - If > 0, run validation loop

**Example constitution.md:**
```markdown
# Presentation Requirements

## Target
- 10 slides total
- Professional tone

## Content Requirements
- Include market analysis
- Include competitive landscape

## Exclusions
- No technical deep-dives
- No pricing details

## Theme
Use "business" preset
```

### Available Preset Themes

Supported by the React renderer (ThemeSelector.tsx):
| Theme Name | Style | Best For |
|------------|-------|----------|
| `business` | Professional corporate style | Business presentations, executive briefings |
| `cyber` | Futuristic tech aesthetic | Tech demos, developer content |
| `minimal` | Clean, typography-focused | Reports, documentation |
| `academic` | Scholarly presentation | Research, educational content |
| `creative` | Bold artistic design | Creative presentations |
| `duolingo` | Playful, friendly style | Casual, educational |
| `dark` | Dark mode presentation | General dark mode |
| `teamsDark` | Microsoft Teams dark mode | Teams meetings |
| `teamsLight` | Microsoft Teams light mode | Teams meetings |

## Step 2: Research Topics (Subagent) — DEFAULT ON

**Research is ENABLED by default.** External validation strengthens claims with market data, industry trends, and citations that executives expect.

### When to SKIP Research (opt-out conditions)

Only skip research if user explicitly requests:
- "no external data", "no research", "internal only"
- "use only the source content", "don't search the web"
- "confidential" or "do not validate externally"

If skipped, mark todo 2 as "completed" with note: "Skipped per user request."

### Research Purpose

Research adds **external validation** to internal source content:
- Market statistics to quantify claims (e.g., "X% of enterprises cite privacy concerns")
- Industry trends to establish urgency (e.g., "NPU adoption growing Y% YoY")
- Competitor data to validate positioning
- Citations that build credibility with executive audiences

**Research does NOT replace source content** — it enriches it with supporting evidence.

### Invoke Research Subagent

```
runSubagent({
  description: "Research topics",
  prompt: `Use the research-agent skill.

Project directory: {project_dir}

Read source files from files/ directory and constitution from content.json.
Identify 3-5 key topics that need external validation or supporting data.
Perform web searches to find relevant statistics, trends, and citations.
Write organized research results to files/research.md.
Return a summary of findings and the path to research.md.`
})
```

The research output will be saved to `{project_dir}/files/research.md` and will be used by the storyline planner to enrich slides with external data.

## Step 3: Select Theme (Conditional)

**Theme Selection Logic:**

1. **Constitution has `theme` field** → Use that theme name directly

2. **User specifies preset name** (e.g., "use dark", "business theme") → Use that preset

3. **User specifies style keywords** → Map to preset:
   - "corporate", "professional" → `business`
   - "dark", "dark mode" → `dark` or `teamsDark`
   - "minimal", "clean" → `minimal`
   - "tech", "cyber", "futuristic" → `cyber`
   - "academic", "scholarly" → `academic`
   - "creative", "bold" → `creative`
   - "playful", "fun" → `duolingo`
   - "teams" → `teamsDark` or `teamsLight`

4. **No theme requirement** → Use `business` as default

Invoke the theme-generator subagent (only if needed):

```
runSubagent({
  description: "Select theme",
  prompt: `Use the theme-generator skill.

Project directory: {project_dir}
User instruction: {user_instruction}

Select from preset themes or generate a custom theme.
Save to content.json and return the theme name.`
})
```

## Step 4: Plan Storyline (Subagent)

Invoke the storyline-planner subagent:

```
runSubagent({
  description: "Plan storyline",
  prompt: `Use the storyline-planner skill.

Project directory: {project_dir}
User instruction: {user_instruction}

Read the source files and create draft slides using SCQA framework.
Include story, density, visual_design, and content fields for each slide.
Return a summary of planned slides.`
})
```

## Step 5: Generate Layouts (Subagent)

**Default: Use Ant Design layout skill.**

Invoke the ant-paged-layout subagent:

```
runSubagent({
  description: "Generate layouts",
  prompt: `Use the ant-paged-layout skill.

Project directory: {project_dir}

Generate Ant Design JSX content for each draft slide.
Use the slide's story, content, and visual_design fields to guide component selection.
Return a summary of generated layouts.`
})
```

**If user opted out of Ant Design**, use original skill:

```
runSubagent({
  description: "Generate layouts",
  prompt: `Use the paged-layout-content skill.

Project directory: {project_dir}

Generate MDX content for each draft slide.
Use the slide's story, content, and visual_design fields.
Return a summary of generated layouts.`
})
```

## Step 6: Export & Preview

**NOTE:** This step is ONLY export. Do NOT run validation here. Validation is Step 7 (Refinement).

**Default: Use Ant Design renderer.**

Use the MCP tool to export slides and start the preview server:
```
mcp_export-mdx_export_mdx({
  "project_dir": "{project_dir}",
  "start_server": true,
  "renderer": "antd"
})
```

Returns:
```json
{
  "status": "success",
  "output_file": "C:/Users/.../slides.jsx",
  "slide_count": 10,
  "project_id": "golden_set_7a783fe4",
  "server_url": "http://localhost:3001/slides/golden_set_7a783fe4",
  "renderer": "antd",
  "server_status": "started"
}
```

**If user opted out of Ant Design**, use original renderer:
```
mcp_export-mdx_export_mdx({
  "project_dir": "{project_dir}",
  "start_server": true,
  "renderer": "original"
})
```
- Server URL: `http://localhost:3000/slides/{project_id}`
- Output file: `slides.mdx`

After export, open the preview URL in Simple Browser using `open_simple_browser`.

### If terminal execution is unavailable

Some environments may not provide a terminal execution tool. If you cannot run the validator script in Step 7, you MUST:
- Still export and open preview
- Clearly state that automated validation/refinement could not be run due to tooling limits
- Offer the exact validator command for the user to run locally to populate `issues` and enable refinement

---

## Step 7: Refinement Loop (Validate → Fix → Re-export)

**This step is SEPARATE from Export (Step 6).** Do NOT run validation during export.

**Refinement is triggered ONLY when:**
1. Constitution.md specifies refinement rounds > 0, OR
2. User explicitly requests refinement (e.g., "refine the slides", "fix the issues")

**If neither condition is met, SKIP this step entirely.**

**Each refinement round:**
1. **Validate** - Run validator to identify issues
2. **Fix** - Run paged-layout subagent to fix slides with errors  
3. **Re-export** - Export the fixed slides

**If status == "ok" after validation, skip fix and exit loop early.**

### Refinement Subagent Calls

**Step 6a: Validate layouts**
```bash
python .claude/skills/validator/scripts/validate_layouts.py --project "{project_dir}"
```

Check the result:
- If `status == "ok"` → Done, no refinement needed
- If `status == "needs_refinement"` → Continue to fix

**Step 6b: Fix layouts (only if errors found)**

**Default: Use Ant Design skill for fixes.**
```
runSubagent({
  description: "Fix layouts",
  prompt: `Use the ant-paged-layout skill.

Project directory: {project_dir}
Refinement round: {current_round} of {max_rounds}

Read the issues section from content.json using mcp_apply-patch_read_section.
Fix the JSX for slides with errors.
Focus on: sparse_content, unbalanced_columns, empty_slot, content_overflow issues.
Return summary of fixes applied.`
})
```

**If user opted out of Ant Design:**
```
runSubagent({
  description: "Fix layouts",
  prompt: `Use the paged-layout-content skill.

Project directory: {project_dir}
Refinement round: {current_round} of {max_rounds}

Read the issues section from content.json using mcp_apply-patch_read_section.
Fix the MDX for slides with errors.
Focus on: sparse_content, unbalanced_columns, empty_slot, content_overflow issues.
Return summary of fixes applied.`
})
```

**Step 6c: Re-export**

Use the MCP tool to re-export (with same renderer as Step 6):
```
mcp_export-mdx_export_mdx({
  "project_dir": "{project_dir}",
  "start_server": true,
  "renderer": "antd"  // or "original" if opted out
})
```

### Refinement Loop Logic

```
max_rounds = refinement_rounds from constitution.md (default: 0)

If max_rounds > 0:
  For round in 1..max_rounds:
    1. Run validate_layouts.py
    2. If status == "ok": break (done)
    3. Run fix subagent (reads issues, updates MDX)
    4. Run re-export subagent
    5. If round < max_rounds: continue
```

## Step 8: Open Preview

After pipeline completes, open the browser:

**Default (Ant Design):**
```
http://localhost:3001/slides/{project_id}
```

**Original components (if opted out):**
```
http://localhost:3000/slides/{project_id}
```

## Context Scripts

Scripts in `.claude/skills/content-manager/scripts/`:

| Script | Purpose |
|--------|---------|
| `create_project.py` | Create project directory and init content.json, constitution.md |

Scripts in `.claude/skills/validator/scripts/`:

| Script | Purpose |
|--------|---------|
| `validate_layouts.py` | Run layout validation and save issues to content.json |

Tools in `.claude/tools/`:

| Tool | Purpose |
|------|---------|
| `mcp_apply_patch.py` | MCP server providing apply_patch and read_section tools |
| `apply_patch.py` | CLI fallback for applying JSON patches |

Export script in `.claude/skills/export/scripts/`:

| Script | Purpose |
|--------|---------|
| `export_mdx.py` | Export MDX and start server |

### Reading Data (MCP Tool - Preferred)

Use `mcp_apply-patch_read_section` to read any section:

```json
mcp_apply-patch_read_section({
  "project_dir": "{project_dir}",
  "section": "slides"
})
```

Available sections:
- `theme`, `slides`, `issues`, `story`, `constitution`, `metadata` - from content.json
- `source` - read all files from files/ directory
- `constitution_file` - read constitution.md file
- `todos_file` - read todos.md file  
- `all` - entire content.json

### apply_patch (MCP Tool)

The `apply-patch` MCP server provides two tools:

**mcp_apply-patch_apply_patch** - Apply JSON patch to content.json:
```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "slides",
  "data": {json_data},
  "patch_file": "{project_dir}/patches/slides.json"  // optional, for verbose mode
})
```

Targets: theme, slides, issues, story, constitution

### apply_patch.py (CLI Fallback)

Apply JSON patch to content.json. Check constitution.md for verbose mode:

**If verbose mode specified in constitution.md:**
```bash
python .claude/tools/apply_patch.py \
  --project "{project_dir}" \
  --target "slides" \
  --data '{json_data}' \
  --patch-file "{project_dir}/patches/slides.json"
```

**If verbose=false or not set:**
```bash
python .claude/tools/apply_patch.py \
  --project "{project_dir}" \
  --target "slides" \
  --data '{json_data}'
```

Targets: theme, slides, story, constitution

## Example Workflow

User: "Generate slides for golden_set.md"

1. Initialize todos with manage_todo_list (6 base todos)
2. Create project: `mcp_create-project_create_project` → mark todo 1 completed
3. Run research-agent subagent → saves research.md to files/ (update todo 2)
   - If user opts out ("no research") → mark todo 2 completed and skip
4. Check constitution for `theme` field:
   - If theme exists or not needed → mark todo 3 completed and skip
   - If theme needed → run theme-generator subagent (update todo 3)
5. Run storyline-planner subagent → reads source + research, creates 10 draft slides with SCQA (update todo 4)
6. Run ant-paged-layout subagent → 10 active slides with JSX (update todo 5)
7. Run mcp_export-mdx_export_mdx → slides.jsx exported, server started (update todo 6)
8. **Refinement loop** (if refinement_rounds > 0):
   - Run validate_layouts.py → check for issues
   - If status == "ok" → done
   - Run ant-paged-layout subagent with issues → fix slides
   - Run mcp_export-mdx_export_mdx → re-export
9. Open http://localhost:3001/slides/{project_id}

## Error Handling

- If subagent fails, verify skill name is correct
- If components not rendering, verify correct component names in output
- If server fails, check SLIDES_OUTPUT_PATH environment variable
- If validation fails repeatedly, check layout_validator.py for issue definitions
