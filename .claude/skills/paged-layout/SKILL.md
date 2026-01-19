---
name: paged-layout-content
description: |
  Transform draft slides into active slides with layouts and MDX content.
  Use when: Generating final slide layouts and widget content from draft slides.
  Triggers: "generate layout", "design slides", "apply layout", "create MDX"
---

# Paged Layout Content Generator

You are a LAYOUT DESIGNER. Convert story drafts into MDX slides.

## CRITICAL RULES (DO NOT VIOLATE)

**DO NOT:**
- Read .tsx, .ts, .js, .jsx, .py files from src/, static/, or any solution code
- Use file_search, grep_search, or semantic_search tools - all paths are deterministic
- Search for component implementations - all component syntax is documented in this SKILL file and LAYOUT.md
- Read files outside the project directory except SKILL files in .claude/skills/
- Call read_section multiple times - use section="all" once
- Call apply_patch multiple times - generate ALL slides, save once
- Generate one slide → save → generate next slide → save - this is ONE atomic operation

**DO:**
- Use MCP tools (mcp_apply-patch_read_section, mcp_apply-patch_apply_patch) exclusively
- Read ALL context with ONE read_section(section="all") call
- Generate MDX for ALL slides in memory
- Save ALL slides with ONE apply_patch call
- Return a brief summary of layouts used

## Project Directory Location

**Project directories are located at:**
- **Windows**: `%TEMP%/content-manager/{project_id}/`
- **Unix/Mac**: `/tmp/content-manager/{project_id}/`

Example: `%TEMP%/content-manager/golden_set_6c765a24/`

## Your Task (SINGLE ATOMIC OPERATION)

**This is ONE step, not multiple steps.** You will:
1. Read all context in a single batch (ONE read_section call)
2. Generate MDX for ALL slides in memory
3. Save ALL slides with ONE apply_patch call

**Do NOT read → generate one slide → save → read → generate next slide → save. Process everything, then save once.**

**Do NOT read .tsx component files.** All component syntax is documented below and in LAYOUT.md.

---

## Read All Context First (ONE read_section call)

Read everything you need in ONE call:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "all"
})
```

This returns constitution, theme, slides, and issues (if any). Use this data to:
- Apply constitution rules (tone, style_rules, content_exclusions)
- Read each draft slide's story, density, visual_design, content
- Generate MDX for ALL slides
- Fix any issues from previous validation

**If `issues` section has errors:**
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

## Generate MDX Content (ALL SLIDES AT ONCE)

### CORE PRINCIPLE

Follow the draft slide's `story` and `visual_design` fields exactly:
- `story` defines WHAT to say (HEADLINE, NARRATIVE, EVIDENCE, TAKEAWAY)
- `visual_design` defines HOW to show it (layout + content approach)
- `density` defines HOW MUCH (sparse=focused, moderate=balanced, dense=detailed)

### DENSITY → ELEMENTS + TEXT LENGTH

| Density | Meaning | Blocks | Coverage | Text Length |
|---------|---------|--------|----------|-------------|
| sparse | Single focus | 2-3 blocks | 40-60% | 1-2 sentences per block |
| moderate | Balanced | 4-5 blocks | 60-80% | 2-3 sentences per block |
| dense | Detailed | 5-7 blocks | 70-90% | 3-4 sentences per block |

**TEXT LENGTH GUIDELINES (CRITICAL)**:
- **Card/StepList descriptions**: 15-30 words. NOT 5-10 words.
- **SmartList items**: 10-20 words each. Full thoughts, not fragments.
- **Text variant="lead"**: 20-40 words. Explain the "why", not just restate headline.
- **Callout content**: 15-30 words. Actionable insight, not label echo.
- **Avoid telegram style**: "9 languages; R0 done" → "9 languages in preview with R0/R1 completed and unified endpoint in production"

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
- **BigNum Purpose**: BigNum is for a **single magnificent number** that represents a milestone or achievement worth highlighting (e.g., "99.38% reliability", "$1.2B revenue", "10M users"). It draws attention to THE key number.
- **NEVER use BigNum/MetricGroup for**:
    - Counts of items (e.g., "3 Steps", "4 Pillars") <--- This is structure, not data.
    - Dates or Years (e.g., "2026", "Q1") <--- Use Heading or Text.
    - Indices (e.g., "01", "02") <--- Use StepList.
- **BigNum vs MetricGroup**: Use BigNum for 1 hero number. Use MetricGroup for 3-6 related KPIs. Don't mix both for same data.
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
- **ProcessStripEx Layout**: **ONLY use `ProcessStripEx` in `LayoutStacked`**. It requires full width to render properly. NEVER use ProcessStripEx in LayoutSplit or LayoutDashboard - use `ProcessStrip` or `StepList` instead for narrow columns.

---

## LAYOUT STRATEGY (HOW TO CHOOSE)

| Layout | Use Case | Content Strategy | Max Usage |
|--------|----------|------------------|-----------|
| `LayoutCover` | Transitions, Titles, Closings | Minimalist. Headline + Subtitle. No data. | 1-2 slides |
| `LayoutSplit` | Comparisons, Visual Proof | Left=context, Right=visual. **NO ProcessStripEx** (use ProcessStrip/StepList) | 3-5 slides |
| `LayoutDashboard` | KPI Overview, Status | Main=context, Sidebar=metrics/charts. **NO ProcessStripEx** | 2-3 slides |
| `LayoutTimeline` | History, Roadmaps | Chronological flow. Text-heavy but structured. | 1 slide |
| `LayoutStacked` | Tables, ProcessStripEx | Full-width for complex components. **ONLY layout for ProcessStripEx** | 1-2 slides |

### LAYOUT VARIETY RULE (CRITICAL)
- **LayoutStacked limit**: Max 20% of slides (e.g., 2 of 10 slides). It's easy but monotonous.
- **LayoutSplit preference**: Use for most content slides. It creates visual interest.
- **LayoutDashboard**: Ideal for metric-heavy slides with supporting narrative.
- **Variety check**: Before finalizing, count layouts. If >3 slides use same layout consecutively, restructure.

### COMPONENT-LAYOUT COMPATIBILITY (SOURCE: layout_engine.py)

This table is the **SOURCE OF TRUTH** from `src/paged/layout/react/layout_engine.py`.

| Widget | cover | split | stacked | grid | fullbleed | dashboard | timeline |
|--------|:-----:|:-----:|:-------:|:----:|:---------:|:---------:|:--------:|
| Heading | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Text | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| SmartList | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| BigNum | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| MetricGroup | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Charts | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| NetworkGraph | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| QuoteBlock | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Callout | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| CardGroup | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| TableData | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| StepList | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| ProcessStrip | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| ProcessStripEx | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Highlight | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:** ✅ = Allowed | ⚠️ = Use with caution | ❌ = Do not use

**Key Rules from Source:**
- **ProcessStripEx**: ONLY in `stacked` or `fullbleed` (needs full width)
- **Charts**: Best in `split` or `dashboard` (never in stacked or cover)
- **BigNum**: Avoid in `stacked` (use in split, dashboard, cover)
- **CardGroup**: ONLY in `grid` layout
- **TableData**: Use in `split` or `stacked` (NOT in dashboard)

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

## ⚠️ CRITICAL COMPONENT SYNTAX (MEMORIZE THIS)

**ProcessStrip and StepList use `items` PROP, NOT child elements!**

### ProcessStrip (horizontal flow)
```mdx
// Simple string items:
<ProcessStrip items={["Plan", "Build", "Test", "Ship"]} />

// With status and icons:
<ProcessStrip items={[
  {label: "Capture", status: "done"},
  {label: "Process", status: "active"},
  {label: "Deliver", status: "pending"}
]} />
```
**❌ WRONG (will cause "Step not defined" error):**
```mdx
<ProcessStrip>
  <Step title="Plan" />  <!-- WRONG! Step component doesn't exist -->
</ProcessStrip>
```

### StepList (vertical numbered steps)
```mdx
// Simple string items:
<StepList items={["Collect data", "Process", "Validate", "Deploy"]} />

// With descriptions:
<StepList items={[
  {label: "Plan", description: "Define scope and goals"},
  {label: "Build", description: "Implement core features"},
  {label: "Ship", description: "Deploy to production"}
]} />
```
**❌ WRONG:**
```mdx
<StepList>
  <Step title="Plan" description="..." />  <!-- WRONG! -->
</StepList>
```

### ProcessStripEx (card-based flow, ONLY in LayoutStacked/LayoutFullBleed)
```mdx
<ProcessStripEx items={[
  {title: "Input", description: "Raw meeting audio", icon: "🎙️"},
  {title: "Process", description: "Speech recognition", icon: "🔄"},
  {title: "Output", description: "Structured transcript", icon: "📄", status: "success"}
]} />
```

### SmartList (bullet/card lists)
```mdx
// Simple string items:
<SmartList items={["First point", "Second point", "Third point"]} />

// With variant (cards, highlight, checklist, timeline, compact):
<SmartList variant="cards" items={[
  "Key insight about the product",
  "Another important finding",
  "Critical recommendation"
]} />

// With highlight (for emphasizing key phrases):
<SmartList variant="highlight" items={[
  {text: "Revenue increased by 40%", highlight: "40%"},
  {text: "Customer satisfaction at 85%", highlight: "85%"}
]} />
```
**❌ WRONG (will cause "items.map undefined" error):**
```mdx
<SmartList>
  <li>First point</li>  <!-- WRONG! Use items prop -->
</SmartList>
```

---

## ⚠️ LAYOUT SLOT COMPONENTS (COMPLETE REFERENCE)

**Only these slot components exist in the renderer:**

| Layout | Slot Components | ❌ Components that DON'T exist |
|--------|-----------------|-------------------------------|
| `LayoutSplit` | `<Left>`, `<Right>` | ~~Top, Bottom, Column~~ |
| `LayoutDashboard` | `<Header>`, `<Main>`, `<Sidebar>`, `<Footer>` | ~~Top, Bottom, Left, Right~~ |
| `LayoutStacked` | **NO SLOTS** — direct children only | ~~Top, Bottom~~ |
| `LayoutCover` | **NO SLOTS** — direct children only | ~~Any slots~~ |
| `LayoutFullBleed` | **NO SLOTS** — direct children only | ~~Any slots~~ |
| `LayoutTimeline` | `<LayoutTimeline.Item year="...">` | ~~Top, Bottom~~ |

### LayoutStacked (CORRECT)
```mdx
<LayoutStacked>
  <Heading>Title</Heading>
  <Text variant="lead">Introduction paragraph...</Text>
  <SmartList items={["Point 1", "Point 2"]} />
  <Callout label="Takeaway">Key insight here.</Callout>
</LayoutStacked>
```
**❌ WRONG:**
```mdx
<LayoutStacked>
  <Top>...</Top>      <!-- WRONG! Top doesn't exist -->
  <Bottom>...</Bottom> <!-- WRONG! Bottom doesn't exist -->
</LayoutStacked>
```

### LayoutSplit (CORRECT)
```mdx
<LayoutSplit>
  <Left>
    <Heading>Left content</Heading>
    <Text>...</Text>
  </Left>
  <Right>
    <Heading level={2}>Right content</Heading>
    <SmartList items={[...]} />
  </Right>
</LayoutSplit>
```

### LayoutDashboard (CORRECT)
```mdx
<LayoutDashboard>
  <Main>
    <Heading>Main content</Heading>
    <Text>...</Text>
  </Main>
  <Sidebar>
    <Heading level={2}>Sidebar</Heading>
    <SmartList items={[...]} />
  </Sidebar>
</LayoutDashboard>
```

---

## CALLOUT USAGE (TAKEAWAY ANCHOR)
Callout is for **attention-worthy conclusions** - use when the slide has a critical insight that demands notice.
- **Purpose**: Highlight a "So What?" that the audience must not miss.
- **When to use**: Critical blockers, key decisions, strategic implications, risk warnings.
- **When NOT to use**: Routine summaries, obvious conclusions, slides where the visual speaks for itself.
- **Frequency**: Max 30% of slides. Overuse dilutes impact.
- **Content**: 15-30 words, actionable or insightful, not a summary of bullets.

**Good Callout examples:**
- `<Callout label="Blocker">Trust in accuracy and tone is the primary barrier to enterprise-wide deployment; fixing quality unlocks the next wave of adoption.</Callout>`
- `<Callout label="Action">LT alignment on GPU capacity and governance ownership is required before H2 scale commitments can proceed.</Callout>`

**Bad Callout usage:**
- ❌ Every slide has a Callout — dilutes attention
- ❌ Callout echoes headline — no new insight
- ❌ Callout summarizes bullets — redundant

## QUOTEBLOCK USAGE (AUTHORITY & TESTIMONIALS)
QuoteBlock is for **distinct voices** - testimonials, leadership mandates, or external validation.
- **Purpose**: Add authority, human element, or "voice of customer".
- **Placement**: Strong visual anchor. Can fill a sparse slot (Sidebar, Right side) effectively.
- **Transformation Strategy**:
    - **Customer Pain Points** -> Turn into a QuoteBlock. (e.g., "The accuracy isn't good enough for legal." - Chief Legal Officer)
    - **Vision/North Star** -> Turn into a QuoteBlock. (e.g., "Accuracy is our north star." - VP Product)
    - **Feedback** -> Turn into a QuoteBlock.
- **Content**: Needs attribution (Author/Source) when possible. If attribution is not explicit, use a generic persona like "Enterprise Customer" or "Product Leadership".

**Good QuoteBlock examples:**
- `<QuoteBlock author="Enterprise Customer" source="Legal Dept">We can't use this if names are misspelled.</QuoteBlock>`
- `<QuoteBlock author="Satya Nadella" variant="large">This is the defining challenge of our time.</QuoteBlock>`
- `<QuoteBlock author="Product Vision">Make entity accuracy the north star.</QuoteBlock>`

**Bad usage (avoid):**
- ❌ Using Callout to list multiple points (use SmartList).
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

## SMARTLIST VARIANT SELECTION
- **default**: Standard bullet list - general narrative points
- **cards**: Card with left accent border - key insights, feature lists needing emphasis
- **highlight**: Text with highlighted keywords - data-focused content (provide as `{text, highlight}`)
- **checklist**: Green checkmarks - completed items, requirements met
- **timeline**: Vertical timeline - sequential steps, chronological events
- **compact**: Dense small-font - supplementary info, footnotes

---

## CHART & TABLE PLACEMENT
- **Charts Need Width**: Charts require `ratio="1:1"` in LayoutSplit. In Dashboard, charts go in Sidebar.
- **Tables Need Width**: Use `LayoutStacked` for TableData. Never put tables in Dashboard sidebar or narrow splits.

---

## SPACE & CONTENT RULES
- **70% minimum coverage**: Every page must fill ≥70% of vertical space
- **Split balance**: Both sides need 4+ elements each with similar visual height
- **No naked lists**: Lists must have a Heading immediately preceding them
- **Visual anchor required**: Every slide needs at least one visual (Chart, BigNum, MetricGroup, CardGroup, ProcessStrip, TableData)
- **Consolidate lists**: Don't fragment content into multiple consecutive SmartLists

---

## Save ALL Slides (ONE apply_patch call)

**CRITICAL: This is the ONLY save operation. Generate MDX for ALL slides first, then save them ALL in ONE call.**

Each slide should have:
- `"state": "active"` (changed from "draft")
- `"layout": "LayoutName"` (e.g., "LayoutSplit", "LayoutDashboard")
- `"mdx": "<LayoutSplit>...</LayoutSplit>"` (the full MDX content)

**Call `mcp_apply-patch_apply_patch` ONCE with the complete slides array:**

```
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "slides",
  "data": [
    {
      "id": "slide_01",
      "rank": 1,
      "state": "active",
      "story": "...",
      "density": "minimal",
      "layout": "LayoutCover",
      "mdx": "<LayoutCover>...</LayoutCover>",
      "content": {...}
    },
    {
      "id": "slide_02",
      "rank": 2,
      "state": "active",
      "story": "...",
      "density": "moderate",
      "layout": "LayoutDashboard",
      "mdx": "<LayoutDashboard>...</LayoutDashboard>",
      "content": {...}
    }
    // ... all slides with mdx field populated
  ]
})
```

**IMPORTANT**: Generate this tool call directly with all slides inline. Do NOT output JSON first then call the tool separately.

**If constitution.verbose=true**, include `patch_file`:
```
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "slides",
  "data": [...slides array...],
  "patch_file": "{project_dir}/patches/slides_active.json"
})
```

---

## GENERATION OUTPUT RULES

**RULES**:
1. Follow each slide's `visual_design` field for layout and content approach
2. Follow each slide's `density` field - affects block count AND text length
3. Each slide tells its own story from the `story` field
4. **LAYOUT VARIETY**: ≥4 different layouts across deck. Max 2 LayoutStacked per 10 slides.
5. **NO CONSECUTIVE REPEATS**: Avoid back-to-back identical layouts or component patterns.
6. **TEXT DENSITY**: Descriptions should be 15-30 words, not 5-10 word fragments.
7. **CALLOUT SPARINGLY**: Max 30% of slides should have a Callout. Reserve for key insights.
8. **NO TEXT-ONLY SLIDES**: Every slide must have a visual anchor (Chart, BigNum, MetricGroup, ProcessStrip, ProcessStripEx, StepList, or CardGroup).

**MDX OUTPUT FORMAT**: Each slide's `mdx` field should contain ONLY the Layout component and its children. Start directly with the Layout (e.g., `<LayoutSplit>...</LayoutSplit>`). Do NOT wrap in `<Slide>` elements - the renderer handles slide separation automatically.

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


