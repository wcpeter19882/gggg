"""Theme skill handler.

Aligns with .claude/skills/theme/SKILL.md ## Workflow section.
"""
from typing import Any

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext


# Default theme preset - aligns with React renderer default
DEFAULT_THEME = "businessLight"


class ThemeHandler(SkillHandler):
    """Theme selection/generation handler.
    
    Workflow:
    - Input: Read constitution to check for tone/style preferences
    - Output: Save theme to content.json (target: theme)
    - Format: JSON theme object
    - Default: businessLight preset
    """
    
    @property
    def name(self) -> str:
        return "theme"
    
    @property
    def input_spec(self) -> SkillInput:
        return SkillInput(
            needs_constitution=True,
            needs_source=False,
            needs_theme=False,
            needs_slides=False,
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        return SkillOutput(
            target="theme",
            format="json",
        )
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build theme-specific prompt.
        
        Includes:
        - Constitution for tone/style hints
        - User instruction for theme preferences
        - Default theme guidance
        """
        import json
        
        parts = [f"Project directory: {context.project_dir}"]
        
        if context.user_instruction:
            parts.append(f"User instruction: {context.user_instruction}")
        
        parts.append("\n=== CONTEXT ===")
        
        if context.constitution:
            parts.append(f"Constitution:\n{json.dumps(context.constitution, indent=2)}")
            
            # Highlight theme-related constitution fields
            if context.constitution.get("theme"):
                parts.append(f"\n**Specified theme preset: {context.constitution['theme']}** - use this preset directly.")
            if context.constitution.get("tone"):
                parts.append(f"**Tone: {context.constitution['tone']}** - select theme matching this tone.")
        
        parts.append("\n=== OUTPUT ===")
        parts.append(f"Return ONLY a valid JSON theme object with id='{DEFAULT_THEME}' (the default preset).")
        parts.append(f"Unless user/constitution specifies a different theme, use '{DEFAULT_THEME}'.")
        parts.append("Available presets: businessLight, business, cyber, minimal, academic, creative, duolingo, dark, teamsDark, teamsLight")
        
        return "\n\n".join(parts)
    
    def process_output(self, output: Any) -> Any:
        """Ensure output is a valid theme dict with default fallback."""
        if isinstance(output, dict):
            # If no id specified, set to default
            if not output.get("id"):
                output["id"] = DEFAULT_THEME
            return output
        # Return default theme if output is invalid
        return {"id": DEFAULT_THEME, "name": "Business Light"}
