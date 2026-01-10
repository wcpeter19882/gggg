# Template Manifest Architecture (V2)

## 1. Overview & Motivation

### The Problem: The "Type Erasure" Gap
In our current architecture, there is a dangerous disconnect between the **React View Layer** and the **Python Generation Layer**.

*   **React** knows what is valid via TypeScript Interfaces/Props (e.g., `sidebar` should look good with a list).
*   **Python/LLM** guesses what is valid via hardcoded strings in `layout_engine.py`.

Because TypeScript interfaces are erased at runtime and cannot be easily read by Python, we rely on manual synchronization. If a developer updates `TemplateDashboard` to disallow Charts in the sidebar, they must remember to manually update the Python string definition. If they forget, the Agent will continue generating broken slides.

### The Solution: "Manifest-First" Architecture
We introduce **Template Manifests**—runtime objects that serve as the **Single Source of Truth (SSOT)** for both the rendering engine and the generation agent.

Instead of defining rules in two places, we define them ONCE in the component file. The Component enforces them, and the Python engine reads them to instruct the AI.

---

## 2. The Manifest Schema

A Manifest is a JSON-serializable constant exported alongside every Template Component.

### Schema Definition
```typescript
type ComponentType = 'Heading' | 'Text' | 'SmartList' | 'Chart' | 'BigNum' | 'MetricGroup' | '...';
type LayoutType = 'SlotLayoutStack' | 'SlotLayoutGrid' | 'SlotLayoutFit';

interface SlotManifest {
  /** Natural language description for the Agent (e.g., "Narrow sidebar column") */
  description: string;
  
  /** Visual constraints for the Agent */
  orientation?: 'portrait' | 'landscape';
  
  /** Allowed Component types in this slot */
  allowedComponents: ComponentType[];
  
  /** Explicitly banned components (useful for negative prompting) */
  bannedComponents?: ComponentType[];
  
  /** Supported SlotLayouts for this region */
  allowedLayouts?: LayoutType[];
  
  /** Recommended maximum number of items (for density calculation) */
  maxElements?: number;
}

interface TemplateManifest {
  /** Unique Template ID (matches component name) */
  id: string;
  
  /** High-level description for the Agent */
  description: string;
  
  /** Categorization for selection strategy */
  category: 'data' | 'narrative' | 'visual' | 'comparison';
  
  /** Slot definitions (must match Component Props) */
  slots: Record<string, SlotManifest>;
}
```

---

## 3. Implementation Plan

### A. The Component Layer (React)
Every V2 Template must export a `manifest`.

**File**: `src/paged/render/react/components/templates/TemplateDashboard.tsx`

```tsx
export const DashboardManifest: TemplateManifest = {
  id: "TemplateDashboard",
  category: "data",
  description: "Use for data-dense KPI displays, performance summaries, and status reports.",
  slots: {
    header: {
      description: "Top area for clean titles only.",
      allowedComponents: ["Heading"],
      maxElements: 1
    },
    main: {
      description: "Large central area for primary visualization.",
      orientation: "landscape",
      allowedComponents: ["Chart", "TableData", "NetworkGraph", "BigNum", "MetricGroup"],
      bannedComponents: ["SmartList", "ProcessStrip"],
      allowedLayouts: ["SlotLayoutFit", "SlotLayoutGrid"]
    },
    sidebar: {
      description: "Narrow vertical column for context and supporting metrics.",
      orientation: "portrait",
      allowedComponents: ["SmartList", "Callout", "MetricGroup", "Text"],
      bannedComponents: ["Chart", "Timeline", "ProcessStrip"],
      allowedLayouts: ["SlotLayoutStack"]
    }
  }
} as const;

export function TemplateDashboard(props: Props) {
  // Optional: Runtime validation against manifest
  if (process.env.NODE_ENV === 'development') {
    validatePropsAgainstManifest(props, DashboardManifest);
  }
  
  return ( ... ); 
}
```

### B. The Generation Layer (Python)
The `ReactLayoutEngine` no longer contains hardcoded prompt strings. It consumes the manifests (which can be synced/scraped during build or imported via a shared definition file).

**Concept**:
1.  Engine loads all known Manifests.
2.  Engine dynamically constructs the System Prompt.

**Generated Prompt Output**:
```markdown
# LAYOUT RULES: TemplateDashboard
Use for data-dense KPI displays, performance summaries, and status reports.

## SLOTS
- **main**: Large central area for primary visualization.
  * ACCEPTS: Chart, TableData, NetworkGraph, BigNum
  * BANNED: SmartList, ProcessStrip (Reason: Sidebar is better for lists)
  * ORIENTATION: landscape

- **sidebar**: Narrow vertical column for context and supporting metrics.
  * ACCEPTS: SmartList, Callout, MetricGroup
  * BANNED: Chart, Timeline (Reason: Too wide for column)
```

### C. The Validation Layer (Pipeline)
The `Validation Step` in the Python pipeline can now perform **Schema Validation** before rendering.

```python
# pseudo-code validation logic
def validate_slide(slide_json, manifest):
    for slot_name, slot_content in slide_json['slots'].items():
        rules = manifest['slots'][slot_name]
        
        # Check 1: Is component allowed?
        for item in slot_content['items']:
            if item['type'] not in rules['allowedComponents']:
                raise ValidationError(f"Component {item['type']} not allowed in {slot_name}")
                
        # Check 2: Element checks
        if len(slot_content['items']) > rules['maxElements']:
             raise ValidationError(f"Too many elements in {slot_name}")
```

---

## 4. Benefits

| Feature | Old Approach (Implicit) | New Approach (Manifest) |
| :--- | :--- | :--- |
| **Logic Location** | Split between Python & React | Centralized in Component file |
| **Validation** | Visual inspection only | Automated Pre-render checks |
| **Prompt Accuracy** | Manual updates (prone to drift) | Auto-generated from source |
| **Agent Guidance** | Generic ("Don't put charts in small columns") | Specific ("Sidebar banned: Chart") |
| **Iteration Speed** | Slow (Update TSX + Update Python) | Fast (Update Manifest only) |

## 5. Next Steps
1.  Define the `TemplateManifest` TypeScript interface in `types.ts`.
2.  Update `TemplateDashboard.tsx` to export its manifest.
3.  Write a script to extract manifests to a JSON registry for Python to consume.
4.  Update `mdx_renderer.py` to use the registry for prompt generation.
