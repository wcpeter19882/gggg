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

## Workflow (ATOMIC)

1. **Read** all context with ONE call: `mcp_apply-patch_read_section(section="all")`
2. **Plan layout variety** — assign layouts to ALL slides before generating (see Layout Variety Rules)
3. **Generate** JSX for ALL slides in memory (use `content.image` if specified)
4. **Save** all slides with ONE call: `mcp_apply-patch_apply_patch(target="slides", data=[...])`
5. **Return** with slides summary

**IMPORTANT:** When saving slides as a list of objects, use the `mdx` field for JSX content (NOT `layout`). The MCP tool will merge with existing slide fields.

Project path: `%TEMP%/content-manager/{project_id}/` (Windows) or `/tmp/content-manager/{project_id}/` (Unix)

---

## Slides summary

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
- Diagrams used: [Venn, Steps, Timeline, etc.]
- Images used: X slides (list which images on which slides)

Layout Usage:
- Centered: X (Cover, Closing)
- Split 50/50: X (max 3)
- Split 60/40: X
- Split 70/30: X
- Grid 2x2: X (max 2)
- T-Shape: X
- L-Shape: X
- Stacked: X
- Other: X

✓ No consecutive repeats
✓ Variety constraints met
✓ Visual balance met
```

---

## 1. Layout

### Layout Patterns

Layouts are grouped by **symmetry** to enable variety planning. Use `intent` from slide to filter candidates, then select based on content.

#### Symmetric Layouts (max 40% of deck)
| Intent | Pattern | Layout | Structure | Best For | Constraints |
|--------|---------|--------|-----------|----------|-------------|
| statement | section-break | **Centered** | `flex items-center justify-center h-full` | Cover, closing, single visual | `max-w-{5xl-7xl}` on content wrapper |
| statement | quote, callout | **Billboard** | `flex flex-col justify-center items-center h-full text-center px-16` | Statement, quote, transition | Label above, hero center, attribution below |
| hierarchy | pyramid, funnel | **Centered** | `flex items-center justify-center h-full` | Hierarchy visualization | Use Pyramid/Funnel component |
| overlap | venn | **Centered** | `flex items-center justify-center h-full` | Intersection concepts | Use Venn component |
| comparison | side-by-side, pros-cons, risk-mitigation | **Split 50/50** | `grid grid-cols-2 gap-6 h-full` | Two equal items, comparison | — |
| structure, matrix | pillars-4, quadrant | **Grid 2x2** | `grid grid-cols-2 grid-rows-2 gap-4` | 4 equal items | — |
| structure, evidence | pillars-3, icon-grid, kpi-dashboard | **Grid 3-col** | `grid grid-cols-3 gap-4` | 3 equal items | — |

#### Asymmetric Layouts (min 40% of deck)
| Intent | Pattern | Layout | Structure | Best For | Constraints |
|--------|---------|--------|-----------|----------|-------------|
| evidence, focal | chart-bullets, hero-left | **Split 60/40** | `grid-cols-5` → `col-span-3` + `col-span-2` | Visual + explanation | — |
| focal | accent | **Split 70/30** | `grid-cols-10` → `col-span-7` + `col-span-3` | Content + accent | — |
| focal | hero-right | **Split 40/60** | `grid-cols-5` → `col-span-2` + `col-span-3` | Accent + visual | — |
| evidence | — | **L-Shape** | `grid-cols-3` → `col-span-2` left + stacked right | Main + 2 accents | — |
| comparison, process, summary | cost-benefit, roadmap, next-steps | **T-Shape** | Full-width header + `grid-cols-3` below | Title + 3 columns | 4+ items per side |
| — | — | **Sidebar Left** | `grid-cols-4` → `col-span-1` + `col-span-3` | Nav/TOC + content | — |
| — | — | **Sidebar Right** | `grid-cols-4` → `col-span-3` + `col-span-1` | Content + aside | — |

#### Compound Layouts (use 1-2 per deck for visual breaks)
| Intent | Pattern | Layout | Structure | Best For | Constraints |
|--------|---------|--------|-----------|----------|-------------|
| process, summary | steps, timeline, closing | **Stacked 2** | `flex flex-col gap-6` with 2 sections | Process with Steps/Timeline | — |
| hierarchy | layers | **Stacked 3** | `flex flex-col gap-4` with 3 sections | Title + 2 content blocks | — |
| comparison | cost-benefit | **Grid 2+1** | `grid-cols-2` top + full-width bottom | 2 items + summary Alert | — |
| summary | — | **Grid 1+2** | Full-width top + `grid-cols-2` bottom | Header + 2 details | — |
| structure | — | **Grid 4-col** | `grid grid-cols-4 gap-4` | 4+ small items | — |
| overlap | hub-spoke | **Bento** | `grid-cols-12` + varied `col-span-*` | Mixed sizes, feature showcase | — |
| — | — | **Masonry** | `grid-cols-3` + varied `row-span-*` | Visual variety | — |

### Using Images from Content

If `content.images` array is specified (max 3), decide rendering based on `aspect_ratio` and slide type:

| Aspect Ratio | Recommended Rendering | Panel Width |
|--------------|----------------------|-------------|
| 16:9, 21:9 | Full background with overlay, or 60%+ hero panel | ≥60% |
| 4:3, 3:2 | 50/50 or 60/40 split panel, `object-cover` | 40-60% |
| 1:1 | Small accent in Card (64-128px), inline with content | ≤40% |
| 2:3, 9:16 | Sidebar panel or narrow accent column | ≤30% |

**Multiple images:**
- 1 image: Use as hero, background, or accent based on aspect ratio
- 2 images: Split layout or primary + accent
- 3 images: Grid, or 1 hero + 2 accents

**Image path:** `/api/project-image/{project_id}/images/{filename}`

### Design System Compliance

**Layout layer uses Tailwind + `<div>` only** — `grid`, `flex`, `gap-*`, `h-full`, `col-span-*`

**FORBIDDEN (Ant Design layout components):** `Row`, `Col`, `Layout`, `Sider`, `Content`, `Flex` — these belong to Ant Design's layout system, not ours.

### Slide Canvas Rule (CRITICAL)

**Slides are fixed 16:9 canvases, not scrolling pages.** Content must be vertically centered.

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `flex flex-col h-full` (top-aligned) | `flex flex-col justify-center h-full` |
| Grid columns without centering | Each column: `flex flex-col justify-center` |

**Exception:** Only top-align when content fills 80%+ of vertical space.

### Void Prevention Rules

**Minimum content per panel:**
- **≤30% width**: 1 Heavy OR 1 Medium + 1 line
- **40-50% width**: 1 Heavy + caption OR 1 Medium + 3 items OR heading + 3 bullets
- **≥60% width**: Heading + 4+ items OR 2 paragraphs OR Heavy + explanation

**If panel is sparse → shrink it or merge content**

| ✅ Correct | ❌ Wrong |
|-----------|---------|
| 70/30 split: Title + List (4 items) left, Statistic accent right | 50/50 with single Statistic in 50% panel |
| Tailwind grid: `grid-cols-2`, `col-span-7` | Ant Design: `Row`, `Col`, `Layout` |

### Layout Variety Rules (CRITICAL)

**Why variety matters:** Repeating the same layout (e.g., 50/50 + Grid 2x2 across all slides) creates visual monotony that signals "template-generated" rather than "designed." Executive audiences subconsciously disengage.

#### Hard Constraints

| Rule | Constraint |
|------|------------|
| **No consecutive repeats** | Never use the same layout pattern twice in a row |
| **Symmetric cap** | Max 40% of slides can use symmetric layouts (50/50, Grid 2x2, Centered, Grid 3-col) |
| **Asymmetric floor** | Min 40% of slides must use asymmetric layouts (60/40, 70/30, L-Shape, T-Shape, Sidebar) |
| **Grid 2x2 limit** | Max 2 instances of Grid 2x2 per deck |
| **50/50 limit** | Max 3 instances of Split 50/50 per deck |

#### Pre-Generation Planning

Before generating JSX, plan ALL slides with:
1. **Layout** — which pattern (60/40, T-Shape, etc.)
2. **Visual component** — diagram, chart, or text-only
3. **Word budget** — based on container sizes

Then verify: symmetric ≤40%, asymmetric ≥40%, no consecutive repeats.

#### Visual Rhythm Guidance

| Position | Recommended Layouts | Rationale |
|----------|--------------------|-----------|
| **Cover/Closing** | Centered | Clean, focused |
| **After 50/50** | 60/40 or 70/30 or T-Shape | Break symmetry |
| **After Grid 2x2** | Stacked, L-Shape, or 60/40 | Change visual weight distribution |
| **Consecutive "Answer" slides** | Alternate between asymmetric patterns | Prevent fatigue |
| **Process/Timeline slides** | Stacked 2 with Steps, or T-Shape | Full-width process visibility |

### Visual Balance Quota (CRITICAL)

**Why this matters:** Slides filled only with Lists and Cards feel like "documents on screen" — rigid, text-heavy, and unengaging. Executive audiences expect visual storytelling, not reading material.

#### Hard Constraints

| Rule | Constraint |
|------|------------|
| **Heavy visual floor** | Min 30% of slides must contain a Heavy component (Chart, Diagram, or Mockup) |
| **Text-only ceiling** | Max 40% of slides can be text-only (Lists + Cards without Heavy/Medium visuals) |
| **Concept-to-Visual mandate** | If content describes a relationship pattern, use the matching diagram component |

#### Concept-to-Visual Mapping (Mandatory)

When slide content describes these patterns, you **MUST** use the corresponding visual component — do NOT render as text Cards or Lists:

| Content Pattern | Required Visual | Example Trigger Phrases |
|-----------------|-----------------|-------------------------|
| Overlapping concepts | `<Venn />` | "intersection of", "overlap between", "both A and B" |
| Hierarchy/layers | `<Pyramid />` | "foundation", "layers", "builds upon", "hierarchy" |
| Conversion/stages | `<Funnel />` | "funnel", "conversion", "stages narrow", "pipeline" |
| 2D positioning | `<Matrix />` | "quadrant", "high/low", "axes", "positioning" |
| Trend over time | `<Line />` or `<Area />` | "growth", "trend", "over time", "trajectory" |
| Comparison quantities | `<Bar />` or `<Column />` | "compare", "vs", "relative size" |
| Proportions | `<Pie />` | "share", "breakdown", "percentage of total" |
| Sequential process | `<Steps />` or `<Timeline />` | "step 1/2/3", "then", "workflow", "process" |
| Hub-and-spoke | Centered card + surrounding cards | "central", "radiates", "connects to" |

#### When Text-Only is Acceptable

- **Cover/Closing slides** — minimal by design
- **Comparison slides** — side-by-side Cards with contrasting colors ARE visual
- **Quote/Callout slides** — large typography IS the visual
- **No matching diagram exists** — e.g., qualitative benefits without relationships

---

## 2. Components

### Story Element Mapping

**Prefer visual over textual** — when a story element CAN be shown as a diagram, it MUST be.

| Story Element | Component | Styling |
|---------------|-----------|---------|
| HEADLINE | `Typography.Title level={2}` | Bold, no emoji |
| NARRATIVE | `Typography.Paragraph` (20-40 words) | Regular weight |
| DETAIL | `List` | `**Key phrase** — explanation` (optional icon prefix) |
| EVIDENCE (number) | `Statistic` or Chart | Chart left + bullets right (50/50 split) |
| EVIDENCE (flow) | `Steps` or `Timeline` | Or phase Cards for roadmaps |
| TAKEAWAY | `Alert` in colored box | `type="info"` at bottom of slide |
| COMPARISON | Side-by-side Cards | Contrasting `bg-*-50` tints |

### Components (Ant Design 6.x API)

Components are classified by **visual weight** — use this to match content to layout.

#### Heavy (40-60% of slide) — Use for split main panel or full-width
| Component | Source | Notes |
|-----------|--------|-------|
| `Line`, `Bar`, `Column`, `Pie`, `Area` | `@/components/antd` | Charts — ONE per slide max |
| `Funnel`, `Radar` | `@/components/antd` | Diagrams |
| `Venn` | `@/components/antd` | Overlapping concepts |
| `Pyramid` | `@/components/antd` | Hierarchy visualization |
| `Scatter` | `@/components/antd` | 2D positioning with quadrant labels (BCG matrix, priority matrix) |
| UI Mockup | Custom | Browser chrome + interface |

#### Medium (30-40% of slide) — Pair with text OR group multiple
| Component | Source | Notes |
|-----------|--------|-------|
| `Statistic` | `@/components/antd` | **Only if 2+ grouped OR with supporting list** |
| `Timeline` | `@/components/antd` | Needs 3+ items. Supports `orientation="horizontal"` |
| `Steps` | `@/components/antd` | Needs 3+ steps |
| `Table` | `@/components/antd` | Needs 3+ rows |
| `Card` grid | `@/components/antd` | Needs 2+ cards |
| `Progress` | `@heroui/react` | Progress bars |
| `CircularProgress` | `@heroui/react` | Circular indicators |

#### Light (inline only) — Never use alone to fill a panel
| Component | Source | Notes |
|-----------|--------|-------|
| `Tag`, `Badge` | `@/components/antd` | Labels, inline decoration |
| `Alert` | `@/components/antd` | Single takeaway — ONE per slide |
| `Descriptions` | `@/components/antd` | Key-value pairs inline |
| Single `Statistic` | `@/components/antd` | Use as inline callout, not panel filler |

#### Text (weight depends on quantity)
| Component | Source | Weight |
|-----------|--------|--------|
| `Typography.Title` | `@/components/antd` | Light (heading only) |
| `Typography.Paragraph` | `@/components/antd` | Light-Medium (depends on length) |
| `List` | `@/components/antd` | Medium if 3+ items, Light if 1-2 |

**Timeline** supports: `items`, `mode` (`left`|`alternate`|`right`), `orientation` (`vertical`|`horizontal`)

### List vs Table vs Steps vs Timeline (CRITICAL)

Choose based on **the relationship you're showing**:

| Component | Core Relationship | The Question It Answers | Reorderable? |
|-----------|------------------|------------------------|--------------|
| **List** | Membership | "What items belong to this group?" | Yes |
| **Table** | Attributes | "What are the properties of each item?" | Yes |
| **Steps** | Dependency | "What must happen in sequence?" | No |
| **Timeline** | Temporality | "When did/will things happen?" | No |

**Reorderability test:** If items can be swapped without changing meaning, use List or Table. If order matters (temporal or dependency), use Timeline or Steps.

### Component Selection (with Weight)

| Content Type | Component | Weight | Constraint |
|--------------|-----------|--------|------------|
| Hero number | `Statistic` | **Light** alone, **Medium** if 2+ | Only for metrics (%, $, users) — never counts or dates |
| Multiple KPIs | `Statistic` in `grid` | **Medium** | 3-6 related metrics in Tailwind grid |
| Bullet points | `List` | **Light** (2 items), **Medium** (3+) | Vary style per slide (see List Formatting Variety) |
| Structured items | `Table` | **Medium** | Use when items have 2+ attributes to cross-reference |
| Process flow | `Steps` | **Medium** | Horizontal for simple, vertical with descriptions |
| Timeline/Roadmap | `Timeline` or Cards | **Medium** | Phase cards (Q1, Q2) with nested bullets inside |
| Comparison data | `Bar`/`Line`/`Pie` | **Heavy** | **ONE chart per slide max** |
| Diagrams | `Venn`/`Scatter`/`Pyramid` | **Heavy** | Use for conceptual relationships |
| Feature cards | `Card` in grid | **Medium** (2+) | Rounded with `bg-*-50` tint, icon bullets inside |
| Comparison | Side-by-side Cards | **Medium** | Contrasting tints (green vs red, blue vs gray) |
| Takeaway | `Alert` | **Light** | **ONE per slide** — key insight box at bottom |
| Labels | `Tag`/`Badge` | **Light** | Inline decoration |

### Alert Discipline (CRITICAL)

**Alert is a "stop and think" signal — not a slide summary.** Use only when the audience must remember or act on something the content alone doesn't convey. If removing the Alert loses no information, remove it. Max 25% of slides should have an Alert; if every slide ends with one, you've trained the audience to ignore them.

### Chart Props

| Chart | Key Props | Notes |
|-------|-----------|-------|
| `Line`, `Bar`, `Column`, `Area` | `data`, `xField`, `yField`, `height` | Standard time-series/comparison |
| `Pie` | `data`, `angleField`, `colorField`, `height` | Proportions |
| `Venn` | `data` (array with `sets`, `size`, `label`), `height` | Overlapping concepts |
| `Pyramid` | `data` (array with `label`, `value`, `color?`), `height` | Hierarchy layers, top-down |
| `Scatter` | `data` (array with `label`, `x`, `y`, `color?`), `xLabel`, `yLabel` | Quadrant dividers auto-drawn at x=50, y=50 |

### Chart & Diagram Sizing (CRITICAL)

Charts use `autoFit` by default — they size to their container. Small containers cause small, illegible charts.

#### Sizing Pattern

**Wrap chart in a `<div>` with explicit `style={{ width, height }}`:**

| Use Case | Container Width | Container Height | Rationale |
|----------|-----------------|------------------|-----------|
| **Full-slide hero chart** | `'90%'` | `550-650` | Maximum impact, minimal surrounding content |
| **Main panel chart (60/40)** | `'100%'` | `400-500` | Chart fills its split panel |
| **Accent chart (40/60)** | `'100%'` | `300-400` | Smaller but still readable |
| **Chart in Card** | Omit (fill Card) | `250-350` | Card provides container |

#### Common Sizing Mistakes

| Problem | Cause | Fix |
|---------|-------|-----|
| **Tiny chart with illegible text** | No explicit height, container collapsed | Add `height: 500+` to wrapper `<div>` |
| **Chart overflows slide** | Height too large for layout | Reduce height, check other content spacing |
| **Axis labels cut off** | Width too narrow | Use `width: '80%'+` for charts with long axis labels |
| **Dots/lines too small** | Chart auto-scales to small container | Increase container dimensions |

#### Minimum Dimensions

| Chart Type | Minimum Height | Recommended Height |
|------------|----------------|-------------------|
| `Scatter` (quadrant) | 450px | 550-650px |
| `Line`, `Bar`, `Area` | 280px | 350-450px |
| `Pie` | 280px | 350-400px |
| `Venn`, `Pyramid`, `Funnel` | 350px | 400-500px |

---

## 3. Wording (Text & Readability)

### List Component API (CRITICAL)

**List requires `dataSource` and `renderItem` props.** Nested `<List.Item>` children are ignored by the shadow component.

### List Discipline
- **Single-item lists are FORBIDDEN** — use `Typography.Paragraph` instead
- Card = Title + Paragraph OR Title + List(2+ items) — never Title + List(1 item)
- **List.Item content must use Typography.Paragraph** — this allows inline emphasis with nested Typography.Text using mark, strong, or type props naturally within the sentence

### List Formatting Variety (CRITICAL)

**Problem:** Using the same list style for every slide creates rigid, templated appearance. Vary list styles based on content type and slide purpose.

#### List Style Options (Choose Based on Content)

| Style | Example | When to Use |
|-------|---------|-------------|
| **Fragment/phrase** | "Zero-latency autocomplete" | Quick scans, capability lists, feature grids |
| **Verb-lead** | "Enables offline AI inference" | Action items, benefits, capabilities |
| **Full sentence** | "Users can work without network connectivity." | Narrative flow, explanations |
| **Question format** | "How do we compete with OS AI?" | Problem framing, audience engagement |
| **Numbered sequence** | "1. Extract → 2. Process → 3. Deploy" | Ordered steps, priorities |

#### Variety Rules (CRITICAL)

- **Default to fragments or verb-lead** — these feel natural, not templated
- **Within a single slide:** All list items should use the SAME style for consistency
- **Across slides:** Use at least 3 DIFFERENT list styles across the deck
- **Match content intent:** Capabilities → fragments; Benefits → verb-lead; Explanations → full sentences

### Container-Aware Text Length (CRITICAL)

**Problem:** Writing the same amount of text regardless of container size causes overflow, cramped layouts, or sparse voids. Text length must adapt to available space.

#### Word Budgets by Container

| Container Type | Word Budget Per Item | Total Words in Container |
|----------------|---------------------|--------------------------|
| **2x2 Grid card** | 6-10 words | 25-40 words per card |
| **3-col Grid card** | 8-12 words | 30-50 words per card |
| **30% accent panel** | 3-6 words per bullet | 15-25 words total |
| **40-50% panel** | 8-15 words per bullet | 40-70 words total |
| **60%+ main panel** | 12-20 words per bullet | 60-100 words total |
| **Full-width card** | 15-25 words per bullet | 80-150 words total |
| **Statistic caption** | 3-5 words | N/A |
| **Card title** | 2-5 words | N/A |
| **Alert takeaway** | 10-20 words | Single statement |

#### Adaptation Principles

1. **Smaller container = fewer words, shorter phrases**
   - Narrow cards: Use fragments (3-5 words)
   - Wide panels: Use full phrases with context (12-20 words)

2. **Count your columns before writing**
   - 2-col layout: Each side gets ~50% attention, moderate density
   - 3-col layout: Each column gets ~33%, must be scannable
   - 4-col or 2x2: Each cell gets ~25%, use fragments only

3. **Hierarchy trades off with quantity**
   - Narrow space: Use title + 2-3 fragments (no nested lists)
   - Wide space: Use title + paragraph + detailed list

4. **Visual components consume word budget**
   - Card with icon: Reduce text by 10-15%
   - Card with Statistic: Text becomes caption only (5-10 words)
   - Card with chart: Adjacent text is interpretation, not description

### Data Integrity
- Use ONLY numbers from source — no invented baselines or filler
- Each data point appears ONCE — Chart shows data, text explains implication
- Dates are not chart values — use Timeline or text

---

## 4. Styling

### Visual Design & Icon Usage
- **Use Ant Design icons** — `@ant-design/icons` follows theme tokens
- **Icons are optional** — use sparingly for visual anchors (1-2 per card max)
- **Strategic use:** Phase headers, contrast pairs, key differentiators
- **Syntax:** `<RocketOutlined />`, `<LockOutlined />`, `<CheckCircleOutlined />`

Common icons:
| Purpose | Icon |
|---------|------|
| Privacy/Security | `<LockOutlined />`, `<SafetyOutlined />` |
| Speed/Performance | `<ThunderboltOutlined />`, `<RocketOutlined />` |
| Success/Positive | `<CheckCircleOutlined />`, `<CheckOutlined />` |
| Problem/Negative | `<CloseCircleOutlined />`, `<WarningOutlined />` |
| Timeline phases | `<FlagOutlined />`, `<CalendarOutlined />` |
| Integration | `<ApiOutlined />`, `<LinkOutlined />` |

### Typography Hierarchy (CRITICAL)

**Body text must be noticeably smaller than headings** — not nearly the same size.

| Element | Component | Prop |
|---------|-----------|------|
| Heading | `Typography.Title` | `level={2}` or `level={3}` |
| Body text | `List`, `Typography.Paragraph` | ~0.8x of Heading |
| Captions | `Typography.Text` | ~0.6x of Heading |

- **Never use `size="small"` for List** — body text becomes too small relative to headings
- Use `type="secondary"` only for attributions and captions, never body content
- **List.Item content must use `Typography.Text`** — raw text/JSX fragments inherit browser defaults

### Timeline & Steps Typography (CRITICAL)

**Slides are viewed from distance on 1080p screens.** Use presentation-scale typography, not web defaults.

| Element | Minimum Font Size | Recommended Approach |
|---------|------------------|---------------------|
| Timeline item title | 32px | Typography.Title level={4} or explicit fontSize style |
| Timeline item description | 28px | Typography.Paragraph with fontSize: 28 style |
| Steps title | 32px | Typography.Title level={4} |
| Steps description | 28px | Explicit fontSize style, avoid type="secondary" |

Limit Timeline/Steps to 3-4 items maximum to maintain readable spacing.

### Text Styling & Inline Emphasis

Use inline emphasis sparingly to draw attention to key terms — 1-2 per slide maximum.

| Purpose | How to Apply |
|---------|--------------|
| Key term emphasis | Wrap the important word in `<strong>` inside Typography.Text |
| Highlighted metric | Use Typography.Text with the `mark` prop for yellow highlight |
| Semantic color | Use Typography.Text with `type` prop: `success` (green), `warning` (orange), `danger` (red) |

Typography.Text supports `mark`, `strong`, `underline`, `delete`, `code`, and `type` props for inline styling. Prefer Ant Design props over raw HTML for consistent theming.

**Emphasis should be selective.** If every sentence has a highlighted word, nothing stands out.

### Card Pattern (Color System)

**Color meanings:**
- `bg-green-50` — our approach, positive, solution
- `bg-red-50` — competitor, problem, risk  
- `bg-blue-50` — neutral info, stats
- `bg-amber-50` — timeline phases, warnings

### Sibling Consistency (CRITICAL)

When components appear as siblings in a grid or row, they must maintain visual consistency.

**Typography levels must match across siblings:**
- Cards in the same row use the SAME heading level for titles
- If one card needs emphasis, use card styling (border weight, background intensity, accent color) — NOT a different heading level
- Breaking heading level consistency creates visual noise that signals amateur design

**Card styling for emphasis (instead of heading changes):**
- Primary/hero card: thicker border, stronger background tint, accent border color
- Secondary cards: thinner border, lighter background tint, neutral border
- All cards still use the same Typography.Title level

**Grid alignment consistency:**
- All cards in a row should have similar content structure (title + paragraph, or title + list)
- If one card has significantly more content, consider splitting it or condensing others
- Empty space should be intentional, not a side effect of uneven content

**Card as content group:** `Card className="bg-{color}-50 rounded-xl"` containing:
- `Typography.Title level={3}` or `level={4}` for section header  
- `List` with fragments or verb-lead phrases (vary style across slides)
- Optional: `<LockOutlined />` prefix for key items (1-2 per card max)

### Density Targets

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
