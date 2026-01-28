# Copilot Instructions for ant-export React

## Skill Architecture

The slides generation pipeline uses specialized skills in `.claude/skills/`:

| Skill | Purpose | Output |
|-------|---------|--------|
| **theme** | Create theme tokens (colors, fonts) | Theme definition in `/themes/` |
| **storyline** | Create story narrative from content | Story structure in `content.json` |
| **ant-paged-layout** | Generate Ant Design JSX layouts | `mdx` field in slides |
| **paged-layout** | Generate general layouts (non-Ant) | `mdx` field in slides |
| **ant-export** | Export and preview Ant Design slides | Server at localhost:3001 |
| **export** | Export general slides | Server output |

**Workflow**: theme → storyline → *-paged-layout → *-export

## Three-Layer Component Model

| Layer | Library | Purpose |
|-------|---------|---------|
| **Layout** | Tailwind CSS + `<div>` | Structure, positioning, spacing |
| **Content** | Ant Design 5.x | Semantic data display |
| **Visual** | HeroUI v2 | Decorative containers |
| **Charts** | Recharts + Custom SVG | Data visualization |

## Available Chart Components

| Component | Type | Use Case |
|-----------|------|----------|
| `Line` | Recharts | Trends over time |
| `Bar` | Recharts | Horizontal bars, rankings |
| `Column` | Recharts | Vertical bars, comparisons |
| `Pie` | Recharts | Proportions, market share |
| `Area` | Recharts | Cumulative trends |
| `Funnel` | Recharts | Conversion flows |
| `Radar` | Recharts | Multi-dimension comparison |
| `Venn` | Custom SVG | Logical intersections |
| `Pyramid` | Custom SVG | Hierarchy levels |
| `Matrix` | Custom SVG | BCG/quadrant positioning |

See `ant-paged-layout/SKILL.md` for full visual component guide.

## Shadow Implementation (CRITICAL)

All component wrappers under `components/` must **only wrap or re-export** real framework components.

### Rules

1. **No custom components** - Only use components that exist in Ant Design / HeroUI
2. **Only supported props** - Only expose props the original component supports
3. **Use `<div>` for custom layouts** - Compose real components + div for custom visuals

### Example

```jsx
// ❌ Wrong - custom component
<Sticker title="Title" color="yellow" votes={5} />

// ✅ Correct - compose real components
<HCard className="w-[140px]" style={{ background: "#fff740" }} shadow="md">
  <CardBody><Text strong>Title</Text></CardBody>
</HCard>
```

## Ant Design className Support

All Ant Design wrappers pass `className` through, merged with module styles:

```jsx
<Statistic className="mb-4" title="Revenue" value={112893} />
<Table className="flex-1" dataSource={data} columns={columns} />
```

Use Tailwind classes for layout/spacing on Ant Design components.

## Theming

### Theme vs className Scope

| Scope | Use Theme Tokens | Use Tailwind className |
|-------|------------------|------------------------|
| Component internals (Statistic value, Table cells) | ✅ | ❌ Won't work |
| Wrapper/container styling | ⚠️ | ✅ Works well |
| Layout (spacing, sizing) | ❌ | ✅ Use this |

### Available Themes

- `businessLight` - White background, navy text
- `teamsDark` - Dark background, light text

### Creating New Themes

Define Ant Design tokens in `/themes/`:

```ts
export const cyberDarkTheme: ThemeDefinition = {
  name: 'cyberDark',
  antdTokens: {
    colorPrimary: '#00ffff',
    colorBgBase: '#0a0a0f',
    colorTextBase: '#e0e0e0',
  },
};
```

Then use Tailwind for additional effects (glow, transforms).
<div className="grid grid-cols-2 gap-8">
  <HCard className="border border-cyan-500/50" style={{ boxShadow: "0 0 20px rgba(0,255,255,0.3)" }}>
    <CardBody>
      <Statistic title="Active Users" value={12847} />  {/* Cyan from theme */}
    </CardBody>
  </HCard>
</div>
```
