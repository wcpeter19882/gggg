"""Research skill handler.

Aligns with .claude/skills/research/SKILL.md ## Workflow section.

Three-step workflow:
1. Step 1 (LLM): Generate search queries from source content
2. Step 2 (Tools): Execute web search and image search
3. Step 3 (LLM): Summarize results into research.md
"""
import json
from pathlib import Path
from typing import Any, Optional

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext


class ResearchHandler(SkillHandler):
    """Research agent handler with three-step workflow.
    
    Step 1: Generate search queries (LLM call, output JSON)
    Step 2: Execute searches (tool calls, no LLM)
    Step 3: Summarize research (LLM call, output markdown)
    """
    
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
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        # Step 1 outputs JSON, Step 3 outputs markdown
        if self._step == 1:
            return SkillOutput(target=None, format="json")
        else:
            return SkillOutput(target=None, format="text")
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build step-specific prompt."""
        if self._step == 1:
            return self._build_step1_prompt(context)
        elif self._step == 3:
            return self._build_step3_prompt(context)
        else:
            raise ValueError("Step 2 is tool execution, not LLM call")
    
    def _build_step1_prompt(self, context: SkillContext) -> str:
        """Step 1: Generate search queries."""
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
            parts.append(json.dumps(context.constitution, indent=2))
        
        parts.append("\n=== TASK ===")
        parts.append("Analyze the source content and generate search queries.")
        parts.append("")
        parts.append("Return ONLY valid JSON in this format:")
        parts.append("""```json
{
  "topics": [
    {
      "name": "Topic name",
      "goal": "What we want to find",
      "web_queries": ["query 1", "query 2"]
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
        parts.append("- 3-5 topics with 1-2 web queries each")
        parts.append("- 2 primary + 2 backup image queries")
        parts.append("- Image queries should be visual metaphors, not literal tech terms")
        parts.append("- Focus on claims that need external validation")
        
        return "\n".join(parts)
    
    def _build_step3_prompt(self, context: SkillContext) -> str:
        """Step 3: Summarize research results."""
        parts = [
            "You are executing Step 3 of the research workflow: Summarize Research.",
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
            parts.append(json.dumps(context.constitution, indent=2))
        
        parts.append("\n=== SEARCH QUERIES (from Step 1) ===")
        if self._queries:
            parts.append(json.dumps(self._queries, indent=2))
        
        parts.append("\n=== SEARCH RESULTS (from Step 2) ===")
        if self._search_results:
            parts.append(json.dumps(self._search_results, indent=2))
        else:
            parts.append("No search results available.")
        
        parts.append("\n=== TASK ===")
        parts.append("Synthesize the search results into a research summary.")
        parts.append("Return markdown content for research.md file.")
        parts.append("")
        parts.append("Structure:")
        parts.append("1. Research Summary header with metadata")
        parts.append("2. Topic sections with Key Findings, Sources, and Relevance")
        parts.append("3. Downloaded Images table (if any)")
        parts.append("4. Recommended Citations list")
        
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
            # Step 3: Save research.md
            research_path = Path(project_dir) / "files" / "research.md"
            research_path.parent.mkdir(exist_ok=True)
            research_path.write_text(str(output), encoding="utf-8")
            return {"research_path": str(research_path)}
        
        else:
            raise ValueError("Step 2 does not save LLM output")
    
    def get_queries(self) -> Optional[dict]:
        """Get queries from Step 1 for Step 2 execution."""
        return self._queries

    async def execute(self, context: SkillContext, llm: Any, logger: Any) -> dict:
        """Execute complete three-phase research workflow.
        
        This handler owns the full workflow:
        - Phase 1: LLM generates search queries (JSON)
        - Phase 2: Execute web/image searches (tool calls)
        - Phase 3: LLM summarizes results (markdown)
        
        Args:
            context: Pre-loaded context with source and constitution
            llm: LLM instance for completion
            logger: Logger instance
            
        Returns:
            Result dict with research_path
        """
        from cliv2.core.subagent import Subagent
        
        project_dir = context.project_dir
        
        # === Phase 1: Generate search queries ===
        logger.info("[research] Phase 1: Generating search queries")
        self.set_step(1)
        
        subagent = Subagent(self.name, llm)
        result = await subagent.run_with_handler(handler=self, context=context)
        
        if not result.success:
            raise RuntimeError(f"Phase 1 failed: {result.error}")
        
        # Parse and store queries
        self.save_output(project_dir, result.output)
        queries = self.get_queries()
        
        if not queries:
            logger.warning("[research] No queries generated, skipping search")
            # Fall back to summarization without search results
            self.set_step(3)
            self.set_search_results({"web_results": [], "image_results": []})
            result = await subagent.run_with_handler(handler=self, context=context)
            if result.success:
                self.save_output(project_dir, result.output)
            return {"research_path": str(Path(project_dir) / "files" / "research.md")}
        
        logger.info(f"[research] Generated {len(queries.get('topics', []))} topics, "
                    f"{len(queries.get('image_queries', []))} image queries")
        
        # === Phase 2: Execute searches (tool calls) ===
        logger.info("[research] Phase 2: Executing searches")
        search_results = await self._execute_searches(queries, project_dir, logger)
        self.set_search_results(search_results)
        
        # === Phase 3: Summarize research ===
        logger.info("[research] Phase 3: Summarizing research")
        self.set_step(3)
        
        result = await subagent.run_with_handler(handler=self, context=context)
        
        if not result.success:
            raise RuntimeError(f"Phase 3 failed: {result.error}")
        
        # Save research.md
        save_result = self.save_output(project_dir, result.output)
        
        return save_result

    async def _execute_searches(self, queries: dict, project_dir: str, logger: Any) -> dict:
        """Execute web and image searches using available tools.
        
        Args:
            queries: Queries from Phase 1 (topics with web_queries, image_queries)
            project_dir: Project directory for saving images
            logger: Logger instance
            
        Returns:
            Dict with web_results and image_results
        """
        web_results = []
        image_results = []
        
        # Try to use web search tool
        try:
            from cliv2.tools.web_search import search_web
            
            for topic in queries.get("topics", []):
                topic_name = topic.get("name", "Unknown")
                for query in topic.get("web_queries", []):
                    logger.debug(f"[research] Web search: {query}")
                    try:
                        results = search_web(query)
                        web_results.append({
                            "topic": topic_name,
                            "query": query,
                            "results": results,
                        })
                    except Exception as e:
                        logger.warning(f"[research] Web search failed: {e}")
                        web_results.append({
                            "topic": topic_name,
                            "query": query,
                            "results": [],
                            "error": str(e),
                        })
        except ImportError:
            logger.warning("[research] Web search tool not available")
        
        # Try to use image search tool
        try:
            from cliv2.tools.image_search import search_images
            
            # Only search primary queries first
            primary_queries = [q for q in queries.get("image_queries", []) 
                             if q.get("priority") == "primary"]
            backup_queries = [q for q in queries.get("image_queries", []) 
                            if q.get("priority") == "backup"]
            
            for img_query in primary_queries:
                query = img_query.get("query", "")
                concept = img_query.get("concept", "")
                logger.debug(f"[research] Image search: {query}")
                try:
                    results = search_images(query, top_n=3, output_folder=project_dir)
                    image_results.append({
                        "concept": concept,
                        "query": query,
                        "images": results,
                    })
                except Exception as e:
                    logger.warning(f"[research] Image search failed: {e}")
            
            # Run backup queries only if primary results are insufficient
            if len(image_results) < 4:
                for img_query in backup_queries[:2]:  # Max 2 backup
                    query = img_query.get("query", "")
                    concept = img_query.get("concept", "")
                    logger.debug(f"[research] Backup image search: {query}")
                    try:
                        results = search_images(query, top_n=3, output_folder=project_dir)
                        image_results.append({
                            "concept": concept,
                            "query": query,
                            "images": results,
                        })
                    except Exception as e:
                        logger.warning(f"[research] Backup image search failed: {e}")
                        
        except ImportError:
            logger.warning("[research] Image search tool not available")
        
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