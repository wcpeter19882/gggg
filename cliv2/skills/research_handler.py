"""Research skill handler.

Aligns with .claude/skills/research/SKILL.md ## Workflow section.

## Data Flow Architecture

Research is the CONSOLIDATION point for all content:
- Input: ALL source files, constitution, user instruction
- Output: research.md (single source of truth)

Downstream agents (storyline, layout) read ONLY research.md.

## Three-step workflow:
1. Step 1 (LLM): Analyze source content + instruction → generate search queries
2. Step 2 (Tools): Execute web search and image search (parallelized)  
3. Step 3 (LLM): Consolidate source content + search results → research.md

Research.md contains:
- Summarized source content
- User instruction context
- External research (citations, statistics)
- Downloaded images catalog
"""
import json
import concurrent.futures
from pathlib import Path
from typing import Any, Optional

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext


class ResearchHandler(SkillHandler):
    """Research agent handler - consolidates ALL content into research.md.
    
    This is the data consolidation point:
    - Reads: ALL source files, constitution, user instruction
    - Outputs: research.md (the ONLY input for storyline)
    
    Step 1: Generate search queries (LLM call, output JSON)
    Step 2: Execute searches (tool calls, no LLM)
    Step 3: Consolidate source + search results → research.md
    
    Incremental Updates:
    - Reads existing research.md as context
    - Outputs create/edit operations per section
    - Small, targeted updates instead of full file rewrite
    """
    
    # Token limits for each phase to prevent excessive generation
    PHASE1_MAX_TOKENS = 2000  # Queries are small JSON
    PHASE3_MAX_TOKENS = 8000  # Research edits, ~11KB output
    
    def __init__(self):
        self._step: int = 1  # Current step (1, 2, or 3)
        self._queries: Optional[dict] = None  # Step 1 output
        self._search_results: Optional[dict] = None  # Step 2 output
    
    @property
    def name(self) -> str:
        return "research"
    
    @property
    def current_step(self) -> int:
        return self._step
    
    def set_step(self, step: int) -> None:
        """Set current step (1, 2, or 3)."""
        if step not in (1, 2, 3):
            raise ValueError(f"Invalid step: {step}. Must be 1, 2, or 3.")
        self._step = step
    
    def set_queries(self, queries: dict) -> None:
        """Set Step 1 output for use in Step 2."""
        self._queries = queries
    
    def set_search_results(self, results: dict) -> None:
        """Set Step 2 output for use in Step 3."""
        self._search_results = results
    
    @property
    def input_spec(self) -> SkillInput:
        return SkillInput(
            needs_source=True,
            needs_constitution=True,
            needs_theme=False,
            needs_slides=False,
            needs_research=True,  # Read existing research.md for incremental updates
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        # All steps output JSON
        return SkillOutput(target=None, format="json")
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build step-specific prompt."""
        if self._step == 1:
            return self._build_step1_prompt(context)
        elif self._step == 3:
            return self._build_step3_prompt(context)
        else:
            raise ValueError("Step 2 is tool execution, not LLM call")
    
    def _build_step1_prompt(self, context: SkillContext) -> str:
        """Step 1: Generate search queries.
        
        If research.md exists, identify gaps to fill.
        Otherwise, generate comprehensive queries.
        """
        parts = [
            "You are executing Step 1 of the research workflow: Generate Search Queries.",
            "",
            f"Project directory: {context.project_dir}",
        ]
        
        if context.user_instruction:
            parts.append(f"User instruction: {context.user_instruction}")
        
        parts.append("\n=== SOURCE CONTENT ===")
        if context.source:
            parts.append(context.source)
        
        parts.append("\n=== CONSTITUTION ===")
        if context.constitution:
            # Constitution is now markdown string
            parts.append(context.constitution)
        
        # Include existing research for incremental updates
        if context.research:
            parts.append("\n=== EXISTING RESEARCH (for reference) ===")
            parts.append("Review existing research and identify gaps to fill:")
            parts.append(context.research)
            parts.append("\n**Focus on:** Topics not yet researched, outdated data, missing citations")
        
        parts.append("\n=== OUTPUT FORMAT ===")
        parts.append("Return ONLY valid JSON:")
        parts.append("""```json
{
  "topics": [
    {
      "id": "topic_unique_id",
      "name": "Topic name",
      "goal": "What we want to find",
      "web_queries": ["query 1", "query 2"],
      "is_update": false
    }
  ],
  "image_queries": [
    {
      "concept": "Visual concept description",
      "query": "search query for images",
      "priority": "primary"
    }
  ]
}
```""")
        parts.append("")
        parts.append("Rules:")
        parts.append("- `id`: Unique identifier like 'topic_ai_adoption' (used for section tracking)")
        parts.append("- `is_update`: true if updating existing research, false if new topic")
        parts.append("- 3-5 topics with 1-2 web queries each")
        parts.append("- Skip topics already well-covered in existing research")
        parts.append("- 2 primary + 2 backup image queries")
        parts.append("- Image queries should be visual metaphors, not literal tech terms")
        parts.append("")
        parts.append("IMPORTANT: Be concise. Output ONLY the JSON, no explanations.")
        
        return "\n".join(parts)
    
    def _build_step3_prompt(self, context: SkillContext) -> str:
        """Step 3: Consolidate ALL content into research.md.
        
        research.md becomes the SINGLE source of truth for storyline.
        Must include:
        - Summarized source content (key points from input files)
        - User instruction context
        - External research findings
        - Downloaded images catalog
        """
        parts = [
            "You are executing Step 3 of the research workflow: Consolidate Content.",
            "",
            "**CRITICAL: research.md will be the ONLY input for storyline.**",
            "Include ALL content the storyline needs - it won't see source files.",
            "",
            f"Project directory: {context.project_dir}",
        ]
        
        if context.user_instruction:
            parts.append(f"\n=== USER INSTRUCTION ===")
            parts.append(context.user_instruction)
            parts.append("(Include this context in research.md so storyline knows the goal)")
        
        # SOURCE CONTENT - must be summarized into research.md
        parts.append("\n=== SOURCE CONTENT (must consolidate into research.md) ===")
        if context.source:
            parts.append(context.source)
            parts.append("\n**Extract key points from above into research.md sections.**")
        else:
            parts.append("(No source files provided)")
        
        # Constitution context
        parts.append("\n=== CONSTITUTION ===")
        if context.constitution:
            # Constitution is now markdown string
            parts.append(context.constitution)
        
        # Show existing research for incremental updates
        if context.research:
            parts.append("\n=== EXISTING RESEARCH.MD (update if needed) ===")
            parts.append(context.research)
        
        # Show queries from Step 1
        parts.append("\n=== SEARCH QUERIES (from Step 1) ===")
        if self._queries:
            topics = self._queries.get("topics", [])
            parts.append(f"Topics researched: {len(topics)}")
            for t in topics:
                parts.append(f"- {t.get('id')}: {t.get('name')}")
        
        parts.append("\n=== SEARCH RESULTS SUMMARY ===")
        if self._search_results:
            # Summarize web results - only include title, snippet, and URL
            web_results = self._search_results.get("web_results", [])
            parts.append(f"\n### Web Results ({len(web_results)} queries)")
            for wr in web_results:
                topic_id = wr.get("topic_id", "unknown")
                query = wr.get("query", "")
                results = wr.get("results", [])
                parts.append(f"\n**{topic_id}** - Query: \"{query}\"")
                for r in results[:3]:  # Top 3 results per query
                    title = r.get("title", "")[:80]
                    snippet = r.get("snippet", "")[:200]
                    url = r.get("link", "")
                    parts.append(f"- [{title}]({url})")
                    parts.append(f"  {snippet}")
            
            # Summarize image results - CRITICAL for storyline to assign images to slides
            image_results = self._search_results.get("image_results", [])
            if image_results:
                parts.append(f"\n### Images Downloaded ({len(image_results)} concepts)")
                parts.append("**CRITICAL: Include ALL downloaded images in the `images` section of research.md!**")
                parts.append("**Storyline agent needs this table to assign images to slides.**")
                parts.append("")
                for ir in image_results:
                    concept = ir.get("concept", "")
                    images = ir.get("images", [])
                    parts.append(f"**Concept: {concept}** ({len(images)} images)")
                    for img in images:
                        # Use title field (description may be empty)
                        desc = img.get('title') or img.get('description', 'No description')
                        filename = img.get('filename', '')
                        width = img.get('width', 'unknown')
                        height = img.get('height', 'unknown')
                        parts.append(f"  - `{filename}` ({width}x{height}): {desc[:80]}")
        else:
            parts.append("No search results available.")
        
        parts.append("\n=== OUTPUT FORMAT ===")
        parts.append("Return ONLY valid JSON with edit operations:")
        parts.append("""```json
{
  "operations": [
    {
      "operation": "create",
      "section": "header",
      "content": "# Research Summary\\n\\nGenerated: 2026-02-10\\nGoal: [user instruction summary]\\nTopics: 3"
    },
    {
      "operation": "create",
      "section": "source_summary",
      "content": "## Source Content Summary\\n\\n### Key Points\\n- Main argument/topic from source\\n- Supporting points extracted\\n- Important data/quotes"
    },
    {
      "operation": "create",
      "section": "topic_ai_adoption",
      "content": "## AI Adoption Trends\\n\\n### Key Findings\\n- 67% of enterprises..."
    },
    {
      "operation": "create",
      "section": "images",
      "content": "## Downloaded Images\\n\\n| File | Dimensions | Description | Suggested Use |\\n|------|------------|-------------|---------------|\\n| team_collab.jpg | 1200x800 | Team collaboration meeting | Slide on teamwork benefits |\\n| abstract_ai.jpg | 1600x900 | Abstract AI visualization | Opener or tech overview slide |"
    },
    {
      "operation": "create",
      "section": "citations",
      "content": "## Recommended Citations\\n\\n1. Gartner. \\"AI Survey 2025\\"..."
    }
  ]
}
```""")
        parts.append("")
        parts.append("**REQUIRED SECTIONS:**")
        parts.append("- `header`: File header with user goal/instruction")
        parts.append("- `source_summary`: **CRITICAL** - Key points from source content")
        parts.append("- `topic_{id}`: External research findings per topic")
        parts.append("- `images`: **CRITICAL** - Downloaded images catalog with ALL images from 'Images Downloaded' section above")
        parts.append("- `citations`: Source URLs and references")
        parts.append("")
        parts.append("**IMAGES SECTION RULES:**")
        parts.append("- MUST include ALL images from the 'Images Downloaded' section")
        parts.append("- Use exact filenames (e.g., `team_collab_01_abc123.jpg`)")
        parts.append("- Include dimensions and a brief description")
        parts.append("- Suggest which slide topics each image fits")
        parts.append("")
        parts.append("Operation types:")
        parts.append("- `create`: Create new section (or replace if exists)")
        parts.append("- `edit`: Update existing section content")
        parts.append("- `append`: Add to existing section")
        parts.append("")
        parts.append("Rules:")
        parts.append("- Only include sections that changed or are new")
        parts.append("- Use 'edit' to update existing sections with new data")
        parts.append("- Keep content concise - this is for slide enrichment")
        parts.append("- Include source URLs in citations")
        parts.append("")
        parts.append("IMPORTANT: Be concise. Output ONLY the JSON operations, no explanations.")
        parts.append("Keep each section content brief - this is for slide enrichment, not a full report.")
        
        return "\n".join(parts)
    
    def save_output(self, project_dir: str, output: Any) -> dict:
        """Save output based on current step."""
        if self._step == 1:
            # Step 1: Parse and store queries
            if isinstance(output, str):
                # Try to extract JSON from markdown code block
                content = output.strip()
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                self._queries = json.loads(content)
            else:
                self._queries = output
            return {"queries": self._queries}
        
        elif self._step == 3:
            # Step 3: Apply edit operations to research.md
            return self._apply_research_edits(project_dir, output)
        
        else:
            raise ValueError("Step 2 does not save LLM output")
    
    def _apply_research_edits(self, project_dir: str, output: Any) -> dict:
        """Apply incremental edits to research.md.
        
        Args:
            project_dir: Project directory path
            output: LLM output with edit operations
            
        Returns:
            Result dict with applied operations
        """
        from cliv2.tools.research_file import apply_research_edit
        
        # Parse output
        if isinstance(output, str):
            content = output.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            data = json.loads(content)
        else:
            data = output
        
        operations = data.get("operations", [])
        results = []
        
        for op in operations:
            operation = op.get("operation", "create")
            section = op.get("section")
            op_content = op.get("content", "")
            
            result = apply_research_edit(
                project_dir=project_dir,
                operation=operation,
                section=section,
                content=op_content,
            )
            results.append(result)
        
        research_path = Path(project_dir) / "files" / "research.md"
        return {
            "research_path": str(research_path),
            "operations_applied": len(results),
            "results": results,
        }
    
    def get_queries(self) -> Optional[dict]:
        """Get queries from Step 1 for Step 2 execution."""
        return self._queries

    async def execute(self, context: SkillContext, llm: Any, logger: Any) -> dict:
        """Execute complete three-phase research workflow.
        
        This handler owns the full workflow:
        - Phase 1: LLM generates search queries (JSON)
        - Phase 2: Execute web/image searches (tool calls)
        - Phase 3: LLM outputs edit operations (JSON)
        
        Args:
            context: Pre-loaded context with source, constitution, and existing research
            llm: LLM instance for completion
            logger: Logger instance
            
        Returns:
            Result dict with research_path
        """
        from cliv2.core.subagent import Subagent
        
        project_dir = context.project_dir
        
        # === Phase 1: Generate search queries ===
        logger.info("[research] Phase 1: Generating search queries")
        if context.research:
            logger.info("[research] Existing research found, will identify gaps")
        
        self.set_step(1)
        
        subagent = Subagent(self.name, llm)
        result = await subagent.run_with_handler(
            handler=self, 
            context=context,
            max_completion_tokens=self.PHASE1_MAX_TOKENS,
        )
        
        if not result.success:
            raise RuntimeError(f"Phase 1 failed: {result.error}")
        
        # Parse and store queries
        self.save_output(project_dir, result.output)
        queries = self.get_queries()
        
        if not queries or not queries.get("topics"):
            logger.warning("[research] No queries generated, skipping search")
            # Fall back to summarization without search results
            self.set_step(3)
            self.set_search_results({"web_results": [], "image_results": []})
            result = await subagent.run_with_handler(
                handler=self, 
                context=context,
                max_completion_tokens=self.PHASE3_MAX_TOKENS,
            )
            if result.success:
                self.save_output(project_dir, result.output)
            return {"research_path": str(Path(project_dir) / "files" / "research.md")}
        
        logger.info(f"[research] Generated {len(queries.get('topics', []))} topics, "
                    f"{len(queries.get('image_queries', []))} image queries")
        
        # === Phase 2: Execute searches (tool calls) ===
        logger.info("[research] Phase 2: Executing searches")
        search_results = await self._execute_searches(queries, project_dir, logger)
        self.set_search_results(search_results)
        
        # === Phase 3: Generate edit operations ===
        logger.info("[research] Phase 3: Generating research updates")
        self.set_step(3)
        
        result = await subagent.run_with_handler(
            handler=self, 
            context=context,
            max_completion_tokens=self.PHASE3_MAX_TOKENS,
        )
        
        if not result.success:
            raise RuntimeError(f"Phase 3 failed: {result.error}")
        
        # Apply edit operations to research.md
        save_result = self.save_output(project_dir, result.output)
        logger.info(f"[research] Applied {save_result.get('operations_applied', 0)} operations")
        
        return save_result

    async def _execute_searches(self, queries: dict, project_dir: str, logger: Any) -> dict:
        """Execute web and image searches using serper.dev API (fully parallelized).
        
        Args:
            queries: Queries from Phase 1 (topics with web_queries, image_queries)
            project_dir: Project directory for saving images
            logger: Logger instance
            
        Returns:
            Dict with web_results and image_results
        """
        from cliv2.tools.serper_search import search_web, search_images
        
        web_results = []
        image_results = []
        
        # Prepare web search tasks
        web_tasks = []
        for topic in queries.get("topics", []):
            topic_id = topic.get("id", topic.get("name", "unknown").lower().replace(" ", "_"))
            topic_name = topic.get("name", "Unknown")
            for query in topic.get("web_queries", []):
                web_tasks.append(("web", topic_id, topic_name, query))
        
        # Prepare image search tasks (primary only, backup handled separately)
        primary_image_queries = [q for q in queries.get("image_queries", []) 
                                 if q.get("priority") == "primary"]
        backup_image_queries = [q for q in queries.get("image_queries", []) 
                               if q.get("priority") == "backup"]
        
        image_tasks = [("image", q.get("concept", ""), q.get("query", ""), False) 
                       for q in primary_image_queries]
        
        def do_web_search(task):
            """Execute a single web search."""
            _, topic_id, topic_name, query = task
            logger.debug(f"[research] Web search (serper): {query}")
            try:
                results = search_web(query, num_results=5)
                return ("web", {
                    "topic_id": topic_id,
                    "topic": topic_name,
                    "query": query,
                    "results": results,
                })
            except Exception as e:
                logger.warning(f"[research] Web search failed: {e}")
                return ("web", {
                    "topic_id": topic_id,
                    "topic": topic_name,
                    "query": query,
                    "results": [],
                    "error": str(e),
                })
        
        def do_image_search(task):
            """Execute a single image search."""
            _, concept, query, is_backup = task
            prefix = "[research] Backup image" if is_backup else "[research] Image search"
            logger.debug(f"{prefix} (serper): {query}")
            try:
                results = search_images(
                    query, 
                    top_n=3, 
                    output_folder=project_dir,
                    min_width=800,
                    min_height=600,
                )
                return ("image", {
                    "concept": concept,
                    "query": query,
                    "images": results,
                })
            except Exception as e:
                logger.warning(f"{prefix} failed: {e}")
                return ("image", None)
        
        def execute_task(task):
            """Route task to appropriate handler."""
            if task[0] == "web":
                return do_web_search(task)
            else:
                return do_image_search(task)
        
        # Run ALL web and image searches in parallel
        all_tasks = web_tasks + image_tasks
        logger.info(f"[research] Starting {len(web_tasks)} web + {len(image_tasks)} image searches in parallel")
        
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                results = list(executor.map(execute_task, all_tasks))
            
            # Separate results by type
            for result_type, result_data in results:
                if result_type == "web":
                    web_results.append(result_data)
                elif result_type == "image" and result_data is not None:
                    image_results.append(result_data)
            
            logger.info(f"[research] Completed {len(web_results)} web, {len(image_results)} image searches")
            
            # Run backup image queries if primary results insufficient
            if len(image_results) < 2 and backup_image_queries:
                backup_tasks = [("image", q.get("concept", ""), q.get("query", ""), True) 
                               for q in backup_image_queries[:2]]
                logger.info(f"[research] Running {len(backup_tasks)} backup image searches")
                with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                    backup_results = list(executor.map(do_image_search, backup_tasks))
                    for result_type, result_data in backup_results:
                        if result_data is not None:
                            image_results.append(result_data)
                            
        except ImportError as e:
            logger.warning(f"[research] Serper search tool not available: {e}")
        except Exception as e:
            logger.error(f"[research] Search error: {e}")
        
        # Filter image results to only include entries with actual downloaded images
        valid_image_results = []
        images_folder = Path(project_dir) / "images"
        for result in image_results:
            valid_images = []
            for img in result.get("images", []):
                filename = img.get("filename")
                if filename:
                    filepath = images_folder / filename
                    # Validate file exists and has reasonable size (>1KB)
                    if filepath.exists() and filepath.stat().st_size > 1024:
                        valid_images.append(img)
                    else:
                        logger.debug(f"[research] Skipping missing/invalid image: {filename}")
            if valid_images:
                valid_image_results.append({
                    "concept": result.get("concept", ""),
                    "query": result.get("query", ""),
                    "images": valid_images,
                })
        
        if valid_image_results:
            logger.info(f"[research] {sum(len(r['images']) for r in valid_image_results)} images validated")
        else:
            logger.info("[research] No valid images downloaded")
        
        return {
            "web_results": web_results,
            "image_results": valid_image_results,
        }