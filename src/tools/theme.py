"""Theme Tool - Load or generate presentation themes.

DirectTool: Delegates to src.generation.theme.creator for sophisticated theme generation.
Can load existing themes or create new ones via LLM.
"""
from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Optional, List, Dict, Any, ClassVar
from pydantic import Field

from src.common.tool_protocol import DirectTool, ToolContext, ToolPatch, register_tool
from src.generation.theme.prompts import get_builtin_themes

if TYPE_CHECKING:
    from src.generation.state import PipelineState


class ThemeContext(ToolContext):
    """Context for theme generation."""
    available_themes: List[str] = Field(default_factory=list)
    current_theme_id: Optional[str] = None
    # Params from planner
    theme_id: Optional[str] = Field(default=None, description="Specific theme ID from planner")
    base_theme_id: Optional[str] = Field(default=None, description="Base theme ID to modify")
    generate_new: bool = Field(default=False, description="Whether planner decided to generate new theme")
    color_keywords: List[str] = Field(default_factory=list, description="Color preference keywords")
    style_keywords: List[str] = Field(default_factory=list, description="Style preference keywords")


class ThemePatch(ToolPatch):
    """Patch containing theme to apply."""
    theme: Optional[Any] = Field(default=None, description="Theme object or dict")
    theme_id: str = ""
    load_from_file: bool = False
    is_new_theme: bool = False


@register_tool
class ThemeTool(DirectTool[ThemeContext, ThemePatch]):
    """Generates or loads themes using the theme creator.
    
    This is a DirectTool that:
    - Loads existing themes by name (no LLM)
    - Delegates to src.generation.theme.creator for new themes
    """
    
    # Self-description
    name: ClassVar[str] = "theme"
    description: ClassVar[str] = "Load existing theme by name or generate new theme via LLM. Can customize colors, fonts, spacing."
    query_description: ClassVar[str] = "Triggered by theme name (corp_modern_v1, minimal_dark) or style keywords (dark, colorful, blue, professional)."
    args_description: ClassVar[List[str]] = [
        "theme_id or base_theme_id (existing theme name to load or base theme for generation)",
        "generate_new (bool: true to create new theme via LLM, false to load existing)",
        "color_keywords (dark, light, colorful, monochrome)",
        "style_keywords (professional, creative, minimal, bold)",
    ]
    requires: ClassVar[List[str]] = ["constitution"]
    produces: ClassVar[List[str]] = ["themes", "active_theme"]
    examples: ClassVar[List[str]] = [
        '{"id": "theme", "type": "theme", "params": {}, "depends_on": ["constitution"]}',
        '{"id": "theme", "type": "theme", "params": {"theme_id": "minimal_dark_v1"}}',
    ]
    
    def slice(self, state: "PipelineState", params: Optional[Dict[str, Any]] = None) -> ThemeContext:
        """Extract context from state."""
        params = params or {}
        
        # Extract planner params
        theme_id = params.get('theme_id')
        base_theme_id = params.get('base_theme_id')
        generate_new = params.get('generate_new', False)
        # Handle keywords which might be single strings or lists
        color_kw = params.get('color_keywords')
        if isinstance(color_kw, str): color_kw = [color_kw]
        
        style_kw = params.get('style_keywords')
        if isinstance(style_kw, str): style_kw = [style_kw]

        print(f"Shiyi Theme Tool Slice: id={theme_id} new={generate_new} base={base_theme_id} c_kw={color_kw} s_kw={style_kw}")
        
        # Combine built-in themes and generated themes
        builtins = [t.get('id', 'unknown') for t in get_builtin_themes()]
        available = list(set(builtins + list(state.themes.keys())))

        return ThemeContext(
            available_themes=available,
            current_theme_id=state.active_theme,
            theme_id=theme_id,
            base_theme_id=base_theme_id,
            generate_new=generate_new,
            color_keywords=color_kw or [],
            style_keywords=style_kw or [],
        )
    
    def transform(
        self,
        context: ThemeContext,
        user_instruction: str,
    ) -> ThemePatch:
        """Determine whether to load existing theme or create new one."""
        # Use planner's decision from params (no redundant keyword checking)
        
        if context.generate_new:
            # Planner decided to generate a new theme
            self._log(f"Generating new theme (planner decision)")
            
            # Combine instruction with specific keywords from planner if available
            theme_instruction = user_instruction
            keywords = []
            if context.color_keywords:
                keywords.extend([f"Color: {k}" for k in context.color_keywords])
            if context.style_keywords:
                keywords.extend([f"Style: {k}" for k in context.style_keywords])
                
            if keywords:
                theme_instruction += "\n\nSpecific Requirements:\n" + "\n".join(keywords)

            # Extract raw keywords for direct passing to creator
            raw_keywords = []
            if context.color_keywords:
                raw_keywords.extend(context.color_keywords)
            if context.style_keywords:
                raw_keywords.extend(context.style_keywords)

            # If theme_id is provided along with generate_new, use it as the target name
            return self._create_new_theme(
                theme_instruction, 
                context.base_theme_id, 
                new_theme_id=context.theme_id,
                keywords_list=raw_keywords
            )
        
        if context.theme_id:
            # Planner specified a theme ID to use
            self._log(f"Loading theme from planner: {context.theme_id}")
            return ThemePatch(
                theme_id=context.theme_id,
                load_from_file=True,
            )
        
        # Default: use first available theme or business
        default_theme = "business" if "business" in context.available_themes else (
            context.available_themes[0] if context.available_themes else "default"
        )
        self._log(f"Using default theme: {default_theme}")
        return ThemePatch(
            theme_id=default_theme,
            load_from_file=True,
        )
    
    def _create_new_theme(
        self, 
        user_instruction: str, 
        base_theme_id: str, 
        new_theme_id: Optional[str] = None,
        keywords_list: Optional[List[str]] = None
    ) -> ThemePatch:
        """Create a new theme via the theme creator."""
        from src.generation.theme.creator import create_theme
        
        self._log(f"Creating new theme: {user_instruction[:50]}...")        
        
        # Create theme
        theme = create_theme(
            user_instruction=user_instruction,
            base_theme_id=base_theme_id,
            new_theme_id=new_theme_id,
            use_cache=self.use_cache,
            keywords_list=keywords_list,
        )
        
        self._log(f"Created theme: {theme.id}")
        
        return ThemePatch(
            theme=theme.to_dict(),
            theme_id=theme.id,
            is_new_theme=True,
        )
    
    def apply(self, state: "PipelineState", patch: ThemePatch) -> None:
        """Apply theme to state."""
        if patch.is_new_theme and patch.theme:
            # Add new theme to state (theme dict must have 'id' key)
            theme_data = patch.theme
            if isinstance(theme_data, dict) and 'id' not in theme_data:
                theme_data['id'] = patch.theme_id
            state.add_theme(theme_data)
            state.set_active_theme(patch.theme_id)
            self._log(f"Added and activated new theme: {patch.theme_id}")
        elif patch.load_from_file:
            if patch.theme_id in state.themes:
                state.set_active_theme(patch.theme_id)
                self._log(f"Activated existing custom theme: {patch.theme_id}")
            else:
                # Check built-ins from TS definition
                # We assume if it's passed here as an ID, it's valid if it matched a TS file
                builtins = [t.get('id') for t in get_builtin_themes()]
                if patch.theme_id in builtins:
                    state.set_active_theme(patch.theme_id)
                    self._log(f"Activated built-in theme: {patch.theme_id}")
                else:
                    self._log(f"Warning: Theme not found: {patch.theme_id}")
    
    def _load_theme_file(self, theme_id: str) -> Optional[Dict[str, Any]]:
        """Deprecated: Load theme from assets/themes directory."""
        # This method is effectively unused now that we rely on TS themes + state.json
        return None
        if theme_file.exists():
            return json.loads(theme_file.read_text(encoding='utf-8'))
        
        # Try without version suffix
        base_name = theme_id.replace("_v1", "").replace("_v2", "")
        theme_file = themes_dir / f"{base_name}.json"
        if theme_file.exists():
            return json.loads(theme_file.read_text(encoding='utf-8'))
        
        return None
