---
name: ant-paged-layout
description: |
  Transform draft slides into Ant Design JSX layouts for executive presentations.
  Triggers: "generate layout", "create slides", "apply layout"
---

# Ant Design Layout Generator

You are an expert presentation designer. Transform draft slides into polished **Ant Design 6.x** JSX.

**Important:** Generate code using Ant Design 6.x API syntax. Components are shadow implementations that accept Ant Design props but render with custom styling.

## String Quoting Rule (CRITICAL)

**Use backticks for object property values** (e.g., in `dataSource` arrays) to avoid apostrophe/quote escaping issues.

## Workflow

### Input

Read all context with ONE call:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "all"
})
```

This returns source files, theme, and draft slides. Constitution is stored in constitution.md.

#### Custom Layout Override (Workflow Pre-Processing)

**For workflow/pipeline execution:** Before invoking this skill, check if `{theme_name}_layout.md` exists in the project directory.

**If custom layout.md exists:**
1. Read the `{theme_name}_layout.md` file content
2. **Replace section 1.1 (Layout Patterns)** in this prompt with the table from that file
3. All other sections (1.2 Layout Rules, 1.3 Hard Constraints, 2.x Components, etc.) remain unchanged
4. Send the modified prompt to LLM

**If NO layout.md exists:**
- Use this prompt as-is with the default Layout Patterns table in section 1.1

**For direct skill invocation (e.g., Claude chat):** Read source files and check for `*_layout.md`. If found, use its table instead of section 1.1 below.

#### Context Processing

Use the loaded data to:
- Apply theme colors and typography
- Plan layout variety across ALL slides before generating
- Generate JSX for each slide using `content.image` if specified

### Output

Save ALL slides with ONE call:
```
mcp_apply-patch_apply_patch({
  project_dir: "{project_dir}",
  target: "slides",
  data: [ {id, rank, state, mdx}, ... ]
})
```

**IMPORTANT:** Use the `mdx` field for JSX content (NOT `layout`). The MCP tool will merge with existing slide fields.

### Summary

After generation, return layout variety report:
```
Generated N slides:

Layout Distribution:
- Symmetric: X slides (Y%) — must be ≤40%
- Asymmetric: X slides (Y%) — must be ≥40%
- Compound: X slides

Visual Balance:
- Heavy visuals: X slides (Y%) — must be ≥30%
- Text-only: X slides (Y%) — must be ≤40%
- Diagrams used: [Venn, Pyramid, Funnel, Scatter, Bar, Pie, etc.]
- Images used: X slides (list which images on which slides)

Layout Usage:
- Centered: X (Cover, Closing)
- Split 50/50: X (max 2)
- Split 60/40: X (max 3)
- Split 70/30: X (max 2)
- Grid 2x2: X (max 2)
- Grid 3-col: X (max 3)
- T-Shape: X (≥1 required)
- L-Shape: X (≥1 required for 10+ slides)
- Stacked: X (≥1 required for 8+ slides)
- Other: X

✓ No consecutive repeats
✓ Variety constraints met
✓ Visual balance met
```

---

## 1. Layout

### 1.1 Layout Patterns

Layouts are grouped by **symmetry** to enable variety planning. Use `intent` from slide to filter candidates, then select based on content.

| Category | Intent | Pattern | Layout | Structure | Best For | Constraints |
|----------|--------|---------|--------|-----------|----------|-------------|
| **Symmetric** | statement | cover | Cover | `flex flex-col justify-center h-full px-16` | Title slide | Max 4 elements. No tags, no metadata. |
| Symmetric | statement | section-break | Centered | `flex items-center justify-center h-full` | Closing, transition | — |
| Symmetric | statement | quote, callout | Billboard | `flex flex-col justify-center items-center h-full text-center px-16` | Statement, quote | Use `max-w-4xl` to `max-w-6xl`. |
| Symmetric | hierarchy | pyramid, funnel | Centered | `flex items-center justify-center h-full` | Hierarchy | Use Pyramid/Funnel component |
| Symmetric | overlap | venn | Centered | `flex items-center justify-center h-full` | Intersection | Use Venn component |
| Symmetric | comparison | side-by-side | Split 50/50 | `grid grid-cols-2 gap-6` | Two equal items | Max 2 per deck. **NEVER add `h-full` to grid.** |
| Symmetric | structure | pillars-4, quadrant | Grid 2x2 | `grid grid-cols-2 grid-rows-2 gap-4` | 4 equal items | Max 2 per deck. **NEVER add `h-full` to grid.** |
| Symmetric | structure | pillars-3, kpi | Grid 3-col | `grid grid-cols-3 gap-4` | 3 equal items | Max 3 per deck. **NEVER add `h-full` to grid.** |
| **Asymmetric** | evidence, focal | 1 main + 1 support | Split 60/40 | `grid grid-cols-5 gap-6` → `col-span-3` + `col-span-2` | Visual + explanation | Max 3. **NEVER add `h-full` to grid.** |
| Asymmetric | focal | 1 main + 1 accent | Split 70/30 | `grid grid-cols-10 gap-6` → `col-span-7` + `col-span-3` | Content + callout | Max 2. Accent col: single centered group. |
| Asymmetric | focal | 1 accent + 1 main | Split 40/60 | `grid grid-cols-5 gap-6` → `col-span-2` + `col-span-3` | Lead with accent | Max 3. **NEVER add `h-full` to grid.** |
| Asymmetric | evidence | 1 main + 2 accents | L-Shape | `grid grid-cols-3 gap-4` → `col-span-2` + stacked | Main + 2 details | ≥1 required (10+ slides). Stacked items in one container. |
| Asymmetric | structure, process | Header + 3 parts | T-Shape | Full-width row + `grid grid-cols-3` | Section intro + 3 pillars | ≥1 required |
| Asymmetric | — | TOC + main | Sidebar Left | `grid grid-cols-4 gap-6` → `col-span-1` + `col-span-3` | Agenda + content | Sidebar: single group, no void. |
| Asymmetric | — | Main + aside | Sidebar Right | `grid grid-cols-4 gap-6` → `col-span-3` + `col-span-1` | Content + callout | Sidebar: single group, no void. |
| **Compound** | process, summary | flow | Stacked 2 | `flex flex-col gap-6` with 2 sections | Numbered List | ≥1 required (8+ slides) |
| Compound | hierarchy | layers | Stacked 3 | `flex flex-col gap-4` with 3 sections | Title + 2 blocks | — |
| Compound | comparison | cost-benefit | Grid 2+1 | `grid-cols-2` top + full-width bottom | 2 items + summary | — |
| Compound | summary | — | Grid 1+2 | Full-width top + `grid-cols-2` bottom | Header + 2 details | — |
| Compound | structure | — | Grid 4-col | `grid grid-cols-4 gap-4` | 4+ small items | — |
| Compound | overlap | hub-spoke | Bento | `grid-cols-12` + varied `col-span-*` | Mixed sizes | — |

**Selection priority:** Match content structure first, then intent.

**MANDATORY:** Every column in split/grid layouts must use `flex flex-col justify-center` — this applies to BOTH main AND sidebar columns.

**CRITICAL - Diagram + Text Coordination:** When using Pyramid, Funnel, Venn, or Scatter:
- **Diagram = abstract concept/structure** — labels should be short titles only
- **Text = supplementary details** — adds context NOT shown in diagram
- **NO redundant content** — if diagram label says "Shared capabilities: local inference + RAG", text should NOT repeat "Local inference + local RAG: privacy, offline..."
- When storyline has detailed bullets that overlap with diagram labels, either:
  - Simplify diagram labels (title only) and keep detailed text, OR
  - Use diagram with descriptions and omit redundant text sections
- Max combined height: diagram ≤450px when paired with supporting text

### 1.2 Layout Rules

#### Forbidden Display Elements
- `content.category` (Situation, Complication, Question, Answer) — narrative metadata only
- Image descriptions — use as `alt` attribute only
- Transition fields (`transition_from`, `transition_to`) — internal structure only
- **Ordinal structural labels** ("Pillar 1", "Step 1", "Point 1") — position implies structure
- Semantic prefixes ("Punchline:", "Takeaway:") — formatting signals importance

#### Source References
References appear as **superscript** numbered links inline using `<sup><a href="...">` pattern. **NEVER show reference URLs as text on slides.**

**Rules:**
- Inline citations: Use `<sup>` for superscript with `<a href="..." target="_blank">` inside
- Link color: Use `style={{ color: 'var(--theme-primary)' }}`
- **FORBIDDEN:** Reference lists at slide bottom showing URLs (e.g., "[1] arxiv.org/...")
- **FORBIDDEN:** Plain text URLs anywhere on slides

#### Using Images from Content
Use images selectively — max 20-30% of slides. Images work best for cover/closing, section dividers, concept reinforcement.

| Aspect Ratio | Rendering | Panel Width |
|--------------|-----------|-------------|
| 16:9, 21:9 | Contained in Card or 60% hero panel | ≥60% |
| 4:3, 3:2 | 50/50 or 60/40 split, `object-cover` | 40-60% |
| 1:1 | Small accent in Card (64-128px) | ≤40% |
| 2:3, 9:16 | Sidebar or narrow accent column | ≤30% |

**FORBIDDEN:** Full-bleed background images with text overlay.

**Multiple images:** 1 = hero/accent; 2 = split or primary+accent; 3 = grid or 1 hero + 2 accents

**Image path:** Use relative path `images/{filename}`

**Image styling:** Images should NOT have background color. Use `bg-transparent` or no bg class on image containers.

#### Design System Compliance
**Layout layer uses Tailwind + `<div>` only** — `grid`, `flex`, `gap-*`, `h-full`, `col-span-*`

**FORBIDDEN:** `Row`, `Col`, `Layout`, `Sider`, `Content`, `Flex` (Ant Design layout components)

#### Slide Canvas Rule
**Slides are fixed 16:9 canvases, not scrolling pages.** Content must be vertically centered.

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `flex flex-col h-full` | `flex flex-col justify-center h-full` |
| `grid ... h-full` on inner grid | `grid ...` without `h-full` — let grid size to content |
| Grid stretches to fill, content at top | Parent `flex justify-center` centers the whole block |

**Grid centering pattern:** Outer wrapper uses `flex flex-col justify-center h-full`, inner grid has NO `h-full`. This way the grid sizes to its content, and the wrapper centers everything vertically.

#### Text Density Rules
| Panel Width | Max Text |
|-------------|----------|
| ≤30% (accent) | 2-3 bullet points, no paragraphs |
| 40-50% | 3-4 bullets OR 1 paragraph + 2 bullets |
| ≥60% (main) | Max 5 bullets OR 2 paragraphs |

**If content exceeds limit → split into two slides.**

#### Void Prevention Rules
**Minimum content per panel:**
- ≤30% width: 1 Heavy OR 1 Medium + 1 line
- 40-50% width: 1 Heavy + caption OR 1 Medium + 3 items
- ≥60% width: Heading + 4+ items OR 2 paragraphs OR Heavy + explanation

**Accidental void detection:**
- If narrow column has 2+ items with `gap-6` between them → items should be in ONE container, not separate
- If column has empty vertical space between components → either add content or use single centered group
- **FORBIDDEN:** Two small items at top and bottom of column with void in middle

**Sidebar cards:** Remove `h-full` — let them size to content.

**Density ceiling:** Max 2 content-heavy cards per slide.

### 1.3 Hard Constraints

| Category | Rule | Constraint |
|----------|------|------------|
| **Variety** | No consecutive repeats | Never use same layout twice in a row |
| Variety | Image swap ≠ variety | 60/40 image-left vs image-right = SAME pattern |
| Variety | Layout+Component variety | No two slides may have identical Layout + Component |
| Variety | Centered text-only limit | Max 2 (cover + 1 section break) |
| **Budgets** | 50/50 split | Max 2 per deck |
| Budgets | 60/40 split | Max 3 per deck |
| Budgets | 70/30 split | Max 2 per deck |
| Budgets | Grid 2x2 | Max 2 per deck |
| Budgets | Grid 3-col | Max 3 per deck |
| **Heavy Diagrams** | Pyramid | Max 1 per deck |
| Heavy Diagrams | Funnel | Max 1 per deck |
| Heavy Diagrams | Venn | Max 1 per deck |
| Heavy Diagrams | Scatter | Max 1 per deck |
| Heavy Diagrams | Steps | Max 1 per deck |
| Heavy Diagrams | Timeline | Max 1 per deck |
| **Requirements** | T-Shape | ≥1 required |
| Requirements | L-Shape | ≥1 required (for 10+ slides) |
| Requirements | Stacked | ≥1 required (for 8+ slides) |
| Requirements | Images (if provided) | Use on ≥3 slides |
| **Visual Balance** | Heavy visual floor | Min 30% of slides with Chart/Diagram/Mockup |
| Visual Balance | Text-only ceiling | Max 40% of slides |

### 1.4 Pre-Generation Planning

**Internal planning only — do NOT output this budget plan.** Plan silently, then output JSX directly.

Before generating JSX, mentally plan:
- Heavy diagrams: Max 1 each of Pyramid, Funnel, Venn, Scatter, Steps, Timeline
- Layout budgets: 50/50 (max 2), 60/40 (max 3), 70/30 (max 2), Grid 2x2 (max 2), Grid 3-col (max 3)
- Requirements: T-Shape (≥1), L-Shape (≥1 for 10+ slides), Stacked (≥1 for 8+ slides)

**Verify mentally:** No consecutive repeats, all budgets respected, requirements met.

**Then immediately generate all JSX slides.**

### 1.5 Visual Rhythm Guidance

| Position | Recommended | Rationale |
|----------|-------------|-----------|
| Cover/Closing | Centered | Clean, focused |
| After 50/50 | 60/40, 70/30, or T-Shape | Break symmetry |
| After Grid 2x2 | Stacked, L-Shape, or 60/40 | Change weight distribution |
| Consecutive "Answer" | Alternate asymmetric | Prevent fatigue |
| Process slides | Stacked 2 or T-Shape | Full-width visibility |

### 1.6 Visual Monotony Break (Override Rule)

**Problem:** 3+ consecutive text-only slides create visual fatigue, even if storyline intent allows text.

**Rule:** After 2 consecutive text-only slides, the 3rd slide MUST add a visual break — override storyline intent if necessary.

**Light Visual Interventions (choose one):**
| Intervention | When to Use | Example |
|--------------|-------------|---------|
| **Icon-enhanced Cards** | Cards listing features/capabilities | Add `<IconName />` prefix to each card title |
| **Accent border/highlight** | Differentiating a key point | `border-l-4 border-theme-primary` on one card |
| **Color gradient progression** | Sequential/phase content | `bg-theme-primary/10` → `/20` → `/30` across cards |
| **Large Statistic callout** | Any slide with a number | Pull one metric into `<Statistic>` even if not "evidence" intent |
| **Quote/Billboard format** | Statement slide with strong claim | Use `Billboard` layout with large centered text |
| **Visual divider** | Dense content that needs breathing room | Add horizontal rule or spacing between sections |

**NOT required to add:** Heavy diagrams (Pyramid, Funnel, Venn) — these have budget limits. Light interventions are unlimited.

**Detection during planning:** Count consecutive text-only slides. If count reaches 2, flag the next slide for visual intervention.

---

## 2. Components

### 2.1 Content-to-Component Mapping

Use slide's `intent` and story element to select visual component.

| Intent / Element | Primary Component | Fallback | When to Use Fallback |
|------------------|-------------------|----------|----------------------|
| `statement` | `Typography.Title` + `Paragraph` | — | Always text-only |
| `evidence` | `Bar`, `Line`, `Statistic` (2+) | List with `so_what` | No numeric data |
| `comparison` | Side-by-side Cards, `Bar` | `Table` | >4 items |
| `process` | Phase Cards, Numbered List, Color-Gradient Cards, Icon Cards | `Funnel` | Stages filter/narrow |
| `structure` | Card grid (3-4), `Pyramid` | List | <3 or >5 items |
| `focal` | Hero visual + text | Large `Statistic` + List | No visual asset |
| `summary` | `Table`, Card grid | List | Simple action list |
| `matrix` | `Scatter` (quadrant), 2x2 Cards | — | Always visual |
| `hierarchy` | `Pyramid`, `Funnel` | Stacked Cards | — |
| `overlap` | `Venn` | Intersecting Cards | >3 sets |
| HEADLINE | `Typography.Title level={2}` | — | Bold, no emoji |
| NARRATIVE | `Typography.Paragraph` (20-40 words) | — | Regular weight |
| DETAIL | `List` | — | `**Key** — explanation` |
| EVIDENCE (number) | `Statistic` or Chart | — | Chart left + bullets right |
| EVIDENCE (flow) | Numbered List, Phase Cards, `Funnel` | — | Funnel when narrowing |
| TAKEAWAY | `Alert` in colored box | — | `type="info"` at bottom |
| COMPARISON | Side-by-side Cards | — | Contrasting `bg-*-50` |

**RULE:** If `intent` is matrix, hierarchy, or overlap → MUST use diagram. Text-only forbidden.

### 2.2 Component Weight Classification

| Weight | Component | Source | Notes |
|--------|-----------|--------|-------|
| **Heavy** | `Line`, `Bar`, `Column`, `Pie`, `Area` | `@/components/antd` | Charts — ONE per slide max |
| Heavy | `Funnel`, `Radar` | `@/components/antd` | Diagrams |
| Heavy | `Venn` | `@/components/antd` | Overlapping concepts |
| Heavy | `Pyramid` | `@/components/antd` | Hierarchy |
| Heavy | `Scatter` | `@/components/antd` | 2D positioning (quadrant labels) |
| Heavy | UI Mockup | Custom | Browser chrome + interface |
| **Medium** | `Statistic` (2+ grouped) | `@/components/antd` | With supporting list |
| Medium | `Timeline` | `@/components/antd` | 3+ items, supports `orientation` |
| Medium | `Steps` | `@/components/antd` | 3+ steps |
| Medium | `Table` | `@/components/antd` | 3+ rows |
| Medium | `Card` grid | `@/components/antd` | 2+ cards |
| Medium | `Progress` | `@heroui/react` | Progress bars |
| Medium | `List` (3+ items) | `@/components/antd` | Medium weight |
| **Light** | `Tag`, `Badge` | `@/components/antd` | Labels, inline only |
| Light | `Alert` | `@/components/antd` | ONE per slide |
| Light | `Descriptions` | `@/components/antd` | Key-value pairs |
| Light | `Statistic` (single) | `@/components/antd` | Inline callout only |
| Light | `List` (1-2 items) | `@/components/antd` | Light weight |
| Light | `Typography.Title` | `@/components/antd` | Heading only |
| Light | `Typography.Paragraph` | `@/components/antd` | Depends on length |

**Never use Light components alone to fill a panel.**

### 2.3 Component Selection Guide

| Content Type | Visual Relationship | Component | Budget |
|--------------|---------------------|-----------|--------|
| Concepts balance/complement | Overlap | `Venn` | Max 1 |
| Items have priority | Hierarchy | `Pyramid` | Max 1 |
| Something narrows/filters | Funnel | `Funnel` | Max 1 |
| Two dimensions matter | Matrix | `Scatter` (quadrant) | Max 1 |
| Temporal sequence | Timeline | `Timeline` | Max 1 |
| Step-by-step with status | Process | `Steps` | Max 1 |
| Quantities differ | Comparison | `Bar` or `Column` | Unlimited |
| Proportions/share | Part-of-whole | `Pie` | Unlimited |
| Single key NUMERIC metric | Evidence | `Statistic` | Unlimited |
| Multiple NUMERIC metrics (3-6) | Evidence | `Statistic` grid in `<div>` (not Card) | Unlimited |
| Qualitative labels/status | Evidence | Card grid with icons, or Tags | Unlimited |
| Stages or phases | Process | Phase Cards, Numbered List | Unlimited |
| Group membership | Collection | `List` | Unlimited |
| Item attributes | Comparison | `Table` | Unlimited |
| Discrete stages | Process | Phase Cards | Unlimited |
| Progression flow | Process | Color-Gradient Cards | Unlimited |
| Memorable phases | Process | Icon-Driven Cards | Unlimited |
| Visual storytelling | Focal | Image from content | ≥3 slides |

**Default for process:** Phase Cards, Numbered List, Color-Gradient Cards, or Icon Cards (unlimited). Use Steps/Timeline only if budget available.

### 2.4 Component Rules

#### List Discipline
- **Single-item lists FORBIDDEN** — use `Typography.Paragraph`
- Card = Title + Paragraph OR Title + List(2+) — never Title + List(1)
- `List` requires `dataSource` and `renderItem` props
- `List.Item` content must use `Typography.Text` or `Typography.Paragraph`
- **Two-line items (text + secondary) are HEAVY** — use sparingly (max 30% of lists). Default to single-line items.

#### Alert Discipline
Alert is a "stop and think" signal — not a slide summary. Max 25% of slides. If every slide has Alert, audience ignores them.

**Alert Placement Rules:**
- Alert must be **grouped with the content it comments on** — never isolated in a corner
- In split layouts, Alert belongs in the **same column as related content**, directly below it
- **FORBIDDEN:** Alert floating alone in a narrow column with empty space above
- If Alert relates to the whole slide, place it at **bottom of main content column**, not in sidebar

#### Statistic Discipline
**Statistic is for NUMERIC values only** (e.g., `$2.4M`, `99.9%`, `<50ms`). For qualitative labels like "Near-zero" or "Domain-tuned", use Card with icon, Tag, or Typography pairs instead.

#### Card Styling

**Card is for content, not layout.** If you're using Card just for background/grouping, use `<div className="bg-theme-surface rounded-xl p-6">` instead.

**CRITICAL:** Always use CSS variables for theme-aware styling. Never hardcode light colors like `bg-slate-50` or `bg-white` — they break on dark themes.

| Visual Intent | Tailwind Classes |
|---------------|------------------|
| Default | `bg-theme-surface rounded-xl` |
| Subtle | `bg-theme-surface/60 rounded-xl` |
| Outlined | `border border-theme-border rounded-xl` |
| Accent/callout | `border-l-4 border-theme-primary bg-theme-surface rounded-r-xl` |
| Elevated/hero | `bg-theme-surface shadow-lg rounded-xl` |
| Comparison A | `bg-theme-success/20 rounded-xl` |
| Comparison B | `bg-theme-danger/20 rounded-xl` or `bg-theme-info/20 rounded-xl` |

**Variety Rules:**
- Same-level items: Use same styling
- Hierarchy: Mix styles (hero with shadow, supporting with `bg-theme-surface/60`)
- Comparison: Use contrasting theme semantic colors (`bg-theme-success/20`, `bg-theme-danger/20`, `bg-theme-info/20`)
- Across deck: Vary default styles

**Color Budget:** Max 2 distinct background color tokens per slide for cards. Too many colors = visual noise.

**Background Usage:**
- Summary/concept cards: No background needed (use `border` or plain)
- Cards with sub-content (lists, details): Use background color to group content

**Grid Card Minimum:** Each card in a grid MUST contain Title + List(2+) OR Title + Statistic OR Icon + Title + paragraph. A card with just Title + 1 sentence is too sparse — collapse into a simple List instead.

### 2.5 Process-Heavy Content Alternatives

When Steps/Timeline budget exhausted, use these **equally effective** alternatives:

#### 1. Phase Cards (Horizontal Grid)
`grid-cols-3` or `grid-cols-4` with Cards. Each card: number/icon + title + 1-2 bullets.

#### 2. Color Gradient Cards
Cards with progressively changing opacity: `bg-theme-primary/10` → `bg-theme-primary/20` → `bg-theme-primary/30`

#### 3. Numbered List with Subheadings
List where each item has bold number prefix: `1. Discovery — understand user needs`

#### 4. Icon-Driven Phase Cards
Each card has distinct icon: 🔍 Research → ✏️ Design → ⚙️ Build → 🚀 Launch

#### 5. Stacked Sections with Dividers
`flex flex-col gap-6` with distinct Cards per phase, visual dividers between.

#### 6. Arrow/Chevron Layout
Cards styled with CSS borders for directional flow.

**Process Variety Rule:** If deck has 3+ process-intent slides, use ≥2 different representations.

### 2.6 Chart Reference

| Chart | Key Props | Min Height | Recommended Height |
|-------|-----------|------------|-------------------|
| `Line`, `Area` | `data`, `xField`, `yField`, `height` | 280px | 350-450px |
| `Bar` | `data`, `xField` (category), `yField` (value), `height` | 280px | 350-450px |
| `Column` | `data`, `xField`, `yField`, `height` | 280px | 350-450px |
| `Pie` | `data`, `angleField`, `colorField`, `height` | 280px | 350-400px |
| `Funnel` | `data`, `xField`, `yField`, `height` | 350px | 400-500px |
| `Venn` | `data` (`sets`, `size`, `label`), `height` | 350px | 400-500px |
| `Pyramid` | `data` (`label`, `description?`, `value`, `color?`), `height` | 350px | 400-500px |
| `Scatter` | `data` (`label`, `x`, `y`, `color?`), `xLabel`, `yLabel` | 450px | 550-650px |

**Timeline** supports: `items`, `mode` (`left`|`alternate`|`right`), `orientation` (`vertical`|`horizontal`)

#### Chart Sizing
| Use Case | Width | Height |
|----------|-------|--------|
| Full-slide hero (diagram only) | `90%` | 550-650 |
| Diagram + heading only | `90%` | 450-500 |
| Diagram + supporting content | `90%` | 350-400 |
| Main panel (60/40) | `100%` | 400-500 |
| Accent panel (40/60) | `100%` | 300-400 |
| Chart in Card | Omit | 250-350 |

#### Common Mistakes
| Problem | Cause | Fix |
|---------|-------|-----|
| Tiny illegible chart | No height, container collapsed | Add `height: 500+` |
| Chart overflows | Height too large | Reduce height |
| Axis labels cut off | Width too narrow | Use `width: 80%+` |

---

## 3. Text

### 3.1 List Formatting

| Style | Example | When to Use |
|-------|---------|-------------|
| Fragment/phrase | "Zero-latency autocomplete" | Quick scans, capability lists |
| Verb-lead | "Enables offline AI inference" | Action items, benefits |
| Full sentence | "Users can work without connectivity." | Narrative flow |
| Question format | "How do we compete with OS AI?" | Problem framing |
| Numbered sequence | "1. Extract → 2. Process → 3. Deploy" | Ordered steps |

**Rules:**
- Default to fragments or verb-lead
- Same style within a slide
- ≥3 different styles across deck
- Match intent: Capabilities → fragments; Benefits → verb-lead

### 3.2 Text Length Rules

| Container | Words Per Item | Max Items | Total Words |
|-----------|----------------|-----------|-------------|
| 2x2 Grid cell | 8-10 | 2-3 | 25-40 per cell |
| 3-col Grid cell | 10-12 | 3-4 | 30-50 per cell |
| 4-col Grid cell | 6-8 | 2 | 15-25 per cell |
| 30% accent panel | 3-6 per bullet | 2-3 | 15-25 total |
| 40-50% panel | 8-15 per bullet | 3-4 | 40-70 total |
| 60%+ main panel | 12-20 per bullet | 5 | 60-100 total |
| Statistic caption | 3-5 | N/A | N/A |
| Card title | 2-5 | N/A | N/A |
| Alert takeaway | 10-20 | 1 | Single statement |

**Principles:**
1. Smaller container = fewer words, shorter phrases
2. Count columns before writing (3-col = must be scannable)
3. Visual components consume word budget (Card with Statistic → caption only)

### 3.3 Slide Overflow Prevention
**When slide has multiple text-heavy components (cards with lists, tables), apply stricter limits:**

| Slide Composition | Max Items Per List | Max Words Per Item |
|-------------------|--------------------|--------------------|
| Single card/list | 4-5 | 15-20 |
| 2 cards side-by-side | 2-3 | 10-12 |
| 2 cards + ANY other element | 2 | 8-10 |
| 3+ cards on slide | 2 | 6-8 |
| Grid 3-col cards | 2 | 6-8 |
| Grid 2x2 cards | 2 | 6-8 |

**Table limits:** Max 3 rows when table is the ONLY content. Max 2 rows when table shares slide with cards. Truncate action text to 8-10 words.

**Content triage (CRITICAL for `summary` intent):** If storyline has sections + next_steps + callout, choose 2 of 3:
- Sections as cards (primary content)
- Next_steps as simplified list (NOT table) OR omit entirely
- Callout as Alert
- **NEVER render all three at full detail**

**Summary slide rules:**
- `summary` intent slides are HIGH OVERFLOW RISK — default to aggressive triage
- If 2 sections with 3+ bullets each: **reduce each section to 2 bullets max**
- If next_steps exist: convert to 2-item list inside one card, NOT separate table
- If 3+ sections in storyline: render only top 2, or collapse into single list
- **Ending/closing slides:** Prefer clean layout over completeness
- **Bullet text limit:** On summary slides, each bullet should be 6-10 words max (fragment style)

**Overflow resolution order:**
1. Remove Alert/callout first (least critical)
2. Merge next_steps into section card as sub-bullets
3. Reduce bullets per section to 2
4. Shorten bullet text to fragments (5-8 words)
5. If still overflowing: split into 2 slides

### 3.4 Data Integrity
- Use ONLY numbers from source — no invented baselines
- Each data point appears ONCE — Chart shows data, text explains implication
- Dates are not chart values — use Timeline or text
- **NO redundant content** — diagram and text should complement, not repeat each other

### 3.5 Heavy Diagram Pairing
**Heavy diagrams (Pyramid, Funnel, Venn, Scatter) demand visual space.** When paired with text:

| Pairing | Allowed | Diagram Height |
|---------|---------|----------------|
| Diagram only | ✅ Full slide | 500-600px |
| Diagram + heading/subtitle | ✅ | 450-500px |
| Diagram + supplementary text (non-redundant) | ✅ | 350-400px |
| Diagram + text that repeats diagram labels | ❌ Redundant | — |
| Diagram + dense content (2-col grid, 3+ bullets) | ❌ Overflow | — |

**Complementary content rule:** Text should add NEW information not visible in diagram:
- ✅ Diagram shows hierarchy → Text explains implications or next steps
- ✅ Diagram shows structure → Text provides supporting evidence or context
- ❌ Diagram label: "Local inference + RAG" → Text: "Local inference + local RAG: privacy..."

### 3.6 Pyramid Text Format
Pyramid layers use **title + description** pattern to avoid text overflow:
- `label`: Short title (2-4 words max, bold, larger font) — e.g., "Platform foundation"
- `description`: Longer explanation (optional, muted, smaller font) — e.g., "local-first + hybrid compute"

**ALWAYS split long text:** If original text is >5 words, extract the key concept as `label` and put the rest in `description`.

Labels display on alternating sides with dashed connector lines.

---

## 4. Styling

### 4.1 Icons

**Use icons to add visual interest**, especially on `structure` intent slides with 3+ cards. 1-2 icons per card. Import from `@ant-design/icons`.

| Purpose | Icon |
|---------|------|
| Privacy/Security | `<LockOutlined />`, `<SafetyOutlined />` |
| Speed/Performance | `<ThunderboltOutlined />`, `<RocketOutlined />` |
| Success/Positive | `<CheckCircleOutlined />`, `<CheckOutlined />` |
| Problem/Negative | `<CloseCircleOutlined />`, `<WarningOutlined />` |
| Timeline phases | `<FlagOutlined />`, `<CalendarOutlined />` |
| Integration | `<ApiOutlined />`, `<LinkOutlined />` |

### 4.2 Typography

| Element | Component | Size Token |
|---------|-----------|------------|
| Cover title | `Typography.Title level={1}` | `var(--theme-size-display)` |
| Slide heading | `Typography.Title level={2}` | `var(--theme-size-heading)` |
| Section heading | `Typography.Title level={3}` or `level={4}` | — |
| Body text | `List`, `Typography.Paragraph` | `var(--theme-size-body)` |
| Captions | `Typography.Text type="secondary"` | `var(--theme-size-caption)` |

**Rules:**
- **Slide heading belongs at slide root, not inside Card** — `Typography.Title level={2}` should be a direct child of the slide container
- Body text must be noticeably smaller than headings
- Never use `size="small"` for List
- `type="secondary"` only for attributions/captions
- Limit Timeline/Steps to 3-4 items for readable spacing

### 4.3 Inline Emphasis

| Purpose | How to Apply |
|---------|--------------|
| Key term | `<Text strong>` or `<strong>` |
| Highlighted metric | `<Text mark>` |
| Semantic color | `<Text type="success|warning|danger">` |

**Emphasis should be selective.** 1-2 per slide max.

### 4.4 Colors & Patterns

**CRITICAL:** Use theme variables for colors to support both light and dark themes.

#### Safelisted Utility Classes (Preferred)
These classes are pre-defined and guaranteed to work:
```
Background: bg-theme-bg, bg-theme-surface, bg-theme-surface-alt, bg-theme-primary, bg-theme-secondary, bg-theme-accent
            bg-theme-success, bg-theme-danger, bg-theme-warning, bg-theme-info
            bg-theme-accent1, bg-theme-accent2, bg-theme-accent3, bg-theme-accent4, bg-theme-accent5, bg-theme-accent6
Text:       text-theme-text, text-theme-text-muted, text-theme-primary, text-theme-secondary, text-theme-accent
            text-theme-success, text-theme-danger, text-theme-warning, text-theme-info
Border:     border-theme-border, border-theme-primary, border-theme-secondary, border-theme-accent
            border-theme-success, border-theme-danger, border-theme-warning, border-theme-info
```

#### Semantic Colors (use when meaning matters)
| Color | Meaning |
|-------|--------|
| `bg-theme-success` or `bg-theme-success/20` | Positive, solution, our approach |
| `bg-theme-danger` or `bg-theme-danger/20` | Problem, risk, competitor |
| `bg-theme-warning` or `bg-theme-warning/20` | Caution, timeline, attention |
| `bg-theme-info` or `bg-theme-info/20` | Neutral info, stats, context |

#### Accent Colors (use for visual variety without semantic meaning)
| Color | Use case |
|-------|----------|
| `bg-theme-accent1` or `bg-theme-accent1/20` | Primary accent (matches primary) |
| `bg-theme-accent2` or `bg-theme-accent2/20` | Secondary accent (orange/warm) |
| `bg-theme-accent3` or `bg-theme-accent3/20` | Tertiary accent |
| `bg-theme-accent4` or `bg-theme-accent4/20` | Fourth accent (cyan/cool) |
| `bg-theme-accent5` or `bg-theme-accent5/20` | Fifth accent (purple) |
| `bg-theme-accent6` or `bg-theme-accent6/20` | Sixth accent (green) |

**When to use accents vs semantics:**
- **Semantics** (success/danger/warning/info): When color conveys meaning (good/bad/caution)
- **Accents** (accent1-6): When you need variety without implying meaning (categories, steps, teams)

#### Surface & Background
| Token | Use |
|-------|-----|
| `bg-theme-surface` | Default card background |
| `bg-theme-bg` | Page background (rarely needed) |
| `bg-theme-primary/20` | Primary-tinted background |
| `border-theme-border` | Card/section borders |

#### Text Colors
| Token | Use |
|-------|-----|
| `text-theme-text` | Primary text (default, rarely needed) |
| `text-theme-text-muted` | Secondary/caption text |
| `text-theme-primary` | Emphasized links, highlights |
| `text-theme-accent1` | Accent-colored text |
| `text-theme-success` | Positive values, gains |
| `text-theme-danger` | Negative values, losses |

#### Complete Token Reference
```
Background:  --theme-bg, --theme-surface
Text:        --theme-text, --theme-text-muted
Brand:       --theme-primary, --theme-secondary, --theme-accent
Semantic:    --theme-success, --theme-danger, --theme-warning, --theme-info
Accents:     --theme-accent1, --theme-accent2, --theme-accent3, --theme-accent4, --theme-accent5, --theme-accent6
Utility:     --theme-border, --theme-shadow-sm, --theme-shadow-md, --theme-shadow-lg
Radius:      --theme-radius-sm, --theme-radius-md, --theme-radius-lg
```

**CRITICAL: Never use hardcoded colors** like `bg-slate-50`, `text-gray-600`, `#ffffff`. Always use theme tokens.

**Theme shadows:** `--theme-shadow-sm`, `--theme-shadow-md`, `--theme-shadow-lg`

### 4.5 Sibling Consistency

**Typography levels must match across siblings:**
- Cards in same row use SAME heading level
- For emphasis, vary card styling (border, background) — NOT heading level

**Grid alignment:**
- All cards in row should have similar content structure
- Empty space should be intentional

### 4.6 Density Targets

| Density | Elements | Coverage |
|---------|----------|----------|
| sparse | 2-3 | 40-60% |
| moderate | 4-5 | 60-80% |
| dense | 5-7 | 70-90% |

---

## Output Format

Wrap each slide in `<Slide id="slide_XX" rank={N}>`. The MCP tool merges into existing slide objects.

**Required:** `id` (matches draft), `rank` (order), JSX content inside.

**Wrapper pattern:** `<div className="flex flex-col justify-center h-full gap-6">` for vertical centering.
