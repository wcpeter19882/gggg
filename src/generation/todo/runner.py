"""Pipeline Runner v2 - Todo-based architecture.

Clean architecture:
    todos = planner(state, user_instruction)
    for todo in todos:
        executor.execute_todo(todo, state, user_instruction)

All tools follow unified protocol:
    context = tool.slice(state)
    patch = tool.generate(constitution, context, user_instruction)
    tool.apply(state, patch)
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from src.generation.state import PipelineState
from src.generation.todo.planner import plan
from src.generation.todo.executor import TodoExecutor


def _safe_print(message: str) -> None:
    """Print message with fallback for Unicode encoding errors on Windows."""
    try:
        print(message)
    except UnicodeEncodeError:
        # Fallback: encode with 'replace' for problematic characters
        safe_message = message.encode(sys.stdout.encoding or 'utf-8', errors='replace').decode(sys.stdout.encoding or 'utf-8', errors='replace')
        print(safe_message)


class PipelineRunner:
    """Runs the todo-based generation pipeline.
    
    Usage:
        runner = PipelineRunner(verbose=True)
        
        # From scratch
        result = runner.run(
            source_path=Path("input.vtt"),
            user_instruction="create slides, 10 pages, professional"
        )
        
        # Incremental update
        result = runner.run_incremental(
            state_path=Path(".state.json"),
            user_instruction="add more visuals"
        )
    """
    
    def __init__(
        self,
        verbose: bool = False,
        use_cache: bool = True,
        output_dir: Optional[Path] = None,
        refine_iterations: int = 2,
    ):
        self.verbose = verbose
        self.use_cache = use_cache
        self.output_dir = output_dir or Path("output")
        self.state_path = self.output_dir / "state.json"
        self.refine_iterations = refine_iterations
        
        self.executor = TodoExecutor(
            verbose=verbose,
            use_cache=use_cache,
            output_dir=self.output_dir,
            state_path=self.state_path,  # Pass state_path for persistence
        )
    
    def run(
        self,
        source_path: Path,
        user_instruction: str,
        state: Optional["PipelineState"] = None,
        project: str = "slidev",
        active_theme: str = "business",
        force_rerun: bool = False,
    ) -> "PipelineState":
        """Run full pipeline from source.
        
        Args:
            source_path: Path to source file (VTT, TXT, MD, etc.)
            user_instruction: User's natural language instruction
            state: Optional existing state (for incremental updates)
            project: Export project type (slidev, duolingo, react-mdx)
            active_theme: Theme for react-mdx export
        
        Returns:
            Final pipeline state
        """
        # Late import to avoid circular dependency
        from src.generation.state import PipelineState
        
        # Try to load existing state from output folder unless force_rerun is set
        state_path = self.output_dir / "state.json"
        if state is None and force_rerun and state_path.exists():
            if self.verbose:
                _safe_print(f"🧹 --force-rerun: ignoring existing state at {state_path}")
            state = PipelineState()
        elif state is None and state_path.exists():
            if self.verbose:
                _safe_print(f"📂 Loading existing state from {state_path}")
            state = PipelineState.load(state_path)
        elif state is None:
            state = PipelineState()
        
        # Set source
        state.set_source(source_path)
        
        # Set project and theme
        state.project = project
        state.active_theme = active_theme
        
        # Check if state already has pending todos - if so, skip planning
        # This makes state.json the source of truth
        has_pending_todos = (
            state.todos is not None 
            and hasattr(state.todos, 'todos') 
            and len(state.todos.todos) > 0
            and any(t.status in ('pending', 'in_progress') for t in state.todos.todos)
        )
        
        if has_pending_todos:
            if self.verbose:
                _safe_print(f"📋 Using existing todos from state.json (skipping planning)")
                pending_count = sum(1 for t in state.todos.todos if t.status in ('pending', 'in_progress'))
                completed_count = sum(1 for t in state.todos.todos if t.status == 'completed')
                _safe_print(f"   • {completed_count} completed, {pending_count} pending")
            todos = state.todos
        else:
            # Plan todos from instruction
            if self.verbose:
                _safe_print(f"📋 Planning todos from instruction...")
            
            todos = plan(state, user_instruction)
            state.todos = todos
            
            # Persist state immediately after planning
            self.state_path.parent.mkdir(parents=True, exist_ok=True)
            state.save(self.state_path)
            if self.verbose:
                _safe_print(f"💾 Todos planned, state persisted")
        
        if self.verbose:
            _safe_print(f"📋 {len(todos.todos)} todos:")
            for todo in todos.todos:
                deps = f" (depends: {todo.depends_on})" if todo.depends_on else ""
                status = f"[{todo.status}]" if todo.status != 'pending' else ""
                _safe_print(f"   • {todo.type.value}: {todo.id}{deps} {status}")
        
        # Execute all todos - pass user_instruction to executor
        # (executor persists state on each todo status change)
        if self.verbose:
            _safe_print(f"\n🔄 Executing todos...")
        
        count = self.executor.execute_all(state, user_instruction)
        
        if self.verbose:
            _safe_print(f"\n✅ Completed {count} todos")
            _safe_print(state.summary())
        
        # Auto-refine loop based on whitespace validation
        if self.refine_iterations > 0 and project == "react-mdx":
            state = self._auto_refine_loop(state, user_instruction)
        
        return state
    
    def _auto_refine_loop(
        self,
        state: "PipelineState",
        user_instruction: str,
    ) -> "PipelineState":
        """Run auto-refinement loop based on whitespace validation.
        
        Checks for layout issues (overflow, cutoff, imbalance) and triggers
        refinement if critical issues are found, up to max iterations.
        
        The loop:
        1. Validates generated MDX for layout issues
        2. Marks problematic slides as "draft" (clears layouts)
        3. Uses planner to generate content + export todos
        4. Regenerates layouts with fix guidance
        """
        from src.paged.layout.react.layout_validator import validate_mdx_content
        
        for iteration in range(self.refine_iterations):
            # Read the generated MDX
            mdx_path = self.output_dir / "slides.mdx"
            if not mdx_path.exists():
                if self.verbose:
                    _safe_print(f"⚠️ No slides.mdx found, skipping auto-refine")
                break
            
            mdx_content = mdx_path.read_text(encoding='utf-8')
            
            # Run validation
            ws_result = validate_mdx_content(mdx_content, verbose=False)
            
            # Check for critical issues (errors only)
            errors = [i for i in ws_result.get("issues", []) if i.severity == "error"]
            
            if not errors:
                if self.verbose:
                    _safe_print(f"\n✅ Auto-refine: No critical layout issues found")
                break
            
            # Group errors by slide
            slides_to_fix = {}
            for err in errors:
                slide_id = err.slide_id
                if slide_id not in slides_to_fix:
                    slides_to_fix[slide_id] = []
                slides_to_fix[slide_id].append(err)
            
            if self.verbose:
                _safe_print(f"\n🔄 Auto-refine iteration {iteration + 1}/{self.refine_iterations}")
                _safe_print(f"   Found {len(errors)} issues in {len(slides_to_fix)} slides:")
                for slide_id, errs in list(slides_to_fix.items())[:3]:
                    _safe_print(f"   • {slide_id}: {', '.join(e.issue_type.value for e in errs)}")
            
            # Mark problematic slides as "draft" to trigger regeneration
            # Note: Validation slide_ids are "slide_1", "slide_2" based on index, not actual slide.id
            # We need to map validation slide_idx to state.slides index
            marked_count = 0
            for val_slide_id in slides_to_fix:
                # Extract index from validation slide_id (e.g., "slide_2" -> index 1)
                match = re.match(r'slide_(\d+)', val_slide_id)
                if match:
                    slide_idx = int(match.group(1)) - 1  # Convert to 0-based index
                    if 0 <= slide_idx < len(state.slides or []):
                        slide = state.slides[slide_idx]
                        slide["state"] = "draft"  # Mark for regeneration
                        # Clear layout to force regeneration
                        slide.pop("layout", None)
                        slide.pop("widgets", None) 
                        slide.pop("content", None)
                        
                        # Set density based on issue type
                        errors_for_slide = slides_to_fix.get(val_slide_id, [])
                        has_overflow = any(e.issue_type.value == "content_overflow" for e in errors_for_slide)
                        has_sparse = any(e.issue_type.value == "sparse_content" for e in errors_for_slide)
                        
                        if has_overflow:
                            slide["density"] = "sparse"  # Reduce content for overflow
                        elif has_sparse:
                            slide["density"] = "dense"   # Add more content for sparse
                        marked_count += 1
            
            if self.verbose:
                _safe_print(f"   Marked {marked_count} slides for layout regeneration")
                # Debug: show draft slide count
                draft_count = sum(1 for s in (state.slides or []) if s.get("state") == "draft")
                _safe_print(f"   DEBUG: {draft_count} slides now have state='draft'")
            
            # Build refinement instruction from issues
            refine_instruction = self._build_refine_instruction(errors)
            
            if self.verbose:
                _safe_print(f"\n📝 Refinement instruction:")
                _safe_print(f"   {refine_instruction[:200]}...")
            
            # Run refinement via planner (will generate content + export only due to rule 7)
            state = self.run_refinement(state, refine_instruction)
            
            if self.verbose:
                _safe_print(f"\n✅ Refinement iteration {iteration + 1} complete")
        
        return state
    
    def _build_refine_instruction(self, issues: list) -> str:
        """Build a refinement instruction from validation issues."""
        # Group issues by type
        overflow_issues = [i for i in issues if i.issue_type.value == "content_overflow"]
        sparse_issues = [i for i in issues if i.issue_type.value == "sparse_content"]
        other_issues = [i for i in issues if i.issue_type.value not in ("content_overflow", "sparse_content")]
        
        lines = []
        
        # Handle sparse content issues (CRITICAL for split layouts)
        if sparse_issues:
            lines.extend([
                "**CRITICAL: FIX UNDERFILLED SLIDES**",
                "",
                "The following slides have too little content and look under-construction.",
                "For SPLIT LAYOUTS (LayoutSplit), you MUST add more content to BOTH sides:",
                "1. ADD BigNum, MetricGroup (3-4 metrics), or additional SmartList",
                "2. ADD Callout or CardGroup for visual weight",
                "3. ADD Diagram or ChartBar if data supports it",
                "4. ENSURE both sides have 4+ elements that vertically overlap",
                "5. If content is limited, SWITCH to LayoutStacked instead",
                "",
                "Underfilled slides:"
            ])
            for issue in sparse_issues:
                desc = issue.description[:100] if issue.description else ""
                lines.append(f"- {issue.slide_id}: {desc}")
            lines.append("")
        
        # Handle overflow issues
        if overflow_issues:
            lines.extend([
                "**CRITICAL: FIX CONTENT OVERFLOW**",
                "",
                "The following slides have content that exceeds the visible area.",
                "For each affected slide, you MUST reduce content by:",
                "1. REMOVE heavy components (Diagram, MetricGroup with 4+ metrics, ChartBar)",
                "2. USE simpler layouts (split/stacked instead of dashboard)",
                "3. LIMIT SmartList to max 3 items",
                "4. SHORTEN Text blocks to 2 sentences max",
                "5. DROP optional elements (footer Callout, secondary visuals)",
                "",
                "Overflow slides:"
            ])
            for issue in overflow_issues:
                suggestion = issue.suggestion or ""
                remove_hint = ""
                if "Consider removing:" in suggestion:
                    remove_hint = suggestion.split("Consider removing:")[-1].strip()
                lines.append(f"- {issue.slide_id}: OVERFLOW (height {int(getattr(issue, 'fill_ratio', 0) * 100)}%) - REMOVE: {remove_hint or 'heavy components'}")
            lines.append("")
        
        # Handle other issues
        if other_issues:
            lines.append("Other issues:")
            for issue in other_issues:
                if issue.issue_type.value == "content_cutoff":
                    lines.append(f"- {issue.slide_id}: CUTOFF in {issue.location} - reduce elements in this slot")
                elif issue.issue_type.value == "empty_slot":
                    lines.append(f"- {issue.slide_id}: EMPTY SLOT {issue.location} - add content or change layout")
                else:
                    lines.append(f"- {issue.slide_id}: {issue.issue_type.value} - {issue.suggestion}")
            lines.append("")
        
        lines.append("Keep slide count the same. ONLY modify affected slides.")
        if sparse_issues:
            lines.append("Use density='dense' for sparse slides to add more content.")
        if overflow_issues:
            lines.append("Use density='sparse' for overflow slides to reduce content.")
        
        return "\n".join(lines)
    
    def run_incremental(
        self,
        state_path: Path,
        user_instruction: str,
    ) -> "PipelineState":
        """Run incremental update on existing state.
        
        Args:
            state_path: Path to saved state JSON
            user_instruction: User's refinement instruction
        
        Returns:
            Updated pipeline state
        """
        # Late import to avoid circular dependency
        from src.generation.state import PipelineState
        
        # Load existing state
        state = PipelineState.load(state_path)
        
        # Clear previous todos
        state.clear_todos()
        
        # Plan new todos based on current state + instruction
        todos = plan(state, user_instruction)
        state.todos = todos
        
        # Persist state immediately after planning
        state_path.parent.mkdir(parents=True, exist_ok=True)
        state.save(state_path)
        
        # Execute - pass user_instruction
        # (executor persists state on each todo status change)
        count = self.executor.execute_all(state, user_instruction)
        
        if self.verbose:
            _safe_print(f"✅ Incremental: {count} todos executed")
        
        return state
    
    def run_refinement(
        self,
        state: "PipelineState",
        user_instruction: str,
    ) -> "PipelineState":
        """Run refinement on existing state with new instruction.
        
        This method refines an existing presentation by:
        1. Keeping existing atoms (no re-extraction)
        2. Re-planning content generation with new instruction
        3. Re-generating slides based on updated instruction
        
        Args:
            state: Existing pipeline state with atoms and slides
            user_instruction: New/additional instruction for refinement
        
        Returns:
            Updated pipeline state with refined slides
        """
        if self.verbose:
            _safe_print(f"🔄 Running refinement (v{state.version})")
            _safe_print(f"   Instruction: {user_instruction[:80]}...")
        
        # Clear previous todos
        state.clear_todos()
        
        # Plan new todos - the planner will detect existing atoms and skip extraction
        todos = plan(state, user_instruction)
        state.todos = todos
        
        # Persist state immediately after planning
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        state.save(self.state_path)
        
        if self.verbose:
            _safe_print(f"📋 Planned {len(todos.todos)} refinement todos")
        
        # Execute - pass user_instruction
        count = self.executor.execute_all(state, user_instruction)
        
        if self.verbose:
            _safe_print(f"✅ Refinement: {count} todos executed")
        
        return state
    
    def save_state(self, state: "PipelineState", path: Path):
        """Save state to file."""
        state.save(path)
        if self.verbose:
            _safe_print(f"💾 State saved to {path}")
    
    def load_state(self, path: Path) -> "PipelineState":
        """Load state from file."""
        # Late import to avoid circular dependency
        from src.generation.state import PipelineState
        
        state = PipelineState.load(path)
        if self.verbose:
            _safe_print(f"📂 State loaded from {path}")
        return state


# Convenience function
def generate_slides(
    source_path: Path,
    user_instruction: str,
    output_dir: Optional[Path] = None,
    verbose: bool = False,
) -> Path:
    """Generate slides from source file.
    
    Args:
        source_path: Input file (VTT, TXT, MD)
        user_instruction: e.g. "create slides, 10 pages, professional, corp_modern_v1"
        output_dir: Where to write slides
        verbose: Print progress
    
    Returns:
        Path to generated slides
    """
    runner = PipelineRunner(
        verbose=verbose,
        output_dir=output_dir or Path("output"),
    )
    
    state = runner.run(source_path, user_instruction)
    
    # Return path to output
    return runner.output_dir / "slides.md"
