# Layout Constraint Interface Implementation

## Summary

Added new `get_layout_constrain()` interface to the LayoutEngine protocol and moved layout-widget compatibility rules from common prompts to layout engine implementations.

## Changes Made

### 1. Protocol Enhancement
**File**: `src/paged/layout/layout_engine_protocol.py`
- Added `get_layout_constrain(cls) -> str` method to LayoutEngine protocol
- Returns layout-specific widget-layout compatibility constraints
- Includes widget space requirements, slot constraints, and compatibility rules

### 2. Dummy Engine Implementation
**File**: `src/paged/layout/dummy/layout_engine.py`
- Implemented `get_layout_constrain()` with placeholder constraints
- Returns basic compatibility message (no actual constraints for dummy engine)

### 3. Slidev Engine Implementation
**File**: `src/paged/layout/slidev/layout_engine.py`
- Implemented comprehensive `get_layout_constrain()` with 5981 chars of constraints
- Includes:
  - Widget space requirements (QuoteWidget, TableWidget, MetricWidget, etc.)
  - Layout slot constraints (smart-grid, hero-split, timeline, etc.)
  - Compatibility checklist (what works where)
  - Common layout-widget matches and anti-patterns
  - Validation strategy

### 4. Prompt System Integration
**File**: `src/generation/content/prompts.py`
- Removed hardcoded layout compatibility rules from common prompt file
- Updated `_build_slide_generation_system_prompt()` to call `active_engine.get_layout_constrain()`
- Constraints now dynamically injected based on active layout engine
- Updated LAYOUT SELECTION PROCESS to include validation step

### 5. Documentation Updates
**File**: `.github/agents/copilot-instructions.md`
- Updated "Layout-Specific Validation Rules" section
- Added guidance about `get_layout_constrain()` method
- Clarified that layout validation MUST come from LayoutEngine via this interface
- Added examples of proper usage

## Architecture Benefits

### Before
```python
# Common prompt file (prompts.py) contained Slidev-specific rules
**LAYOUT-WIDGET COMPATIBILITY** (CRITICAL):
⚠️ **Quote widgets need WIDE space** - quotes are typically 100-250 characters:
  - ✅ GOOD: QuoteWidget/Type.Quote in full-bleed, hero-split...
  - ❌ BAD: QuoteWidget/Type.Quote in smart-grid columns...
```

### After
```python
# Layout engine provides constraints dynamically
active_engine = LayoutEngineRegistry.get_active_engine()
layout_constraints = active_engine.get_layout_constrain()

# Constraints injected into prompt
prompt = f"""
{layout_docs}
{layout_constraints}  # <-- Engine-specific, not hardcoded
"""
```

## Key Principles

1. **Separation of Concerns**: Layout-specific rules belong in layout engines, not common prompts
2. **Engine Decoupling**: Different engines can have different constraints
3. **Dynamic Injection**: Constraints loaded at runtime based on active engine
4. **Single Source of Truth**: Each engine owns its compatibility rules

## Testing

Created `test_layout_constrain.py` demonstrating:
- ✅ Dummy engine returns placeholder constraints
- ✅ Slidev engine returns comprehensive constraints (5981 chars)
- ✅ Prompt builder integrates constraints correctly
- ✅ All widget types and layouts documented

## Migration Path

For future layout engines:
1. Implement `get_layout_constrain()` method
2. Return formatted string with:
   - Widget space requirements
   - Layout slot constraints  
   - Compatibility rules
   - Validation checklist
3. Constraints automatically used in prompts via `_build_slide_generation_system_prompt()`

## Example Output

### Slidev Constraints (excerpt)
```
LAYOUT-WIDGET COMPATIBILITY (CRITICAL):

Widget Space Requirements:
- QuoteWidget/Type.Quote: Needs WIDE space (100-250 chars typical)
  - Minimum comfortable width: ~400px
  
- TableWidget: Needs FULL width (200-400 chars for multi-column tables)
  - Minimum comfortable width: ~600px

Layout Slot Constraints:
1. smart-grid columns (col1, col2, col3, col4):
   - Width: NARROW (~200-300px per column)
   - Max characters: 150 chars per column
   - ✅ GOOD: Type.Heading, MetricWidget
   - ❌ BAD: QuoteWidget, TableWidget

Layout Selection Checklist:
1. Does slide have a quote? → MUST use full-bleed, hero-split, center
2. Does slide have a table? → MUST use full-bleed or default
3. Using smart-grid? → ALL widgets must be short (NO quotes!)
```

## Files Modified
- `src/layout/layout_engine_protocol.py` (protocol definition)
- `src/layout/dummy/layout_engine.py` (dummy implementation)
- `src/layout/slidev/layout_engine.py` (Slidev implementation)
- `src/generation/content/prompts.py` (integration)
- `.github/agents/copilot-instructions.md` (documentation)

## Files Created
- `test_layout_constrain.py` (demonstration/testing)

## Validation
All changes tested and verified:
- Protocol method callable on both engines
- Constraints properly formatted
- Prompt integration works correctly
- Documentation updated
