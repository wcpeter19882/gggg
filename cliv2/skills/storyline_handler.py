"""Storyline skill handler.

Aligns with .claude/skills/storyline/SKILL.md ## Workflow section.
"""
import re
from typing import Any, Callable, Optional, Union

import yaml

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext, SkillContextWithTarget


class StorylineHandler(SkillHandler):
    """Storyline planning handler.
    
    Workflow:
    - Input: Read ALL context (source, constitution, theme)
    - Output: Save draft slides to content.json (target: slides)
    - Format: YAML frontmatter + markdown per slide
    
    Non-Batched:
    - Generates ALL slides in one call (no batching)
    - Returns slide_end marker when complete
    - Storyline is inherently sequential, batching would waste tokens
    
    Targeted Execution:
    - When target_indices specified, only generate/update those slides
    - Preserves other slides in the output
    """
    
    @property
    def name(self) -> str:
        return "storyline"
    
    @property
    def input_spec(self) -> SkillInput:
        return SkillInput(
            needs_source=False,  # Source content is consolidated into research.md
            needs_constitution=True,
            needs_theme=False,  # Storyline is content, not visual
            needs_slides=True,
            needs_research=True,  # Primary input: research.md contains ALL enriched content
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        return SkillOutput(
            target="slides",
            format="mdx",
            state_on_save="draft",
        )
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build storyline-specific prompt.
        
        Includes:
        - Research.md as PRIMARY source (contains consolidated source + external data)
        - Constitution for target_slides, tone, requirements
        - Theme for visual planning hints
        - User instruction for narrative focus
        - Target information for partial generation
        
        NOTE: Source files are NOT included. Research.md consolidates all content.
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
        
        if is_targeted:
            parts.append(f"\n=== TARGETED EXECUTION ===")
            parts.append(f"**Generate/update ONLY slides: {target_indices}**")
            parts.append(f"Action: {task_params.get('action', 'generate')}")
            if task_params.get('focus'):
                parts.append(f"Focus: {task_params['focus']}")
            parts.append("Preserve all other slides exactly as they are.")
        
        # Research.md is the ONLY source of content - it consolidates:
        # - Original source files
        # - User instruction context  
        # - External research (citations, statistics, images)
        if context.research:
            parts.append("\n=== RESEARCH CONTENT (Primary Source) ===")
            parts.append("**CRITICAL: This is your ONLY content source. Generate slides using SPECIFIC content from this material.**")
            parts.append("**DO NOT generate generic placeholders. Use actual product names, metrics, KPIs, and data points provided below.**")
            parts.append("**Every slide must contain SPECIFIC information from this research, not generic templates.**")
            parts.append("")
            parts.append(context.research)
        else:
            parts.append("\n=== WARNING ===")
            parts.append("No research.md found. Cannot generate slides without content.")
            parts.append("Run research subagent first to consolidate source content.")
        
        parts.append("\n=== CONSTITUTION ===")
        if context.constitution:
            # Constitution is now markdown string
            parts.append(context.constitution)
        
        if context.theme:
            parts.append(f"\n=== THEME ===\n{json.dumps(context.theme, indent=2)}")
        
        # Show existing slides for targeted updates
        if is_targeted and context.slides:
            parts.append("\n=== EXISTING SLIDES (for reference) ===")
            for i, slide in enumerate(context.slides):
                slide_num = i + 1
                marker = "→ UPDATE THIS" if slide_num in target_indices else ""
                parts.append(f"Slide {slide_num} {marker}: {slide.get('id', 'unknown')}")
                if slide.get('content', {}).get('headline'):
                    parts.append(f"  Headline: {slide['content']['headline'][:50]}")
        
        parts.append("\n=== OUTPUT ===")
        parts.append("""Return ALL slides in YAML frontmatter + markdown format.

**Generate ALL slides in this single call.** No batching.

**IMPORTANT: Frontmatter contains ONLY metadata, ALL content goes in markdown body.**

Format:
```
---
id: slide_01
rank: 1
state: draft
density: moderate
intent: statement
story: What audience should understand from this slide
---
# Headline (≤9 words)
## Subtitle (optional)

### Section Title
Content here using structured markdown (see below)
```

Frontmatter fields (ONLY these, no content/headline/subtitle/sections):
- id: slide_XX (required)
- rank: number (required)
- state: draft (required)
- density: minimal/moderate/dense (required)
- intent: statement/evidence/comparison/process/structure/hierarchy/overlap (required)
- story: 1-sentence narrative purpose (required)
- images: list of image filenames from research.md Downloaded Images table (REQUIRED if images available)

### IMAGE ASSIGNMENT (MANDATORY if research.md has Downloaded Images)

**CRITICAL: If research.md contains a Downloaded Images table, you MUST assign images to at least 3 slides.**

Add images field to frontmatter (single object, not array):
```
---
id: slide_03
rank: 3
state: draft
density: moderate
intent: evidence
story: Show platform transformation impact
images:
  filename: diverse_business_leaders_01_abc123.jpg
  dimensions: 1920x1080
  description: "Business leaders in hybrid meeting"
---
```

**Image Assignment Rules:**
- **EACH IMAGE CAN ONLY BE USED ONCE** - never assign same filename to multiple slides
- **MANDATORY**: Use ALL downloaded images across different slides
- **Include dimensions from research.md** (e.g., 1920x1080) - layout uses this for aspect ratio
- Match image description to slide topic conceptually
- 3-4 images for a 12-slide deck (minimum 3)
- Maximum 1 image per slide
- Priority: evidence > process > comparison > cover

### STRUCTURED MARKDOWN FORMAT (CRITICAL)

Use these markdown patterns to express content structure. Layout will use these to select components.

**1. Regular bullets (→ List component):**
```
- **Key point** — supporting explanation
- Another point with [citation or data source]
```

**2. Statistics/Metrics (→ Statistic component):**
```
- [stat] 99.9% — reliability rate
- [stat] $2.4M — annual savings
- [stat] 136k — monthly active users
```

**3. Process/Steps (→ Timeline or Steps component):**
```
1. **Phase name** — description of this phase
2. **Next phase** — what happens here
3. **Final phase** — outcome
```

**4. Comparison (→ Table or side-by-side Cards):**
```
| Aspect | Option A | Option B |
|--------|----------|----------|
| Speed  | Fast     | Slow     |
| Cost   | High     | Low      |
```

**5. Key takeaway (→ Alert component):**
```
> **Takeaway:** One-sentence insight or call to action.
```

**Match format to intent:**
- `evidence` intent → use [stat] markers and tables
- `process` intent → use numbered lists
- `comparison` intent → use tables
- `structure` intent → use regular bullets with sections
- `summary` intent → mix of bullets and > takeaway

When done with ALL slides, add completion marker:
```
---
id: slide_end
---
```

Each slide separated by ---, YAML frontmatter + markdown body.""")
        
        if is_targeted:
            parts.append(f"\n**Include ALL slides in output, with only slides {target_indices} modified.**")
        
        return "\n\n".join(parts)
    
    def process_output(self, output: Any) -> str:
        """Return MDX string for apply_patch to parse.
        
        Output format: YAML frontmatter + markdown content per slide.
        """
        if isinstance(output, str):
            return output.strip()
        # Fallback for legacy JSON format
        if isinstance(output, dict):
            slides = output.get("slides", [])
        elif isinstance(output, list):
            slides = output
        else:
            return ""
        
        # Convert JSON slides to MDX format (backwards compatibility)
        import yaml
        parts = []
        for slide in slides:
            if isinstance(slide, dict):
                # Extract metadata for frontmatter
                frontmatter = {
                    "id": slide.get("id", f"slide_{len(parts)+1}"),
                    "rank": slide.get("rank", len(parts) + 1),
                }
                for field in ["density", "intent", "category", "story", "transition_to", "modifier"]:
                    if field in slide:
                        frontmatter[field] = slide[field]
                
                # Get content
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
                
                parts.append(f"---\n{yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True).strip()}\n---\n{content}")
        
        return "\n\n".join(parts)
    
    def _extract_slide_ids(self, output: str) -> list[str]:
        """Extract slide IDs from output."""
        import re
        
        # Find all id: slide_XX or slide_end patterns
        pattern = r'id:\s*(slide_(?:\d+|end))'
        matches = re.findall(pattern, output)
        return list(dict.fromkeys(matches))  # Dedupe while preserving order
    
    async def execute_streaming(
        self, 
        context: SkillContext, 
        llm: Any, 
        logger: Any,
        on_slide_complete: Optional[Callable[[str, str], None]] = None,
    ) -> dict:
        """Execute storyline with streaming output.
        
        Streams LLM response and parses slides progressively.
        When a complete slide is detected, calls on_slide_complete callback
        which can apply patch immediately.
        
        Args:
            context: Pre-loaded context
            llm: LLM instance for completion
            logger: Logger instance
            on_slide_complete: Callback(slide_id, slide_mdx) called for each complete slide
            
        Returns:
            Result dict with skill-specific data
        """
        from cliv2.core.subagent import Subagent
        
        # Create subagent
        subagent = Subagent(self.name, llm)
        
        # Streaming execution with progressive parsing
        buffer = ""
        completed_slides = []
        # Pattern: ---\nid: slide_XX\n...more frontmatter...\n---\ncontent
        slide_pattern = re.compile(r'^---\s*\nid:\s*(slide_\d+)\s*\n', re.MULTILINE)
        
        logger.info("Starting streaming storyline generation...")
        
        try:
            async for chunk in subagent.run_with_handler_streaming(handler=self, context=context):
                buffer += chunk
                
                # Try to extract complete slides from buffer
                while True:
                    # Find all slide boundaries
                    matches = list(slide_pattern.finditer(buffer))
                    
                    if len(matches) < 2:
                        # Not enough boundaries to extract a complete slide
                        # But check for slide_end marker
                        if 'slide_end' in buffer and len(matches) == 1:
                            # Last slide before slide_end
                            end_pattern = re.compile(r'---\s*\nid:\s*slide_end', re.MULTILINE)
                            end_match = end_pattern.search(buffer)
                            if end_match and matches[0].start() < end_match.start():
                                slide_id = matches[0].group(1)
                                slide_mdx = buffer[matches[0].start():end_match.start()].strip()
                                
                                if on_slide_complete and slide_mdx:
                                    logger.info(f"Slide {slide_id} complete (final), applying patch...")
                                    on_slide_complete(slide_id, slide_mdx)
                                
                                completed_slides.append(slide_id)
                                buffer = buffer[end_match.start():]
                                continue
                        break
                    
                    # Extract the first complete slide (from first to second boundary)
                    first_match = matches[0]
                    second_match = matches[1]
                    
                    slide_id = first_match.group(1)
                    slide_mdx = buffer[first_match.start():second_match.start()].strip()
                    
                    # Call callback for completed slide
                    if on_slide_complete and slide_mdx:
                        logger.info(f"Slide {slide_id} complete, applying patch...")
                        on_slide_complete(slide_id, slide_mdx)
                    
                    completed_slides.append(slide_id)
                    
                    # Remove processed slide from buffer
                    buffer = buffer[second_match.start():]
            
            # Handle any remaining slide in buffer (no slide_end marker case)
            last_match = slide_pattern.search(buffer)
            if last_match and last_match.group(1) not in completed_slides:
                slide_id = last_match.group(1)
                # Check if slide_end is in buffer
                end_pattern = re.compile(r'---\s*\nid:\s*slide_end', re.MULTILINE)
                end_match = end_pattern.search(buffer)
                
                if end_match:
                    slide_mdx = buffer[last_match.start():end_match.start()].strip()
                else:
                    slide_mdx = buffer[last_match.start():].strip()
                
                if on_slide_complete and slide_mdx and slide_id != 'slide_end':
                    logger.info(f"Final slide {slide_id} complete, applying patch...")
                    on_slide_complete(slide_id, slide_mdx)
                
                if slide_id != 'slide_end':
                    completed_slides.append(slide_id)
            
            logger.info(f"Streaming complete. Generated {len(completed_slides)} slides: {completed_slides}")
            
        except Exception as e:
            logger.error(f"Streaming storyline generation failed: {e}")
            raise RuntimeError(f"Streaming storyline failed: {e}") from e
        
        # Check for completion marker
        is_complete = 'slide_end' in buffer
        
        return {
            "output": "",  # Already applied via callbacks
            "completed_ids": completed_slides,
            "is_complete": is_complete,
            "completed": completed_slides,
            "pending": [],
            "summary": f"Streamed storyline for {len(completed_slides)} slides",
            "streaming": True,
        }

    async def execute(self, context: SkillContext, llm: Any, logger: Any) -> dict:
        """Execute storyline generation (all slides in one call).
        
        Returns completion status for orchestrator.
        """
        # Call parent execute
        result = await super().execute(context, llm, logger)
        
        # Extract slide IDs
        raw_output = result.get("raw_output", result.get("output", ""))
        if isinstance(raw_output, str):
            slide_ids = self._extract_slide_ids(raw_output)
            # Filter out slide_end from completed IDs (it's just a marker)
            slide_ids = [sid for sid in slide_ids if sid != 'slide_end']
            is_complete = 'slide_end' in self._extract_slide_ids(raw_output)
        else:
            slide_ids = []
            is_complete = True  # Assume complete if no output
        
        # Add completion info for orchestrator
        result["is_complete"] = is_complete
        result["completed_ids"] = slide_ids
        
        # Add completion info for task DAG
        if isinstance(context, SkillContextWithTarget):
            target_indices = context.target_indices
            result["completed"] = target_indices if target_indices else []
            result["pending"] = []
            result["summary"] = f"Generated {len(slide_ids)} slides: {slide_ids}"
        else:
            result["completed"] = slide_ids
            result["pending"] = []
            result["summary"] = f"Generated {len(slide_ids)} slides"
        
        return result
