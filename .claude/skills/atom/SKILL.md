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

---

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
| VISUAL | Concrete imagery | description, visual_category (metaphor/demo/screenshot), related_atom |

### All Atoms Require

- `id`: Unique identifier (e.g., 'fact_001', 'stat_001', 'quote_001')
- `abstract`: One-line summary (max 100 chars, e.g., 'Latency improved by 50%')
- `type`: One of BIO, FACT, STAT, QUOTE, TENSION, CONCEPT, VISUAL
- `rank`: Importance rank (1=most important)
- `visual`: Suggested representation (chart/diagram/big-number/quote-card/code/screenshot/photo/icon/timeline/comparison-table/flow/architecture/before-after/list/table/graph/none)
- `source_ref`: Reference to source location with source_id, file_path, offset, length

### Complete Atom Schema

Each atom must follow this schema with all fields (use empty string "" or empty array [] for non-applicable fields):

```json
{
  "id": "string (e.g., 'fact_001', 'stat_001', 'quote_001')",
  "abstract": "string (one-line summary, max 100 chars)",
  "type": "BIO | FACT | STAT | QUOTE | TENSION | CONCEPT | VISUAL",
  "rank": "integer (1=most important)",
  
  "text": "string (main content for FACT, TENSION, CONCEPT - empty for others)",
  
  "name": "string (person/entity name for BIO - empty for others)",
  "role": "string (role/title for BIO - empty for others)",
  "credentials": "string (background/achievements for BIO - empty for others)",
  "affiliation": "string (company/organization for BIO - empty for others)",
  
  "description": "string (visual description for VISUAL type - empty for others)",
  "visual_category": "string (metaphor/demo/screenshot for VISUAL - empty for others)",
  "related_atom": "string (ID of related atom for VISUAL - empty if not applicable)",
  
  "category": "string (definition/architecture/status/context for FACT - empty for others)",
  
  "value": "string (numeric value for STAT, e.g., '50%', '200ms', '3x' - empty for others)",
  "label": "string (label for STAT, e.g., 'Latency Reduction' - empty for others)",
  
  "quote": "string (verbatim quote for QUOTE - empty for others)",
  "attribution": "string (who said it for QUOTE - empty if not applicable)",
  "context": "string (context for STAT or QUOTE - empty if not applicable)",
  
  "tension_type": "string (problem/contradiction/trade-off for TENSION - empty for others)",
  "resolution_hint": "string (optional resolution hint for TENSION - empty if not applicable)",
  
  "concept_type": "string (solution/insight/method for CONCEPT - empty for others)",
  "supporting_facts": "array of strings (IDs of supporting FACT atoms for CONCEPT - empty array for others)",
  
  "visual": "string (suggested visual: chart/diagram/big-number/quote-card/code/screenshot/photo/icon/timeline/comparison-table/flow/architecture/before-after/list/table/graph/none)",
  
  "source_ref": {
    "source_id": "string",
    "file_path": "string",
    "offset": "integer",
    "length": "integer"
  }
}
```

### Extraction Rules

1. **Extract 5-20 atoms** - ignore fluff, focus on meaningful content
2. **STAT for numbers** - any quantitative data (percentages, counts, durations, growth rates)
3. **QUOTE for memorable phrases** - use for impact phrases relevant to the audience/scenario
4. **FACT for context** - definitions, architectural details, status updates, background info
5. **TENSION for problems** - conflicts, trade-offs, contradictions that create narrative tension
6. **CONCEPT for solutions** - insights, methods, resolutions that address tensions
7. **BIO for people** - speaker credentials, team members, stakeholders
8. **VISUAL for imagery** - metaphors, demos, screenshots that enhance understanding
9. **Fill type-specific fields** - use empty string "" for fields not applicable to the atom type
10. **Rank by importance** - 1=most important to the presentation narrative

### Visual Suggestions by Type

| Atom Type | Recommended Visuals |
|-----------|---------------------|
| STAT | big-number, chart, comparison-table, before-after |
| FACT | diagram, architecture, flow, list, table |
| QUOTE | quote-card |
| TENSION | before-after, comparison-table, diagram |
| CONCEPT | diagram, flow, architecture, list |
| BIO | photo, icon |
| VISUAL | screenshot, photo, diagram |

---

## Output Format

```json
{
  "abstract": "2-3 sentence summary of the source content",
  "atoms": [
    {
      "id": "stat_001",
      "abstract": "MAU reached 136k with 1.9% MoM growth",
      "type": "STAT",
      "rank": 1,
      "text": "",
      "name": "",
      "role": "",
      "credentials": "",
      "affiliation": "",
      "description": "",
      "category": "",
      "value": "136k",
      "label": "MAU",
      "quote": "",
      "attribution": "",
      "context": "+1.9% MoM growth",
      "tension_type": "",
      "resolution_hint": "",
      "concept_type": "",
      "supporting_facts": [],
      "visual_category": "",
      "related_atom": "",
      "visual": "big-number",
      "source_ref": {
        "source_id": "source_001",
        "file_path": "meeting_notes.md",
        "offset": 245,
        "length": 42
      }
    },
    {
      "id": "tension_001",
      "abstract": "Accuracy isn't good enough for legal use cases",
      "type": "TENSION",
      "rank": 2,
      "text": "Current accuracy levels are insufficient for legal and compliance use cases where precision is critical",
      "name": "",
      "role": "",
      "credentials": "",
      "affiliation": "",
      "description": "",
      "category": "",
      "value": "",
      "label": "",
      "quote": "",
      "attribution": "",
      "context": "",
      "tension_type": "problem",
      "resolution_hint": "Improve entity recognition accuracy to 99%+",
      "concept_type": "",
      "supporting_facts": [],
      "visual_category": "",
      "related_atom": "",
      "visual": "before-after",
      "source_ref": {
        "source_id": "source_001",
        "file_path": "meeting_notes.md",
        "offset": 512,
        "length": 89
      }
    },
    {
      "id": "quote_001",
      "abstract": "VP Product on accuracy as north star",
      "type": "QUOTE",
      "rank": 3,
      "text": "",
      "name": "",
      "role": "",
      "credentials": "",
      "affiliation": "",
      "description": "",
      "category": "",
      "value": "",
      "label": "",
      "quote": "Accuracy is our north star - we can't compromise on this for enterprise customers",
      "attribution": "VP Product",
      "context": "Product strategy discussion",
      "tension_type": "",
      "resolution_hint": "",
      "concept_type": "",
      "supporting_facts": [],
      "visual_category": "",
      "related_atom": "",
      "visual": "quote-card",
      "source_ref": {
        "source_id": "source_001",
        "file_path": "meeting_notes.md",
        "offset": 1024,
        "length": 78
      }
    }
  ]
}
```

---

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

---

## Example Output

After extraction, return summary:
```
Extracted 15 atoms:
- 6 STAT (metrics and numbers)
- 4 FACT (context and definitions)
- 3 TENSION (problems and challenges)
- 2 CONCEPT (solutions and insights)
```
