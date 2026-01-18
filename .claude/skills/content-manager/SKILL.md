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
Source Document → Storyline → Theme → Layout → Export
```

Each stage is handled by a specialized subagent.

## Todo Management

Use the built-in `manage_todo_list` tool for tracking pipeline progress.

**Base todos:**
```
manage_todo_list({
  todoList: [
    { id: 1, title: "Create Project", status: "not-started" },
    { id: 2, title: "Select Theme (if needed)", status: "not-started" },
    { id: 3, title: "Plan Storyline", status: "not-started" },
    { id: 4, title: "Generate Layouts", status: "not-started" },
    { id: 5, title: "Export & Preview", status: "not-started" }
  ]
})
```

**Note:** If theme is pre-set in constitution or not needed, mark todo 2 as "completed" and skip the theme subagent.

**Refinement todos (added dynamically if validation finds errors):**

By default, `refinement_rounds = 0` (no auto-refinement after export). However, validation always runs as part of refinement. If errors are found and refinement is requested:
```
// Added when refinement is triggered:
{ id: 6, title: "Validate & Refine (R1)", status: "not-started" },
{ id: 7, title: "Re-export (R1)", status: "not-started" }

// If refinement_rounds = 2 or more issues remain:
{ id: 8, title: "Validate & Refine (R2)", status: "not-started" },
{ id: 9, title: "Re-export (R2)", status: "not-started" }
```

Update status as each step progresses: "not-started" → "in-progress" → "completed"

## Step 1: Create Project

```bash
python .claude/skills/content-manager/scripts/create_project.py \
  --source "{source_file_path}" \
  --instruction "{user_instruction}"
```

Note: Project name is derived from source filename. Use `--force` to overwrite existing.

Returns:
```json
{
  "project_id": "golden_set_7a783fe4",
  "project_dir": "C:/Users/.../content-manager/golden_set_7a783fe4",
  "content_json": "C:/Users/.../content.json"
}
```

Save `project_dir` for all subsequent steps.

## Project Files

Each project contains:
- `content.json` - Main data store (theme, slides)
- `constitution.md` - User constraints and requirements

### constitution.md

Contains user constraints that ALL subagents must respect:
- `target_slides` - Target number of slides
- `content_requirements` - Must-include topics
- `content_exclusions` - Topics to avoid
- `style_requirements` - Style constraints
- `theme` - (Optional) Pre-selected theme name from preset list. If set, load directly without generation.
- `verbose` - If true, save intermediate outputs to files

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

## Step 2: Select Theme (Conditional)

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
  prompt: `You are a theme selection subagent.

Read the SKILL file at .claude/skills/theme/SKILL.md for complete instructions.

Project directory: {project_dir}
User instruction: {user_instruction}

Select from preset themes or generate a custom theme.
Save to content.json and return the theme name.`
})
```

## Step 3: Plan Storyline (Subagent)

Invoke the storyline-planner subagent:

```
runSubagent({
  description: "Plan storyline",
  prompt: `You are a storyline planning subagent.

Read the SKILL file at .claude/skills/storyline/SKILL.md for complete instructions.

Project directory: {project_dir}
User instruction: {user_instruction}

Read the source files in {project_dir}/files/ and create draft slides using SCQA framework.
Include story, density, visual_design, and content fields for each slide.
Return a summary of planned slides.`
})
```

## Step 4: Generate Layouts (Subagent)

Invoke the paged-layout subagent:

```
runSubagent({
  description: "Generate layouts",
  prompt: `You are a layout generation subagent.

Read the SKILL file at .claude/skills/paged-layout/SKILL.md for complete instructions.

Project directory: {project_dir}

Generate MDX content for each draft slide.
Use the slide's story, content, and visual_design fields to generate MDX.
Follow the visual_design field exactly.
Use correct component names: <Left>/<Right> for LayoutSplit, <LayoutFullBleed> not LayoutFocus.
Return a summary of generated layouts.`
})
```

## Step 5: Export & Preview (Subagent)

Invoke the export subagent:

```
runSubagent({
  description: "Export slides",
  prompt: `You are an export subagent.

Read the SKILL file at .claude/skills/export/SKILL.md for complete instructions.

Project directory: {project_dir}

Export slides to MDX and start the preview server.
Return the preview URL.`
})
```

After export, open the preview in Simple Browser.

---

## Step 6: Refinement Loop (Validate → Fix → Re-export)

**Refinement is triggered when:**
1. `constitution.refinement_rounds > 0`, OR
2. User explicitly requests refinement (e.g., "refine the slides", "fix the issues")

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
```
runSubagent({
  description: "Fix layouts",
  prompt: `You are a layout refinement subagent.

Read the SKILL file at .claude/skills/paged-layout/SKILL.md for complete instructions.

Project directory: {project_dir}
Refinement round: {current_round} of {max_rounds}

Read the issues section from content.json using mcp_apply-patch_read_section.
Fix the MDX for slides with errors.
Focus on: sparse_content, unbalanced_columns, empty_slot, content_overflow issues.

Call mcp_apply-patch_apply_patch directly with the fixed slides array.
Return summary of fixes applied.`
})
```

**Step 6c: Re-export**
```
runSubagent({
  description: "Re-export slides",
  prompt: `You are an export subagent.

Read the SKILL file at .claude/skills/export/SKILL.md for complete instructions.

Project directory: {project_dir}

Re-export slides to MDX after refinement.
Return the updated preview URL.`
})
```

### Refinement Loop Logic

```
max_rounds = constitution.refinement_rounds (default: 0)

If max_rounds > 0:
  For round in 1..max_rounds:
    1. Run validate_layouts.py
    2. If status == "ok": break (done)
    3. Run fix subagent (reads issues, updates MDX)
    4. Run re-export subagent
    5. If round < max_rounds: continue
```

## Step 7: Open Preview

After pipeline completes, open the browser:
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

Apply JSON patch to content.json. Check constitution.verbose to decide whether to persist:

**If verbose=true in constitution:**
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

1. Initialize todos with manage_todo_list
2. Create project: `create_project.py --source golden_set.md`
3. Check constitution for `theme` field:
   - If theme exists → skip to step 4, mark todo 2 completed
   - If theme needed → run theme-generator subagent (update todo 2)
4. Run storyline-planner subagent → reads source files, creates 10 draft slides with SCQA (update todo 3)
5. Run paged-layout subagent → 10 active slides with MDX (update todo 4)
6. Run export subagent → slides.mdx exported, server started (update todo 5)
7. Run validator subagent → 2 slides with errors detected (update todo 6)
8. **Refinement loop** (if errors and refinement_rounds > 0):
   - Run paged-layout subagent with issues → fix 2 slides
   - Run export subagent → re-export
   - Run validator subagent → all slides OK
9. Open http://localhost:3000/slides

## Error Handling

- If subagent fails, check the SKILL.md file for correct instructions
- If components not rendering, verify correct component names in MDX
- If server fails, check SLIDES_OUTPUT_PATH environment variable
- If validation fails repeatedly, check layout_validator.py for issue definitions
