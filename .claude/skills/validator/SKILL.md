---
name: layout-validator
description: |
  Validate slide layouts for whitespace, balance, and content density issues.
  Use when: After generating layouts, before or after export.
  Triggers: "validate slides", "check layout", "run validator"
---

# Layout Validator

You are a subagent responsible for validating slide layouts and detecting issues.

## Project Directory Location

**Project directories are located at:**
- **Windows**: `%TEMP%/content-manager/{project_id}/`
- **Unix/Mac**: `/tmp/content-manager/{project_id}/`

Example: `%TEMP%/content-manager/golden_set_6c765a24/`

## Your Task

Run layout validation on active slides and save issues to content.json for refinement.

## Step 0: Read Constitution

**ALWAYS read constitution first** - check refinement_rounds setting.

Use the MCP tool:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

## Step 1: Read Active Slides

Use the MCP tool:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "slides"
})
```

## Step 2: Run Validation

```bash
python .claude/skills/validator/scripts/validate_layouts.py \
  --project "{project_dir}"
```

This script:
1. Reads active slides with MDX from content.json
2. Runs layout_validator on each slide
3. Aggregates all issues
4. Saves issues to content.json at `$root.issues`

## Step 3: Check Results

The script outputs:
```json
{
  "total_slides": 10,
  "slides_with_errors": 2,
  "slides_with_warnings": 3,
  "total_errors": 5,
  "total_warnings": 8,
  "status": "needs_refinement",
  "issues": [...]
}
```

## Issue Types Detected

| Issue Type | Severity | Description |
|------------|----------|-------------|
| `empty_slot` | error | Slot has no content (trapped whitespace) |
| `sparse_content` | error | Slot underfilled (<65% height) |
| `unbalanced_columns` | error | Split columns have >35% height difference |
| `content_overflow` | error | Too much content, will be cut off |
| `insufficient_page_coverage` | error | Page <70% filled |
| `processstrip_too_wide` | warning | ProcessStrip has too many items for column width |
| `metric_value_too_long` | warning | Metric value >10 chars |
| `consecutive_lists_without_header` | warning | SmartLists without Heading between |
| `missing_visual_block` | info | No charts/diagrams/BigNum on slide |

## Step 4: Trigger Refinement

If `status == "needs_refinement"` and `refinement_round < max_rounds`:
- Return issues summary to orchestrator
- Orchestrator will invoke paged-layout subagent with issues context

## Output Format

After validation, return:
```
Validated 10 slides:
- 2 slides with errors (need refinement)
- 3 slides with warnings
- 5 slides OK

Critical issues:
- slide_03: sparse_content in left column (45% filled, need 65%)
- slide_07: unbalanced_columns (left: 80%, right: 35%)

Status: needs_refinement (round 1 of 1)
```
