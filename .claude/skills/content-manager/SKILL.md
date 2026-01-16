---
name: content-manager
description: |
  Orchestrate slide generation pipeline: atoms → storyline → theme → layout → export.
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
Source Document → Atoms → Storyline → Theme → Layout → Export
```

Each stage is handled by a specialized subagent.

## Todo Management

Use the built-in `manage_todo_list` tool for tracking pipeline progress.

**Base todos (before knowing refinement_rounds):**
```
manage_todo_list({
  todoList: [
    { id: 1, title: "Create Project", status: "not-started" },
    { id: 2, title: "Extract Atoms", status: "not-started" },
    { id: 3, title: "Generate Theme", status: "not-started" },
    { id: 4, title: "Plan Storyline", status: "not-started" },
    { id: 5, title: "Generate Layouts", status: "not-started" },
    { id: 6, title: "Export Slides", status: "not-started" },
    { id: 7, title: "Validate Layouts", status: "not-started" }
  ]
})
```

**After reading constitution, add refinement todos based on `refinement_rounds`:**
```
// If refinement_rounds = 1:
{ id: 8, title: "Refine Layouts (R1)", status: "not-started" },
{ id: 9, title: "Re-export (R1)", status: "not-started" },
{ id: 10, title: "Re-validate (R1)", status: "not-started" }

// If refinement_rounds = 2, also add:
{ id: 11, title: "Refine Layouts (R2)", status: "not-started" },
{ id: 12, title: "Re-export (R2)", status: "not-started" },
{ id: 13, title: "Re-validate (R2)", status: "not-started" }
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
- `content.json` - Main data store (atoms, theme, slides)
- `constitution.md` - User constraints and requirements

### constitution.md

Contains user constraints that ALL subagents must respect:
- `target_slides` - Target number of slides
- `content_requirements` - Must-include topics
- `content_exclusions` - Topics to avoid
- `style_requirements` - Style constraints
- `verbose` - If true, save intermediate outputs to files

## Step 2: Extract Atoms (Subagent)

Invoke the atom-extractor subagent:

```
runSubagent({
  description: "Extract atoms from source",
  prompt: `You are an atom extraction subagent.

Read the SKILL file at .claude/skills/atom/SKILL.md for complete instructions.

Project directory: {project_dir}
Source files: {project_dir}/files/*.md (read ALL .md files in this directory)

Extract atoms from each source file and save to content.json.
Return a summary of extracted atoms.`
})
```

## Step 3: Select Theme (Subagent)

Invoke the theme-generator subagent:

```
runSubagent({
  description: "Select theme",
  prompt: `You are a theme selection subagent.

Read the SKILL file at .claude/skills/theme/SKILL.md for complete instructions.

Project directory: {project_dir}
User instruction: {user_instruction}

Select or generate a theme and save to content.json.
Return the selected theme name.`
})
```

## Step 4: Plan Storyline (Subagent)

Invoke the storyline-planner subagent:

```
runSubagent({
  description: "Plan storyline",
  prompt: `You are a storyline planning subagent.

Read the SKILL file at .claude/skills/storyline/SKILL.md for complete instructions.

Project directory: {project_dir}
User instruction: {user_instruction}

Create draft slides with story, atoms, density, visual_design.
Return a summary of planned slides.`
})
```

## Step 5: Generate Layouts (Subagent)

Invoke the paged-layout subagent:

```
runSubagent({
  description: "Generate layouts",
  prompt: `You are a layout generation subagent.

Read the SKILL file at .claude/skills/paged-layout/SKILL.md for complete instructions.

Project directory: {project_dir}

Generate MDX content for each draft slide.
Follow the visual_design field exactly.
Use correct component names: <Left>/<Right> for LayoutSplit, <LayoutFullBleed> not LayoutFocus.
Return a summary of generated layouts.`
})
```

## Step 6: Export Slides (Subagent)

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

## Step 7: Validate Layouts (Subagent)

Invoke the validator subagent:

```
runSubagent({
  description: "Validate layouts",
  prompt: `You are a layout validator subagent.

Read the SKILL file at .claude/skills/validator/SKILL.md for complete instructions.

Project directory: {project_dir}

Run layout validation on active slides.
Save issues to content.json.
Return validation summary.`
})
```

## Step 8: Refinement Loop

**Check constitution.refinement_rounds** (default: 1)

If validation found errors AND refinement_round < max_rounds:

```
For round in 1..refinement_rounds:
  1. Mark "Refine Layouts (R{round})" as in-progress
  2. Run paged-layout subagent (reads issues, fixes MDX)
  3. Mark "Refine Layouts (R{round})" as completed
  
  4. Mark "Re-export (R{round})" as in-progress
  5. Run export subagent (re-export MDX)
  6. Mark "Re-export (R{round})" as completed
  
  7. Mark "Re-validate (R{round})" as in-progress
  8. Run validator subagent (re-validate)
  9. Mark "Re-validate (R{round})" as completed
  
  10. If status == "ok", break
```

Invoke paged-layout with issues context:
```
runSubagent({
  description: "Refine layouts",
  prompt: `You are a layout refinement subagent.

Read the SKILL file at .claude/skills/paged-layout/SKILL.md for complete instructions.

Project directory: {project_dir}
Refinement round: {current_round} of {max_rounds}

Read the issues section from content.json.
Fix the MDX for slides with errors.
Focus on: sparse_content, unbalanced_columns, empty_slot issues.
Return summary of fixes applied.`
})
```

**After refinement, always re-export:**
```
runSubagent({
  description: "Re-export slides",
  prompt: `You are an export subagent.

Read the SKILL file at .claude/skills/export/SKILL.md for complete instructions.

Project directory: {project_dir}

Re-export slides to MDX after refinement.
Return the updated MDX file path.`
})
```

## Step 9: Open Preview

After refinement completes, open the browser:
```
http://localhost:3000/slides
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
  "section": "atoms"
})
```

Available sections:
- `atoms`, `theme`, `slides`, `issues`, `story`, `constitution`, `metadata` - from content.json
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

Targets: atoms, theme, slides, issues, story, constitution

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

Targets: atoms, theme, slides, story, constitution

## Example Workflow

User: "Generate slides for golden_set.md"

1. Initialize todos with manage_todo_list
2. Create project: `create_project.py --source golden_set.md`
3. Run atom-extractor subagent → 15 atoms extracted (update todo 1)
4. Run theme-generator subagent → corp_modern theme selected (update todo 2)
5. Run storyline-planner subagent → 10 draft slides planned (update todo 3)
6. Run paged-layout subagent → 10 active slides with MDX (update todo 4)
7. Run export subagent → slides.mdx exported, server started (update todo 5)
8. Run validator subagent → 2 slides with errors detected (update todo 6)
9. **Refinement loop** (if errors and refinement_rounds > 0):
   - Run paged-layout subagent with issues → fix 2 slides
   - Run export subagent → re-export
   - Run validator subagent → all slides OK
10. Open http://localhost:3000/slides

## Error Handling

- If subagent fails, check the SKILL.md file for correct instructions
- If components not rendering, verify correct component names in MDX
- If server fails, check SLIDES_OUTPUT_PATH environment variable
- If validation fails repeatedly, check layout_validator.py for issue definitions
