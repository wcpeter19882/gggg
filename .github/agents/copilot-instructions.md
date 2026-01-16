# gggg Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-01-09

## Architecture Principles

### Skills and Subagents Architecture (NEW)

The system now uses a **content-manager skill** that orchestrates multiple **specialized subagents**:

```
.claude/skills/                  # Claude skill definitions
├── content-manager.md           # Orchestrator skill
├── theme-subagent.md            # Theme subagent
├── atom-subagent.md             # Atom subagent
├── storyline-subagent.md        # Storyline subagent
├── paged-layout-subagent.md     # Layout/widget subagent
└── export-subagent.md           # Export subagent

src/skills/                      # Python implementation
├── __init__.py                  # Skill registry with register_skill decorator
├── models/                      # Shared data models
│   ├── content_json.py          # ContentJson schema
│   ├── patch.py                 # Patch format and apply_patch
│   └── project.py               # Project metadata
├── content_manager/             # Orchestrator implementation
│   ├── orchestrator.py          # Main orchestrator
│   └── constitution.py          # Constitution extraction
├── theme/                       # Theme handler
├── atom/                        # Atom handler
├── storyline/                   # Storyline handler
├── paged_layout/                # Layout/widget handler
└── export/                      # Export handler

src/scripts/
├── apply_patch.py               # Patch application
├── slice_atoms.py               # Extract atoms from content.json
├── slice_theme.py               # Extract theme from content.json
├── slice_storylines.py          # Extract slides from content.json
└── check_mdx_server.py          # Server status checking
```

**Project Directory Structure**:
```
$tmp/content-manager/{project_id}/
├── content.json      # Central data store
├── todo.md           # Subagent todo list
├── files/            # Source files
├── patches/          # JSON patches from subagents
└── output/           # Generated MDX and renders
```

### Layout System Decoupling
- **Layout/widgets/presets are provided by LayoutEngine** via `get_layout_documentation()` protocol method
- **Only content-related prompts belong in `src/generation/content/prompts.py`**
- LayoutEngine implementations (e.g., `src/layout/dummy/layout_engine.py`) define:
  - Available layout strategies with slot structures
  - Supported widget types with parameters
  - Preset attributes (surface, shape, fill, effect)
- Content generation prompts focus on:
  - Narrative structure and storytelling
  - Atom synthesis and content brevity
  - Markdown formatting and abstraction rules
- **Runtime engine switching** via `LayoutEngineRegistry`:
  - Environment variable: `LAYOUT_ENGINE=dummy`
  - Programmatic: `LayoutEngineRegistry.set_active_engine("engine_name")`
  - Default: First registered engine

### Layout-Specific Validation Rules
- **CRITICAL**: Layout validation rules (widget-layout compatibility, slot constraints) MUST come from the LayoutEngine via `get_layout_constrain()`
- **DO NOT add layout validation prompts to `src/generation/content/prompts.py`** - this is the COMMON prompt file for content generation only
- Layout-specific validation logic belongs in:
  - LayoutEngine's `get_layout_constrain()` method (returns formatted constraints for LLM guidance)
  - LayoutEngine's `get_layout_documentation()` method (returns layout/widget/preset documentation)
  - Dedicated validator modules (e.g., `src/layout/slidev/layout_validator.py`) for runtime validation
  - Layout engine-specific prompt builders if needed (use `get_layout_constrain()` to inject constraints)
- Example: Widget-layout compatibility rules for Slidev belong in `SlidevLayoutEngine.get_layout_constrain()`, NOT in common content prompts
- Prompts should call `active_engine.get_layout_constrain()` to dynamically inject layout-specific constraints

## Active Technologies
- Python 3.11 + Pydantic 2.x (for data models), Jinja2 (for templates) (001-uce-render)
- N/A (stateless rendering) (001-uce-render)
- Python 3.11+ (backend), JavaScript/Vue 3 (frontend Slidev components) + pydantic, jinja2 (Python); Slidev, Vue 3, UnoCSS (JavaScript) (001-slidev-engine)
- File-based (.md output files) (001-slidev-engine)
- TypeScript 5.x (React components), Python 3.11+ (MDX generator/CLI) (001-react-mdx-renderer)
- N/A (file-based: state.json → MDX → HTML) (001-react-mdx-renderer)
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (002-mdx-direct-output)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (002-mdx-direct-output)
- TypeScript 5.x (React components), Python 3.11 (content generation) + Recharts (already in use), React 18, Python LLM generation pipeline (003-extended-chart-types)
- Python 3.11+ (backend), TypeScript/React (MDX renderer) + Pydantic, Anthropic API (via LLM client), React, MDX, Next.js (001-skills-subagent-migration)
- File-based (content.json per project) (001-skills-subagent-migration)

- Python 3.11+ + Pydantic 2.x, Jinja2 3.x, Click 8.x (001-uce-render)

## Project Structure

```text
src/
  common/
  layout/
  render/
tests/
  contract/
  integration/
  unit/
cli/
examples/
```

## Commands

pytest; ruff check src; mypy src

## Code Style

Python 3.11+: Follow PEP 8, use type hints, prefer Pydantic for validation

## Recent Changes
- 001-skills-subagent-migration: Added Python 3.11+ (backend), TypeScript/React (MDX renderer) + Pydantic, Anthropic API (via LLM client), React, MDX, Next.js
- 001-skills-subagent-migration: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 003-extended-chart-types: Added TypeScript 5.x (React components), Python 3.11 (content generation) + Recharts (already in use), React 18, Python LLM generation pipeline


<!-- MANUAL ADDITIONS START -->

## CLI Usage

### Basic Rendering

```bash
# Render to stdout
python -m cli examples/cyber-tech.json

# Render to file (self-contained HTML with embedded preset CSS)
python -m cli examples/cyber-tech.json --output output/presentation.html

# Validate configuration only
python -m cli examples/cyber-tech.json --validate-only

# Verbose output
python -m cli examples/cyber-tech.json --output result.html --verbose
```

### Listing Available Assets

```bash
# List all layout strategies
python -m cli --list-strategies

# List all widget types
python -m cli --list-widgets

# List all themes
python -m cli --list-themes

# List all styles
python -m cli --list-styles

# Get JSON format for programmatic use
python -m cli --list-widgets --format json
python -m cli --list-themes --format json
```

### Output Formats

```bash
# HTML output (default)
python -m cli config.json --output presentation.html

# JSON output (for debugging/inspection)
python -m cli config.json --format json --output data.json
```

### Custom Dimensions

```bash
# Override width/height from config
python -m cli config.json --width 1280 --height 720 --output slide.html
```

## Widget Presets

Widget presets provide inline styling through 4 categories:

**Surface** (depth/layering): `Flat`, `Elevated`, `Outline`, `Glass`, `Sunken`, `NeoBrutal`
**Shape** (border radius): `Sharp`, `Rounded`, `Curve`, `Pill`, `Squircle`, `Organic`
**Fill** (backgrounds): `Solid_Brand`, `Subtle`, `Gradient_Linear`, `Gradient_Mesh`, `Pattern_Dot`, `Noise`
**Effect** (visual fx): `Duotone`, `Glitch`, `Glow`, `Tape`

### Usage in JSON

```json
{
  "type": "Type.Display",
  "parameters": {"text": "Hello World"},
  "preset": {
    "surface": "Elevated",
    "shape": "Rounded",
    "fill": "Gradient_Linear",
    "effect": "Glow"
  }
}
```

Presets apply to the outer `.widget` container, ensuring effects like `Outline` properly border the entire widget including padding.

## Layout Strategies

Available strategies (use `--list-strategies` for full details):
- **Bento**: Standard, HeroLeft, HeroTop, Quarter
- **Swiss**: Poster, Asymmetry, SplitTypo
- **Cinematic**: FullBleed
- **Data**: KPI_Row, Magazine_Collage, Split, Grid_Masonry
- **Edit**: Left_Right, Solar_System
- **Focus**: Feature_Focus, Hero

## Configuration Structure

```json
{
  "width": 1920,
  "height": 1080,
  "theme": {
    "colors": {
      "primary": "#00ff9f",
      "secondary": "#00d4ff",
      "background": "#0a0e27"
    }
  },
  "style": {
    "theme_name": "cyber-tech",
    "typography": {
      "h1": {"size": "56px", "weight": "bold"}
    }
  },
  "slides": [
    {
      "id": "slide-1",
      "rank": 0,
      "strategy": "Bento.Standard",
      "widgets": {
        "cell_1": {
          "type": "Type.Display",
          "parameters": {"text": "Title"},
          "preset": {"surface": "Elevated", "shape": "Rounded"}
        }
      }
    }
  ]
}
```

## Preset CSS Architecture

**All preset CSS is generated in-memory** with zero file dependencies:
1. Preset defaults defined in `src/render/preset_defaults.py` (Python dictionaries)
2. Optional custom presets from layout JSON config under `presets` key
3. `generate_preset_css()` generates CSS class rules with CSS variable references
4. `generate_preset_css_variables()` converts preset tokens to CSS variables
5. Both CSS content and variables embedded inline in output HTML

**No static files**: Previously used `static/presets.css` file has been removed.

<!-- MANUAL ADDITIONS END -->
