"""Storyline skill handler.

Aligns with .claude/skills/storyline/SKILL.md ## Workflow section.
"""
from typing import Any

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext


class StorylineHandler(SkillHandler):
    """Storyline planning handler.
    
    Workflow:
    - Input: Read ALL context (source, constitution, theme, existing slides)
    - Output: Save draft slides to content.json (target: slides)
    - Format: JSON array of slide objects with state="draft"
    """
    
    @property
    def name(self) -> str:
        return "storyline"
    
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
            format="json",
            state_on_save="draft",
        )
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build storyline-specific prompt.
        
        Includes:
        - Source content for extraction
        - Constitution for target_slides, tone, requirements
        - Theme for visual planning hints
        - User instruction for narrative focus
        """
        import json
        
        parts = [f"Project directory: {context.project_dir}"]
        
        if context.user_instruction:
            parts.append(f"User instruction: {context.user_instruction}")
        
        parts.append("\n=== SOURCE CONTENT ===")
        if context.source:
            parts.append(context.source)
        else:
            parts.append("(No source content provided)")
        
        parts.append("\n=== CONSTITUTION ===")
        if context.constitution:
            parts.append(json.dumps(context.constitution, indent=2))
            
            # Highlight key constraints
            if context.constitution.get("target_slides"):
                parts.append(f"\n**Target slide count: {context.constitution['target_slides']}**")
            if context.constitution.get("content_requirements"):
                parts.append(f"**Must include: {context.constitution['content_requirements']}**")
            if context.constitution.get("content_exclusions"):
                parts.append(f"**Must NOT include: {context.constitution['content_exclusions']}**")
        
        if context.theme:
            parts.append(f"\n=== THEME ===\n{json.dumps(context.theme, indent=2)}")
        
        parts.append("\n=== OUTPUT ===")
        parts.append("Return ONLY a valid JSON object with a 'slides' array.")
        parts.append("Each slide must have: id, rank, story, density, intent, content (with headline, category).")
        parts.append("All slides will have state='draft' applied automatically.")
        
        return "\n\n".join(parts)
    
    def process_output(self, output: Any) -> list:
        """Extract slides array and mark as draft."""
        if isinstance(output, dict):
            slides = output.get("slides", [])
        elif isinstance(output, list):
            slides = output
        else:
            slides = []
        
        # Mark all slides as draft
        for slide in slides:
            if isinstance(slide, dict):
                slide["state"] = "draft"
        
        return slides
