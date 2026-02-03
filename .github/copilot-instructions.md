# Copilot Instructions

## gggg Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-01-09

---

## Critical Principles (READ FIRST)

### Code vs Data Separation

| Type | Examples | Rule |
|------|----------|------|
| **Code** | SKILL.md files, Python handlers, React components | Defines behavior, never creates mock data |
| **Data** | brainstorm_set.md, source files, research.md | Content to be processed |
| **Output** | content.json, slides.jsx | Generated from data by code |

**If data is lacking:**
- Request richer source data from user
- Rely on research step to fill in external data (citations, statistics, metrics)
- **NEVER modify SKILL files to synthesize or mock data**

### Pipeline Flow

```
Source Data → Research (adds external data) → Storyline (sets intent) → Layout (uses intent) → Export
```

- **Research step** fills in citations, statistics, and external validation
- **Storyline** assigns `intent` (evidence, comparison, process, etc.) based on content
- **Layout** uses `intent` to select visual components (Charts, Diagrams, Lists)
- If layout output lacks visual diversity, the issue is upstream data, not layout code

### Intent-Driven Component Selection

Layout SKILL uses slide `intent` to determine components. The mapping from intent to component is defined in the SKILL.md file, not here.

**Principle:** Layout code is correct if it follows intent. If wrong components are used, check:
1. Did storyline assign the right intent?
2. Did research provide enough data for visual components?
3. Are budget constraints (defined in SKILL.md) exhausted?

**Detailed mappings, budgets, and alternatives are in:** `.claude/skills/ant-paged-layout/SKILL.md`

---

## Architecture Principles

### Skills and Subagents Architecture

The system uses a **content-manager skill** that orchestrates multiple **specialized subagents**:

```
.claude/skills/                  # Claude skill definitions
├── content-manager/             # Orchestrator skill
├── atom/                        # Atom extraction subagent
├── theme/                       # Theme subagent
├── storyline/                   # Storyline planning subagent
├── paged-layout/                # Layout/widget subagent (generic)
├── ant-paged-layout/            # Ant Design layout subagent
├── export/                      # Export subagent (generic)
├── ant-export/                  # Ant Design renderer (Next.js app)
└── validator/                   # Layout validation subagent

src/skills/                      # Python implementation
├── __init__.py                  # Skill registry with register_skill decorator
├── models/                      # Shared data models
│   ├── content_json.py          # ContentJson schema
│   ├── patch.py                 # Patch format and apply_patch
│   └── project.py               # Project metadata
├── content_manager/             # Orchestrator implementation
│   ├── orchestrator.py          # Main orchestrator
│   └── constitution.py          # Constitution extraction
├── theme/                       # Theme handler
├── atom/                        # Atom handler
├── storyline/                   # Storyline handler
├── paged_layout/                # Layout/widget handler
└── export/                      # Export handler

src/scripts/
├── apply_patch.py               # Patch application
├── slice_atoms.py               # Extract atoms from content.json
├── slice_theme.py               # Extract theme from content.json
├── slice_storylines.py          # Extract slides from content.json
└── check_mdx_server.py          # Server status checking
```

**Project Directory Structure**:
```
$tmp/content-manager/{project_id}/
├── content.json      # Central data store
├── todo.md           # Subagent todo list
├── files/            # Source files
├── patches/          # JSON patches from subagents
└── output/           # Generated MDX and renders
```

### Layout System Decoupling
- **Layout/widgets/presets are provided by LayoutEngine** via `get_layout_documentation()` protocol method
- **Only content-related prompts belong in `src/generation/content/prompts.py`**
- LayoutEngine implementations (e.g., `src/layout/dummy/layout_engine.py`) define:
  - Available layout strategies with slot structures
  - Supported widget types with parameters
  - Preset attributes (surface, shape, fill, effect)
- Content generation prompts focus on:
  - Narrative structure and storytelling
  - Atom synthesis and content brevity
  - Markdown formatting and abstraction rules
- **Runtime engine switching** via `LayoutEngineRegistry`:
  - Environment variable: `LAYOUT_ENGINE=dummy`
  - Programmatic: `LayoutEngineRegistry.set_active_engine("engine_name")`
  - Default: First registered engine

### Layout-Specific Validation Rules
- **CRITICAL**: Layout validation rules (widget-layout compatibility, slot constraints) MUST come from the LayoutEngine via `get_layout_constrain()`
- **DO NOT add layout validation prompts to `src/generation/content/prompts.py`** - this is the COMMON prompt file for content generation only
- Layout-specific validation logic belongs in:
  - LayoutEngine's `get_layout_constrain()` method (returns formatted constraints for LLM guidance)
  - LayoutEngine's `get_layout_documentation()` method (returns layout/widget/preset documentation)
  - Dedicated validator modules (e.g., `src/layout/slidev/layout_validator.py`) for runtime validation
  - Layout engine-specific prompt builders if needed (use `get_layout_constrain()` to inject constraints)
- Example: Widget-layout compatibility rules for Slidev belong in `SlidevLayoutEngine.get_layout_constrain()`, NOT in common content prompts
- Prompts should call `active_engine.get_layout_constrain()` to dynamically inject layout-specific constraints

---

## Active Technologies
- Python 3.11 + Pydantic 2.x (for data models), Jinja2 (for templates)
- Python 3.11+ (backend), JavaScript/Vue 3 (frontend Slidev components) + pydantic, jinja2 (Python); Slidev, Vue 3, UnoCSS (JavaScript)
- TypeScript 5.x (React components), Python 3.11+ (MDX generator/CLI)
- Recharts (charts), React 18, Python LLM generation pipeline
- Pydantic, Anthropic API (via LLM client), React, MDX, Next.js
- File-based (content.json per project)

---

## Project Structure

```text
src/
  common/
  layout/
  render/
tests/
  contract/
  integration/
  unit/
cli/
examples/
```

---

## Commands

pytest; ruff check src; mypy src

---

## Code Style

Python 3.11+: Follow PEP 8, use type hints, prefer Pydantic for validation

---

## CLI Usage

### Basic Rendering

```bash
# Render to stdout
python -m cli examples/cyber-tech.json

# Render to file (self-contained HTML with embedded preset CSS)
python -m cli examples/cyber-tech.json --output output/presentation.html

# Validate configuration only
python -m cli examples/cyber-tech.json --validate-only

# Verbose output
python -m cli examples/cyber-tech.json --output result.html --verbose
```

### Listing Available Assets

```bash
# List all layout strategies
python -m cli --list-strategies

# List all widget types
python -m cli --list-widgets

# List all themes
python -m cli --list-themes

# List all styles
python -m cli --list-styles

# Get JSON format for programmatic use
python -m cli --list-widgets --format json
python -m cli --list-themes --format json
```

### Output Formats

```bash
# HTML output (default)
python -m cli config.json --output presentation.html

# JSON output (for debugging/inspection)
python -m cli config.json --format json --output data.json
```

### Custom Dimensions

```bash
# Override width/height from config
python -m cli config.json --width 1280 --height 720 --output slide.html
```

---

## Widget Presets

Widget presets provide inline styling through 4 categories: **Surface**, **Shape**, **Fill**, **Effect**.

Use `python -m cli --list-styles` for available options.

---

## Layout Strategies

Use `python -m cli --list-strategies` for available strategies (Bento, Swiss, Cinematic, Data, Edit, Focus families).

---

## Preset CSS Architecture

**All preset CSS is generated in-memory** with zero file dependencies:
1. Preset defaults defined in `src/render/preset_defaults.py` (Python dictionaries)
2. Optional custom presets from layout JSON config under `presets` key
3. `generate_preset_css()` generates CSS class rules with CSS variable references
4. `generate_preset_css_variables()` converts preset tokens to CSS variables
5. Both CSS content and variables embedded inline in output HTML

**No static files**: Previously used `static/presets.css` file has been removed.

---

## Ant Design Slide Renderer (`ant-export` skill)

### Fundamental Rule: No Interactive Components

**We are building slides, not web apps.** Generated JSX must be **static, presentation-only content**.

#### FORBIDDEN (Interactive)
- `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
- `Modal`, `Drawer`, `Popover`, `Tooltip` (hover/click triggers)
- `Form`, `DatePicker`, `Upload`, `Slider`
- `Dropdown`, `Menu` (unless purely decorative mockup)
- Any `onClick`, `onChange`, `onSubmit` handlers

#### ALLOWED (Presentation)
- `Typography` (Title, Paragraph, Text)
- `List`, `Table`, `Descriptions` (data display)
- `Statistic`, `Card`, `Tag`, `Badge`
- `Steps`, `Timeline` (process visualization)
- `Alert` (callout/takeaway)
- `Progress` (static percentage display)
- Charts and Diagrams

If a mockup UI needs to show a button, render it as a **static visual** (div styled like a button), not an actual `<Button>` component.

### Two-Layer Architecture

| Layer | File | Concern |
|-------|------|---------|
| **API Layer** | `.claude/skills/ant-paged-layout/SKILL.md` | LLM prompt — uses standard Ant Design 6.x API |
| **Implementation Layer** | `.claude/skills/ant-export/react/components/antd/` | Shadow components — custom rendering |

### API Layer (SKILL.md)

The SKILL.md file is a **prompt for LLM generation**. It should:
- Use **standard Ant Design 6.x API** syntax (not custom props)
- Reference official Ant Design documentation
- Specify version: **Ant Design 6.x** (not 5.x or 4.x)
- NOT mention shadow implementation details

#### SKILL.md Prompt Architecture (CRITICAL)

**All layout SKILL.md files MUST follow this 4-section structure:**

```
## 1. Layout
├── 1.1 Layout Patterns (single merged table: Symmetric + Asymmetric + Compound)
├── 1.2 Layout Rules (all ad-hoc rules grouped: Forbidden Elements, Images, Canvas, Density, Void)
├── 1.3 Hard Constraints (single table: Variety + Budgets + Requirements + Visual Balance)
├── 1.4 Pre-Generation Planning (mandatory budget template)
└── 1.5 Visual Rhythm Guidance

## 2. Components
├── 2.1 Content-to-Component Mapping (Intent + Story Element merged)
├── 2.2 Component Weight Classification (Heavy + Medium + Light + Text merged)
├── 2.3 Component Selection Guide (relationships → visuals → budgets)
├── 2.4 Component Rules (List Discipline, Alert Discipline, Card Styling)
├── 2.5 Process Alternatives (6 patterns for process-heavy content)
└── 2.6 Chart Reference (props + sizing merged)

## 3. Wording
├── 3.1 List Formatting (styles + variety rules)
├── 3.2 Text Length Rules (word budgets by container)
└── 3.3 Data Integrity

## 4. Styling
├── 4.1 Icons
├── 4.2 Typography
├── 4.3 Inline Emphasis
├── 4.4 Colors & Patterns
├── 4.5 Sibling Consistency
└── 4.6 Density Targets
```

**Architecture Principles:**
- **Minimize tables**: Merge related tables (e.g., all layout patterns in ONE table with Category column)
- **Group ad-hoc rules**: Rules belong under their section, not scattered
- **Single source of truth**: Each constraint appears in ONE place only (prefer Hard Constraints table)
- **Budget-limited items**: Heavy diagrams (Pyramid, Funnel, Venn, Scatter, Steps, Timeline) = max 1 each

#### NO CODE SNIPPET EXAMPLES (STRICTLY FORBIDDEN)

**SKILL.md files are LLM prompts, NOT code tutorials.** LLMs already know component APIs.

| ✅ ALLOWED | ❌ FORBIDDEN |
|------------|--------------|
| Tailwind class names: `grid-cols-3`, `flex-col justify-center` | Full JSX code blocks with component examples |
| Prop names in tables: `dataSource`, `renderItem` | Multi-line code snippets showing how to use components |
| Short inline references: `<Venn />`, `<Pyramid />` | Markdown code fences with complete JSX |
| Decision tables: "When X → use Y component" | "Here's how to use Timeline:" followed by code |

**BAD** (wastes tokens, LLM already knows this):
```markdown
### Timeline Usage
Timeline accepts `items` prop which is an array of objects with `label` and `children` properties...
```

**GOOD** (adds value LLM doesn't know):
```markdown
### When to Use Timeline
- Horizontal: 3-5 milestones, fits in one row
- Vertical: 4+ items OR items need descriptions
- NEVER: Single item (use Paragraph instead)
- **Budget: Max 1 per deck**
```

**Token Budget Priority:**
1. **Constraints** — What is forbidden, what has limits
2. **Decision logic** — When to use X vs Y
3. **Layout composition** — How to arrange (via Tailwind classes)
4. **Visual hierarchy** — What goes where
5. ~~Component syntax~~ — LLM already knows this

#### Prompt Token Efficiency

**DO NOT** waste tokens on component syntax — LLMs already know Ant Design 6.x API.

**DO** spend tokens on:
- **Constraints**: Forbidden patterns, budget limits, hard rules
- **Decision logic**: When to use List vs Cards vs Table
- **Layout composition**: Tailwind class patterns for grid/flex
- **Visual hierarchy**: What goes where on a slide

### Implementation Layer (Shadow Components)

Components in `@/components/antd/` use **shadow implementation**:
- **API**: Accept Ant Design 6.x props (for LLM compatibility)
- **Rendering**: Custom JSX with CSS Modules (no Ant Design runtime)
- **Theming**: Use CSS variables (`--theme-*`) directly

#### Why Shadow Implementation
1. **Theming**: CSS variables work without ConfigProvider
2. **Bundle size**: No Ant Design CSS/JS runtime
3. **Styling control**: Slide-appropriate typography and spacing
4. **Consistency**: All components use same theming approach

#### Shadow Component Pattern
```tsx
// Timeline.tsx
import { type TimelineProps as AntTimelineProps } from 'antd'; // Types only!
import styles from './Timeline.module.css';

export interface TimelineProps extends Omit<AntTimelineProps, 'pending'> {
  orientation?: 'vertical' | 'horizontal'; // Ant Design 6.x prop
}

export function Timeline({ items = [], mode = 'left', orientation = 'vertical' }: TimelineProps) {
  // Custom rendering — NO AntTimeline import
  return (
    <div className={`${styles.timeline} ${styles[mode]}`}>
      {items.map((item, i) => (
        <div key={i} className={styles.timelineItem}>
          {item.label && <div className={styles.itemLabel}>{item.label}</div>}
          <div className={styles.itemContent}>{item.children}</div>
        </div>
      ))}
    </div>
  );
}
```

#### Components with Shadow Implementation
| Component | Ant Design 6.x API | Notes |
|-----------|-------------------|-------|
| `Timeline` | `items`, `mode`, `orientation` | Vertical & horizontal |
| `List` | `dataSource`, `renderItem`, `size` | Custom ul/li |
| `Statistic` | `title`, `value`, `prefix`, `suffix` | Themed numbers |
| `Steps` | `items`, `current`, `direction` | Process visualization |
| `Card` | `title`, `extra`, `size` | Content container |

#### When to Use Ant Design Directly
- Complex interactions: `Modal`, `Dropdown`, `Select`
- Form controls: `Input`, `DatePicker` (if needed in mockups)

For **slide content components**, always use shadow implementation.

---

## Slide Density Framework

**Principle:** Match visual weight to layout space. Content should fill 70-85% of slide area.

**Detailed rules are in:** `.claude/skills/ant-paged-layout/SKILL.md` sections 1.2 (Layout Rules), 2.2 (Component Weight), and 4.6 (Density Targets).

---

## Validation Flow for WebUI-Based Slide Generation

To establish a robust **Validation Flow**, issues are categorized not just by "what they are," but by how much they damage the credibility of the presentation.

---

## Issue Classification (by Severity)

### 1. Critical (P0): Breakage & Loss of Information

*Issues that make the slide unusable or objectively broken. These should trigger an automatic "fail" in the validation flow.*

| Issue | Description |
|-------|-------------|
| **Content Overflow/Clipping** | Text or images bleeding outside the slide boundaries or disappearing behind other elements (e.g., footers). |
| **Legibility Failure** | Contrast ratios that fall below accessibility standards (e.g., light grey text on a white background) or font sizes dropping below a readable threshold (typically **12pt** for slides). |
| **Component Overlap** | Z-index issues where a "callout" box or image covers the primary text. |
| **Broken Assets** | Missing icons (the "empty square" syndrome), 404 image placeholders, or unrendered Mermaid/LaTeX code strings. |

---

### 2. Major (P1): Structural & Balance Failures

*Issues that signal "AI-generated" or "unprofessional." The content is there, but the layout logic failed.*

| Issue | Description |
|-------|-------------|
| **The "Void" (Accidental Empty Space)** | A 16:9 slide with content only occupying the top 20%, leaving a massive, unintended "white desert" at the bottom. |
| **Scaling Artifacts** | Pixelated images or "spindly" diagrams where the stroke weight is too thin to be seen from the back of a room. |
| **Misalignment/Drift** | Elements that should be snapped to a grid but are off by a few pixels, or "jumping" elements when transitioning between slides of the same template. |
| **Hierarchy Collapse** | Titles that are smaller than body text, or bullet points that have more visual weight than the "So-What" summary. |

---

### 3. Minor (P2): Polish & Typographic Nuance

*Issues that affect the "Taste" and professional feel. These are often the hardest to solve with pure CSS.*

| Issue | Description |
|-------|-------------|
| **Typographic "Widows"** | A single word sitting alone on the last line of a title or paragraph, creating an unbalanced "ragged" edge. |
| **Information Density Mismatch** | A "Big Number" slide template used for a complex 5-paragraph explanation, or vice versa. |
| **Visual Monotony** | Five slides in a row using the exact same "Image Left, Text Right" layout without variation. |
| **Standard Web Spacing** | Using default `1.5` line-heights and `16px` margins that make a slide look like a printed website rather than a designed deck. |

---

## Validation Flow Matrix

| Severity | Category | Human Reaction | Validation Logic Check |
|----------|----------|----------------|------------------------|
| **P0 (Critical)** | **Technical** | "I can't even read this." | Bounding box collision detection; Contrast ratio check. |
| **P1 (Major)** | **Layout** | "This looks broken/empty." | Content-to-Container area ratio; Alignment snapping. |
| **P2 (Minor)** | **Design/Taste** | "This looks amateur." | Widow detection; Layout variety counters. |

---

## Automated Validation Heuristics

### P0 Checks (Must Pass)
- [ ] **Overflow Detection**: Check DOM element coordinates to ensure no content exceeds slide boundaries
- [ ] **Contrast Ratio**: Verify text-background contrast meets WCAG AA standards (≥4.5:1 for normal text)
- [ ] **Minimum Font Size**: Ensure no text falls below 12pt
- [ ] **Asset Integrity**: Verify all images load and icons render correctly
- [ ] **Z-Index Collision**: Detect overlapping elements that obscure content

### P1 Checks (Should Pass)
- [ ] **Content Fill Ratio**: Content should occupy at least 60% of available slide area
- [ ] **Grid Alignment**: Elements should snap to defined grid positions (within 2px tolerance)
- [ ] **Visual Hierarchy**: Title font size > Body font size > Caption font size
- [ ] **Image Resolution**: No images with visible pixelation at display size

### P2 Checks (Nice to Have)
- [ ] **Widow Prevention**: Flag single-word final lines in titles/paragraphs
- [ ] **Layout Variety**: Track consecutive slides using identical layouts (flag if >3)
- [ ] **Slide-Native Spacing**: Use tighter line-heights (1.2-1.3) and presentation-appropriate margins

---

## Quick Reference: Severity Decision Tree

```
Is content missing, unreadable, or broken?
├─ YES → P0 Critical (Auto-fail)
└─ NO → Is the layout empty, unbalanced, or misaligned?
         ├─ YES → P1 Major (Needs fix)
         └─ NO → Does it feel amateur or templated?
                  ├─ YES → P2 Minor (Polish)
                  └─ NO → ✅ Pass
```
