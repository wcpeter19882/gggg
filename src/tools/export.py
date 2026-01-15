"""Export Tool - Render slides to output format.

DirectTool: No LLM needed, uses layout engine renderer.

DEPENDENCY: Layout Engine Render
- SlidevRenderer: Converts slide JSON to Slidev markdown and builds HTML
- ReactMDXRenderer: Converts slide JSON to MDX and exports to HTML
- render_to_markdown(): Generates slides.md
- render_to_html(): Runs Slidev build or exports React HTML
"""
from __future__ import annotations

import shutil
from pathlib import Path
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List, Dict, Any, ClassVar
from pydantic import Field

from src.common.tool_protocol import DirectTool, ToolContext, ToolPatch, register_tool

if TYPE_CHECKING:
    from src.generation.state import PipelineState


class ExportContext(ToolContext):
    """Context for export."""
    slides: List[Dict[str, Any]] = Field(default_factory=list)
    theme: Optional[Dict[str, Any]] = None
    project: str = Field(default="slidev", description="Project style: slidev, duolingo, or react-mdx")
    active_theme: str = Field(default="business", description="Active theme ID (preset or custom)")
    generated_components: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Generated React components from codegen step"
    )


class ExportPatch(ToolPatch):
    """Patch containing export result."""
    output_path: str = ""
    format: str = "slidev"  # slidev, react-mdx, json
    build_html: bool = True  # Whether to run HTML build


@register_tool
class ExportTool(DirectTool[ExportContext, ExportPatch]):
    """Exports slides to target format (NO LLM).
    
    DEPENDS ON: Layout Engine Render
    - Uses SlidevRenderer for Slidev markdown and HTML builds
    - Uses ReactMDXRenderer for MDX and HTML exports
    - Can output to JSON for debugging
    """
    
    # Self-description
    name: ClassVar[str] = "export"
    description: ClassVar[str] = "Export slides to Slidev/React-MDX, then build to HTML. Also supports JSON for debugging."
    query_description: ClassVar[str] = "Runs last. Format determined by project setting (slidev, react-mdx) or instruction keywords (json)."
    args_description: ClassVar[List[str]] = [
        "output_dir (directory for output files)",
        "format (slidev, react-mdx, json)",
        "build_html (whether to run HTML build, default true)",
    ]
    requires: ClassVar[List[str]] = ["content"]
    produces: ClassVar[List[str]] = ["output_files", "dist"]
    examples: ClassVar[List[str]] = [
        '{"id": "export", "type": "export", "params": {}, "depends_on": ["content"]}',
        '{"id": "export", "type": "export", "params": {"project": "react-mdx"}, "depends_on": ["content"]}',
    ]
    
    def __init__(self, output_dir: Path = Path("output"), **kwargs):
        super().__init__(**kwargs)
        self.output_dir = output_dir
    
    def slice(self, state: "PipelineState", params: Optional[Dict[str, Any]] = None) -> ExportContext:
        """Extract slides and theme for export.
        
        Theme resolution priority:
        1. First slide's parameters.theme (set during content generation)
        2. Fallback to AssetManager.get_theme()
        """
        params = params or {}
        slides = state.slides or []
        
        # Get theme from first slide's parameters.theme
        theme = None
        theme_id = None
        if slides:
            params_theme = slides[0].get("parameters", {}).get("theme")
            if params_theme:
                theme_id = params_theme
        
        # Load full theme data from AssetManager
        if theme_id:
            from src.common.asset_manager import AssetManager
            theme = AssetManager.get_theme(theme_id)
        
        # Get active theme from params, state.active_theme
        # Priority:
        # 1. params['active_theme'] (explicit instruction)
        # 2. state.active_theme (persisted theme ID)
        # 3. "business" (fallback)
        active_theme = params.get("active_theme")
        if not active_theme:
            active_theme = getattr(state, "active_theme", None) or "business"
        
        # Get generated components from state
        generated_components = getattr(state, "generated_components", {}) or {}
        
        return ExportContext(
            slides=slides,
            theme=theme,
            project=state.project or "slidev",
            active_theme=active_theme,
            generated_components=generated_components,
        )
    
    def transform(
        self,
        context: ExportContext,
        user_instruction: str,
    ) -> ExportPatch:
        """Determine export format from context and instruction."""
        instruction_lower = user_instruction.lower()
        
        # Determine format based on project or instruction
        if context.project in ("react-mdx", "react"):
            fmt = "react-mdx"
            build_html = True
            ext = "mdx"
        elif "json" in instruction_lower:
            fmt = "json"
            build_html = False
            ext = "json"
        elif "markdown only" in instruction_lower or "md only" in instruction_lower or "no build" in instruction_lower:
            fmt = "slidev"
            build_html = False
            ext = "md"
        else:
            fmt = "slidev"
            build_html = True
            ext = "md"
        
        output_path = str(self.output_dir / f"slides.{ext}")
        
        return ExportPatch(output_path=output_path, format=fmt, build_html=build_html)
    
    def apply(self, state: "PipelineState", patch: ExportPatch) -> None:
        """Apply export using appropriate renderer."""
        context = self.slice(state)
        
        output_path = Path(patch.output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if patch.format == "react-mdx":
            self._export_react_mdx(context, output_path, patch.build_html, state)
        elif patch.format == "slidev":
            self._export_slidev(context, output_path, patch.build_html)
        elif patch.format == "json":
            self._export_json(context, output_path)
        
        self._log(f"Exported to {output_path}")
    
    def _export_slidev(self, context: ExportContext, output_path: Path, build_html: bool = True) -> None:
        """Export to Slidev markdown and optionally build HTML.
        
        Steps:
        1. Generate slides.md using SlidevRenderer
        2. Copy to output directory
        3. If build_html, run Slidev build to generate dist/
        4. Copy dist/ to output directory
        """
        from src.paged.render import SlidevRenderer
        
        # Pass output directory and project to renderer
        renderer = SlidevRenderer(output_dir=self.output_dir, project=context.project)
        
        # Generate markdown with theme from context
        markdown = renderer.render_to_markdown(context.slides, theme=context.theme)
        output_path.write_text(markdown, encoding='utf-8')
        self._log(f"Generated {output_path.name} ({len(markdown)} chars)")
        
        if not build_html:
            self._log("Skipping Slidev build (markdown only)")
            return
        
        # Determine base path for assets
        # Use /static/{session_folder}/ for FastAPI static mount
        output_dir = output_path.parent
        session_folder = output_dir.name  # e.g., "slide_20251222_56"
        # base_path = f"/static/{session_folder}/"
        base_path = f"/output/{session_folder}/"
        
        # Run Slidev build
        self._log(f"Running Slidev build with base={base_path}...")
        try:
            html_content = renderer.render_to_html(markdown, base_path=base_path)
            
            # Copy dist contents directly to output_dir (no extra dist folder)
            build_dist = renderer.build_dir / "dist"
            output_dir = output_path.parent
            
            if build_dist.exists():
                # Copy contents of dist/ directly to output folder
                for item in build_dist.iterdir():
                    dest = output_dir / item.name
                    if item.is_dir():
                        if dest.exists():
                            shutil.rmtree(dest)
                        shutil.copytree(item, dest)
                    else:
                        shutil.copy2(item, dest)
                self._log(f"Copied HTML build to {output_dir}")
                
                # Save slides.json alongside
                slides_json_path = output_dir / "slides.json"
                import json
                with open(slides_json_path, 'w', encoding='utf-8') as f:
                    json.dump(context.slides, f, indent=2, ensure_ascii=False)
                self._log(f"Saved slides.json")
                
                # Print viewing instructions
                print(f"\n[export] Slidev build complete!")
                print(f"  To view: python -m http.server 8080 --directory \"{output_dir}\"")
                print(f"  Then open: http://localhost:8080/")
            else:
                self._log("Warning: Slidev build did not produce dist/")
                
        except Exception as e:
            self._log(f"Slidev build failed: {e}")
            self._log("Markdown exported successfully, but HTML build failed")
            # Don't raise - markdown export succeeded
    
    def _export_react_mdx(self, context: ExportContext, output_path: Path, build_html: bool = True, state: "PipelineState" = None) -> None:
        """Export to React MDX and optionally build HTML.
        
        Steps:
        1. Replace <InventComponent> with generated React components
        2. Generate MDX using ReactMDXRenderer
        3. Save MDX and generated components to output directory
        4. Update state.slides with processed slides (so preview uses replaced components)
        5. React app loads generated components from state.json at runtime
        """
        from src.paged.render.react.mdx_renderer import ReactMDXRenderer
        import json
        import re
        
        # Process slides to replace InventComponent with generated components
        # (This updates the 'mdx'/'content' fields in the slide dictionaries)
        processed_slides = self._replace_invent_components(context.slides, context.generated_components)
        
        # Update state.slides with processed slides so preview can use replaced component tags
        # This ensures state.json (saved after export) has the processed MDX
        if state is not None:
            state.slides = processed_slides
            self._log("Updated state.slides with processed MDX (InventComponent tags replaced)")
        
        # Determine effective theme for preview
        # If custom theme exists, use it; otherwise use active_theme from context
        effective_theme = context.active_theme
        self._log(f"[DEBUG] Initial active_theme from context: {effective_theme}")
        self._log(f"[DEBUG] state is None: {state is None}, state.active_theme: {getattr(state, 'active_theme', 'N/A')}")
        if state is not None and state.active_theme:
            effective_theme = state.active_theme
            self._log(f"Using persisted theme for preview: {effective_theme}")
        else:
            self._log(f"[DEBUG] No active theme - using context.active_theme: {context.active_theme}")
        
        # Build state dict for renderer (include theme data for preview)
        state_dict = {
            "slides": processed_slides, 
            "presentation": {"theme": effective_theme},
            "generated_components": context.generated_components or {},
            "active_theme": getattr(state, "active_theme", None) if state else None,
            "themes": getattr(state, "themes", {}) if state else {},
        }
        
        # Create renderer with theme
        renderer = ReactMDXRenderer(output_dir=output_path.parent, theme=effective_theme)
        
        # Generate MDX
        mdx_content = renderer.render_state(state_dict)
        output_path.write_text(mdx_content, encoding='utf-8')
        self._log(f"Generated {output_path.name} ({len(mdx_content)} chars)")
        
        # Save generated components to output directory only (same lifecycle as state.json)
        # These files are gitignored via output/ and don't affect other pipeline runs
        if context.generated_components:
            components_dir = output_path.parent / "generated_components"
            components_dir.mkdir(parents=True, exist_ok=True)

            def _split_leading_imports(tsx: str) -> tuple[str, str]:
                lines = (tsx or "").splitlines()
                import_lines: list[str] = []
                i = 0
                saw_import = False
                while i < len(lines):
                    line = lines[i]
                    stripped = line.strip()
                    if stripped.startswith("import "):
                        saw_import = True
                        import_lines.append(line)
                        i += 1
                        continue
                    if stripped == "" and (saw_import or (i + 1 < len(lines) and lines[i + 1].strip().startswith("import "))):
                        # Preserve blank lines inside/around the import block
                        import_lines.append(line)
                        i += 1
                        continue
                    break
                imports = "\n".join(import_lines).strip()
                rest = "\n".join(lines[i:]).strip()
                return imports, rest
            
            for comp_id, comp_data in context.generated_components.items():
                comp_name = comp_data.get("name", comp_id)
                code = comp_data.get("code", "")
                props_interface = comp_data.get("props_interface", "")
                
                # Write component file to output directory
                comp_file = components_dir / f"{comp_name}.tsx"
                imports, rest = _split_leading_imports(code)
                if not imports:
                    # Backward compatibility if codegen produced no imports
                    imports = "import React from 'react';"
                full_code = f"{imports}\n\n{props_interface}\n\n{rest}\n"
                comp_file.write_text(full_code, encoding='utf-8')
                self._log(f"Generated component: {comp_name}.tsx")
            
            # Write index file for all components
            index_content = "// Auto-generated component index\n"
            for comp_id, comp_data in context.generated_components.items():
                comp_name = comp_data.get("name", comp_id)
                index_content += f"export {{ {comp_name} }} from './{comp_name}';\n"
            
            index_file = components_dir / "index.ts"
            index_file.write_text(index_content, encoding='utf-8')
            self._log(f"Generated component index: index.ts")
        
        # Run whitespace validation on generated MDX
        from src.paged.layout.react.layout_validator import validate_mdx_content
        print("\n[export] Layout Whitespace Analysis:")
        ws_result = validate_mdx_content(mdx_content, verbose=True)
        
        # Save state.json alongside
        state_json_path = output_path.parent / "state.json"
        with open(state_json_path, 'w', encoding='utf-8') as f:
            json.dump(state_dict, f, indent=2, ensure_ascii=False)
        self._log(f"Saved state.json (active_theme: {state_dict.get('active_theme', 'None')})")
        
        # Export generated custom theme to TypeScript file if available
        if state is not None and state.active_theme:
            active_theme = state.themes.get(state.active_theme)
            if active_theme:
                self._export_theme_to_typescript(active_theme, output_path.parent)
                self._log(f"Exported custom theme to TypeScript: {state.active_theme}.ts")
        
        if not build_html:
            self._log("Skipping HTML build (MDX only)")
            return
        
        # React TSX components handle HTML rendering
        print(f"\n[export] React MDX export complete!")
        print(f"  MDX saved to: {output_path}")
        print(f"  State saved to: {state_json_path}")
        if context.generated_components:
            print(f"  Generated components: {output_path.parent / 'generated_components'}")
            print(f"  (Components stored in state.json for runtime loading)")
        print(f"\n  To render HTML:")
        print(f"    cd src/paged/render/react")
        print(f"    npm run dev    # for development preview")
        print(f"    npm run build  # for production build")
    
    def _replace_invent_components(
        self,
        slides: List[Dict[str, Any]],
        generated_components: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Replace <InventComponent> tags with generated component tags in slide MDX."""
        import re
        import copy
        
        if not generated_components:
            return slides
        
        processed_slides = []
        for slide in slides:
            slide_copy = copy.deepcopy(slide)
            
            # The exact field depends on where MDX is stored. 
            # In 'react-mdx' flow, we often reconstruct MDX from parameters or use 'content' field.
            # Assuming 'mdx' or 'content_mdx' might be available, or we check 'parameters.content'
            # But the renderer often rebuilds it. 
            # If the slide object ALREADY has the <InventComponent> in its 'content' or 'mdx' field, we replace it.
            
            # NOTE: Often the MDX is inside `slide['content']` or `slide['markdown']` depending on the step.
            # We'll check common fields.
            target_fields = ['mdx', 'content', 'markdown']
            
            for field in target_fields:
                if field not in slide_copy:
                    continue
                    
                mdx = slide_copy[field]
                if not isinstance(mdx, str) or not mdx:
                    continue

                # Find and replace InventComponent tags
                def replace_invent(match):
                    full_tag = match.group(0)
                    attrs_str = match.group(1)
                    
                    # Extract component ID
                    id_match = re.search(r'id\s*=\s*["\']([^"\']+)["\']', attrs_str)
                    if not id_match:
                        return full_tag  # Keep original if no ID
                    
                    comp_id = id_match.group(1)
                    
                    # Look up generated component
                    if comp_id not in generated_components:
                        return full_tag  # Keep original if not generated
                    
                    comp_data = generated_components[comp_id]
                    
                    # 1. Prefer explicit mdx_usage from LLM (most robust)
                    mdx_usage = comp_data.get("mdx_usage")
                    if mdx_usage:
                        return mdx_usage
                    
                    # 2. Fallback to regex reconstruction if no explicit usage found
                    # Use the generated name, or fall back to comp_data['name']
                    comp_name = comp_data.get("name", "")
                    
                    if not comp_name:
                        return full_tag
                    
                    # Extract data attribute for props. 
                    # The prompt format is data={{ ... }} usually with multi-line content.
                    # We want to extract the inner content and spread it as props.
                    # Pattern handles nested braces by matching opening {{ and closing }}
                    
                    # Extract the data attribute - handle multi-line nested objects
                    # Match data={{ followed by content until matching }}
                    data_match = re.search(r'data\s*=\s*\{\{([\s\S]*?)\}\}', attrs_str)
                    
                    if data_match:
                        # Extract the inner content between {{ and }}
                        data_inner = data_match.group(1).strip()
                        # Create spread syntax: {...{ layers: [...], message: "..." }}
                        return f"<{comp_name} {{...{{ {data_inner} }}}} />"
                    
                    return f"<{comp_name} />"
                
                # Pattern to match <InventComponent ... /> including multi-line attributes
                # This captures everything between <InventComponent and /> or >
                pattern = r'<InventComponent\s+([\s\S]*?)(?:/>|>\s*</InventComponent>)'
                mdx = re.sub(pattern, replace_invent, mdx)
                
                slide_copy[field] = mdx
            
            processed_slides.append(slide_copy)
        
        return processed_slides
    
    def _export_theme_to_typescript(self, theme_data: Dict[str, Any], output_dir: Path) -> None:
        """Export theme as TypeScript file with type definitions.
        
        Args:
            theme_data: Theme dictionary from state
            output_dir: Output directory (same as slides.mdx parent)
        """
        theme_id = theme_data.get('id', 'custom_theme')
        theme_file = output_dir / f"{theme_id}.ts"
        
        # New format (ThemeDefinition)
        # Ensure name matches filename ID and displayName exists
        adapted_theme = theme_data.copy()
        adapted_theme['name'] = theme_id
        if 'displayName' not in adapted_theme:
            adapted_theme['displayName'] = theme_data.get('name', theme_id)
        
        ts_content = f"""/**
 * Generated Custom Theme: {theme_id}
 */

import type {{ ThemeDefinition }} from '@/utils/types';

export const {theme_id}: ThemeDefinition = {self._theme_to_typescript_object(adapted_theme, indent=0)};

export default {theme_id};
"""
        
        theme_file.write_text(ts_content, encoding='utf-8')
    
    def _theme_to_typescript_object(self, obj: Any, indent: int = 0) -> str:
        """Convert theme object to TypeScript object literal.
        
        Args:
            obj: Object to convert (dict, list, or primitive)
            indent: Current indentation level
            
        Returns:
            TypeScript object literal as string
        """
        ind = '  ' * indent
        next_ind = '  ' * (indent + 1)
        
        if isinstance(obj, dict):
            if not obj:
                return '{}'
            lines = ['{']
            for key, value in obj.items():
                ts_value = self._theme_to_typescript_object(value, indent + 1)
                lines.append(f'{next_ind}{key}: {ts_value},')
            lines.append(f'{ind}}}')
            return '\n'.join(lines)
        elif isinstance(obj, list):
            if not obj:
                return '[]'
            items = [self._theme_to_typescript_object(item, indent + 1) for item in obj]
            return '[' + ', '.join(items) + ']'
        elif isinstance(obj, str):
            # Escape quotes and newlines
            escaped = obj.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
            return f'"{escaped}"'
        elif isinstance(obj, bool):
            return 'true' if obj else 'false'
        elif obj is None:
            return 'null'
        else:
            return str(obj)
    
    def _export_json(self, context: ExportContext, output_path: Path) -> None:
        """Export raw slide JSON for debugging."""
        import json
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(context.slides, f, indent=2, ensure_ascii=False)
