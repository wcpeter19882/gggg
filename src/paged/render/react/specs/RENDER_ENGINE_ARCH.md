# React Render Engine Architecture & Refactoring Plan

## 0. Goals & Constraints

### Core Philosophy: Fixed Canvas Rendering
The render engine is designed to produce **presentation slides** on a fixed canvas (e.g., 1920x1080), NOT responsive web pages.

### What it is NOT
*   **No Responsive Reflow**: We do not solve for variable viewport sizes. The canvas size is deterministic.
*   **No Scrolling**: Slides are single-view entities. Content must fit within the viewport.
*   **No Dynamic Overflow Handling**: The renderer does not attempt to create scrollbars for overflowing text.

### Responsibility Boundary
*   **Pipeline Validation**: If text exceeds its allocated area, the pipeline's **Validation Step** (upstream) is responsible for detecting this and either:
    *   Summarizing/shortening the content.
    *   Selecting a different Template with more capacity.
*   **Renderer**: Blindly renders what it is given into the fixed slots. It assumes "fit" has been validated.

---

## 1. Current Architecture Analysis

### Status Quo: "Logic-Driven" & Implicit
The current React renderer operates on a mix of **Compound Components** (e.g., `LayoutSplit.Left`) and **Heuristic/Positional Logic** (e.g., `LayoutStacked` guessing headers based on child count).

### Key Issues
1.  **Implicit Slotting & Guesswork**: The renderer relies on inspecting `children` arrays or `displayName` to determine where content should go. This is fragile; if an Agent generates 2 items instead of 3, a structure meant to have a Header might collapse into just Body text.
2.  **Coupled Responsibilities**: Components like `LayoutSplit` handle both *where* things go (Grid areas) and *how* they stack (Flex/gap attributes). This high coupling makes it hard to change one without breaking the other.
3.  **Lack of Constraints**: There is no standard mechanism to prevent overflow or ensure components "fit". A component is blindly dumped into a container, often resulting in visual misalignments.
4.  **High-Friction Customization**: Adding a new "layout" requires writing a new React component and modifying the Python renderer logic (`mdx_renderer.py`) to map parameters manually.

---

## 2. Future Architecture: The 4-Layer Model

We are moving towards a **Schema-Driven**, deterministic architecture where visual placement is explicitly defined, not guessed.

### The 4 Layers

#### 1. Template (The Skeleton)
*   **Role**: Defines the macro grid of the slide. It knows *nothing* about the content, only about "Areas".
*   **Responsibility**: CSS Grid Areas, Global Padding, Backgrounds.
*   **Interface**: Props are explicit semantic slots (e.g., `header`, `sidebar`), not generic `children`.

**⚠️ CRITICAL RULE: Template Slot Consistency**

All templates MUST use the same CSS variables for spacing to ensure the generation engine can reliably calculate available space:

| Property | CSS Variable | Default Value | Purpose |
|----------|--------------|---------------|----------|
| Outer padding | `--theme-spacing-padding` | `64px 80px` | Slide edge margins |
| Section gap | `--theme-spacing-margin` | `24px` | Gap between header/body/footer |
| Column gap | `--theme-spacing-gap` | `40px` | Gap between columns/slots |

**Slot styling rules:**
1. All slots within a template MUST have identical structural styling (no extra padding/margin on specific slots)
2. Visual styling (backgrounds, borders, border-radius) MUST NOT be applied to slots directly—use SlotLayout or wrapper components inside the slot instead
3. This ensures consistent space calculation for validation and content fitting

#### 2. Slot (The Semantic Region)
*   **Role**: The contract/interface between a Template and its content.
*   **Responsibility**: **Validation & Constraint**. It strictly defines which **SlotLayouts** (e.g., Stack, Grid) and **Components** (e.g., Chart, Timeline) are valid for this specific region. It ensures an agent cannot attempt to fit an incompatible layout or component into a constrained slot.

#### 3. SlotLayout (The Structural Strategy)
*   **Role**: A pure structural primitive that dictates how atomic components are arranged *within* a Slot.
*   **Responsibility**: Stacking (Vertical/Horizontal), Grids, "Fitting".
*   **Examples**: `SlotLayoutStack`, `SlotLayoutGrid`, `SlotLayoutFit`.

#### 4. Component (The Atomic Content)
*   **Role**: The smallest unit of display.
*   **Responsibility**: Rendering data (Charts, Metrics, Text). Responsive behavior to fill its container.

### Pseudo-Code Representation

```tsx
// 1. Template: Defines the "Map"
const TemplateTwoColumn = ({ header, left, right }) => (
  <div className="grid-areas-layout">
     <div className="area-header">{header}</div>
     <div className="area-left">{left}</div>
     <div className="area-right">{right}</div>
  </div>
);

// 2. Renderer Logic: Injects SlotLayouts into Slots
<TemplateTwoColumn
  // Slot: Header
  header={
    // SlotLayout: Stack
    <SlotLayoutStack align="center">
      {/* Component */}
      <Heading text="Performance Review" />
    </SlotLayoutStack>
  }
  
  // Slot: Left Column
  left={
    // SlotLayout: Stack (Text heavy)
    <SlotLayoutStack gap="md">
      <Text content="..." />
      <List items={[...]} />
    </SlotLayoutStack>
  }

  // Slot: Right Column
  right={
    // SlotLayout: Fit (Visual heavy)
    <SlotLayoutFit>
      <ChartBar data={...} />
    </SlotLayoutFit>
  }
/>
```

---

## 3. Incremental Refactoring Plan

We will adoption an **"Extract -> Wrap -> Expose"** strategy. We set up new parallel directories to build V2 components without breaking V1 "Production" rendering.

### Workspace Setup
*   **New Component Folders**:
    *   `src/paged/render/react/components/slot-layouts/` -> For **SlotLayout** primitives (Phase 1). ✅ **COMPLETED**
    *   `src/paged/render/react/components/templates/` -> For **Template** components (Phase 2).
*   **New Design System Page**:
    *   `src/paged/render/react/app/design-system/v2/page.tsx` -> Sandbox for testing the 4-layer assembly.

### Phase 1: Extract Structure Primitives (SlotLayouts) ✅ **COMPLETED**
**Goal**: Decouple "Stacking/Grid" logic from business logic.
1.  **Create Primitives**: Build pure layout components in `/slot-layouts`:
    *   `SlotLayoutStack`: Flex-col with `gap`. ✅
    *   `SlotLayoutGrid`: CSS Grid with `cols`. ✅
    *   `SlotLayoutFit`: Box that ensures child covers container (object-fit). ✅
2.  **Refactor Legacy**: Update existing `LayoutStacked` etc. to use these primitives internally, verifying they work exactly as before.

#### SlotLayout API Reference (Implemented)

```typescript
// SlotLayoutStack - Vertical flex stacking
interface SlotLayoutStackProps {
  children: ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';  // default: 'md'
  align?: 'start' | 'center' | 'end' | 'stretch';    // default: 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between';  // default: 'start'
  className?: string;
}

// SlotLayoutGrid - CSS Grid columns
interface SlotLayoutGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;           // default: 2
  gap?: 'sm' | 'md' | 'lg';       // default: 'md'
  className?: string;
}

// SlotLayoutFit - Fill container (for visuals)
interface SlotLayoutFitProps {
  children: ReactNode;
  mode?: 'cover' | 'contain' | 'fill';  // default: 'cover'
  align?: 'start' | 'center' | 'end';   // default: 'center'
  valign?: 'start' | 'center' | 'end';  // default: 'center'
  className?: string;
}
```

### Phase 2: Define Semantic Templates ✅ **COMPLETED**
**Goal**: Create the top-level Skeletons.
1.  **Create Templates**: Build strict templates in `/templates` (e.g., `TemplateTwoColumn.tsx`, `TemplateDashboard.tsx`). ✅
2.  **Define Props**: Use explicit interfaces (`interface TwoColProps { left: ReactNode; right: ReactNode }`) instead of `children` arrays. ✅

#### Template Summary (Implemented)

| Template | Slots | Variants/Options | Use Case |
|----------|-------|------------------|----------|
| `TemplateSingleColumn` | `header?`, `body`, `footer?` | `align`: left, center | Standard content slides |
| `TemplateTwoColumn` | `header?`, `left`, `right`, `footer?` | `ratio`: 1:1, 2:1, 1:2, 3:1, 1:3 | Comparison, side-by-side layouts |
| `TemplateDashboard` | `header?`, `main`, `sidebar`, `footer?` | `variant`: default, wide-main, sidebar-focus | KPI displays, metrics dashboards |
| `TemplateCover` | `title`, `subtitle?`, `meta?`, `background?` | `align`: center, left, right | Title/cover slides |
| `TemplateFullBleed` | `media`, `overlay` | `overlayPosition`: 9 positions, `overlayOpacity` | Hero slides, section dividers |

All templates follow the design principle of explicit named slots (no `children` arrays) and support `theme` and `vibe` props for styling overrides.

### Phase 3: The Bridge (Middleware & Schema)
**Goal**: Enable Python Renderer to "speak" the new Architecture.
1.  **Schema Update**: Extend the JSON protocol to support a `structure` or `template` object alongside the legacy `layout` string.
2.  **Renderer Logic**: Add `_render_template()` method in `mdx_renderer.py`. It should read the explicit slot definitions and map them to the new Template + SlotLayout components.

### Phase 4: Agent Migration
**Goal**: Shift "Storyline" generation to the new standard.
1.  **Prompt Engineering**: Update the Agent System Prompt to generate the new JSON schema (selecting specific Templates and Region strategies).
2.  **Validation**: Ensure the combination of Template + SlotLayout + Component produces valid outcomes.
3.  **Deprecation**: Slowly phase out legacy `layouts/*` components.
