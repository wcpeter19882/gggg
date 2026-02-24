"""Base class for skill-specific subagent handlers.

Each skill has its own handler that defines:
- Input: What context to pre-load before LLM call
- Output: How to save LLM results to content.json
- Prompt: Skill-specific prompt instructions

These handlers align with the ## Workflow section in each SKILL.md
but are executed by the Python pipeline (not Claude's MCP tools).
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional, Union


@dataclass
class SkillContext:
    """Context passed to skill handlers."""
    project_dir: str
    user_instruction: str = ""
    source: str = ""
    constitution: str = ""  # Markdown content from constitution.md
    theme: Optional[dict] = None  # Theme config (may be deprecated)
    slides: Optional[list] = None
    research: str = ""  # Content of research.md if exists


@dataclass
class SkillContextWithTarget(SkillContext):
    """Extended context with target slide information.
    
    Used for incremental execution where only specific slides
    need to be processed.
    """
    target_indices: list[int] = field(default_factory=list)  # 1-indexed slide numbers
    task_params: dict = field(default_factory=dict)  # Additional task parameters
    
    def get_target_slides(self) -> list[dict]:
        """Get only the slides that match target indices."""
        if not self.slides or not self.target_indices:
            return self.slides or []
        
        return [
            slide for i, slide in enumerate(self.slides)
            if (i + 1) in self.target_indices
        ]
    
    def is_targeted(self) -> bool:
        """Check if this is a targeted execution (not all slides)."""
        return bool(self.target_indices) and len(self.target_indices) < len(self.slides or [])


@dataclass
class SkillInput:
    """Specifies what context a skill needs."""
    needs_source: bool = False
    needs_constitution: bool = False
    needs_theme: bool = False
    needs_slides: bool = False
    needs_research: bool = False  # Read research.md as input


@dataclass
class SkillOutput:
    """Specifies how to save skill results."""
    target: Optional[str] = None  # "theme", "slides", or None
    format: str = "text"  # "json", "jsx", "text"
    state_on_save: Optional[str] = None  # "draft", "active", etc.


def load_context_for_skill(
    project_dir: str,
    input_spec: "SkillInput",
    user_instruction: str = "",
    target_indices: Optional[list[int]] = None,
    task_params: Optional[dict] = None,
) -> "SkillContextWithTarget":
    """Load context based on skill's input_spec.
    
    This is the SINGLE source of truth for loading context.
    Handlers declare what they need via input_spec, this function loads it.
    
    Args:
        project_dir: Path to project directory
        input_spec: What context the skill needs
        user_instruction: User instruction to pass through
        target_indices: Optional list of 1-indexed slide numbers
        task_params: Additional task parameters
        
    Returns:
        SkillContextWithTarget with loaded data
    """
    import json
    from cliv2.tools.mcp_client import call_read_section
    
    project_path = Path(project_dir)
    
    # Load base content from content.json via MCP
    project_context = call_read_section(project_dir, "all") if project_dir else {}
    
    # Load source files (from files/ directory)
    # Can be skipped via task_params.skip_source for light tasks (e.g., image search only)
    source_content = ""
    skip_source = (task_params or {}).get("skip_source", False)
    if input_spec.needs_source and not skip_source:
        source_content = project_context.get("source", "")
    
    # Load constitution.md as markdown string
    constitution_content = ""
    if input_spec.needs_constitution:
        constitution_path = project_path / "constitution.md"
        if constitution_path.exists():
            try:
                constitution_content = constitution_path.read_text(encoding="utf-8")
            except Exception:
                pass
    
    # Load theme from content.json
    theme_data = None
    if input_spec.needs_theme:
        theme_data = project_context.get("theme")
    
    # Load slides from content.json
    slides_data = None
    if input_spec.needs_slides:
        slides_data = project_context.get("slides", [])
    
    # Load research.md as markdown string
    research_content = ""
    if input_spec.needs_research:
        research_path = project_path / "files" / "research.md"
        if research_path.exists():
            try:
                research_content = research_path.read_text(encoding="utf-8")
            except Exception:
                pass
    
    return SkillContextWithTarget(
        project_dir=project_dir,
        user_instruction=user_instruction,
        source=source_content,
        constitution=constitution_content,
        theme=theme_data,
        slides=slides_data,
        research=research_content,
        target_indices=target_indices or [],
        task_params=task_params or {},
    )


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
            # Constitution is now markdown string
            parts.append(f"Constitution:\n{context.constitution}")
        
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

    def load_context(
        self,
        project_dir: str,
        user_instruction: str = "",
        target_indices: Optional[list[int]] = None,
        task_params: Optional[dict] = None,
    ) -> SkillContextWithTarget:
        """Load context based on this handler's input_spec.
        
        Each handler knows what it needs via input_spec.
        This method loads only what's declared.
        
        Args:
            project_dir: Path to project directory
            user_instruction: User instruction to pass through
            target_indices: Optional list of 1-indexed slide numbers
            task_params: Additional task parameters
            
        Returns:
            SkillContextWithTarget with loaded data
        """
        return load_context_for_skill(
            project_dir=project_dir,
            input_spec=self.input_spec,
            user_instruction=user_instruction,
            target_indices=target_indices,
            task_params=task_params,
        )

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
        
        return {"output": processed, "raw_output": result.raw_output}
