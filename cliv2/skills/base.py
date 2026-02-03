"""Base class for skill-specific subagent handlers.

Each skill has its own handler that defines:
- Input: What context to pre-load before LLM call
- Output: How to save LLM results to content.json
- Prompt: Skill-specific prompt instructions

These handlers align with the ## Workflow section in each SKILL.md
but are executed by the Python pipeline (not Claude's MCP tools).
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional


@dataclass
class SkillContext:
    """Context passed to skill handlers."""
    project_dir: str
    user_instruction: str = ""
    source: str = ""
    constitution: Optional[dict] = None
    theme: Optional[dict] = None
    slides: Optional[list] = None


@dataclass
class SkillInput:
    """Specifies what context a skill needs."""
    needs_source: bool = False
    needs_constitution: bool = False
    needs_theme: bool = False
    needs_slides: bool = False


@dataclass
class SkillOutput:
    """Specifies how to save skill results."""
    target: Optional[str] = None  # "theme", "slides", or None
    format: str = "text"  # "json", "jsx", "text"
    state_on_save: Optional[str] = None  # "draft", "active", etc.


class SkillHandler(ABC):
    """Base class for skill-specific handlers.
    
    Each skill implements:
    - input_spec: What context to pre-load
    - output_spec: How to save results
    - build_prompt(): Build skill-specific prompt with context
    - process_output(): Transform LLM output before saving
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Skill name (e.g., 'theme', 'storyline')."""
        pass
    
    @property
    @abstractmethod
    def input_spec(self) -> SkillInput:
        """What context this skill needs."""
        pass
    
    @property
    @abstractmethod
    def output_spec(self) -> SkillOutput:
        """How to save results."""
        pass
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build the user prompt with pre-loaded context.
        
        Override to customize prompt structure for the skill.
        
        Args:
            context: Pre-loaded context
            
        Returns:
            User prompt string
        """
        parts = [f"Project directory: {context.project_dir}"]
        
        if context.user_instruction:
            parts.append(f"User instruction: {context.user_instruction}")
        
        parts.append("\n=== PRE-LOADED CONTEXT ===")
        
        if self.input_spec.needs_source and context.source:
            parts.append(f"Source files:\n{context.source}")
        
        if self.input_spec.needs_constitution and context.constitution:
            import json
            parts.append(f"Constitution:\n{json.dumps(context.constitution, indent=2)}")
        
        if self.input_spec.needs_theme and context.theme:
            import json
            parts.append(f"Theme:\n{json.dumps(context.theme, indent=2)}")
        
        if self.input_spec.needs_slides and context.slides:
            import json
            parts.append(f"Slides:\n{json.dumps(context.slides, indent=2)}")
        
        # Add output format hint
        format_hints = {
            "json": "Return ONLY valid JSON.",
            "jsx": "Return ONLY JSX code with <Slide> wrappers.",
            "text": "Return markdown/text content.",
        }
        parts.append(f"\n=== OUTPUT ===\n{format_hints.get(self.output_spec.format, '')}")
        
        return "\n\n".join(parts)
    
    def process_output(self, output: Any) -> Any:
        """Transform LLM output before saving.
        
        Override to customize output processing for the skill.
        
        Args:
            output: Parsed LLM output
            
        Returns:
            Transformed output ready for saving
        """
        return output

    async def execute(self, context: SkillContext, llm: Any, logger: Any) -> dict:
        """Execute the skill's complete workflow.
        
        Default implementation: single LLM call with build_prompt().
        Override for multi-step workflows (e.g., research with tool calls).
        
        Args:
            context: Pre-loaded context
            llm: LLM instance for completion
            logger: Logger instance
            
        Returns:
            Result dict with skill-specific data
        """
        # Default: single LLM call
        from cliv2.core.subagent import Subagent
        
        subagent = Subagent(self.name, llm)
        result = await subagent.run_with_handler(handler=self, context=context)
        
        if not result.success:
            raise RuntimeError(f"Skill {self.name} failed: {result.error}")
        
        # Process output through handler's transform
        processed = self.process_output(result.output)
        
        return {"output": processed}
