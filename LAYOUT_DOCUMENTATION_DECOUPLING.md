# Layout Documentation Decoupling

## Overview

This document describes the architectural improvement that decouples layout-specific documentation from content generation prompts.

## Problem

Previously, the content generation prompts in `src/generation/content/prompts.py` contained hardcoded logic to format layout strategy documentation. This tight coupling meant:

1. **Layout knowledge embedded in generation code** - The `_format_strategies_for_prompt()` function duplicated layout family descriptions and formatting logic
2. **Switching layout engines required changing prompts** - New layout implementations would need to modify prompt code
3. **Violation of separation of concerns** - Content generation shouldn't know implementation details of layout strategies

## Solution

We introduced a new protocol method `get_layout_documentation()` in the `LayoutEngine` protocol:

```python
# src/paged/layout/layout_engine_protocol.py
class LayoutEngine(Protocol):
    @classmethod
    def get_layout_documentation(cls) -> str:
        """Provide layout strategy documentation for content generation.
        
        Returns formatted documentation about available layout strategies,
        their slot structures, size constraints, and content guidance.
        """
        ...
```

### Implementation

**1. Protocol Definition** (`src/paged/layout/layout_engine_protocol.py`)
- Added `get_layout_documentation()` as a required protocol method
- Method returns formatted string describing available layouts
- Includes strategy names, slot roles, sizes, and content guidance

**2. Dummy Implementation** (`src/paged/layout/dummy/layout_engine.py`)
- Implemented `get_layout_documentation()` in `LayoutEngine` class
- Queries `AssetManager` for strategy metadata
- Formats with family descriptions and slot details
- Import moved inside method to avoid circular dependency

**3. Prompt Template Updates** (`src/generation/content/prompts.py`)
- Removed `_format_strategies_for_prompt()` helper function
- Updated `_build_state_transition_system_prompt()` to call `LayoutEngine.get_layout_documentation()`
- Updated `_build_content_generation_system_prompt()` to call `LayoutEngine.get_layout_documentation()`
- Prompts now use `{layout_documentation}` placeholder filled by layout engine

## Benefits

### 1. **Layout Engine Controls Its Own Documentation**
```python
# Each layout implementation provides its own docs
layout_docs = LayoutEngine.get_layout_documentation()
```

### 2. **Switching Layout Engines is Seamless**
When you create a new layout engine implementation:
```python
class NewLayoutEngine:
    @classmethod
    def get_layout_documentation(cls) -> str:
        # Return docs for YOUR layouts
        return "Your custom layout documentation..."
```

Then update the import in `prompts.py`:
```python
from src.paged.layout.new.layout_engine import NewLayoutEngine as LayoutEngine
```

Content generation automatically uses the new layout documentation!

### 3. **Clear Separation of Concerns**

**Before:**
```
Content Generation → Knows about layout families, slots, strategy details
Layout Engine → Just calculates positions
```

**After:**
```
Content Generation → Uses layout documentation (template-based)
Layout Engine → Provides documentation + calculates positions
```

### 4. **Protocol-Based Flexibility**

The `get_layout_documentation()` method is part of the `LayoutEngine` protocol, so:
- Type checkers verify implementations provide this method
- No inheritance required (structural subtyping)
- Different implementations can format documentation differently

## Example Output

The dummy layout engine produces documentation like:

```
Available Layout Strategies:

Bento Family: Grid-based layouts with multiple content cells. Best for: data comparisons...
  - Bento.Standard: Slots: [cell_1 (size: M), cell_2 (size: M), cell_3 (size: M), ...]
  - Bento.HeroLeft: Slots: [hero (size: L), side_1 (size: S), side_2 (size: S), ...]

Cinematic Family: Full-bleed dramatic layouts emphasizing visual impact...
  - Cinematic.FullBleed: Slots: [main (size: XL)]
  - Cinematic.Split_50_50: Slots: [left (size: L), right (size: L)]

...
```

This gets injected into LLM prompts automatically.

## Testing

All integration tests pass with the new architecture:
```bash
pytest tests/integration/test_size_validation_e2e.py -xvs
# ============================== 6 passed in 3.85s ==============================
```

## Migration Guide

### For New Layout Implementations

1. **Implement the protocol method:**
   ```python
   @classmethod
   def get_layout_documentation(cls) -> str:
       # Return your layout docs
       return "..."
   ```

2. **Register your engine:**
   ```python
   from src.layout.engine_registry import LayoutEngineRegistry
   LayoutEngineRegistry.register("myengine", MyLayoutEngine)
   ```

3. **Switch to your engine (three options):**
   
   **Option A: Environment variable** (recommended for deployment)
   ```bash
   export LAYOUT_ENGINE=myengine
   python -m cli.uce_render data/test.json
   ```
   
   **Option B: Programmatic** (recommended for scripts)
   ```python
   from src.layout.engine_registry import LayoutEngineRegistry
   LayoutEngineRegistry.set_active_engine("myengine")
   # Now run generation...
   ```
   
   **Option C: Default registration** (auto-register in your module)
   ```python
   # In your engine module's __init__.py
   from src.layout.engine_registry import LayoutEngineRegistry
   from .my_engine import MyLayoutEngine
   LayoutEngineRegistry.register("myengine", MyLayoutEngine)
   ```

4. **Done!** Content generation automatically uses your layouts.

### Runtime Engine Switching

The `LayoutEngineRegistry` provides three ways to switch engines:

**1. Auto-registration on Import**
The dummy engine is automatically registered when you import from `src.layout`:
```python
from src.layout import LayoutEngineRegistry
# 'dummy' engine is already registered
```

**2. Environment Variable Override**
```bash
# Windows (PowerShell)
$env:LAYOUT_ENGINE = "custom"

# Windows (CMD)
set LAYOUT_ENGINE=custom

# Linux/Mac
export LAYOUT_ENGINE=custom
```

**3. Programmatic Selection**
```python
from src.layout.engine_registry import LayoutEngineRegistry

# List available engines
engines = LayoutEngineRegistry.list_engines()
print(engines.keys())  # ['dummy', 'custom', ...]

# Switch to specific engine
LayoutEngineRegistry.set_active_engine("custom")

# Get current active engine
active = LayoutEngineRegistry.get_active_engine()
docs = active.get_layout_documentation()
```

### Priority Order

When determining the active engine:
1. **Environment variable** (`LAYOUT_ENGINE`) - highest priority
2. **Programmatic selection** (`set_active_engine()`)
3. **First registered engine** - default fallback

This allows deployment-time configuration without code changes.

### For Extending Documentation Format

If you want to provide richer documentation:
```python
@classmethod
def get_layout_documentation(cls) -> str:
    # You control the format - add examples, constraints, etc.
    return """
    Available Layouts:
    
    Family: Advanced
      - Advanced.3D: Slots: [perspective (size: XL)]
        Content guidance: Use for spatial visualization
        Constraints: Requires WebGL support
        Example: "3D Model Viewer"
    """
```

The LLM will receive whatever format you provide.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 Content Generation                       │
│  (src/generation/content/prompts.py)                    │
│                                                          │
│  - Calls: LayoutEngineRegistry.get_active_engine()     │
│  - Builds prompts using {layout_documentation}          │
│  - Format-agnostic, template-based                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ get_active_engine()
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│          LayoutEngineRegistry                            │
│  (src/layout/engine_registry.py)                        │
│                                                          │
│  - Manages registered engines                           │
│  - Checks LAYOUT_ENGINE env var                         │
│  - Returns active engine based on priority              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ returns engine class
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│            LayoutEngine Protocol                         │
│  (src/layout/layout_engine_protocol.py)                 │
│                                                          │
│  - Defines: get_layout_documentation() method           │
│  - Returns: String with layout docs                     │
│  - Protocol (structural subtyping)                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ implemented by
                  │
      ┌───────────┴────────────┐
      │                        │
      ▼                        ▼
┌─────────────┐      ┌──────────────────┐
│   Dummy     │      │    Your Custom   │
│   Engine    │      │     Engine       │
├─────────────┤      ├──────────────────┤
│ - Bento     │      │ - Custom.3D      │
│ - Swiss     │      │ - Advanced.AI    │
│ - Cinematic │      │ - ...            │
└─────────────┘      └──────────────────┘
```

### Registration Flow

```
1. Module Import
   └─> engine_registry.py loads
       └─> Auto-registers dummy engine
           └─> LayoutEngineRegistry._engines = {"dummy": DummyLayoutEngine}

2. Your Code Registers Custom Engine
   └─> LayoutEngineRegistry.register("custom", CustomEngine)
       └─> LayoutEngineRegistry._engines = {"dummy": ..., "custom": ...}

3. Runtime Selection (three ways)
   a) Environment: export LAYOUT_ENGINE=custom
   b) Programmatic: LayoutEngineRegistry.set_active_engine("custom")
   c) Default: First registered engine ("dummy")

4. Content Generation
   └─> active = LayoutEngineRegistry.get_active_engine()
       └─> Returns CustomEngine or DummyEngine based on selection
           └─> docs = active.get_layout_documentation()
               └─> LLM receives custom or dummy layouts
```

## Circular Dependency Resolution

We encountered a circular import:
```
prompts.py → AssetManager → Style → LayoutEngine → AssetManager (circular!)
```

**Solution:** Import `AssetManager` inside the `get_layout_documentation()` method:
```python
@classmethod
def get_layout_documentation(cls) -> str:
    # Import here to avoid circular dependency
    from src.common.asset_manager import AssetManager
    strategies = AssetManager.list_strategies()
    ...
```

This breaks the cycle because the import only happens when the method is called, not at module load time.

## Related Work

This change complements:
- **Protocol-based architecture** - Layout, Theme, Style, Renderer protocols
- **Dummy implementation isolation** - Current implementations in `src/*/dummy/`
- **Visual generation optimization** - Conditional execution and caching

Together, these improvements create a flexible, decoupled architecture that supports multiple layout engines running side-by-side.
