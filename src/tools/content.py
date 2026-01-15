"""Content Tool - Generate layouts and widgets for draft slides.

Takes draft slides (from StoryTool) with story, atoms, visual_design
and generates layouts and widgets to make them active.

Two-phase architecture:
1. StoryTool: atoms → draft slides (story, atoms, visual_design)
2. ContentTool: draft slides → active slides (layout, widgets)
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional, List, Dict, Any, ClassVar
from pydantic import Field

from src.common.tool_protocol import DirectTool, ToolContext, ToolPatch, register_tool

if TYPE_CHECKING:
    from src.generation.state import PipelineState


class ContentContext(ToolContext):
    """Context for content generation - draft slides with surrounding context."""
    draft_slides: List[Dict] = Field(default_factory=list, description="Slides in draft state to generate")
    context_before: List[Dict] = Field(default_factory=list, description="2 slides before for context")
    context_after: List[Dict] = Field(default_factory=list, description="2 slides after for context")
    atoms_collection: Optional[Any] = Field(default=None, description="AtomCollection for widget content")
    theme_id: Optional[str] = None
    themes: Optional[List[Dict]] = Field(default=None, description="Available themes")
    intent_guidance: str = Field(default="", description="Guidance from constitution")
    selected_theme: Optional[str] = Field(default=None, description="User-selected theme from UI")
    selected_vibe: Optional[str] = Field(default=None, description="User-selected vibe from UI")
    project: str = Field(default="slidev", description="Project/renderer: 'slidev' or 'react-mdx'")


class ContentPatch(ToolPatch):
    """Patch containing generated slides (to merge with existing)."""
    slides: List[Dict[str, Any]] = Field(default_factory=list, description="Generated active slides")
    
    class Config:
        arbitrary_types_allowed = True


@register_tool
class ContentTool(DirectTool[ContentContext, ContentPatch]):
    """Generates layouts and widgets for draft slides.
    
    This is phase 2 of content generation:
    1. StoryTool creates draft slides with story, atoms, visual_design
    2. ContentTool fills in layout and widgets to make them active
    
    Depends on StoryTool completing first.
    """
    
    # Self-description
    name: ClassVar[str] = "content"
    description: ClassVar[str] = """Generate layouts and widgets for draft slides.

INPUT: Draft slides with story, atoms, visual_design populated (from story tool)
OUTPUT: Active slides with layout and widgets filled in

This tool:
1. Takes draft slides from story tool
2. Selects appropriate layout based on visual_design
3. Populates widgets with content from referenced atoms
4. Outputs active slides ready for export

MODES:
1. mode="generate": Process all draft slides
2. mode="refine": Re-generate specific slides (keeps story/visual_design)

The story, atoms, and visual_design are PRESERVED from the draft.
Only layout and widgets are generated."""

    query_description: ClassVar[str] = """Triggers on:
- After story planning creates draft slides
- When draft slides need layout/widget generation
- Re-generating content for specific slides without changing story"""

    args_description: ClassVar[List[str]] = [
        "mode: 'generate' for all drafts, 'refine' for specific slides",
        "instruction: additional content guidance",
        "slide_ids: specific slide IDs to generate (empty = all drafts)",
    ]
    requires: ClassVar[List[str]] = ["story", "theme"]
    produces: ClassVar[List[str]] = ["slides (active state)"]
    examples: ClassVar[List[str]] = [
        '{"id": "content", "type": "content", "params": {"mode": "generate"}, "depends_on": ["story", "theme"]}',
        '{"id": "content", "type": "content", "params": {"mode": "refine", "slide_ids": ["slide_03"]}}',
    ]
    
    def slice(self, state: "PipelineState", params: Optional[Dict[str, Any]] = None) -> ContentContext:
        """Extract draft slides and context from state.
        
        Slices:
        - All draft slides (or specific IDs if provided)
        - 2 active slides before and after each draft for context
        - Atoms for widget content
        """
        params = params or {}
        
        # Get all slides from state
        all_slides = state.slides or []
        
        # DEBUG: Log slide states
        state_counts = {}
        for s in all_slides:
            st = s.get("state", "unknown")
            state_counts[st] = state_counts.get(st, 0) + 1
        self._log(f"DEBUG: Slide states in build_context: {state_counts}")
        
        # Sort by rank
        sorted_slides = sorted(all_slides, key=lambda s: s.get("rank", 0))
        
        # Identify draft slides to process
        slide_ids = params.get("slide_ids", [])
        if slide_ids:
            # Specific slides requested
            draft_slides = [s for s in sorted_slides if s.get("id") in slide_ids]
            self._log(f"DEBUG: Requested slide_ids: {slide_ids}")
        else:
            # All draft slides
            draft_slides = [s for s in sorted_slides if s.get("state") == "draft"]
            
            # If no drafts found, but we have active slides, assume user wants to RE-GENERATE content for them
            if not draft_slides:
                active_slides = [s for s in sorted_slides if s.get("state") == "active"]
                if active_slides:
                    self._log(f"Note: No draft slides found. Re-processing {len(active_slides)} active slides as drafts.")
                    draft_slides = active_slides

        self._log(f"DEBUG: Found {len(draft_slides)} slides for processing")
        
        # Get context slides (2 before and 2 after the draft range)
        context_before = []
        context_after = []
        # Only calculate context if we aren't processing EVERYTHING
        # If we are reprocessing all active slides, context is irrelevant (we see them all as drafts)
        is_reprocessing_all = (len(draft_slides) == len([s for s in sorted_slides if s.get("state") == "active"]))
        
        if draft_slides and not is_reprocessing_all:
            first_draft_rank = min(s.get("rank", 0) for s in draft_slides)
            last_draft_rank = max(s.get("rank", 0) for s in draft_slides)
            
            context_before = [
                s for s in sorted_slides 
                if s.get("state") == "active" 
                and s.get("rank", 0) < first_draft_rank
            ][-2:]  # Last 2 before
            
            context_after = [
                s for s in sorted_slides 
                if s.get("state") == "active" 
                and s.get("rank", 0) > last_draft_rank
            ][:2]  # First 2 after
        
        # Build intent guidance from constitution
        intent_guidance = ""
        constitution = state.get_constitution()
        if constitution:
            if hasattr(constitution, 'style_rules') and constitution.style_rules:
                intent_guidance = "\n".join(constitution.style_rules)
            if hasattr(constitution, 'layout_preferences') and constitution.layout_preferences:
                intent_guidance += "\n\nLayout preferences:\n" + "\n".join(
                    f"- {p}" for p in constitution.layout_preferences
                )
        
        # Get available themes (id + description only for LLM to choose)
        themes = None
        if state.themes:
            themes = []
            for t in state.themes.values():
                if isinstance(t, dict):
                    themes.append({
                        "id": t.get("id", "unknown"), 
                        "name": t.get("name", t.get("id", "unknown")),
                        "description": t.get("description", "")
                    })
                else:
                    themes.append({
                        "id": t.id, 
                        "name": getattr(t, 'name', t.id),
                        "description": getattr(t, 'description', "")
                    })
        
        # Get selected theme/vibe from constitution
        selected_theme = None
        selected_vibe = None
        if constitution:
            selected_theme = getattr(constitution, 'selected_theme', None)
            selected_vibe = getattr(constitution, 'selected_vibe', None)
        
        return ContentContext(
            draft_slides=draft_slides,
            context_before=context_before,
            context_after=context_after,
            atoms_collection=state.get_atoms(),
            theme_id=state.active_theme,
            themes=themes,
            intent_guidance=intent_guidance,
            selected_theme=selected_theme,
            selected_vibe=selected_vibe,
            project=state.project or "slidev",
        )
    
    def transform(self, context: ContentContext, user_instruction: str) -> ContentPatch:
        """Generate layouts and widgets for draft slides."""
        from src.generation.content.layout_generator import generate_layouts
        
        self._log(f"DEBUG transform: draft_slides len={len(context.draft_slides)}")
        
        if not context.draft_slides:
            self._log("No draft slides to process")
            return ContentPatch(slides=[])
        
        self._log(f"Generating layouts for {len(context.draft_slides)} draft slides")
        if context.context_before:
            self._log(f"  Context before: {len(context.context_before)} slides")
        if context.context_after:
            self._log(f"  Context after: {len(context.context_after)} slides")
        
        # Build full guidance
        full_guidance = context.intent_guidance
        if user_instruction:
            if full_guidance:
                full_guidance += f"\n\nUser instruction: {user_instruction}"
            else:
                full_guidance = f"User instruction: {user_instruction}"
        
        # Generate layouts and widgets for draft slides
        active_slides = generate_layouts(
            draft_slides=context.draft_slides,
            context_before=context.context_before,
            context_after=context.context_after,
            atoms=context.atoms_collection,
            theme_id=context.theme_id,
            intent_guidance=full_guidance,
            project=context.project,  # Pass project for MDX vs JSON output
        )
        
        self._log(f"Generated {len(active_slides)} active slides")
        return ContentPatch(slides=active_slides)
    
    def apply(self, state: "PipelineState", patch: ContentPatch) -> None:
        """Merge generated slides back into state.
        
        Merges new active slides while preserving:
        - story, atoms, visual_design from draft
        - Other slides that weren't regenerated
        
        Also applies selected theme/vibe from constitution.
        """
        if not patch.slides:
            return
        
        # Get selected theme/vibe from constitution
        constitution = state.get_constitution()
        selected_theme = None
        selected_vibe = None
        if constitution:
            selected_theme = getattr(constitution, 'selected_theme', None)
            selected_vibe = getattr(constitution, 'selected_vibe', None)
        
        # Get current slides
        current_slides = state.slides or []

        # Build lookup of generated slides by ID (plus tolerant matchers)
        import re

        def _canonical_slide_id(slide_id: Any) -> Any:
            if not isinstance(slide_id, str):
                return slide_id
            match = re.fullmatch(r"slide_(\d+)", slide_id)
            if not match:
                return slide_id
            try:
                return f"slide_{int(match.group(1))}"
            except ValueError:
                return slide_id

        generated_by_id = {s.get("id"): s for s in patch.slides if s.get("id") is not None}
        generated_by_canonical_id = {}
        generated_by_rank = {}
        for generated in patch.slides:
            gen_id = generated.get("id")
            canonical = _canonical_slide_id(gen_id)
            if canonical is not None:
                generated_by_canonical_id[canonical] = generated
            gen_rank = generated.get("rank")
            if isinstance(gen_rank, int):
                generated_by_rank[gen_rank] = generated
        
        # Merge: replace drafts with generated, keep others
        merged = []
        unmatched_generated_ids = set(generated_by_id.keys())

        for slide in current_slides:
            slide_id = slide.get("id")
            slide_rank = slide.get("rank")

            generated = None
            if slide_id in generated_by_id:
                generated = generated_by_id[slide_id]

            else:
                canonical = _canonical_slide_id(slide_id)
                generated = generated_by_canonical_id.get(canonical)
                if generated is None and isinstance(slide_rank, int):
                    generated = generated_by_rank.get(slide_rank)

            if generated is not None:
                # Replace draft with generated active slide
                if slide_id is not None:
                    # Keep state IDs stable even if the model returned slide_01 vs slide_1
                    generated["id"] = slide_id
                if generated.get("id") in unmatched_generated_ids:
                    unmatched_generated_ids.discard(generated.get("id"))
                if slide_id in unmatched_generated_ids:
                    unmatched_generated_ids.discard(slide_id)
                # Preserve story/atoms/visual_design/content from original
                generated["story"] = slide.get("story", generated.get("story", ""))
                generated["atoms"] = slide.get("atoms", generated.get("atoms", []))
                generated["visual_design"] = slide.get("visual_design", generated.get("visual_design", ""))
                
                # Preserve content field if present (from source-based generation)
                if slide.get("content"):
                    generated["content"] = slide.get("content")
                
                # Apply selected theme/vibe if set
                if selected_theme or selected_vibe:
                    if "parameters" not in generated:
                        generated["parameters"] = {}
                    if selected_theme:
                        generated["parameters"]["theme"] = selected_theme
                    if selected_vibe:
                        generated["parameters"]["vibe"] = selected_vibe
                
                merged.append(generated)
            else:
                merged.append(slide)

        # Helpful debug signal when the LLM returns IDs that don't exist in state.
        # This prevents silent failures that lead to empty exports.
        if unmatched_generated_ids:
            sample = sorted([str(x) for x in list(unmatched_generated_ids)[:5]])
            self._log(
                f"[WARN] {len(unmatched_generated_ids)} generated slide(s) did not match existing state IDs/ranks. "
                f"Sample IDs: {sample}"
            )
        
        # Post-processing: Fix consecutive same-layout issues
        from src.paged.layout.slidev.validate_slides import fix_consecutive_layouts
        merged, fix_report = fix_consecutive_layouts(merged, verbose=True)
        fixes_applied = sum(1 for line in fix_report if "→" in line)
        if fixes_applied > 0:
            self._log(f"🔧 Fixed {fixes_applied} consecutive layout issue(s)")
        
        state.set_slides(merged)
        self._log(f"Applied: merged {len(patch.slides)} generated slides" + 
                  (f" (theme={selected_theme}, vibe={selected_vibe})" if selected_theme or selected_vibe else ""))
