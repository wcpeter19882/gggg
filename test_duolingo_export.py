"""Test duolingo theme/vibe export."""
import json
from pathlib import Path
from src.generation.state import PipelineState
from src.paged.render.slidev.markdown_renderer import SlidevRenderer

# Load state
state_path = Path("output/slide_20251223_72/state.json")
state = PipelineState.load(state_path)

print(f"Loaded {len(state.slides)} slides")

# Check first slide parameters
if state.slides:
    slide = state.slides[0]
    params = slide.get("parameters", {})
    print(f"Slide 1 theme: {params.get('theme')}")
    print(f"Slide 1 vibe: {params.get('vibe')}")

# Create renderer
output_dir = Path("output/slide_20251223_72")
renderer = SlidevRenderer(output_dir=output_dir)

# Get active theme
theme = None
if state.active_theme and state.themes:
    theme = state.themes.get(state.active_theme)

# Render
print("\nRendering slides...")
html_path = renderer.render_slides(state.slides, theme)
print(f"Generated: {html_path}")

# Check slides.md for vibe
slides_md_path = output_dir / "slidev_build" / "slides.md"
if slides_md_path.exists():
    content = slides_md_path.read_text()
    # Find first vibe line
    for line in content.split('\n'):
        if 'vibe:' in line:
            print(f"First vibe in slides.md: {line.strip()}")
            break
