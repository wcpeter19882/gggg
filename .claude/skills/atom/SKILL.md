---
name: atom-extractor
description: |
  Extract structured "Narrative Atoms" from source content for slide generation.
  Use when: Processing VTT, TXT, MD files to extract facts, stats, quotes, tensions, concepts.
  Triggers: "extract atoms", "analyze content", "parse source"
---

# Atom Extraction

You are a subagent responsible for extracting structured atoms from source content.

## Your Task

Read the source document and extract atoms following the exact schema and rules below.

## Step 0: Read Constitution

**ALWAYS read constitution first** - it contains global rules that guide extraction.

Use the MCP tool:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

**Apply constitution rules during extraction:**
- If tone is "professional" → prioritize formal language atoms
- If tone is "technical" → include more architecture/definition facts
- If content_exclusions exist → skip atoms matching those topics
- If content_requirements exist → ensure atoms cover those topics
- If target_slides is set → adjust atom count (typically 1.5-2x slide count)

## Step 1: Read Source Files

Use the MCP tool to read ALL source files from the project's files/ directory:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "source"
})
```

This returns all `.md` and `.txt` files concatenated. Each file is marked with `# Source: filename.md`.
Extract atoms from ALL source files, not just the first one.

## Step 2: Extract Atoms

Extract "Narrative Atoms" from content for slide decks.

### Atom Types (use exact: BIO, FACT, STAT, QUOTE, TENSION, CONCEPT, VISUAL)

| Type | Purpose | Key Fields |
|------|---------|------------|
| BIO | Identity/credentials | name, role, credentials, affiliation |
| FACT | Context/definitions | text, category (definition/architecture/status/context) |
| STAT | Numbers/metrics | value ("50%", "200ms", "3x"), label ("Latency Reduction"), context |
| QUOTE | Verbatim phrases | quote, attribution, context |
| TENSION | Problems/conflicts | text, tension_type (problem/contradiction/trade-off), resolution_hint |
| CONCEPT | Solutions/insights | text, concept_type (solution/insight/method), supporting_facts |
| VISUAL | Concrete imagery | description, visual_category (metaphor/demo/screenshot) |

### All Atoms Require

- `id`: Unique identifier (e.g., 'fact_001', 'stat_001', 'quote_001')
- `abstract`: One-line summary (max 100 chars, e.g., 'Latency improved by 50%')
- `type`: One of BIO, FACT, STAT, QUOTE, TENSION, CONCEPT, VISUAL
- `rank`: Importance rank (1=most important)
- `visual`: Suggested representation (chart/big-number/quote-card/diagram/none)

### Extraction Rules

1. Extract 5-20 atoms, ignore fluff
2. STAT for numbers, QUOTE for memorable phrases, FACT for context
3. Fill type-specific fields, use empty "" for others
4. QUOTE: Use for impact phrases relevant to the audience/scenario
5. Rank by importance to the presentation narrative

### Output Format

```json
{
  "abstract": "2-3 sentence summary of the source content",
  "atoms": [
    {
      "id": "stat_001",
      "abstract": "MAU reached 136k with 1.9% MoM growth",
      "type": "STAT",
      "rank": 1,
      "value": "136k",
      "label": "MAU",
      "context": "+1.9% MoM growth",
      "visual": "big-number"
    }
  ]
}
```

## Step 3: Save Atoms to content.json

Use the `apply_patch` MCP tool (from `apply-patch` server):

```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "atoms",
  "data": {extracted_atoms_json}
})
```

**If constitution.verbose=true**, include `patch_file`:
```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "atoms",
  "data": {extracted_atoms_json},
  "patch_file": "{project_dir}/patches/atoms.json"
})
```

## Example Output

After extraction, return summary:
```
Extracted 15 atoms:
- 6 STAT (metrics and numbers)
- 4 FACT (context and definitions)
- 3 TENSION (problems and challenges)
- 2 CONCEPT (solutions and insights)
```
