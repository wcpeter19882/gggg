# Layout Engine Refactoring: Proper Auto-Layout Implementation

## Problem

The current implementation is **fundamentally broken** - it delegates layout calculation to CSS Grid in templates instead of performing explicit auto-layout in the LayoutEngine. This violates the design principle that the layout engine should work independently of rendering target (HTML/CSS, PDF, Canvas, SVG, etc.).

## Root Cause

**Missing Components:**
1. ❌ Widget size measurement (content → dimensions)
2. ❌ Layout algorithm implementation (positions calculation)
3. ❌ Bounds tracking in RenderableLayout

**What exists:** Only size validation (widget.min_size vs slot.size)

## Architecture Fix Required

### 1. Widget Measurement (NEW)

**File:** `src/common/measurement.py` ✅ CREATED
**File:** `src/paged/widgets/base.py` ✅ UPDATED

Every widget must implement:
```python
def measure(self, style: Dict[str, Any], max_width: float, max_height: float) -> MeasuredSize:
    """Calculate how much space this widget needs based on content."""
    # Example for TypeWidget:
    text = self.parameters.get("text", "")
    font_size = float(style.get("font-size", "16px").replace("px", ""))
    return WidgetMeasurement.measure_text_widget(text, font_size, max_width)
```

**Must implement for:**
- [ ] TypeWidget (Display, Heading, Body, List, Quote) - measure text
- [ ] DataWidget (BigNum, Trend, Progress) - measure numbers + labels
- [ ] Future: ChartWidget - fixed size or data-driven
- [ ] Future: MediaWidget - image dimensions or fixed

### 2. Layout Protocol (NEW)

**File:** `src/paged/layout/layout_protocol.py` ✅ CREATED

Every layout strategy must implement:
```python
@staticmethod
def calculate_layout(
    widgets: List[WidgetLayoutInput],
    context: LayoutContext
) -> Dict[str, Bounds]:
    """
    Calculate absolute (x, y, width, height) for each widget.
    
    Input: Measured widget sizes
    Output: Absolute pixel positions on canvas
    """
```

### 3. Layout Strategies (UPDATE)

**Files:** `src/paged/layout/dummy/strategies/*.py`

Must implement `calculate_layout()` for:
- [x] BentoStandardStrategy - 3x2 fixed grid ✅ IMPLEMENTED
- [x] BentoHeroLeftStrategy - 2/3-1/3 split ✅ IMPLEMENTED
- [ ] BentoHeroTopStrategy - top hero + footer cells
- [ ] BentoQuarterStrategy - 2x2 medium grid
- [ ] SwissPosterStrategy - full-bleed single content
- [ ] SwissAsymmetryStrategy - asymmetric positioning
- [ ] SwissSplitTypoStrategy - split with typography emphasis
- [ ] CinematicSplit5050Strategy - 50/50 split
- [ ] CinematicSplit3070Strategy - 30/70 split
- [ ] CinematicFullBleedStrategy - single full canvas

**Algorithm Types:**
1. **Fixed Grid** (Bento.Standard): Equal divisions
2. **Proportional Split** (Bento.HeroLeft, Cinematic): Percentage-based
3. **Content-Driven** (Swiss.Asymmetry): Dynamic based on measured sizes
4. **Full Bleed** (Swiss.Poster, Cinematic.FullBleed): Single widget fills canvas

### 4. Bounds Model (NEW)

**File:** `src/common/bounds.py` ✅ CREATED

```python
class Bounds(BaseModel):
    x: float      # Absolute X position (pixels from canvas 0,0)
    y: float      # Absolute Y position (pixels from canvas 0,0)
    width: float  # Width in pixels
    height: float # Height in pixels
```

### 5. RenderableLayout Update (UPDATED)

**File:** `src/common/renderable_layout.py` ✅ UPDATED

```python
class WidgetAssignment:
    role: str
    widget: BaseWidget
    slot: Slot
    applied_style: Dict[str, Any]
    bounds: Bounds  # ✅ ADDED - absolute position/size
```

### 6. LayoutEngine Refactor (CRITICAL - NOT DONE)

**File:** `src/layout/layout_engine.py` ❌ NEEDS COMPLETE REWRITE

**Current (WRONG):**
```python
def calculate(...):
    # 1. Create widgets
    # 2. Validate size constraints
    # 3. Return RenderableLayout
    # ❌ NO LAYOUT CALCULATION
```

**Required (CORRECT):**
```python
def calculate(...) -> RenderableLayout:
    # 1. Create widgets
    widgets_list = []
    
    # 2. Measure each widget (call widget.measure())
    for role, widget_config in widget_assignments.items():
        widget = create_widget(widget_config)
        style = resolve_style(widget.widget_type, style, theme)
        measured_size = widget.measure(style, max_width, max_height)
        
        widgets_list.append(WidgetLayoutInput(
            role=role,
            measured_size=measured_size,
            slot=slot_map[role],
            style=style
        ))
    
    # 3. Create layout context
    context = LayoutContext(
        canvas_width=width,
        canvas_height=height,
        margin_x=parse_spacing(theme.margin_x),
        margin_y=parse_spacing(theme.margin_y),
        gutter=parse_spacing(theme.gutter),
        header_height=parse_height(theme.header_footer.header_height, height),
        footer_height=parse_height(theme.header_footer.footer_height, height)
    )
    
    # 4. Call strategy's calculate_layout() - THE CORE AUTO-LAYOUT
    strategy = get_strategy(strategy_name)
    bounds_map = strategy.calculate_layout(widgets_list, context)
    
    # 5. Create WidgetAssignments with bounds
    assignments = []
    for widget_input in widgets_list:
        bounds = bounds_map[widget_input.role]
        assignments.append(WidgetAssignment(
            role=widget_input.role,
            widget=widget_input.widget,
            slot=widget_input.slot,
            applied_style=widget_input.style,
            bounds=bounds  # ✅ Absolute position
        ))
    
    # 6. Return RenderableLayout with calculated bounds
    return RenderableLayout(...)
```

### 7. Renderer Update (REQUIRED)

**File:** `src/render/html_renderer.py` ❌ NEEDS UPDATE

**Current:** Uses CSS Grid, no absolute positioning
**Required:** Use `bounds` from WidgetAssignment

```python
# In template rendering
for assignment in renderable.widget_assignments:
    widget_data[assignment.role] = {
        "type": assignment.widget.get_widget_type(),
        "data": assignment.widget.render_data(),
        "applied_style": assignment.applied_style,
        "bounds": {  # ✅ ADD THIS
            "x": assignment.bounds.x,
            "y": assignment.bounds.y,
            "width": assignment.bounds.width,
            "height": assignment.bounds.height
        }
    }
```

### 8. Template Update (REQUIRED)

**Files:** `src/render/templates/layouts/*.html.j2` ❌ NEEDS REWRITE

**Current (WRONG):**
```jinja2
.bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
}
```

**Required (CORRECT):**
```jinja2
.layout-container {
    position: relative;
    width: {{ canvas_width }}px;
    height: {{ canvas_height }}px;
}

.widget {
    position: absolute;
}

<!-- Widget positioning -->
<div class="widget" data-role="{{ role }}" style="
    left: {{ widget.bounds.x }}px;
    top: {{ widget.bounds.y }}px;
    width: {{ widget.bounds.width }}px;
    height: {{ widget.bounds.height }}px;
    {{ render_style(widget.applied_style) }}
">
    {% include 'widgets/_widget_content.html.j2' %}
</div>
```

## Implementation Steps

### Phase 1: Foundation (DONE)
- [x] Create `Bounds` model
- [x] Create `MeasuredSize` and `WidgetMeasurement`
- [x] Create `LayoutProtocol` and `LayoutContext`
- [x] Update `BaseWidget` with `measure()` method
- [x] Update `WidgetAssignment` with `bounds` field

### Phase 2: Widget Measurement (TODO)
- [ ] Implement `measure()` in `TypeWidget` (all 5 variants)
- [ ] Implement `measure()` in `DataWidget` (all 3 variants)
- [ ] Add tests for widget measurement

### Phase 3: Layout Algorithms (PARTIAL)
- [x] Implement `calculate_layout()` in `BentoStandardStrategy`
- [x] Implement `calculate_layout()` in `BentoHeroLeftStrategy`
- [ ] Implement remaining 8 layout strategies
- [ ] Add tests for each strategy's layout algorithm

### Phase 4: LayoutEngine (CRITICAL - TODO)
- [ ] Rewrite `LayoutEngine.calculate()` to:
  - Call widget.measure() for each widget
  - Create LayoutContext with spacing/margins
  - Call strategy.calculate_layout()
  - Create WidgetAssignments with bounds
- [ ] Add utility for parsing spacing strings ("40px", "15%" → pixels)
- [ ] Update tests to verify bounds are calculated

### Phase 5: Rendering (TODO)
- [ ] Update `HTMLRenderer` to pass bounds to templates
- [ ] Rewrite layout templates to use absolute positioning
- [ ] Remove CSS Grid from templates
- [ ] Update tests to verify absolute positioning in HTML

### Phase 6: Validation (TODO)
- [ ] Run all existing tests (expect failures)
- [ ] Fix broken tests
- [ ] Add new tests for auto-layout
- [ ] Verify HTML output uses absolute positioning

## Critical Design Principles

1. **Renderer-Agnostic**: LayoutEngine calculates positions, not CSS/HTML
2. **Content-Driven**: Widget size comes from content measurement
3. **Explicit Positioning**: Absolute (x, y, width, height) in pixels
4. **Strategy Pattern**: Each layout implements its own algorithm
5. **Two-Phase**: Measure → Layout (separate concerns)

## Breaking Changes

⚠️ **This is a breaking change:**
- All widget classes need `measure()` implementation
- All layout strategies need `calculate_layout()` implementation
- Templates will change from CSS Grid to absolute positioning
- Tests will need updates to check bounds instead of CSS classes

## Next Immediate Action

**STOP** implementing new features until this is fixed. Priority tasks:

1. Implement `measure()` in all existing widgets (5 TypeWidget + 3 DataWidget)
2. Complete `calculate_layout()` for all 10 layout strategies
3. Rewrite `LayoutEngine.calculate()` with proper auto-layout flow
4. Update templates to use absolute positioning
5. Fix all broken tests

**Estimated effort:** 2-3 days of focused work to properly implement auto-layout system.
