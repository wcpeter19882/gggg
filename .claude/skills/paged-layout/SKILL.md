---
name: paged-layout-content
description: |
  Transform draft slides into active slides with layouts and MDX content.
  Use when: Generating final slide layouts and widget content from draft slides.
  Triggers: "generate layout", "design slides", "apply layout", "create MDX"
---

# Paged Layout Content Generator

You are a LAYOUT DESIGNER. Convert story drafts into MDX slides.

## Project Directory Location

**Project directories are located at:**
- **Windows**: `%TEMP%/content-manager/{project_id}/`
- **Unix/Mac**: `/tmp/content-manager/{project_id}/`

Example: `%TEMP%/content-manager/golden_set_6c765a24/`

## Your Task

Read draft slides and generate MDX content following the exact component syntax and rules.

**IMPORTANT**: Before generating MDX, read the complete layout documentation:
```
read_file(".claude/skills/paged-layout/LAYOUT.md")
```

## Step 0: Read Constitution

**ALWAYS read constitution first** - it defines style and content rules.

Use the MCP tool:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

**Apply constitution rules during layout generation:**
- If tone is "professional" → use formal language in Heading/Text
- If tone is "minimal" → prefer simpler layouts, fewer elements
- If style_rules mention specific formatting → apply to MDX
- If content_exclusions exist → don't include that content in MDX

## Step 1: Read Context

Use the MCP tool to read all needed sections:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "slides"
})
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "theme"
})
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "atoms"
})
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "issues"
})
```

Or read all at once:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "all"
})
```

**If `issues` section has errors (from previous validation):**
- Read the `issues.issues` array for specific problems per slide
- Each issue has: `slide_id`, `issue_type`, `description`, `suggestion`
- Focus on fixing slides with `severity: "error"` first
- Apply the `suggestion` from each issue to fix the MDX

**Common fixes:**
| Issue Type | Fix |
|------------|-----|
| `sparse_content` | Add more elements (BigNum, SmartList, Callout) to reach 65%+ height |
| `unbalanced_columns` | Add content to shorter side to balance heights |
| `empty_slot` | Add content or switch to layout without that slot |
| `processstrip_too_wide` | Use StepList instead, or reduce items to 3 |
| `metric_value_too_long` | Shorten value to <10 chars, move text to label |

---

## Step 2: Generate MDX Content

### CORE PRINCIPLE

Follow the draft slide's `story` and `visual_design` fields exactly:
- `story` defines WHAT to say (HEADLINE, NARRATIVE, EVIDENCE, TAKEAWAY)
- `visual_design` defines HOW to show it (layout + content approach)
- `density` defines HOW MUCH (sparse=focused, moderate=balanced, dense=detailed)

### DENSITY → ELEMENTS

| Density | Meaning | Blocks | Coverage |
|---------|---------|--------|----------|
| sparse | Single focus, supporting context | 2-3 blocks (hero + support) | 40-60% |
| moderate | Balanced multi-element | 4-5 blocks | 60-80% |
| dense | Detailed breakdown | 5-7 blocks | 70-90% |

### CONTENT MAPPING

- HEADLINE → `<Heading>`
- NARRATIVE → `<Text variant="lead">` or `<SmartList>`
- EVIDENCE (numbers) → `<MetricGroup>`, `<BigNum>`, Charts
- EVIDENCE (branching graphs) → `<NetworkGraph>` with JSX children (Node, Edge, Group)
- EVIDENCE (linear flows) → `<ProcessStrip>` for A→B→C sequences
- TAKEAWAY → `<Callout>` or `<Text variant="caption">`

---

## DESIGN PRINCIPLES (NON-NEGOTIABLE)

### 1. Visual-Narrative Balance
Every slide must tell a story (Narrative) AND prove it (Visual).
- **Narrative**: Use Heading + Text/SmartList to explain the "Why".
- **Visual**: Use Charts, BigNum, ProcessStrip, ProcessStripEx, MetricGroup, or structured lists (StepList, CardGroup) to show the "What".
- **Rule**: **NEVER create text-only slides**. SmartList and TableData are text-heavy. Always anchor the slide with at least one true visual component (Chart, BigNum, MetricGroup, ProcessStrip, ProcessStripEx, StepList, CardGroup).

### 2. Data Integrity: Performance vs Structure
Numbers must represent **performance metrics**, not **document structure**.
- **Definition of Metric**: A Performance Metric must be a **quantitative measurement** (e.g., "15%", "$10M", "300ms", "500 Users").
- **Real Data Only**: `MetricGroup` and `BigNum` are for KPIs. **NEVER** use them to show:
    - Counts of bullet points (e.g., "3 Steps", "4 Pillars") <--- This is structure, not data.
    - Dates or Years (e.g., "2026", "Q1") <--- Use Heading or Text.
    - Indices (e.g., "01", "02") <--- Use StepList.
- **Categorical Enumerations Forbidden**: NEVER use `BigNum`, `Metric`, or `MetricGroup` to visualize categorical indices or ordinal numbers.
- **Value-Add Metrics**: Use numbers that add *new* information not visible in the structure itself.
- **STRICTLY NO DUPLICATION**: A specific data point should appear **EXACTLY ONCE** on the slide.
    - **Chart vs Text**: If a number appears in a Chart, **DO NOT** write that number in any Text, List, or Heading. The Text must explain the *implication* (e.g., "Quality improved significantly"), while the Chart shows the *data* (e.g., "19.5% -> 12.3%"). **NEVER** have a bullet point that reads "X changed from A to B" if a chart shows A and B.
    - If a number is in a BigNum, **do NOT** repeat it in key text or lists.
    - Components must be complementary.
- **NO REDUNDANT SUMMARIES**:
    - **One Callout Rule**: Maximum 1 Callout per slide.
    - **Content Rule**: Do NOT use a Callout if it just repeats a List item. Callouts are for "So What?" insights that are NOT explicitly stated elsewhere.
- **STRICTLY NO HALLUCINATION**:
    - **Source-Based Data Only**: Use numbers explicitly provided in the text or mathematically available (e.g., calculating differences, sums, or ratios from given numbers is ALLOWED).
    - **No Arbitrary Inventions**: Do not invent missing variables to solve an equation. (e.g., if input only says "Sales up 15%", you do not know the total volume. Do not invent "$100M" as a baseline).
    - **No Assumed Complements**: Do not assume "remainder" values exist unless the category is binary/closed (e.g., "30% Market Share" does not imply who owns the other 70%).
    - **No Qualitative-to-Quantitative**: Do NOT assign arbitrary numbers to qualitative states (e.g. do not chart "In Progress" as 50%).
- **Visual**: If you have 3+ data points, use a Chart, not a list of metrics.
- **List Discipline**: Avoid single-item lists. If you have only one bullet point, write it as a paragraph using `<Text>...</Text>` instead. Lists are for enumeration (2+ items).

### 3. Visual Metaphor (The "Flashpoint" Rule)
Don't just list facts; visualize relationships.
- **Conceptual Comparisons**: If you are comparing two things (e.g., "SIM vs TBT", "Risk vs Scale") on dimensions like "Speed", "Quality", or "Cost", **ALWAYS use a `ChartBubble`** inside a `LayoutSplit` (Left: Context, Right: Bubble).
    - This is the "Flashpoint": showing the trade-off visually is 10x more powerful than a list.
    - Use imaginary 0-100 scales for X/Y to position the bubbles conceptually.
- **Flow vs Structure**: Use `ProcessStrip` for simple flows, `ProcessStripEx` for detailed card-based flows, and `NetworkGraph` for complex branching.

### 4. Chart Logic (No Nonsense Charts)
- **Dates are NOT Quantities**: NEVER put years (2025, 2026) or dates (20260331) as the `value` in a Bar/Line chart. That makes no sense. Use `LayoutTimeline` or a simple List for dates.
- **Pie vs Bar**: Use `ChartPie` ONLY for "Part-to-Whole" relationships (e.g., Budget Split, Market Share) where values must sum to 100%. Use `ChartBar` for "Independent Comparisons" (e.g., Completion % of 3 different projects, CSAT scores of 4 regions).
- **Single Data Point**: Do NOT make a Chart for 1 number. Use `BigNum`.
- **No Relative Inventions**: If input has **relative change ONLY** ("delta is ZZ"), do NOT invent "before=XX, after=YY". This applies to **Charts and Tables**. inventing baseline data is FALSE DATA.
- **No "Filler" Data**: For `ChartBar` or `ChartLine`, if you have sparse data (e.g., only 2 years), plot exactly those 2 years. **Do NOT invent** intermediate years or extra categories to "fill out" the chart.

### 5. Table Discipline
- **Data over Text**: Tables are for *data* (metrics, status, prices), not long paragraphs of text.
- **No Mock Data**: **NEVER** invent example rows (e.g. "Contoso", "Fabrikam", "John Doe") just to show what the table *could* look like. If the input text does not contain specific data rows, **do NOT** use a Table. Use a descriptive Text or List instead.
- **Refactor to Cards**: If a table is just a list of "Item Name" and "Description" (2 columns), it is a List, not a Table. Use `CardGroup` or `StepList` instead, as they handle text wrapping better than tables. Only use `TableData` for dense, structured matrices (3+ columns of short data).
- **Layout Choice**: **NEVER** use `LayoutDashboard` for slides with `TableData`. Sidebar is too narrow, and Main should be for Charts. Use `LayoutSplit` (Table on one side) or `LayoutStacked` (Table full width) instead.

### 6. Component Polish (Icons & Visuals)
- **CardGroup Icons**: When using `CardGroup`, **ALWAYS** provide a relevant semantic emoji or icon for the `icon="..."` prop. e.g. `<Card ... icon="🚀"/>` for Speed, `<Card ... icon="💰"/>` for Finance.
- **Process Visuals**: For `ProcessStrip` or steps, ensure the labels are concise.
- **ProcessStripEx Construction**: When utilizing `ProcessStripEx`, ALWAYS include a final "End Node" item representing the successful outcome or destination. Use `status='success'` for this final item to trigger the result styling. The title should be the result (e.g., "Deployable Governance") and the icon should represent completion (e.g., "✅" or "🛡️").

---

## LAYOUT STRATEGY (HOW TO CHOOSE)

| Layout | Use Case | Content Strategy |
|--------|----------|------------------|
| `LayoutCover` | Transitions, Titles, Closings | Minimalist. Headline + Subtitle + Quote. No heavy data. |
| `LayoutSplit` | Comparisons (A vs B), Visual Proof | Context on Left, Data/Visual on Right. **HEADLINE RULE**: For **Comparisons** (A vs B), use **BOTH** headers. For **Visual Proof** (Text + Visual), use **ONLY Left** header (Right has NO header). |
| `LayoutDashboard` | KPI Overview, Simple Status | **Main (Narrow/Left)**: Context/Lists. **Sidebar (Wide/Right)**: Hero Visuals (Charts, Simple Process). **ABSOLUTELY NO TABLES**. |
| `LayoutTimeline` | History, Roadmaps | Chronological flow. Text-heavy but visually structured. |
| `LayoutStacked` | Narrative Flow, Detailed Processes | **Primary Choice for Tables and ProcessStripEx**. Use when you have a large Table or Card-based Flow that needs full width. |

---

## CONTENT MAPPING (STORY → COMPONENT)

- **Table Data**: If the story provides a structured table (rows/cols), use `TableData` inside `LayoutStacked`. **DO NOT** try to break it into a List + Table (Mirroring). Just show the Table once, beautifully explanation above or below it.

| Story Element | Component | Note |
|---------------|-----------|------|
| HEADLINE | `Heading` | Level 1 for Title, Level 2 for Sections |
| NARRATIVE | `Text` | Use `variant="lead"` for the main story arc |
| DETAIL | `SmartList` | Bullet points (max 3-4 items per list) |
| EVIDENCE (Data) | `Chart` | Best for trends (Line), shares (Pie), comparisons (Bar) |
| EVIDENCE (Hero) | `BigNum` | Single high-impact number (Revenue, Growth) |
| EVIDENCE (Set) | `MetricGroup` | Group of 3-4 related metrics (KPIs) |
| EVIDENCE (Flow) | `ProcessStrip`/`ProcessStripEx` | Linear flows. `Ex` combines step w/ details. |
| EVIDENCE (Net) | `NetworkGraph` | Branching or complex relationships |
| TAKEAWAY | `Callout` | Slide conclusion - the "So What?" |

---

## CALLOUT USAGE (TAKEAWAY ANCHOR)
Callout is for **slide conclusions** - the single key insight or implication the audience should remember.
- **Purpose**: Distill the slide's message into one memorable statement. Logical "So What?".
- **Placement**: Bottom of LayoutStacked, or in narrow columns (Main slot of Dashboard, Left side of Split).
- **Design**: Minimal, integrated, left-accent border.
- **Content**: Short (1-2 sentences), actionable or insightful, not a summary of bullets.

## QUOTEBLOCK USAGE (AUTHORITY & TESTIMONIALS)
QuoteBlock is for **distinct voices** - testimonials, leadership mandates, or external validation.
- **Purpose**: Add authority, human element, or "voice of customer".
- **Placement**: Strong visual anchor. Can fill a sparse slot (Sidebar, Right side) effectively.
- **Transformation Strategy**:
    - **Customer Pain Points** -> Turn into a QuoteBlock. (e.g., "The accuracy isn't good enough for legal." - Chief Legal Officer)
    - **Vision/North Star** -> Turn into a QuoteBlock. (e.g., "Accuracy is our north star." - VP Product)
    - **Feedback** -> Turn into a QuoteBlock.
- **Content**: Needs attribution (Author/Source) when possible. If attribution is not explicit, use a generic persona like "Enterprise Customer" or "Product Leadership".

**Good Callout examples:**
- `<Callout label="Implication">We're building on proven components, not starting from scratch.</Callout>`
- `<Callout label="Takeaway">Trust in accuracy is the primary blocker for enterprise scale.</Callout>`

**Good QuoteBlock examples:**
- `<QuoteBlock author="Enterprise Customer" source="Legal Dept">We can't use this if names are misspelled.</QuoteBlock>`
- `<QuoteBlock author="Satya Nadella" variant="large">This is the defining challenge of our time.</QuoteBlock>`
- `<QuoteBlock author="Product Vision">Make entity accuracy the north star.</QuoteBlock>`

**Bad Callout/Quote usage (avoid):**
- ❌ Using Callout to list multiple points (use SmartList).
- ❌ Using Callout for status alerts (use Highlight or Text with styling).
- ❌ Using QuoteBlock for simple text that lacks "voice".
- ❌ Duplicating content already in the slide.

---

## DEDUPLICATION & ECONOMY (NO REDUNDANCY)
- **One Concept, One Component**: Do not visualize the same data twice.
    - **Chart vs List**: If you have a Chart showing data, do NOT write a list of those exact data points next to it.
    - **Process vs List**: If you have a `ProcessStrip`, do NOT write a `StepList` repeating the steps.
    - **Table vs List**: If you have a `TableData`, do NOT summarize the rows in a `SmartList`.
- **Mutual Exclusion**: `ProcessStrip` and `StepList` are **MUTUALLY EXCLUSIVE**.
    - **Scenario A (Visual Focus)**: Use `ProcessStrip` (in Main) + `SmartList` (in Sidebar/Text). Best for `LayoutDashboard`.
    - **Scenario B (Text Focus)**: Use `StepList` (Detailed descriptions). Best for `LayoutSplit` or `LayoutStacked`.
    - **CRITICAL**: Never use `ProcessStrip` and `StepList` together.
- **Fill the Void**: If a slot looks empty/sparse, consider adding a **QuoteBlock** (testament/principle) or a **Callout** (conclusion). Do not leave huge white spaces.

---

## ANTI-PATTERNS (STRICTLY FORBIDDEN)
- **The "Mirroring" Trap**: In `LayoutSplit`, **NEVER** use the Right side to summarize or "list" the content of the Left side.
    - **Forbidden**: Left = Table of 5 items; Right = List of the same 5 items.
    - **Forbidden**: Left = Text description; Right = Checklist of the same points.
    - **Correction**: If you have a detailed List/Table on one side, use the other side for:
        1. A **Visual Anchor**: `BigNum` (Key Stat), `Chart` (Impact), or `NetworkGraph` (Concept).
        2. An **Insight**: `Callout` (conclusion) or `QuoteBlock` (attributed quote).
        3. **Never** just repeat the list.
- **The "Counting" Metrics**: **NEVER** use `BigNum` to count the number of rows in a table or items in a list (e.g., "5 Decisions", "3 Pillars"). This is noise, not data.
- **Footer Discipline**: In `LayoutStacked`, the last element is the bottom anchor. Do not put heavy detailed lists (like `StepList`) at the very bottom. Use the bottom slot for a `Callout` (conclusion) or a `QuoteBlock`.
- **Callout Misuse**: `Callout` is for **conclusions**, not alerts. Don't use it with warning/info styling - that's what `<Highlight>` is for inline.

---

## SMARTLIST VARIANT SELECTION (choose appropriate variant based on content)
- **default**: Standard bullet or numbered list - use for general narrative points
- **cards**: Each item in a card with left accent border - use for key insights, feature lists, or when items need visual emphasis
- **highlight**: Text with highlighted keywords - use for data-focused content where numbers or key terms need to stand out
  - Provide items as objects: `{ text: "Revenue grew by 40%", highlight: "40%" }`
- **checklist**: Green checkmark items - use for completed items, requirements met, or success criteria
- **timeline**: Vertical timeline with dots - use for sequential steps, milestones, or chronological events
- **compact**: Dense small-font list - use for supplementary info, footnotes, or sidebar content

## SMARTLIST HIGHLIGHT BEST PRACTICES
- Use highlight variant when content contains metrics, percentages, or key terms that should pop
- Keep highlights short (1-3 words) - the highlighted text should be the key data point
- Example: `{ text: "Customer satisfaction improved to 85%", highlight: "85%" }`
- Example: `{ text: "Launch scheduled for Q3 2024", highlight: "Q3 2024" }`

---

## CHART SIZING & PLACEMENT (CRITICAL)
- **Charts Need Width**: Charts (`ChartBar`, `ChartLine`, etc.) generally need width to be readable.
- **LayoutSplit Restriction**: If a slide contains a Chart and uses `LayoutSplit`:
    - **MUST USE** `ratio="1:1"`.
    - **FORBIDDEN**: Do NOT use Charts in `2:1` or `1:2` splits.
- **LayoutDashboard**: Charts ALWAYS go in the **Sidebar** (Wide).
- **LayoutStacked**: Charts can go anywhere (Full Width).

---

## SPACE MANAGEMENT (70% MINIMUM COVERAGE)
- **EVERY PAGE must fill ≥70% of vertical space** with content
- Split layouts: BOTH sides need 4+ elements EACH (Heading + visual + text + support)
- Both sides of split must span similar vertical height (visual overlap)
- Dashboard/Stacked: ALL slots need content, no empty or sparse slots
- Never leave gaps/holes - content should flow continuously
- AVOID: sparse pages that look like work-in-progress
- If content is limited, use simpler layout (LayoutStacked) rather than leave gaps

---

## LIST GROUPING & CONTEXT
- **Consolidate Lists**: Avoid fragmented lists. Consecutive lists (e.g., `SmartList` followed by another `SmartList`) dilute the message. Consolidate them into one unless they are conceptually distinct categories.
- **Context Headers**: Lists (`SmartList`, `StepList`) must NEVER appear at the top of a slot (Main, Sidebar, Left, Right) without a `Heading` immediately preceding them. A list without a header is a "naked list" and is forbidden.

---

## TEXT DENSITY WITH METRICS
- **If using MetricGroup**: Keep accompanying `Text` concise (max 2 sentences). The Metrics are the hero; don't drown them in a wall of text.
- **If using BigNum**: You can use more text, as BigNum takes less space.

---

## TEXT-ONLY SLIDES ARE FORBIDDEN
- Every slide MUST have at least one visual block (BigNum, MetricGroup, Chart, CardGroup, ProcessStrip, TableData).
- **TableData IS A VISUAL**: A dense `TableData` counts as the visual anchor. You do NOT need to add a Chart or BigNum if you have a good Table.
- **Layout Choice for Tables**: If you have a Table, use `LayoutStacked`. This is the ONLY layout that handles tables well.
    - **Forbidden**: Do not put Tables in `LayoutDashboard` (Sidebar is too narrow).
    - **Forbidden**: Do not put Tables in `LayoutSplit` (Half-width is usually too narrow).

---

## Step 3: Save Active Slides

**CRITICAL**: Store generated MDX content in the `"mdx"` field (NOT `"widgets"`).

Each slide should have:
- `"state": "active"` (changed from "draft")
- `"layout": "LayoutName"` (e.g., "LayoutSplit", "LayoutDashboard")
- `"mdx": "<LayoutSplit>...</LayoutSplit>"` (the full MDX content)

**Use the `apply_patch` MCP tool** (from `apply-patch` server):

```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "slides",
  "data": {slides_json_with_mdx}
})
```

**If constitution.verbose=true**, include `patch_file`:
```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "slides",
  "data": {slides_json_with_mdx},
  "patch_file": "{project_dir}/patches/slides_active.json"
})
```

---

## GENERATION OUTPUT RULES

**RULES**:
1. Follow each slide's `visual_design` field for layout and content approach
2. Follow each slide's `density` field (sparse=2-3 blocks, moderate=3-4, dense=5+)
3. Each slide tells its own story from the `story` field
4. Use Diagram ONLY when visual_design explicitly mentions it
5. ≥4 different layouts across deck.
6. **VARIETY RULE**: Avoid consecutive slides with identical structures.
    - If Slide `N` uses `LayoutStacked` + `ProcessStripEx`, Slide `N+1` SHOULD NOT use `ProcessStripEx`. Use `LayoutSplit`, `LayoutDashboard`, or `ProcessStrip`+`SmartList` instead.
    - Vary the rhythm: High-Density Card Flow -> Simple Headline Flow -> Dashboard.
7. Each <Slide> has id, rank, story, atoms attributes (or content field if use_content_field mode)
8. Combine text AND visual on each slide (one leads, other supports)
9. Fill space appropriate to density (sparse≠empty)
10. **CONTENT FLEXIBILITY**: You may refactor, shorten, or selectively omit content details to achieve a clean, well-balanced layout. Visual appeal and readability trump exhaustive completeness.
11. **NO TEXT-ONLY SLIDES**: Every slide must have a visual anchor (Chart, BigNum, MetricGroup, ProcessStrip, ProcessStripEx, StepList, or CardGroup). Pure text slides (Heading + Text + List) are forbidden.

Generate MDX slides wrapped in <Slide> elements.

---

## Example Output

After layout generation, return:
```
Generated MDX for 10 slides:
- 1 LayoutCover (title)
- 2 LayoutDashboard (metrics)
- 4 LayoutSplit (comparisons)
- 2 LayoutStacked (content)
- 1 LayoutFullBleed (call to action)
```


