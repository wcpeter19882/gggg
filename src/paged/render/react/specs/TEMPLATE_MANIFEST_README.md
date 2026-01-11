# Template Manifest System & Playground

## Overview

The Template Manifest System is a **Single Source of Truth (SSOT)** architecture that bridges the gap between the React rendering layer and the Python generation layer. It solves the "type erasure" problem by providing runtime-accessible specifications for template slot constraints.

## System Architecture

### 1. Core Components

#### Manifest Types (`utils/manifest-types.ts`)
- **`ComponentType`**: All renderable component types (Heading, Text, Chart, etc.)
- **`LayoutType`**: SlotLayout strategies (Stack, Grid, Fit)
- **`SlotManifest`**: Defines rules for a single template slot
- **`TemplateManifest`**: Complete specification for a template

#### Manifest Registry (`utils/manifest-registry.ts`)
- Central collection of all template manifests
- Validation utilities for runtime checking
- Export functions for Python consumption
- System prompt generation for LLM agents

#### Mock Content Registry (`utils/mock-content-registry.tsx`)
- Factory functions for generating test content
- Supports 'short', 'normal', and 'long' variants
- Used by playground for rapid prototyping

### 2. Template Integration

All V2 templates now export a manifest alongside the component:

```tsx
// TemplateDashboard.tsx
export const DashboardManifest: TemplateManifest = {
  id: 'TemplateDashboard',
  category: 'data',
  description: 'Use for data-dense KPI displays...',
  slots: {
    header: {
      description: 'Top area for clean titles only.',
      allowedComponents: ['Heading', 'Text'],
      maxElements: 2,
      bannedComponents: ['Chart', 'SmartList', ...]
    },
    // ... more slots
  }
};

export function TemplateDashboard({ ... }) { ... }
```

### 3. Playground Tool

Interactive environment for testing templates:

**Location**: `/design-system/v2/playground`

**Features**:
- **Manifest Configurator**: Toggle allowed/banned components per slot
- **Content Injector**: Test buttons for each component type
- **Live Preview**: Real-time rendering with mock content
- **Visual Debug Mode**: Overlay showing slot boundaries
- **Export**: Copy manifest JSON to clipboard

## Usage

### Accessing the Playground

```bash
# Start the dev server
npm run dev

# Navigate to:
http://localhost:3000/design-system/v2/playground
```

### Testing Workflow

1. **Select a Template** from the dropdown (Dashboard, TwoColumn, etc.)
2. **Configure Manifest** in the left panel:
   - Toggle allowed components for each slot
   - Add/remove banned components
   - Enable/disable layout types
3. **Inject Content** in the right panel:
   - Select target slot
   - Choose content size (short/normal/long)
   - Click component "Test" buttons
4. **Observe Results** in the center preview
5. **Export Manifest** when finalized

### Exporting Manifests for Python

```bash
# Run export script
npx tsx src/paged/render/react/scripts/export-manifests.ts

# Outputs:
# - output/template-manifests.json (full registry)
# - output/template-prompts.json (LLM system prompts)
```

## Manifest Structure

### Slot Manifest Properties

```typescript
{
  description: string;              // Human-readable explanation
  orientation?: 'portrait' | 'landscape';  // Visual constraint
  allowedComponents: ComponentType[];      // Whitelist
  bannedComponents?: ComponentType[];      // Explicit blacklist
  allowedLayouts?: LayoutType[];          // Supported layouts
  maxElements?: number;                    // Density limit
  minElements?: number;                    // Required minimum
}
```

### Example: Dashboard Main Slot

```json
{
  "description": "Large central area for primary data visualization",
  "orientation": "landscape",
  "allowedComponents": [
    "ChartBar", "ChartLine", "ChartPie",
    "TableData", "NetworkGraph",
    "BigNum", "MetricGroup"
  ],
  "bannedComponents": [
    "SmartList", "ProcessStrip", "Timeline"
  ],
  "allowedLayouts": ["SlotLayoutFit", "SlotLayoutGrid"],
  "maxElements": 4
}
```

## Integration with Python

### Reading Manifests

```python
import json

# Load the registry
with open('output/template-manifests.json', 'r') as f:
    registry = json.load(f)

# Access a specific template
dashboard_manifest = registry['templates']['TemplateDashboard']

# Get slot rules
main_slot = dashboard_manifest['slots']['main']
allowed_components = main_slot['allowedComponents']
```

### Generating System Prompts

The exported `template-prompts.json` contains pre-formatted prompt text:

```json
{
  "TemplateDashboard": "# LAYOUT RULES: TemplateDashboard\nUse for data-dense KPI displays...\n\n## SLOTS\n- **main**: Large central area...\n  * ORIENTATION: landscape\n  * ACCEPTS: ChartBar, ChartLine, ...\n  * BANNED: SmartList, ProcessStrip\n  ..."
}
```

Use this directly in your LLM system prompt to guide content generation.

## Benefits

### Before (Implicit Rules)
- Rules split between React TypeScript and Python strings
- Manual synchronization required
- Drift leads to broken slides
- No validation until render time

### After (Manifest-First)
- Single source of truth in component file
- Automatic synchronization via JSON export
- Pre-render validation possible
- Type-safe on both ends

## File Structure

```
src/paged/render/react/
├── utils/
│   ├── manifest-types.ts           # Core type definitions
│   ├── manifest-registry.ts        # Central registry & utilities
│   └── mock-content-registry.tsx   # Test content generators
├── components/templates/
│   ├── TemplateDashboard.tsx       # Component + Manifest
│   ├── TemplateTwoColumn.tsx
│   ├── TemplateSingleColumn.tsx
│   ├── TemplateCover.tsx
│   └── TemplateFullBleed.tsx
├── app/design-system/v2/playground/
│   ├── page.tsx                    # Main playground page
│   ├── TemplateExperiment.tsx      # State management wrapper
│   ├── ManifestConfigurator.tsx    # Left panel UI
│   └── ContentInjector.tsx         # Right panel UI
└── scripts/
    └── export-manifests.ts         # Export to JSON
```

## Current Template Manifests

| Template | Category | Slots | Key Constraints |
|----------|----------|-------|-----------------|
| **TemplateDashboard** | data | header, main, sidebar, footer | Main: landscape, charts only; Sidebar: portrait, no charts |
| **TemplateTwoColumn** | comparison | header, left, right, footer | Balanced columns, mixed content |
| **TemplateSingleColumn** | narrative | header, body, footer | Most flexible, text-focused |
| **TemplateCover** | visual | title, subtitle, meta, background | Minimal text, single elements |
| **TemplateFullBleed** | visual | media, overlay | Full-bleed media, overlay text |

## Next Steps

1. **Python Integration**: Update `ReactLayoutEngine` to read from exported JSON
2. **Validation Pipeline**: Add pre-render validation using manifest rules
3. **Agent Prompts**: Replace hardcoded prompts with generated ones
4. **Stress Testing**: Add automated layout stress tests in playground
5. **Manifest Versioning**: Track manifest changes for backward compatibility

## Troubleshooting

### "Component not rendering in playground"
- Check that the component type is in the slot's `allowedComponents`
- Verify the mock content generator exists in `mock-content-registry.tsx`

### "Manifest export fails"
- Ensure all templates properly export their manifest as a named export
- Check that imports in `manifest-registry.ts` are correct

### "Visual debug overlay not showing"
- This feature is currently basic and shows global boundaries
- Proper slot positioning requires ref measurements (future enhancement)

## Contributing

When adding a new V2 template:

1. Define the `TemplateManifest` constant
2. Export it alongside the component
3. Add to `TEMPLATE_MANIFESTS` in `manifest-registry.ts`
4. Add to `TEMPLATE_REGISTRY` in playground `page.tsx`
5. Run export script to update JSON files
6. Test in playground before committing

## References

- [TEMPLATE_MANIFEST_ARCHITECTURE.md](../../../TEMPLATE_MANIFEST_ARCHITECTURE.md)
- [TEMPLATE_PLAYGROUND_ARCHITECTURE.md](../../../TEMPLATE_PLAYGROUND_ARCHITECTURE.md)
- [RENDER_ENGINE_ARCH.md](RENDER_ENGINE_ARCH.md)
