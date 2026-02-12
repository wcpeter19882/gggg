---
name: ant-paged-layout
description: |
  Transform draft slides into Ant Design JSX layouts for executive presentations.
  Triggers: "generate layout", "create slides", "apply layout"
---

# Ant Design Layout Generator

Transform draft slides into **Ant Design 6.x** JSX. Components are shadow implementations accepting Ant Design props.

**String Quoting:** Use backticks for object property values in `dataSource` arrays.

## ⚠️ CRITICAL CONSTRAINTS (DO NOT VIOLATE)

| Constraint | Limit | Violation = Failure |
|------------|-------|---------------------|
| **List per slide** | **MAX 2** | 3+ Lists on one slide = REJECT |
| **List per deck** | **MAX 20** | 21+ Lists total = REJECT |
| **Consecutive List slides** | **MAX 2** | 3+ slides with List-primary = REJECT |
| **Statistic per slide** | **MAX 4** | 5+ Statistics on one slide = overflow |
| **Statistic per deck** | **MAX 8** | 9+ Statistics total = overuse |
| **Grid 3-col per deck** | **MAX 3** | 4+ 3-column layouts = REJECT |
| **Consecutive same layout** | **MAX 2** | 3+ slides with same grid pattern = REJECT |
| **Nested grids** | **FORBIDDEN** | 3-col + 2-col on same slide = REJECT |
| **comparison + table** | **MUST use `<Table>`** | Using List for table data = REJECT |

**Layout Variety Rule:** After using 3-col, next slide MUST use different layout (60/40, 2-col, stacked, or single).

**When you have 3+ bullet groups on a slide, you MUST convert:**
- Numbered items → `<Steps>` or `<Timeline>`
- Metrics/numbers → `<Statistic>` grid (2-4 per slide, max 8 per deck)
- Categories → `<Card>` grid (title + 2-3 bullets each)
- Comparisons / markdown tables → `<Table>` (NOT two-column Lists)

## Workflow

### Input

Read all context with ONE call:
```
mcp_apply-patch_read_section({ project_dir: "{project_dir}", section: "all" })
```

Returns source files, theme, and draft slides. Constitution in constitution.md.

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
mcp_apply-patch_apply_patch({ project_dir: "{project_dir}", target: "slides", data: [ {id, rank, state, mdx}, ... ] })
```

Use `mdx` field for JSX content (NOT `layout`).

### Summary

Return layout variety report showing: Layout Distribution (Symmetric ≤40%, Asymmetric ≥40%), Visual Balance (Heavy ≥30%, Text-only ≤40%), Layout Usage counts vs budgets, and constraint verification.

---

## 1. Layout

### 1.1 Layout Patterns

| Category | Intent | Pattern | Layout | Structure | Constraints |
|----------|--------|---------|--------|-----------|-------------|
| **Symmetric** | statement | cover | Cover | `flex flex-col justify-center h-full px-16` | **Title + Subtitle ONLY. NO List, NO Alert, NO bullets.** |
| Symmetric | statement | section-break | Centered | `flex items-center justify-center h-full` | — |
| Symmetric | statement | quote | Billboard | `flex flex-col justify-center items-center h-full text-center px-16` | `max-w-4xl`-`max-w-6xl` |
| Symmetric | hierarchy | pyramid, funnel | Centered | `flex items-center justify-center h-full` | Use Pyramid/Funnel |
| Symmetric | overlap | venn | Centered | `flex items-center justify-center h-full` | Use Venn |
| Symmetric | comparison | side-by-side | Split 50/50 | `grid grid-cols-2 gap-6 items-start` | Max 2. Top-aligned, balanced content. |
| Symmetric | structure | pillars-4 | Grid 2x2 | `grid grid-cols-2 grid-rows-2 gap-4 items-start` | Max 2. **≤2 bullets/card, ≤8 words/bullet.** |
| Symmetric | structure | pillars-3, kpi | Grid 3-col | `grid grid-cols-3 gap-4 items-start` | Max 3. **≤3 bullets/card, ≤10 words/bullet.** |
| **Asymmetric** | evidence, focal | main+support | Split 60/40 | `grid grid-cols-5 gap-6 items-start` → `col-span-3`+`col-span-2` | Max 3. Top-aligned. |
| Asymmetric | focal | main+accent | Split 70/30 | `grid grid-cols-10 gap-6 items-start` → `col-span-7`+`col-span-3` | Max 2 |
| Asymmetric | focal | accent+main | Split 40/60 | `grid grid-cols-5 gap-6 items-start` → `col-span-2`+`col-span-3` | Max 3 |
| Asymmetric | evidence | main+2 accents | L-Shape | `grid grid-cols-3 gap-4 items-start` → `col-span-2`+stacked | ≥1 req (10+ slides) |
| Asymmetric | structure, process | header+3 parts | T-Shape | Full-width row + `grid grid-cols-3 items-start` | ≥1 required |
| Asymmetric | — | TOC+main | Sidebar Left | `grid grid-cols-4 gap-6 items-start` → `col-span-1`+`col-span-3` | Single group, no void |
| Asymmetric | — | main+aside | Sidebar Right | `grid grid-cols-4 gap-6 items-start` → `col-span-3`+`col-span-1` | Single group, no void |
| **Compound** | process, summary | flow | Stacked 2 | `flex flex-col gap-6` with 2 sections | ≥1 req (8+ slides) |
| Compound | hierarchy | layers | Stacked 3 | `flex flex-col gap-4` with 3 sections | — |
| Compound | comparison | cost-benefit | Grid 2+1 | `grid-cols-2 items-start` top + full-width bottom | — |
| Compound | summary | — | Grid 1+2 | Full-width top + `grid-cols-2` bottom | — |
| Compound | structure | — | Grid 4-col | `grid grid-cols-4 gap-4` | — |
| Compound | overlap | hub-spoke | Bento | `grid-cols-12` + varied `col-span-*` | — |

**Selection:** Match content structure first, then intent.

**MANDATORY:** Every column: `flex flex-col justify-start`. **Grid centering:** Outer wrapper `flex flex-col justify-center h-full`, inner grid NO `h-full`.

**Multi-Column Balance (CRITICAL):**
- All columns in 2-col/3-col layouts must be **top-aligned** (`items-start` on grid, `justify-start` on children)
- Content height should be **similar across columns** (±20% variance)
- If one column has 5 bullets and another has 2, **rebalance** by: (1) moving content, (2) adding supporting text, or (3) using different component
- FORBIDDEN: One column with 8 bullets, another with 2 — split into separate slides instead

**Diagram + Text:** Diagram labels = short titles only. Text = supplementary (non-redundant). Max diagram height 450px when paired with text.

### 1.2 Layout Rules

**Forbidden:** `content.category`, image descriptions (use as `alt`), transition fields, ordinal labels ("Step 1"), semantic prefixes ("Takeaway:").

**References:** Superscript links `<sup><a href="..." style={{ color: 'var(--theme-primary)' }}>`. FORBIDDEN: URL lists, plain text URLs.

**Images:**
- Max 20-30% slides. Path: `/images/{filename}`.
- **CRITICAL: Each image file can only be used ONCE in entire deck.** NO duplicate image usage.
- Use `<img>` with `className="w-full h-full object-cover rounded-xl"`.
- **Use `image_dimensions` from frontmatter to determine aspect ratio:**
  - Wide landscape (3:1, 2:1) → image panel 70% width (col-span-4 in grid-cols-5)
  - Standard landscape (16:9, 3:2) → image panel 60% width (col-span-3 in grid-cols-5)
  - Square-ish (4:3, 1:1) → image panel 40% width (col-span-2 in grid-cols-5)
  - Portrait → image panel 30% width, or use as accent

**Design System:** Tailwind + `<div>` only. FORBIDDEN: Ant `Row`, `Col`, `Layout`, `Sider`, `Flex`.

**Canvas:** Fixed 16:9. Content vertically centered. Use `flex flex-col justify-center h-full`.

**Density:** ≤30% panel: 2-3 bullets. 40-50%: 3-4 bullets. ≥60%: max 5 bullets. Exceeds → split slide.

**Void Prevention:** Min content per panel width. FORBIDDEN: isolated items with void between.

### 1.3 Hard Constraints

| Category | Constraint |
|----------|------------|
| **Variety** | No 3+ consecutive same-category layouts. No 3+ consecutive List-primary slides. Image swap ≠ variety. Centered text-only: max 2. |
| **Budgets** | 50/50: max 2. **60/40: max 2** (not 3). 70/30: max 2. Grid 2x2: max 2. Grid 3-col: max 3. |
| **Heavy Diagrams** | Pyramid, Funnel, Venn, Scatter, Steps, Timeline: max 1 each. |
| **List Budget** | Max 2 List per slide. Max 20 List total per deck. Prefer: Table, Statistic, Steps, Card grid. |
| **Requirements** | T-Shape: ≥1. L-Shape: ≥1 (10+ slides). Stacked: ≥1 (8+ slides). Images: ≥3 slides. |
| **Visual Balance** | Heavy visuals: ≥30%. Text-only: ≤40%. |
| **Image Uniqueness** | **Each image filename used exactly ONCE.** Duplicate image usage is FORBIDDEN. |

### 1.4 Pre-Generation Planning

**Internal only.** Mentally plan budgets, verify constraints, then generate JSX directly.

### 1.5 Visual Rhythm

After 50/50 → use 70/30 or T-Shape. After 60/40 → use Stacked or L-Shape. After Grid 2x2 → use Stacked or L-Shape. Cover/Closing → Centered.

### 1.6 Visual Monotony Break

After 2 consecutive text-only slides, 3rd MUST add visual: icon-enhanced cards, accent border, color gradient, Statistic callout, or Billboard format. Heavy diagrams NOT required (budget limits).

---

## 2. Components

### 2.1 Component Reference

| Component | Use For | Intents |
|-----------|---------|---------|
| **Typography.Title** | Headlines, section headers | all |
| **Typography.Paragraph** | Narrative text (20-40 words) | statement, focal |
| **List** | Bullet points, details | evidence, structure, summary (fallback) |
| **Table** | Structured data, comparisons | comparison, summary |
| **Card** | Grouped content with title | structure, comparison, focal |
| **Statistic** | Numeric KPIs (`$2.4M`, `99.9%`) | evidence, focal |
| **Alert** | Takeaways, callouts | any (max 25% slides) |
| **Tag/Badge** | Labels, status indicators | any (light, not alone) |
| **Descriptions** | Key-value pairs | summary |
| **Image** | Visual support (20-30% slides) | focal, evidence, comparison |
| **Timeline** | Temporal sequence (≤5 items) | process |
| **Steps** | Step-by-step flow (≤6 items) | process |
| **Bar/Column** | Quantity comparison | evidence |
| **Line** | Trends over time | evidence |
| **Pie** | Proportions | evidence |
| **Funnel** | Narrowing flow | hierarchy, process |
| **Pyramid** | Layered hierarchy | hierarchy, structure |
| **Venn** | Overlapping concepts | overlap |
| **Scatter** | 2D matrix/quadrant | matrix |

**Story Element Mapping:**
- HEADLINE → `Typography.Title level={2}`
- NARRATIVE → `Typography.Paragraph`
- DETAIL → `List` with `**Key** — explanation`
- EVIDENCE (number) → `Statistic` or Chart
- EVIDENCE (flow) → Timeline, Steps, Phase Cards, or Funnel
- TAKEAWAY → `Alert type="info"`
- COMPARISON → `<Table>` (preferred) or Side-by-side Cards

**RULE:** `matrix`, `hierarchy`, `overlap` → MUST use diagram.

**RULE:** `process` intent with numbered list in content → MUST use Steps or Timeline (not List). If >6 items, use Phase Cards.

**RULE:** `comparison` intent with markdown table in content → MUST use `<Table>` component. DO NOT convert markdown tables to two-column List layouts.

### 2.2 Component Weight

| Heavy (1/slide max) | Medium (2-3/slide) | Light (accent only) |
|---------------------|--------|-------------------|
| Charts: Line, Bar, Column, Pie, Area | Timeline, Steps, Table (3+ rows), Card grid (3+), List (4+) | Tag, Badge, Alert (1/slide), Descriptions, List (1-3) |
| Diagrams: Funnel, Venn, Pyramid, Scatter | **Statistic grid (2-4)** | |

**Statistic is Medium weight, not Light.** A grid of 2-4 Statistics is a focal element, not decoration.

### 2.3 Component Selection

| Relationship | Component | Budget |
|--------------|-----------|--------|
| Overlap | Venn | Max 1 |
| Hierarchy | Pyramid | Max 1 |
| Funnel/filter | Funnel | Max 1 |
| Matrix (2D) | Scatter | Max 1 |
| Temporal | Timeline | Max 1 |
| Step-by-step | Steps | Max 1 |
| Quantities | Bar, Column | Max 2 |
| Proportions | Pie | Max 1 |
| NUMERIC metric | Statistic | **Max 8 total per deck** (2-4 per slide when used) |
| Process phases | Phase Cards, Numbered List | Unlimited |

**List monotony rule:** No 3+ consecutive slides with List as primary component. After 2 List-heavy slides, use Table, Phase Cards, Statistic grid, or Chart.

**List budget per slide:** Max 2 List components per slide. If content has 3+ distinct bullet groups:
- Merge related bullets into fewer lists
- Convert to Card grid (each card = title + short list)
- Convert numeric items to Statistic components
- Convert sequential items to Steps or Timeline

**List → Alternative Conversion (CRITICAL):**
| Content Pattern | Instead of List | Use This |
|-----------------|-----------------|----------|
| 3-5 numbered steps | List | `<Steps items={[...]}/>` |
| Dates/milestones | List | `<Timeline items={[...]}/>` |
| Metrics with numbers | List | `<Statistic>` grid (2-4 cards) |
| A vs B comparison | 2 Lists | `<Table columns={...} dataSource={...}/>` |
| 3-4 categories | 3-4 Lists | Card grid (each card = title + 2-3 bullets) |
| Feature highlights | List | `<Card>` with icon + short description |

### 2.4 Component Rules

**List:** No single-item lists → use Paragraph. Card = Title + List(2+) or Title + Paragraph. Two-line items are HEAVY (max 30% of lists).

**List JSX format:** Use `dataSource` array with JSX elements, `renderItem` returns `<List.Item>`. 
- `dataSource`: array of JSX elements (NOT strings with markdown)
- `renderItem`: `(item) => <List.Item>{item}</List.Item>`
- FORBIDDEN: `List.Item.Meta`, `itemLayout="horizontal"`, objects with `{title, description}`, markdown `**bold**` in strings

**Text emphasis in JSX (CRITICAL):** Convert markdown to JSX tags:
- `**bold**` → `<strong>` or `<Typography.Text strong>`
- `*italic*` → `<em>`
- `==highlight==` or key metrics → `<Typography.Text mark>` (yellow background)
- FORBIDDEN: Raw markdown `**` or `*` in JSX strings — renderer cannot parse them
- FORBIDDEN: Double closing tags like `</strong></strong>` — verify tag matching before output

**Use `<Typography.Text mark>` for:** Key numbers, percentages, KPIs, critical terms that need visual pop. E.g., `<Typography.Text mark>99.9%</Typography.Text>`

**Alert:** Max 25% slides. Group with related content, not isolated. Bottom of main column, not sidebar.

**Statistic:** NUMERIC only (`$2.4M`, `99.9%`). Qualitative → Card with icon or Tag.

**Card Styling:**
- Default: `bg-theme-surface rounded-xl`
- Subtle: `bg-theme-surface/60`
- Accent: `border-l-4 border-theme-primary bg-theme-surface rounded-r-xl`
- Comparison: `bg-theme-success/20` vs `bg-theme-danger/20`

Max 2 distinct bg colors per slide. Grid cards must have Title + List(2+) or Title + Statistic.

### 2.5 Process Alternatives (when Steps/Timeline exhausted)

1. Phase Cards: `grid-cols-3` with number/icon + title + bullets
2. Color Gradient: `bg-theme-primary/10` → `/20` → `/30`
3. Numbered List: `1. Phase — description`
4. Icon-Driven Cards: distinct icon per phase
5. Stacked Sections with dividers

### 2.6 Chart Reference

| Chart | Props | Height |
|-------|-------|--------|
| Line, Bar, Column | `data`, `xField`, `yField`, `height` | 350-450px |
| Pie | `data`, `angleField`, `colorField` | 350-400px |
| Funnel, Venn, Pyramid | `data`, `height` | 400-500px |
| Scatter | `data`, `xLabel`, `yLabel` | 550-650px |

Sizing: Full-slide 550-650, with content 350-400, in Card 250-350.

---

## 3. Text

### 3.1 List Formatting

| Style | Example | Use |
|-------|---------|-----|
| Fragment | "Zero-latency autocomplete" | Capability lists |
| Verb-lead | "Enables offline inference" | Benefits, actions |
| Full sentence | "Users work offline." | Narrative |
| Numbered | "1. Extract → 2. Process" | Ordered steps |

**Rules:** Default to fragments. Same style within slide. ≥3 styles across deck.

### 3.2 Text Length (STRICT)

| Container | Words/Item | Max Items | Total Words |
|-----------|------------|----------|-------------|
| 3-col Grid | 8-10 | 3 | ≤30/card |
| 2x2 Grid | 6-8 | 2-3 | ≤24/card |
| 30% panel | 3-5 | 2-3 | ≤15 |
| 40-50% panel | 6-12 | 3-4 | ≤48 |
| 60%+ panel | 10-15 | 4-5 | ≤75 |

**CRITICAL:** Exceeding word limits → split slide or reduce content. Never compress by shrinking font.

### 3.3 Overflow Prevention

**Multi-card slides:** 2-3 items/list, 6-8 words/item. **Grid 3-col:** max 3 bullets per card, max 10 words per bullet.

**Nested Grid FORBIDDEN:** Do NOT stack grids (e.g., 3-col on top + 2-col on bottom). Choose ONE layout:
- Use 3-col OR 2-col, not both
- If content needs both, SPLIT into 2 slides
- Compound layouts (Stacked, T-Shape) are vertical stacking, not nested grids

**Dense slide limits:**
- Max 4 Statistic components per slide
- Max 1 List (with max 4 items) per slide
- Max 1 Alert per slide
- **Card grids:** Each Card with List → max 2-3 bullets per Card (not 4+)

**Overflow cascade (MANDATORY):** 
1. **Summarize** — Condense 3 bullets to 2, merge related points
2. **Shorten** — Cut words per bullet (≤10 words)
3. **Split slide** — Last resort if content cannot fit

**You MUST fit content to layout constraints. NEVER render more bullets than layout allows.**
Example: Grid 2x2 with 4 Cards, storyline provides 12 bullets → YOU summarize to 8 bullets (2 per card).

**List item format:** Prefer `**Key** — short explanation` (≤12 words total). Two-line items only when essential.

### 3.4 Data Integrity

Use ONLY numbers from source. Each data point appears ONCE. Diagram + text must complement, not repeat.

### 3.5 Pyramid Text Format

Pyramid uses `label` + `description` pattern:
- `label`: 2-4 words (bold, larger) — e.g., "Platform foundation"
- `description`: optional explanation (muted, smaller) — e.g., "local-first + hybrid compute"

If text >5 words, split into label + description.

---

## 4. Styling

### 4.1 Theme Colors

**CRITICAL:** Use theme tokens only. FORBIDDEN: `bg-slate-50`, `bg-white`, hardcoded hex.

```
Background: bg-theme-surface, bg-theme-bg, bg-theme-surface-alt
Semantic:   bg-theme-success/20, bg-theme-danger/20, bg-theme-warning/20, bg-theme-info/20
Accents:    bg-theme-accent1 through bg-theme-accent6 (with /20 for tints)
Text:       text-theme-text, text-theme-text-muted, text-theme-primary
Border:     border-theme-border, border-theme-primary
```

Semantics = meaning (good/bad). Accents = variety without meaning.

### 4.2 Typography

| Element | Component |
|---------|-----------|
| Cover title | Typography.Title level={1} |
| Slide heading | Typography.Title level={2} — at slide root, not inside Card |
| Section heading | Typography.Title level={3} or {4} |
| Body | List, Typography.Paragraph |
| Caption | Typography.Text type="secondary" |

### 4.3 Icons

Use on `structure` intent with 3+ cards. 1-2 icons per card. Import from `@ant-design/icons`.

| Purpose | Icons |
|---------|-------|
| Privacy/Security | `LockOutlined`, `SafetyOutlined` |
| Speed/Performance | `ThunderboltOutlined`, `RocketOutlined` |
| Success/Problem | `CheckCircleOutlined`, `CloseCircleOutlined` |
| Timeline | `FlagOutlined`, `CalendarOutlined` |
| Integration | `ApiOutlined`, `LinkOutlined` |

### 4.4 Inline Emphasis

- Key term: `<Text strong>` or `<strong>`
- **Highlighted metric/KPI: `<Text mark>`** — use for numbers, percentages, critical data points
- Semantic: `<Text type="success|warning|danger">`

**Highlight target:** Each slide with metrics should have 1-2 `<Text mark>` on the most important numbers.

### 4.5 Consistency

Same heading level across sibling cards. Vary styling (bg, border) not heading level.

---

## Output Format

Wrap slides: `<Slide id="slide_XX" rank={N}>`. Use `<div className="flex flex-col justify-center h-full gap-6">` wrapper.
