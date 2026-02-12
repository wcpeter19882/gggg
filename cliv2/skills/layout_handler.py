"""Ant Design Layout skill handler.

Aligns with .claude/skills/ant-paged-layout/SKILL.md ## Workflow section.
"""
import json
import re
from pathlib import Path
from typing import Any, AsyncGenerator, Callable, Optional

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext, SkillContextWithTarget


class LayoutHandler(SkillHandler):
    """Ant Design Layout generation handler.
    
    Workflow:
    - Input: Read ALL context (source, constitution, theme, draft slides)
    - Output: Save JSX to slides in content.json (target: slides, format: jsx)
    - Process: Generate JSX for each slide, apply to mdx field
    
    Custom Layout Override:
    - If {theme_name}_layout.md exists in project, replace section 1.1 in SKILL.md
    
    Targeted Execution:
    - When target_indices specified, only generate JSX for those slides
    - Returns existing JSX for other slides unchanged
    """
    
    def _format_slides_for_context(self, slides: list[dict], target_indices: list[int] = None) -> str:
        """Format slides as YAML frontmatter + markdown.
        
        For target slides: full content included
        For other slides: only metadata (story, density, intent) for context
        
        Args:
            slides: List of all slide dictionaries
            target_indices: Which slides need JSX (1-indexed), empty = all
            
        Returns:
            YAML frontmatter + markdown for each slide
        """
        target_indices = target_indices or []
        generate_all = not target_indices
        
        parts = []
        for i, slide in enumerate(slides):
            idx = i + 1
            is_target = generate_all or idx in target_indices
            
            # Build frontmatter
            frontmatter_lines = ["---"]
            for key in ["id", "rank", "state", "density", "intent", "story"]:
                if key in slide:
                    value = slide[key]
                    if isinstance(value, str) and (":" in value or "\n" in value):
                        value = f'"{value}"'
                    frontmatter_lines.append(f"{key}: {value}")
            
            # Include images if assigned by storyline (with dimensions for aspect ratio)
            if "images" in slide and slide["images"]:
                images = slide["images"]
                if isinstance(images, dict):
                    # Single image with dimensions
                    filename = images.get('filename', '')
                    dimensions = images.get('dimensions', '')
                    frontmatter_lines.append(f"image: /images/{filename}")
                    if dimensions:
                        frontmatter_lines.append(f"image_dimensions: {dimensions}")
                elif isinstance(images, list) and images:
                    # First image as primary
                    filename = images[0].get('filename', '')
                    dimensions = images[0].get('dimensions', '')
                    frontmatter_lines.append(f"image: /images/{filename}")
                    if dimensions:
                        frontmatter_lines.append(f"image_dimensions: {dimensions}")
            
            # Mark if this slide needs JSX generation
            if is_target:
                frontmatter_lines.append("generate_jsx: true")
            frontmatter_lines.append("---")
            
            # For target slides: include full content
            # For context slides: just frontmatter (story provides narrative context)
            if is_target:
                content = slide.get("content", "")
                if isinstance(content, dict):
                    # Convert structured content to markdown
                    md_parts = []
                    if content.get("headline"):
                        md_parts.append(f"# {content['headline']}")
                    if content.get("subtitle"):
                        md_parts.append(f"## {content['subtitle']}")
                    for section in content.get("sections", []):
                        if section.get("title"):
                            md_parts.append(f"### {section['title']}")
                        for bullet in section.get("bullets", []):
                            if isinstance(bullet, dict):
                                text = bullet.get("text", "")
                                data = bullet.get("supporting_data", "")
                                so_what = bullet.get("so_what", "")
                                line = f"- {text}"
                                if data:
                                    line += f" [{data}]"
                                if so_what:
                                    line += f" → {so_what}"
                                md_parts.append(line)
                            else:
                                md_parts.append(f"- {bullet}")
                    content = "\n\n".join(md_parts)
                parts.append("\n".join(frontmatter_lines) + "\n" + content)
            else:
                # Context only - no content, just story in frontmatter
                parts.append("\n".join(frontmatter_lines))
        
        return "\n\n".join(parts)
    
    @property
    def name(self) -> str:
        return "layout"
    
    @property
    def input_spec(self) -> SkillInput:
        return SkillInput(
            needs_source=False,
            needs_constitution=True,
            needs_theme=True,
            needs_slides=True,
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        return SkillOutput(
            target="slides",
            format="mdx",
            state_on_save="active",
        )
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build layout-specific prompt.
        
        Includes:
        - Draft slides with story, density, intent, content
        - Theme for colors and typography
        - Constitution for any layout constraints
        - Target information for partial generation
        """
        import json
        
        parts = [f"Project directory: {context.project_dir}"]
        
        if context.user_instruction:
            parts.append(f"User instruction: {context.user_instruction}")
        
        # Handle targeted execution
        is_targeted = False
        target_indices = []
        task_params = {}
        
        if isinstance(context, SkillContextWithTarget):
            is_targeted = context.is_targeted()
            target_indices = context.target_indices
            task_params = context.task_params
        
        # Convert slide_ids from params to target_indices if present
        if task_params.get("slide_ids") and not target_indices:
            for sid in task_params["slide_ids"]:
                if sid.startswith("slide_"):
                    try:
                        idx = int(sid.replace("slide_", ""))
                        target_indices.append(idx)
                    except ValueError:
                        pass
            is_targeted = bool(target_indices)
        
        # Add specific instructions from task_params (e.g., for regeneration with image)
        # Check both "instructions" (plural) and "instruction" (singular) for compatibility
        task_instruction = task_params.get("instructions") or task_params.get("instruction")
        if task_instruction:
            parts.append(f"\n=== REGENERATION INSTRUCTIONS ===\n{task_instruction}")
        
        # Show slides in same format as storyline output
        # Target slides have full content, others just metadata for context
        parts.append("\n=== SLIDES ===")
        if is_targeted:
            parts.append(f"**Generate JSX ONLY for slides with `generate_jsx: true`**")
        if context.slides:
            parts.append(self._format_slides_for_context(context.slides, target_indices if is_targeted else []))
        else:
            parts.append("(No slides found)")
        
        # List available images in project
        parts.append("\n=== AVAILABLE IMAGES ===")
        images_dir = Path(context.project_dir) / "images"
        if images_dir.exists():
            image_files = [f.name for f in images_dir.iterdir() if f.is_file() and f.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']]
            if image_files:
                parts.append("Use these images with <img src=\"/images/{filename}\" />:")
                for img in image_files:
                    parts.append(f"  - {img}")
            else:
                parts.append("(No images available)")
        else:
            parts.append("(No images directory)")
        
        parts.append("\n=== THEME ===")
        if context.theme:
            parts.append(json.dumps(context.theme, indent=2))
        else:
            parts.append("(Using default theme)")
        
        parts.append("\n=== CONSTITUTION ===")
        if context.constitution:
            # Constitution is now markdown string
            parts.append(context.constitution)
        
        parts.append("\n=== OUTPUT ===")
        if is_targeted:
            parts.append(f"Output JSX ONLY for slides marked `generate_jsx: true`.")
        parts.append("Format:\n---\nid: slide_XX\nrank: X\n---\n<div className=\"...\">...JSX...</div>")
        parts.append("Use Ant Design 6.x components: Typography, List, Statistic, Steps, Timeline, etc.")
        
        return "\n\n".join(parts)
    
    def process_output(self, output: Any) -> str:
        """Return MDX string for apply_patch to parse."""
        if isinstance(output, str):
            return output.strip()
        return str(output) if output else ""
    
    def _find_custom_layout_file(self, project_dir: str) -> Path | None:
        """Find custom layout.md file in project directory.
        
        Looks for files matching *_layout.md pattern.
        
        Args:
            project_dir: Project directory path
            
        Returns:
            Path to layout.md file or None
        """
        project_path = Path(project_dir)
        layout_files = list(project_path.glob("*_layout.md"))
        
        if layout_files:
            return layout_files[0]
        return None
    
    def _apply_layout_override(self, skill_instructions: str, custom_layout_content: str) -> str:
        """Replace section 1.1 in SKILL.md with custom layout table.
        
        Args:
            skill_instructions: Original SKILL.md content
            custom_layout_content: Content from {theme_name}_layout.md
            
        Returns:
            Modified SKILL.md content with section 1.1 replaced
        """
        # Pattern to match section 1.1 from "### 1.1 Layout Patterns" to next "### 1.2"
        pattern = r'(### 1\.1 Layout Patterns\n.*?)(?=### 1\.2 Layout Rules)'
        
        # Build replacement content
        replacement = f"""### 1.1 Layout Patterns (Custom from PowerPoint Template)

{custom_layout_content}

"""
        
        # Apply replacement
        modified = re.sub(pattern, replacement, skill_instructions, flags=re.DOTALL)
        
        return modified
    
    async def execute(self, context: SkillContext, llm: Any, logger: Any) -> dict:
        """Execute layout skill with optional custom layout override.
        
        If {theme_name}_layout.md exists in project:
        1. Load the custom layout file
        2. Replace section 1.1 in the SKILL.md prompt
        3. Execute with modified prompt
        
        Supports targeted execution:
        - When target_indices specified, only generates JSX for those slides
        - Returns completion info for task DAG
        
        Args:
            context: Pre-loaded context
            llm: LLM instance for completion
            logger: Logger instance
            
        Returns:
            Result dict with skill-specific data
        """
        from cliv2.core.subagent import Subagent
        
        # Check for custom layout file
        custom_layout_file = self._find_custom_layout_file(context.project_dir)
        
        # Create subagent
        subagent = Subagent(self.name, llm)
        
        # If custom layout exists, modify the parsed skill's instructions
        if custom_layout_file:
            logger.info(f"Found custom layout file: {custom_layout_file}")
            custom_layout_content = custom_layout_file.read_text(encoding="utf-8")
            
            # Apply override to skill instructions
            original_instructions = subagent.parsed_skill.instructions
            modified_instructions = self._apply_layout_override(
                original_instructions, 
                custom_layout_content
            )
            
            # Update parsed skill with modified instructions
            subagent.parsed_skill.instructions = modified_instructions
            logger.debug("Applied custom layout patterns to SKILL.md")
        
        # Execute with (possibly modified) skill
        result = await subagent.run_with_handler(handler=self, context=context)
        
        if not result.success:
            raise RuntimeError(f"Skill {self.name} failed: {result.error}")
        
        # Process output through handler's transform
        processed = self.process_output(result.output)
        
        # Build completion info for task DAG
        output_data = {"output": processed}
        
        if isinstance(context, SkillContextWithTarget):
            target_indices = context.target_indices
            output_data["completed"] = target_indices if target_indices else []
            output_data["pending"] = []  # Layout generates all requested at once
            output_data["summary"] = f"Generated layout for slides {target_indices or 'all'}"
        else:
            # Count slides from JSX output
            slide_count = len(re.findall(r'<Slide\s+', processed)) if processed else 0
            output_data["completed"] = list(range(1, slide_count + 1))
            output_data["pending"] = []
            output_data["summary"] = f"Generated layout for {slide_count} slides"
        
        return output_data

    async def execute_streaming(
        self, 
        context: SkillContext, 
        llm: Any, 
        logger: Any,
        on_slide_complete: Optional[Callable[[str, str], None]] = None,
        on_slide_start: Optional[Callable[[str], None]] = None,
    ) -> dict:
        """Execute layout skill with streaming output.
        
        Streams LLM response and parses slides progressively.
        When a slide starts generating, calls on_slide_start callback.
        When a complete slide is detected, calls on_slide_complete callback
        which can apply patch immediately.
        
        Args:
            context: Pre-loaded context
            llm: LLM instance for completion
            logger: Logger instance
            on_slide_complete: Callback(slide_id, jsx_content) called for each complete slide
            on_slide_start: Callback(slide_id) called when slide starts generating
            
        Returns:
            Result dict with skill-specific data
        """
        from cliv2.core.subagent import Subagent
        
        # Check for custom layout file
        custom_layout_file = self._find_custom_layout_file(context.project_dir)
        
        # Create subagent
        subagent = Subagent(self.name, llm)
        
        # If custom layout exists, modify the parsed skill's instructions
        if custom_layout_file:
            logger.info(f"Found custom layout file: {custom_layout_file}")
            custom_layout_content = custom_layout_file.read_text(encoding="utf-8")
            
            original_instructions = subagent.parsed_skill.instructions
            modified_instructions = self._apply_layout_override(
                original_instructions, 
                custom_layout_content
            )
            subagent.parsed_skill.instructions = modified_instructions
            logger.debug("Applied custom layout patterns to SKILL.md")
        
        # Streaming execution with progressive parsing
        buffer = ""
        completed_slides = []
        started_slides = set()  # Track slides we've already notified as started
        slide_pattern = re.compile(r'^---\s*\nid:\s*(slide_\d+)\s*\nrank:\s*(\d+)\s*\n---\s*\n', re.MULTILINE)
        
        logger.info("Starting streaming layout generation...")
        
        try:
            async for chunk in subagent.run_with_handler_streaming(handler=self, context=context):
                buffer += chunk
                
                # Check for new slide starts (notify when we see a slide boundary)
                for match in slide_pattern.finditer(buffer):
                    slide_id = match.group(1)
                    if slide_id not in started_slides:
                        started_slides.add(slide_id)
                        if on_slide_start:
                            logger.info(f"Slide {slide_id} started generating...")
                            on_slide_start(slide_id)
                
                # Try to extract complete slides from buffer
                while True:
                    # Find all slide boundaries
                    matches = list(slide_pattern.finditer(buffer))
                    
                    if len(matches) < 2:
                        # Not enough boundaries to extract a complete slide
                        break
                    
                    # Extract the first complete slide (from first to second boundary)
                    first_match = matches[0]
                    second_match = matches[1]
                    
                    slide_id = first_match.group(1)
                    slide_jsx = buffer[first_match.end():second_match.start()].strip()
                    
                    # Call callback for completed slide
                    if on_slide_complete and slide_jsx:
                        logger.info(f"Slide {slide_id} complete, applying patch...")
                        on_slide_complete(slide_id, slide_jsx)
                    
                    completed_slides.append(slide_id)
                    
                    # Remove processed slide from buffer
                    buffer = buffer[second_match.start():]
            
            # Handle the last slide in buffer (no second boundary)
            last_match = slide_pattern.search(buffer)
            if last_match:
                slide_id = last_match.group(1)
                slide_jsx = buffer[last_match.end():].strip()
                
                if on_slide_complete and slide_jsx:
                    logger.info(f"Final slide {slide_id} complete, applying patch...")
                    on_slide_complete(slide_id, slide_jsx)
                
                completed_slides.append(slide_id)
            
            logger.info(f"Streaming complete. Generated {len(completed_slides)} slides: {completed_slides}")
            
        except Exception as e:
            logger.error(f"Streaming layout generation failed: {e}")
            raise RuntimeError(f"Streaming layout failed: {e}") from e
        
        # Build completion info
        target_indices = []
        if isinstance(context, SkillContextWithTarget):
            target_indices = context.target_indices or []
        
        return {
            "output": "",  # Already applied via callbacks
            "completed": [int(s.replace("slide_", "")) for s in completed_slides],
            "pending": [],
            "summary": f"Streamed layout for {len(completed_slides)} slides",
            "streaming": True,
        }
