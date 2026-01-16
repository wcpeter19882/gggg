# React MDX Presentation Renderer

A **Strictly Semantic** React/MDX presentation system where AI agents generate MDX using only semantic components (no raw HTML/CSS).

## Architecture

### 4-Layer System

| Layer | Purpose | Examples | Agent Can Use? |
|-------|---------|----------|----------------|
| **L0** | Forbidden | `<div>`, `className`, `style` | ❌ Never |
| **L1** | Layouts | `LayoutCover`, `LayoutSplit`, `LayoutGrid`, `LayoutFullBleed`, `LayoutTimeline`, `LayoutDashboard` | ✅ Yes |
| **L2** | Blocks | `SmartList`, `ChartBar`, `ChartLine`, `ChartPie`, `MetricGroup`, `TableData`, `QuoteBlock`, `ImageBlock`, `CardGroup` | ✅ Yes |
| **L3** | Atoms | `Heading`, `Text`, `Callout` | ✅ Yes |

### Design Principles

1. **Semantic Only**: Agents write meaning, not presentation
2. **Theme-Aware**: All styling comes from themes via CSS variables
3. **Vibe Modifiers**: 5 visual intensity levels (minimal → expressive)
4. **Compound Components**: Clean slot-based composition (`LayoutSplit.Left`)
5. **Validated Output**: L0 validator catches forbidden elements

## Quick Start

### Installation

```bash
cd src/paged/render/react
npm install
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Build

```bash
npm run build
```

## Component Reference

### L1: Layouts

#### LayoutCover
```mdx
<LayoutCover>
  <Heading level={1}>Title</Heading>
  <Text variant="lead">Subtitle</Text>
</LayoutCover>
```

#### LayoutSplit
```mdx
<LayoutSplit ratio="2:1">
  <LayoutSplit.Left>
    <Heading level={2}>Features</Heading>
    <SmartList items={["Fast", "Easy", "Powerful"]} />
  </LayoutSplit.Left>
  <LayoutSplit.Right>
    <ChartBar data={[{label: "Q1", value: 100}]} />
  </LayoutSplit.Right>
</LayoutSplit>
```

Supported ratios: `"1:1"`, `"2:1"`, `"1:2"`, `"3:1"`, `"1:3"`

#### LayoutGrid
```mdx
<LayoutGrid cols={3}>
  <LayoutGrid.Col>Column 1</LayoutGrid.Col>
  <LayoutGrid.Col>Column 2</LayoutGrid.Col>
  <LayoutGrid.Col>Column 3</LayoutGrid.Col>
</LayoutGrid>
```

Supported columns: `2`, `3`, `4`

#### LayoutFullBleed (NEW)
```mdx
<LayoutFullBleed image="/hero.jpg" overlay={0.5} align="center">
  <Heading level={1}>Hero Title</Heading>
  <Text variant="lead">Impactful message</Text>
</LayoutFullBleed>
```

Options: `image`, `overlay` (0-1), `align` (left/center/right), `valign` (top/center/bottom)

#### LayoutTimeline (NEW)
```mdx
<LayoutTimeline>
  <LayoutTimeline.Item year="2020">
    <Heading level={3}>Company Founded</Heading>
    <Text>Started with 5 people</Text>
  </LayoutTimeline.Item>
  <LayoutTimeline.Item year="2023">
    <Heading level={3}>Series B</Heading>
    <Text>Raised $50M funding</Text>
  </LayoutTimeline.Item>
</LayoutTimeline>
```

#### LayoutDashboard (NEW)
```mdx
<LayoutDashboard>
  <LayoutDashboard.Header>
    <Heading level={2}>Dashboard</Heading>
  </LayoutDashboard.Header>
  <LayoutDashboard.Main>
    <ChartLine data={chartData} />
  </LayoutDashboard.Main>
  <LayoutDashboard.Sidebar>
    <MetricGroup metrics={metrics} />
  </LayoutDashboard.Sidebar>
</LayoutDashboard>
```

### L2: Blocks

#### SmartList
```mdx
<SmartList 
  items={["Item 1", "Item 2", "Item 3"]} 
  ordered={false}
  icon="🚀"
/>
```

#### ChartBar
```mdx
<ChartBar 
  title="Sales by Quarter"
  data={[
    {label: "Q1", value: 100},
    {label: "Q2", value: 150}
  ]}
  height="md"
/>
```

#### ChartLine (NEW)
```mdx
<ChartLine 
  title="Revenue Trend"
  data={[
    {label: "Jan", value: 100},
    {label: "Feb", value: 150},
    {label: "Mar", value: 180}
  ]}
  curve="smooth"
  area={true}
/>
```

#### ChartPie (NEW)
```mdx
<ChartPie 
  title="Market Share"
  data={[
    {label: "Product A", value: 45},
    {label: "Product B", value: 30},
    {label: "Product C", value: 25}
  ]}
  donut={true}
/>
```

#### MetricGroup
```mdx
<MetricGroup 
  metrics={[
    {value: "$2.4M", label: "Revenue", change: 12},
    {value: "89%", label: "Satisfaction"}
  ]}
  cols={2}
/>
```

#### TableData (NEW)
```mdx
<TableData 
  headers={["Name", "Role", "Department"]}
  rows={[
    ["Alice", "Engineer", "R&D"],
    ["Bob", "Designer", "Product"],
    ["Carol", "Manager", "Operations"]
  ]}
  striped={true}
/>
```

#### QuoteBlock (NEW)
```mdx
<QuoteBlock author="Steve Jobs" source="Stanford 2005">
  Stay hungry, stay foolish.
</QuoteBlock>
```

#### ImageBlock (NEW)
```mdx
<ImageBlock 
  src="/product.png" 
  alt="Product screenshot"
  caption="Our flagship product"
  size="lg"
/>
```

#### CardGroup (NEW)
```mdx
<CardGroup 
  cols={3}
  cards={[
    {title: "Fast", description: "Lightning speed", icon: "⚡"},
    {title: "Easy", description: "Simple to use", icon: "🎯"},
    {title: "Powerful", description: "Full featured", icon: "💪"}
  ]}
/>
```

### L3: Atoms

#### Heading
```mdx
<Heading level={1}>Main Title</Heading>
<Heading level={2}>Section Title</Heading>
```

#### Text
```mdx
<Text>Regular paragraph</Text>
<Text variant="lead">Larger intro text</Text>
<Text variant="caption">Small caption</Text>
<Text variant="code">const x = 1</Text>
```

#### Callout
```mdx
<Callout intent="info" title="Note">
  This is informational content.
</Callout>
```

Intents: `"info"`, `"warning"`, `"success"`, `"danger"`

## Python MDX Generator

Generate MDX from `state.json`:

```python
from src.paged.render.react.mdx_renderer import ReactMDXRenderer

renderer = ReactMDXRenderer(output_dir="./output", theme="business")
mdx_content = renderer.render_state(state_json)
```

Or render to file:

```python
renderer.render_to_file(state_json, "slides.mdx")
```

## Themes & Vibes

### Available Themes
- `business` (default) - Professional corporate style
- `cyber` - Futuristic neon aesthetic
- `minimal` - Clean, minimal design
- `academic` - Traditional academic style
- `creative` - Bold, expressive design
- `duolingo` - Playful, colorful style
- `dark` - Dark mode theme

### Vibe Modifiers
Vibes control visual intensity across all components:

| Vibe | Intensity | Description |
|------|-----------|-------------|
| `minimal` | 1 | Flat, no shadows, subtle borders |
| `clean` | 2 | Light shadows, minimal decoration |
| `balanced` | 3 | Default, moderate visual weight |
| `decorative` | 4 | Rich shadows, prominent borders |
| `expressive` | 5 | Maximum visual impact |

Apply vibes via props or CSS variables:
```mdx
<LayoutCover vibe="expressive">...</LayoutCover>
```

## Validation

The L0 validator ensures MDX contains no forbidden elements:

```typescript
import { validateMDX } from './utils/validator';

const result = validateMDX(mdxContent);
if (!result.valid) {
  console.error(result.errors);
}
```

Python validation:
```python
from src.paged.render.react.mdx_renderer import validate_mdx

result = validate_mdx(mdx_content)
if not result.valid:
    print(result.errors)
```

## CLI Usage

```bash
# Render state.json to HTML
uce-render --render state.json --project react-mdx -o output.html

# Validate MDX without rendering
uce-render --render state.json --project react-mdx --validate-only

# Verbose output
uce-render --render state.json --project react-mdx -o output.html --verbose

# Override theme
uce-render --render state.json --project react-mdx --theme cyber
```

## Project Structure

```
src/paged/render/react/
├── components/
│   ├── atoms/          # L3: Heading, Text, Callout
│   ├── blocks/         # L2: SmartList, ChartBar, ChartLine, ChartPie, etc.
│   ├── layouts/        # L1: LayoutCover, LayoutSplit, LayoutFullBleed, etc.
│   └── core/           # Infrastructure: ThemeContext, MDXProvider, ThemeSelector
├── themes/             # Theme definitions + vibe system
├── utils/              # Types, validator, lazy-charts
├── styles/             # Global CSS with vibe variables
├── scripts/            # Export script for bundling
├── app/                # Next.js app router pages
├── __tests__/          # Vitest tests
└── mdx_renderer.py     # Python MDX generator
```

## Performance

### Lazy Loading
Charts are code-split for faster initial load:
```typescript
import { LazyChartBar, LazyChartLine } from '@/utils/lazy-charts';
```

### Export Optimization
- Single HTML file with inlined CSS/JS
- Image base64 encoding for portability
- Size validation (<500KB excluding images)

## Success Criteria

- [x] 95% valid MDX generation
- [x] Zero L0 violations in output
- [x] Vibe modifier system (5 levels)
- [x] Full component set (6 layouts, 9 blocks)
- [x] CLI integration with validation
- [ ] <2s render for 20 slides
- [ ] <100ms theme switch
- [ ] <500KB HTML export

## License

Internal project - see root LICENSE file.
