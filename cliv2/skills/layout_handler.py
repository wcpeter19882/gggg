"""Ant Design Layout skill handler.

Aligns with .claude/skills/ant-paged-layout/SKILL.md ## Workflow section.
"""
from typing import Any

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext


class LayoutHandler(SkillHandler):
    """Ant Design Layout generation handler.
    
    Workflow:
    - Input: Read ALL context (source, constitution, theme, draft slides)
    - Output: Save JSX to slides in content.json (target: slides, format: jsx)
    - Process: Generate JSX for each slide, apply to mdx field
    """
    
    @property
    def name(self) -> str:
        return "layout"
    
    @property
    def input_spec(self) -> SkillInput:
        return SkillInput(
            needs_source=True,
            needs_constitution=True,
            needs_theme=True,
            needs_slides=True,
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        return SkillOutput(
            target="slides",
            format="jsx",
            state_on_save="active",
        )
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build layout-specific prompt.
        
        Includes:
        - Draft slides with story, density, intent, content
        - Theme for colors and typography
        - Constitution for any layout constraints
        - Chart API hints
        """
        import json
        
        parts = [f"Project directory: {context.project_dir}"]
        
        if context.user_instruction:
            parts.append(f"User instruction: {context.user_instruction}")
        
        parts.append("\n=== DRAFT SLIDES ===")
        if context.slides:
            parts.append(json.dumps(context.slides, indent=2))
            parts.append(f"\n**{len(context.slides)} slides to generate JSX for**")
        else:
            parts.append("(No slides found - generate from source)")
        
        parts.append("\n=== THEME ===")
        if context.theme:
            parts.append(json.dumps(context.theme, indent=2))
        else:
            parts.append("(Using default theme)")
        
        parts.append("\n=== CONSTITUTION ===")
        if context.constitution:
            parts.append(json.dumps(context.constitution, indent=2))
        
        parts.append("\n=== OUTPUT ===")
        parts.append("Return JSX with <Slide> wrappers for EACH slide.")
        parts.append("Format: <Slide id=\"slide_01\" rank={1}>...JSX content...</Slide>")
        parts.append("Use Ant Design 6.x components: Typography, List, Statistic, Steps, Timeline, etc.")
        parts.append("Each slide's JSX will be saved to the 'mdx' field and state set to 'active'.")
        
        return "\n\n".join(parts)
    
    def process_output(self, output: Any) -> str:
        """Return JSX string for apply_patch to parse."""
        if isinstance(output, str):
            return output.strip()
        return str(output) if output else ""
