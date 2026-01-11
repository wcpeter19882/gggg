# Template Manifest System - Quick Start Guide

## 🚀 Getting Started (2 Minutes)

### View the Playground

```bash
# 1. Start the dev server (if not already running)
cd src/paged/render/react
npm run dev

# 2. Open browser to:
# http://localhost:3000/design-system/v2/playground
```

### Try It Out

1. **Select a template** from the dropdown (try "TemplateDashboard")
2. **Click "Test" buttons** in the right panel to inject mock content
3. **Toggle components** in the left panel to see what's allowed
4. **Enable "Visual Debug"** to see slot boundaries
5. **Click "Export Manifest"** to copy the JSON

## 📊 Export Manifests for Python

```bash
# From: src/paged/render/react/
npx tsx scripts/export-manifests.ts

# Creates:
# - output/template-manifests.json
# - output/template-prompts.json
```

## 🎯 What You Get

### For React Developers
- Type-safe template definitions
- Runtime validation of slot content
- Interactive testing environment
- Visual debugging tools

### For Python/LLM Integration
- JSON manifest registry
- Pre-generated system prompts
- Explicit component constraints
- Validation rules

## 📖 Full Documentation

See [TEMPLATE_MANIFEST_README.md](src/paged/render/react/TEMPLATE_MANIFEST_README.md) for:
- Complete API reference
- Python integration guide
- Troubleshooting
- Contributing guidelines

## 🏗️ Architecture Summary

```
Template Component (TSX)
    ↓
Exports Manifest (JSON-serializable)
    ↓
Manifest Registry (Central SSOT)
    ↓
Export Script
    ↓
JSON Files → Python Generation Layer
```

## 🎨 Available Templates

| Template | Best For | Slots |
|----------|----------|-------|
| `TemplateDashboard` | KPI dashboards, metrics | header, main, sidebar, footer |
| `TemplateTwoColumn` | Comparisons, side-by-side | header, left, right, footer |
| `TemplateSingleColumn` | Narrative content, lists | header, body, footer |
| `TemplateCover` | Title slides, dividers | title, subtitle, meta, background |
| `TemplateFullBleed` | Hero slides, visuals | media, overlay |

## 🔧 Adding a New Template

1. Create template component with props interface
2. Export `TemplateManifest` constant alongside component
3. Add to `TEMPLATE_MANIFESTS` in `utils/manifest-registry.ts`
4. Add to `TEMPLATE_REGISTRY` in `app/design-system/v2/playground/page.tsx`
5. Run export script
6. Test in playground

## 💡 Example Manifest

```typescript
export const MyTemplateManifest: TemplateManifest = {
  id: 'TemplateMyTemplate',
  category: 'data',
  description: 'Use for...',
  slots: {
    header: {
      description: 'Top area for title',
      allowedComponents: ['Heading', 'Text'],
      maxElements: 2
    },
    body: {
      description: 'Main content',
      allowedComponents: ['Chart', 'Table', 'BigNum'],
      orientation: 'landscape',
      maxElements: 3
    }
  }
};
```

## ❓ Common Questions

**Q: Do manifests affect runtime rendering?**
A: No. Manifests are for validation and documentation. They don't change component behavior.

**Q: Can I use this without Python?**
A: Yes! The playground is useful for testing templates in isolation.

**Q: What if I want to override a manifest rule?**
A: Use the playground to test variations, then export the modified manifest.

**Q: How do I know what components exist?**
A: Check `ComponentType` in `utils/manifest-types.ts` or call `getAllComponentTypes()`.

## 🐛 Troubleshooting

**Playground won't load:**
- Check console for errors
- Ensure all templates are properly imported in `page.tsx`

**Export script fails:**
- Run `npm install` to ensure dependencies are installed
- Check that all manifests are valid TypeScript

**Component not showing in injector:**
- Verify it's in the slot's `allowedComponents` array
- Check the mock generator exists in `mock-content-registry.tsx`

## 📚 Related Docs

- [TEMPLATE_MANIFEST_ARCHITECTURE.md](TEMPLATE_MANIFEST_ARCHITECTURE.md) - Design philosophy
- [TEMPLATE_PLAYGROUND_ARCHITECTURE.md](TEMPLATE_PLAYGROUND_ARCHITECTURE.md) - Playground design
- [TEMPLATE_MANIFEST_IMPLEMENTATION.md](TEMPLATE_MANIFEST_IMPLEMENTATION.md) - Implementation details
- [RENDER_ENGINE_ARCH.md](src/paged/render/react/RENDER_ENGINE_ARCH.md) - Overall system architecture
