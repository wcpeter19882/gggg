# Template Playground Architecture (Design System V2 Tooling)

## 0. Overview & Motivation

### The Problem: The "Blind Update" Cycle
Iterating on `TemplateManifests` is currently a high-friction process:
1.  Edit code (`TemplateDashboard.tsx`).
2.  Guess if a `BigNum` looks good in the `sidebar`.
3.  Refresh the browser.
4.  Realize it looks bad (overflow/clipping).
5.  Edit code again (ban `BigNum` or change layout strategy).
6.  Repeat.

This cycle is slow and doesn't encourage exploration. It also leads to "conservative" manifests where developers ban components just because they aren't sure if they will work, limiting the Agent's creativity.

### The Solution: The Template Playground
A specialized "meta-component" in the Design System V2 that wraps a Template in a stateful control harnesses. It allows developers to:
1.  **Tweak Manifest Rules** in real-time (toggling allowed/banned components).
2.  **Inject Mock Content** instantly to verify visual compatibility.
3.  **Stress Test** layouts with extreme content (overflow, wrong aspect ratios).
4.  **Export** the finalized settings back to the code.

---

## 1. Architecture: The `TemplateExperiment` Wrapper

We introduce a new container component that sits between the Page and the Template.

### Component Structure
`src/paged/render/react/app/design-system/v2/playground/TemplateExperiment.tsx`

```tsx
interface TemplateExperimentProps {
  /** The Template Component to test (e.g. TemplateDashboard) */
  component: React.ComponentType<any>;
  
  /** The specific Manifest to load as initial state */
  sourceManifest: TemplateManifest;
  
  /** Pre-defined content scenarios for quick testing */
  scenarios?: Record<string, any>;
}
```

### State Management
The Playground maintains a **"Shadow Manifest"**—a local state copy of the source manifest.

```tsx
const [draftManifest, setDraftManifest] = useState(sourceManifest);
const [activeContent, setActiveContent] = useState(defaultContent);
const [visualDebug, setVisualDebug] = useState(false);
```

---

## 2. Features & Workflow

### A. The "Manifest Configurator" (Left Panel)
An interactive tree-view mirroring the `slots` definition in the manifest.

**Controls for each Slot:**
*   **Allowed Components**: Checkboxes for every system component type (Chart, Text, BigNum, etc.). Checking a box adds it to the `allowedComponents` array in the Shadow Manifest.
*   **Allowed Layouts**: Toggles for `SlotLayoutStack` / `SlotLayoutGrid` / `SlotLayoutFit`.
*   **Orientation**: Radio button for `portrait` vs `landscape`.
*   **Max Elements**: Number input.

### B. Live Content Injection (The "Try It" Button)
Crucially, changing the *permission* (Manifest) doesn't automatically show the *result*. We need to inject content.

**Mechanism:**
For every unchecked/checked component type, the UI provides a "Test" button.
*   "Test BigNum": Injects a mock `BigNum` prop into the corresponding slot prop of the Template.
*   "Test Chart": Injects a mock `Chart` prop.

**Interactive Layout Switching:**
If a slot allows multiple layouts (e.g., `["SlotLayoutStack", "SlotLayoutGrid"]`), the Playground renders a **Dropdown** above that slot in the preview area, letting the developer force the renderer to use a specific strategy for the current content.

### C. Visual Scaffolding (Ghost Mode)
To debug *why* something doesn't fit, we need `visualDebug` mode.

**Render Overlays:**
*   **Slot Boundaries**: 2px dashed blue border around the `Slot`.
*   **Padding/Margins**: Semi-transparent red overlay on the Template's CSS variables (`--theme-spacing-padding`).
*   **Grid Lines**: If `SlotLayoutGrid` is active, overlay CSS Grid tracks.
*   **Dimensions Label**: A small tag showing the actual pixel width/height of the slot (e.g., "Main: 800x600").

### D. Stress Testing (The "Fuzzer")
Automated scenarios to validate the robustness of the layout choices.

**Buttons:**
*   **"Max Fill"**: Injects dummy items up to `maxElements`.
*   **"Text Overflow"**: Injects typical text components with 3x normal length.
*   **"Aspect Ratio Torture"**: Injects a wide chart into a narrow slot.

---

## 3. Implementation Details

### Integration Strategy
This does NOT require changing the Templates themselves. It uses React's composition model.

**File:** `src/paged/render/react/app/design-system/v2/page.tsx`

```tsx
// Interactive Design Page
export default function V2DesignSystem() {
  const [selectedTemplate, setSelectedTemplate] = useState('Dashboard');

  return (
    <div className="playground-layout">
      <Sidebar>
        <TemplateSelector onChange={setSelectedTemplate} />
        <ManifestEditor 
          manifest={getManifest(selectedTemplate)} 
          onUpdate={updateShadowManifest} 
        />
        <StressTools onInject={injectScenario} />
      </Sidebar>
      
      <PreviewArea>
        {/* The Live Component */}
        <TemplateDashboard
           {...activeContent} // Injected mock content
           _debug={visualDebug} // Optional debug prop if we want to pass it down
        />
        
        {/* Or Overlay Approach */}
        {visualDebug && <ScaffoldingOverlay template={selectedTemplate} />}
      </PreviewArea>
    </div>
  );
}
```

### The "Export" Action
Once the developer has tweaked the settings (e.g., "Ok, Sidebar needs `SlotLayoutFit` and can only take `BigNum`"), they click **"Copy Manifest"**.

This generates a formatted JSON/TypeScript string matching the `TemplateManifest` interface, which can be pasted directly back into `TemplateDashboard.tsx`.

---

## 4. Constraints & Rules (Preserving Architecture)

1.  **Immutable Template Props**: The Playground cannot invent new props for the Template. It can only populate existing defined slots (`header`, `main`, `sidebar`).
2.  **CSS Variable Reliance**: The Scaffolding tool must rely on the standard CSS variables defined in `RENDER_ENGINE_ARCH.md` (`--theme-spacing-padding`, etc.) to draw accurate overlays. It should not guess pixel values.
3.  **No Logic Leakage**: The Playground logic stays in the Playground. We do not add "Playground Mode" checks inside the production `TemplateDashboard` component code.

## 5. Next Steps
1.  Build the `TemplateExperiment` container.
2.  Create a `MockContentRegistry` (factory functions for generating dummy Charts, Lists, Text).
3.  Implement the "Shadow Manifest" state logic.
