"""Export skill handler.

Aligns with .claude/skills/ant-export/SKILL.md ## Workflow section.
"""
from typing import Any

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext


class ExportHandler(SkillHandler):
    """Export handler.
    
    Note: Export is handled directly by MCP export_mdx tool in pipeline,
    not by LLM subagent. This handler is for documentation completeness.
    
    Workflow:
    - Input: Read constitution for verification
    - Output: Uses export_mdx MCP tool (not apply_patch)
    """
    
    @property
    def name(self) -> str:
        return "export"
    
    @property
    def input_spec(self) -> SkillInput:
        return SkillInput(
            needs_source=False,
            needs_constitution=True,
            needs_theme=False,
            needs_slides=False,
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        return SkillOutput(
            target=None,  # Uses export_mdx MCP tool
            format="jsx",
        )
    
    def build_prompt(self, context: SkillContext) -> str:
        """Export doesn't use LLM - handled by MCP tool."""
        return ""
    
    def process_output(self, output: Any) -> Any:
        """Export doesn't process LLM output."""
        return output
