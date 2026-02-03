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

This returns constitution, source files, theme, and draft slides. Use this data to:
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
| Symmetric | comparison | side-by-side | Split 50/50 | `grid grid-cols-2 gap-6 h-full` | Two equal items | Max 2 per deck |
| Symmetric | structure | pillars-4, quadrant | Grid 2x2 | `grid grid-cols-2 grid-rows-2 gap-4` | 4 equal items | Max 2 per deck |
| Symmetric | structure | pillars-3, kpi | Grid 3-col | `grid grid-cols-3 gap-4` | 3 equal items | Max 3 per deck |
| **Asymmetric** | evidence, focal | 1 main + 1 support | Split 60/40 | `grid-cols-5` → `col-span-3` + `col-span-2` | Visual + explanation | Max 3 per deck |
| Asymmetric | focal | 1 main + 1 accent | Split 70/30 | `grid-cols-10` → `col-span-7` + `col-span-3` | Content + callout | Max 2 per deck |
| Asymmetric | focal | 1 accent + 1 main | Split 40/60 | `grid-cols-5` → `col-span-2` + `col-span-3` | Lead with accent | Max 3 per deck |
| Asymmetric | evidence | 1 main + 2 accents | L-Shape | `grid-cols-3` → `col-span-2` + stacked | Main + 2 details | ≥1 required (10+ slides) |
| Asymmetric | structure, process | Header + 3 parts | T-Shape | Full-width row + `grid-cols-3` | Section intro + 3 pillars | ≥1 required |
| Asymmetric | — | TOC + main | Sidebar Left | `grid-cols-4` → `col-span-1` + `col-span-3` | Agenda + content | — |
| Asymmetric | — | Main + aside | Sidebar Right | `grid-cols-4` → `col-span-3` + `col-span-1` | Content + callout | — |
| **Compound** | process, summary | flow | Stacked 2 | `flex flex-col gap-6` with 2 sections | Numbered List | ≥1 required (8+ slides) |
| Compound | hierarchy | layers | Stacked 3 | `flex flex-col gap-4` with 3 sections | Title + 2 blocks | — |
| Compound | comparison | cost-benefit | Grid 2+1 | `grid-cols-2` top + full-width bottom | 2 items + summary | — |
| Compound | summary | — | Grid 1+2 | Full-width top + `grid-cols-2` bottom | Header + 2 details | — |
| Compound | structure | — | Grid 4-col | `grid grid-cols-4 gap-4` | 4+ small items | — |
| Compound | overlap | hub-spoke | Bento | `grid-cols-12` + varied `col-span-*` | Mixed sizes | — |

**Selection priority:** Match content structure first, then intent.

**MANDATORY:** Every column in split/grid layouts must use `flex flex-col justify-center` — this applies to BOTH main AND sidebar columns.

### 1.2 Layout Rules

#### Forbidden Display Elements
- `content.category` (Situation, Complication, Question, Answer) — narrative metadata only
- Image descriptions — use as `alt` attribute only
- Transition fields (`transition_from`, `transition_to`) — internal structure only
- **Ordinal structural labels** ("Pillar 1", "Step 1", "Point 1") — position implies structure
- Semantic prefixes ("Punchline:", "Takeaway:") — formatting signals importance

#### Source References
References appear as superscript numbered links: [1], [2], etc. Place inline after the claim they support.

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

#### Design System Compliance
**Layout layer uses Tailwind + `<div>` only** — `grid`, `flex`, `gap-*`, `h-full`, `col-span-*`

**FORBIDDEN:** `Row`, `Col`, `Layout`, `Sider`, `Content`, `Flex` (Ant Design layout components)

#### Slide Canvas Rule
**Slides are fixed 16:9 canvases, not scrolling pages.** Content must be vertically centered.

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `flex flex-col h-full` | `flex flex-col justify-center h-full` |
| Grid columns without centering | Each column: `flex flex-col justify-center` |
| `items-stretch` on grid | `items-center` on grid container |

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

### 1.4 Pre-Generation Planning (MANDATORY)

**STOP. Before generating any JSX, output this budget plan:**

```
=== HEAVY DIAGRAM BUDGET ===
Pyramid: □ (max 1 — slide: ___)
Funnel: □ (max 1 — slide: ___)
Venn: □ (max 1 — slide: ___)
Scatter: □ (max 1 — slide: ___)
Steps: □ (max 1 — slide: ___)
Timeline: □ (max 1 — slide: ___)

=== LAYOUT BUDGET ===
50/50: 0/2 (slides: ___)
60/40: 0/3 (slides: ___)
70/30: 0/2 (slides: ___)
Grid 2x2: 0/2 (slides: ___)
Grid 3-col: 0/3 (slides: ___)
T-Shape: ≥1 (slides: ___)
L-Shape: ≥1 for 10+ (slides: ___)
Stacked: ≥1 for 8+ (slides: ___)
```

**Verify:** No consecutive repeats, all budgets respected, requirements met.

### 1.5 Visual Rhythm Guidance

| Position | Recommended | Rationale |
|----------|-------------|-----------|
| Cover/Closing | Centered | Clean, focused |
| After 50/50 | 60/40, 70/30, or T-Shape | Break symmetry |
| After Grid 2x2 | Stacked, L-Shape, or 60/40 | Change weight distribution |
| Consecutive "Answer" | Alternate asymmetric | Prevent fatigue |
| Process slides | Stacked 2 or T-Shape | Full-width visibility |

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
| Single key metric | Evidence | `Statistic` | Unlimited |
| Multiple metrics (3-6) | Evidence | `Statistic` grid | Unlimited |
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

#### Alert Discipline
Alert is a "stop and think" signal — not a slide summary. Max 25% of slides. If every slide has Alert, audience ignores them.

#### Card Styling
| Visual Intent | Tailwind Classes |
|---------------|------------------|
| Subtle/default | `bg-slate-50/60 rounded-xl` |
| Filled | `bg-[--theme-surface] rounded-xl` |
| Outlined | `border border-slate-200 rounded-xl` |
| Accent/callout | `border-l-4 border-[--theme-primary] bg-[--theme-surface] rounded-r-xl` |
| Elevated/hero | `bg-[--theme-surface] shadow-[--theme-shadow-lg] rounded-xl` |
| Comparison A | `bg-green-50 rounded-xl` |
| Comparison B | `bg-red-50 rounded-xl` or `bg-blue-50 rounded-xl` |

**Variety Rules:**
- Same-level items: Use same styling
- Hierarchy: Mix styles (hero with shadow, supporting with `bg-slate-50/60`)
- Comparison: Use contrasting `bg-*-50` tints
- Across deck: Vary default styles

### 2.5 Process-Heavy Content Alternatives

When Steps/Timeline budget exhausted, use these **equally effective** alternatives:

#### 1. Phase Cards (Horizontal Grid)
`grid-cols-3` or `grid-cols-4` with Cards. Each card: number/icon + title + 1-2 bullets.

#### 2. Color Gradient Cards
Cards with progressively changing backgrounds: `bg-blue-50` → `bg-blue-100` → `bg-blue-200`

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
| `Pyramid` | `data` (`label`, `value`, `color?`), `height` | 350px | 400-500px |
| `Scatter` | `data` (`label`, `x`, `y`, `color?`), `xLabel`, `yLabel` | 450px | 550-650px |

**Timeline** supports: `items`, `mode` (`left`|`alternate`|`right`), `orientation` (`vertical`|`horizontal`)

#### Chart Sizing
| Use Case | Width | Height |
|----------|-------|--------|
| Full-slide hero | `90%` | 550-650 |
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

## 3. Wording

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

| Container | Words Per Item | Total Words |
|-----------|----------------|-------------|
| 2x2 Grid card | 6-10 | 25-40 per card |
| 3-col Grid card | 8-12 | 30-50 per card |
| 30% accent panel | 3-6 per bullet | 15-25 total |
| 40-50% panel | 8-15 per bullet | 40-70 total |
| 60%+ main panel | 12-20 per bullet | 60-100 total |
| Statistic caption | 3-5 | N/A |
| Card title | 2-5 | N/A |
| Alert takeaway | 10-20 | Single statement |

**Principles:**
1. Smaller container = fewer words, shorter phrases
2. Count columns before writing (3-col = must be scannable)
3. Visual components consume word budget (Card with Statistic → caption only)

### 3.3 Data Integrity
- Use ONLY numbers from source — no invented baselines
- Each data point appears ONCE — Chart shows data, text explains implication
- Dates are not chart values — use Timeline or text

---

## 4. Styling

### 4.1 Icons

Use sparingly — 1-2 per card max. `@ant-design/icons` follows theme tokens.

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

| Color | Meaning |
|-------|---------|
| `bg-green-50` | Our approach, positive, solution |
| `bg-red-50` | Competitor, problem, risk |
| `bg-blue-50` | Neutral info, stats |
| `bg-amber-50` | Timeline phases, warnings |

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
