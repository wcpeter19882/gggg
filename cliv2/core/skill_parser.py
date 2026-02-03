"""SKILL.md parser for subagent execution.

Parses SKILL.md into structured sections:
- frontmatter: YAML metadata (name, description, triggers)
- workflow: The ## Workflow section with ### Input, ### Output, ### Summary
- instructions: Rest of skill content (rules, guidelines, examples)

This allows us to:
1. Execute context collection (MCP reads) BEFORE calling LLM
2. Use instruction content from SKILL.md unchanged
3. Save output (MCP writes) AFTER LLM returns
4. Validate output matches expected Summary format
"""
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional


@dataclass
class InputSpec:
    """Defines what context a skill needs (from ### Input section)."""
    sections: list[str] = field(default_factory=list)  # e.g., ["all", "source", "constitution"]
    needs_source: bool = False
    needs_constitution: bool = False
    needs_theme: bool = False
    needs_slides: bool = False
    needs_story: bool = False
    raw_content: str = ""  # Original ### Input content


@dataclass
class OutputSpec:
    """Defines expected output handling (from ### Output section)."""
    format: str = "text"  # text, json, jsx
    target: Optional[str] = None  # MCP target: theme, slides, etc.
    schema: Optional[dict] = None  # JSON schema if applicable
    raw_content: str = ""  # Original ### Output content


@dataclass
class SummarySpec:
    """Defines expected return format (from ### Summary section)."""
    format: str = "text"  # What format to return to mainflow
    template: str = ""  # Template from Summary section
    raw_content: str = ""  # Original ### Summary content


@dataclass
class WorkflowSpec:
    """Complete workflow specification from ## Workflow section."""
    input_spec: InputSpec
    output_spec: OutputSpec
    summary_spec: SummarySpec
    raw_content: str = ""  # Original ## Workflow content


@dataclass
class ParsedSkill:
    """Parsed SKILL.md content."""
    name: str
    description: str
    workflow: WorkflowSpec  # Parsed ## Workflow section
    instructions: str  # Main skill content (excluding Workflow section)
    raw_content: str  # Original content for reference
    
    # Convenience accessors for backward compatibility
    @property
    def input_spec(self) -> InputSpec:
        return self.workflow.input_spec
    
    @property
    def output_spec(self) -> OutputSpec:
        return self.workflow.output_spec


def parse_skill(skill_path: Path) -> ParsedSkill:
    """Parse a SKILL.md file into structured components.
    
    Args:
        skill_path: Path to SKILL.md file
        
    Returns:
        ParsedSkill with separated components
    """
    content = skill_path.read_text(encoding="utf-8")
    
    # Parse frontmatter
    name, description = _parse_frontmatter(content)
    
    # Parse ## Workflow section with ### Input, ### Output, ### Summary
    workflow = _parse_workflow_section(content, name)
    
    # Extract instructions (skill content excluding Workflow section)
    instructions = _extract_instructions(content)
    
    return ParsedSkill(
        name=name,
        description=description,
        workflow=workflow,
        instructions=instructions,
        raw_content=content,
    )


def _parse_frontmatter(content: str) -> tuple[str, str]:
    """Extract name and description from YAML frontmatter."""
    frontmatter_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not frontmatter_match:
        return "unknown", ""
    
    frontmatter = frontmatter_match.group(1)
    
    # Simple YAML parsing for name and description
    name_match = re.search(r'^name:\s*(.+)$', frontmatter, re.MULTILINE)
    name = name_match.group(1).strip() if name_match else "unknown"
    
    desc_match = re.search(r'^description:\s*\|?\s*\n?((?:[ \t]+.+\n?)+|.+)$', frontmatter, re.MULTILINE)
    description = desc_match.group(1).strip() if desc_match else ""
    
    return name, description


def _parse_workflow_section(content: str, skill_name: str) -> WorkflowSpec:
    """Parse the ## Workflow section into Input, Output, Summary specs.
    
    The Workflow section structure:
    ## Workflow
    ### Input
    (MCP read calls and context description)
    ### Output
    (MCP write calls and save target)
    ### Summary
    (Return format to mainflow)
    """
    # Find ## Workflow section
    workflow_match = re.search(
        r'^## Workflow.*?\n(.*?)(?=^## [^#]|\Z)',
        content,
        re.MULTILINE | re.DOTALL
    )
    
    if not workflow_match:
        # Fallback: analyze full content for backward compatibility
        return _analyze_workflow_from_content(content, skill_name)
    
    workflow_content = workflow_match.group(1)
    
    # Parse ### Input subsection
    input_spec = _parse_input_section(workflow_content)
    
    # Parse ### Output subsection
    output_spec = _parse_output_section(workflow_content, skill_name)
    
    # Parse ### Summary subsection
    summary_spec = _parse_summary_section(workflow_content)
    
    return WorkflowSpec(
        input_spec=input_spec,
        output_spec=output_spec,
        summary_spec=summary_spec,
        raw_content=workflow_content,
    )


def _parse_input_section(workflow_content: str) -> InputSpec:
    """Parse ### Input section to determine what context to pre-load."""
    # Find ### Input section
    input_match = re.search(
        r'^### Input\s*\n(.*?)(?=^### |\Z)',
        workflow_content,
        re.MULTILINE | re.DOTALL
    )
    
    if not input_match:
        return InputSpec()
    
    input_content = input_match.group(1)
    spec = InputSpec(raw_content=input_content)
    
    # Analyze what sections are read
    if 'section: "all"' in input_content or "section: 'all'" in input_content or 'section="all"' in input_content:
        spec.sections.append("all")
        spec.needs_source = True
        spec.needs_constitution = True
        spec.needs_theme = True
        spec.needs_slides = True
    
    if 'section: "source"' in input_content or "section: 'source'" in input_content:
        spec.sections.append("source")
        spec.needs_source = True
    
    if 'section: "constitution"' in input_content or "section: 'constitution'" in input_content:
        spec.sections.append("constitution")
        spec.needs_constitution = True
    
    if 'section: "theme"' in input_content or "section: 'theme'" in input_content:
        spec.sections.append("theme")
        spec.needs_theme = True
    
    if 'section: "slides"' in input_content or "section: 'slides'" in input_content:
        spec.sections.append("slides")
        spec.needs_slides = True
    
    # Check for source file references
    if "files/" in input_content or "source files" in input_content.lower():
        spec.needs_source = True
    
    return spec


def _parse_output_section(workflow_content: str, skill_name: str) -> OutputSpec:
    """Parse ### Output section to determine how to save results."""
    # Find ### Output section
    output_match = re.search(
        r'^### Output\s*\n(.*?)(?=^### |\Z)',
        workflow_content,
        re.MULTILINE | re.DOTALL
    )
    
    if not output_match:
        return OutputSpec(format=_default_output_format(skill_name))
    
    output_content = output_match.group(1)
    
    # Determine target from apply_patch call
    # Match both: target: "theme" and "target": "theme"
    target = None
    target_patterns = [
        r'"target":\s*"(\w+)"',  # JSON-style: "target": "theme"
        r'target:\s*["\'](\w+)["\']',  # YAML-style: target: "theme"
    ]
    for pattern in target_patterns:
        target_match = re.search(pattern, output_content)
        if target_match:
            target = target_match.group(1)
            break
    
    # Determine output format
    output_format = _default_output_format(skill_name)
    if "mdx" in output_content.lower() or "jsx" in output_content.lower():
        output_format = "jsx"
    elif "json" in output_content.lower():
        output_format = "json"
    
    return OutputSpec(
        format=output_format,
        target=target,
        raw_content=output_content,
    )


def _parse_summary_section(workflow_content: str) -> SummarySpec:
    """Parse ### Summary section to determine return format."""
    # Find ### Summary section
    summary_match = re.search(
        r'^### Summary\s*\n(.*?)(?=^### |\Z)',
        workflow_content,
        re.MULTILINE | re.DOTALL
    )
    
    if not summary_match:
        return SummarySpec()
    
    summary_content = summary_match.group(1)
    
    # Extract template from code block if present
    template = ""
    template_match = re.search(r'```\s*\n(.*?)```', summary_content, re.DOTALL)
    if template_match:
        template = template_match.group(1).strip()
    
    return SummarySpec(
        format="text",
        template=template,
        raw_content=summary_content,
    )


def _default_output_format(skill_name: str) -> str:
    """Get default output format for a skill."""
    format_map = {
        "research-agent": "text",
        "theme-generator": "json",
        "storyline-planner": "json",
        "ant-paged-layout": "jsx",
        "paged-layout-content": "jsx",
        "ant-slides-export": "text",
        "slides-export": "text",
    }
    return format_map.get(skill_name, "text")


def _analyze_workflow_from_content(content: str, skill_name: str) -> WorkflowSpec:
    """Fallback: analyze full content when ## Workflow section is missing."""
    # Build specs from full content analysis
    input_spec = InputSpec()
    
    # Check for read_section calls anywhere in content
    if 'section: "all"' in content or "section: 'all'" in content or 'section="all"' in content:
        input_spec.sections.append("all")
        input_spec.needs_source = True
        input_spec.needs_constitution = True
        input_spec.needs_theme = True
        input_spec.needs_slides = True
    
    if 'section: "constitution"' in content or "section: 'constitution'" in content:
        input_spec.sections.append("constitution")
        input_spec.needs_constitution = True
    
    if "files/" in content or "source files" in content.lower():
        input_spec.needs_source = True
    
    # Determine output format
    output_format = _default_output_format(skill_name)
    
    # Determine target from apply_patch calls
    target = None
    target_match = re.search(r'target:\s*["\'](\w+)["\']', content)
    if target_match:
        target = target_match.group(1)
    
    return WorkflowSpec(
        input_spec=input_spec,
        output_spec=OutputSpec(format=output_format, target=target),
        summary_spec=SummarySpec(),
        raw_content="",
    )


def _extract_instructions(content: str) -> str:
    """Extract instruction content, excluding the Workflow section.
    
    The Workflow section is handled separately (for Input/Output/Summary).
    The rest of the skill content is used as LLM instructions.
    """
    # Remove frontmatter
    content_no_frontmatter = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)
    
    # Remove ## Workflow section (it's handled separately)
    content_no_workflow = re.sub(
        r'^## Workflow.*?\n.*?(?=^## [^#]|\Z)',
        '',
        content_no_frontmatter,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Also handle ## Workflow (ATOMIC) variant
    content_no_workflow = re.sub(
        r'^## Workflow \(ATOMIC\).*?\n.*?(?=^## [^#]|\Z)',
        '',
        content_no_workflow,
        flags=re.MULTILINE | re.DOTALL
    )
    
    return content_no_workflow.strip()


def build_subagent_prompt(
    skill: ParsedSkill,
    project_dir: str,
    project_context: dict,
    user_instruction: str = "",
    include_instruction_in_prompt: bool = False,
) -> tuple[str, str]:
    """Build system and user prompts for subagent execution.
    
    Uses the parsed workflow to:
    - System prompt: Use skill instructions (excludes Workflow section)
    - User prompt: Inject pre-loaded context based on Input spec
    - Output hint: Based on Output spec format
    
    Args:
        skill: Parsed skill definition
        project_dir: Project directory path
        project_context: Pre-loaded context from MCP reads
        user_instruction: Optional user instruction
        include_instruction_in_prompt: If True, include user_instruction in prompt
        
    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    import json
    
    # System prompt = skill instructions (Workflow section already excluded)
    system_prompt = skill.instructions + """

=== EXECUTION MODE ===
You are running in DIRECT OUTPUT mode.
- MCP tools are NOT available - context is pre-loaded below
- Return output DIRECTLY (no tool calls, no XML tags)
- Your output will be saved by the pipeline (you don't need to save)
"""
    
    # User prompt = minimal (like Claude's runSubagent) + pre-loaded context
    user_parts = [f"Project directory: {project_dir}"]
    
    if include_instruction_in_prompt and user_instruction:
        user_parts.append(f"User instruction: {user_instruction}")
    
    # Add pre-loaded context based on parsed Input spec
    input_spec = skill.workflow.input_spec
    context_parts = []
    
    if input_spec.needs_source and "source" in project_context:
        context_parts.append(f"Source files:\n{project_context['source']}")
    
    if input_spec.needs_constitution and "constitution" in project_context:
        context_parts.append(f"Constitution:\n{json.dumps(project_context['constitution'], indent=2)}")
    
    if input_spec.needs_theme and "theme" in project_context and project_context["theme"]:
        context_parts.append(f"Theme:\n{json.dumps(project_context['theme'], indent=2)}")
    
    if input_spec.needs_slides and "slides" in project_context and project_context["slides"]:
        context_parts.append(f"Slides:\n{json.dumps(project_context['slides'], indent=2)}")
    
    if context_parts:
        user_parts.append("\n=== PRE-LOADED CONTEXT ===")
        user_parts.extend(context_parts)
    
    # Output format hint based on parsed Output spec
    output_spec = skill.workflow.output_spec
    format_hints = {
        "json": "Return ONLY valid JSON.",
        "jsx": "Return ONLY JSX code with <Slide> wrappers.",
        "text": "Return markdown/text content.",
    }
    user_parts.append(f"\n=== OUTPUT ===\n{format_hints.get(output_spec.format, '')}")
    
    # Add summary template if available
    summary_spec = skill.workflow.summary_spec
    if summary_spec.template:
        user_parts.append(f"\nAfter your main output, include a summary in this format:\n{summary_spec.template}")
    
    return system_prompt, "\n\n".join(user_parts)
