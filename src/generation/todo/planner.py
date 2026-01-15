"""LLM-based Todo Planner.

Converts user instruction + current state into a TodoQueue using LLM.

Architecture:
    todos = planner(state, user_instruction)
    for todo in todos:
        patch = executor.do(todo)
        state.apply(patch)

The planner:
1. Collects all registered tool descriptions
2. Creates a context slice from state (atoms abstract, slides abstract)
3. Uses LLM to generate todos with parameters
4. Parses LLM response into TodoQueue
"""
from __future__ import annotations

import json
import logging
import os
import re
from enum import Enum
from typing import TYPE_CHECKING, Optional, List, Dict, Any
from pydantic import BaseModel, Field

from src.generation.todo.models import (
    TodoItem, TodoQueue, TodoType, TodoStatus,
    ConstitutionPatch, AtomsParams, ThemeParams, StoryParams, ContentParams, CodegenParams, ExportParams
)
from src.common.tool_protocol import get_all_descriptions, get_all_descriptions_structured
from src.utils.llm_client import call_llm

if TYPE_CHECKING:
    from src.generation.state import PipelineState

logger = logging.getLogger(__name__)


# =============================================================================
# INTENT MODELS (kept for backward compatibility with tools)
# =============================================================================

class IntentAction(str, Enum):
    """What the user wants to do."""
    CREATE = "create"        # New presentation
    REFINE = "refine"        # Modify existing
    REGENERATE = "regenerate"  # Start over


class ToneStyle(str, Enum):
    """Presentation tone."""
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    ACADEMIC = "academic"
    CREATIVE = "creative"
    TECHNICAL = "technical"
    MARKETING = "marketing"
    MINIMAL = "minimal"
    NEUTRAL = "neutral"


class ParsedIntent(BaseModel):
    """Parsed intent from user instruction."""
    action: IntentAction = IntentAction.CREATE
    tone_style: Optional[ToneStyle] = None
    slide_count: Optional[int] = None
    density: Optional[str] = None  # sparse, normal, dense
    theme_id: Optional[str] = None
    color_keywords: List[str] = Field(default_factory=list)


def parse_intent(user_instruction: str) -> ParsedIntent:
    """Parse intent from user instruction using pattern matching.
    
    This is kept for backward compatibility with DirectTools that need
    simple pattern extraction without LLM.
    """
    instruction_lower = user_instruction.lower()
    
    # Action detection
    action = IntentAction.CREATE
    if any(word in instruction_lower for word in ["refine", "improve", "update", "modify", "change"]):
        action = IntentAction.REFINE
    elif any(word in instruction_lower for word in ["regenerate", "redo", "start over", "recreate"]):
        action = IntentAction.REGENERATE
    
    # Tone detection
    tone_style = None
    tone_patterns = {
        ToneStyle.PROFESSIONAL: ["professional", "business", "corporate", "formal"],
        ToneStyle.CASUAL: ["casual", "informal", "friendly", "relaxed"],
        ToneStyle.ACADEMIC: ["academic", "scholarly", "research", "educational"],
        ToneStyle.CREATIVE: ["creative", "artistic", "innovative", "bold"],
        ToneStyle.TECHNICAL: ["technical", "engineering", "developer", "code"],
        ToneStyle.MARKETING: ["marketing", "sales", "pitch", "promotional"],
        ToneStyle.MINIMAL: ["minimal", "minimalist", "simple", "clean"],
        ToneStyle.NEUTRAL: ["neutral", "balanced", "standard"],
    }
    for tone, keywords in tone_patterns.items():
        if any(kw in instruction_lower for kw in keywords):
            tone_style = tone
            break
    
    # Slide count detection
    slide_count = None
    slide_match = re.search(r'(\d+)\s*(?:slides?|pages?)', instruction_lower)
    if slide_match:
        slide_count = int(slide_match.group(1))
    
    # Density detection
    density = "normal"
    if any(word in instruction_lower for word in ["sparse", "minimal content", "one idea per slide"]):
        density = "sparse"
    elif any(word in instruction_lower for word in ["dense", "packed", "detailed", "comprehensive"]):
        density = "dense"
    
    # Color keywords
    color_keywords = []
    colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", 
              "dark", "light", "colorful", "monochrome", "neon", "pastel"]
    for color in colors:
        if color in instruction_lower:
            color_keywords.append(color)
    
    return ParsedIntent(
        action=action,
        tone_style=tone_style,
        slide_count=slide_count,
        density=density,
        color_keywords=color_keywords,
    )


# =============================================================================
# STATE SLICER - Extract abstract context for planner
# =============================================================================

def slice_state_for_planner(state: "PipelineState") -> Dict[str, Any]:
    """Extract minimal context from state for LLM planner.
    
    This creates an abstract view of the current state that helps
    LLM understand what exists and what needs to be done.
    """
    context = {}
    
    # Source info
    if state.source:
        context["source"] = {
            "path": state.source.path,
            "content_type": state.source.content_type,
            "has_content": True,  # If source exists, it has content
        }
    else:
        context["source"] = None
    
    # Atoms: slice all atoms but only key fields (id, type, abstract)
    if state.atoms:
        # Handle AtomCollection structure: {id, model, contexts: [...]}
        atom_list = state.atoms.get("contexts", []) if isinstance(state.atoms, dict) else state.atoms
        if isinstance(atom_list, list):
            # Slice fields, not items - show all atoms but only id, type, abstract
            atoms_slice = []
            for atom in atom_list:
                if isinstance(atom, dict):
                    atoms_slice.append({
                        "id": atom.get("id", ""),
                        "type": atom.get("type", "unknown"),
                        "abstract": atom.get("abstract", ""),
                    })
            context["atoms"] = {
                "count": len(atom_list),
                "items": atoms_slice,  # All atoms, sliced fields
                "has_atoms": True,
            }
        else:
            context["atoms"] = {"count": 0, "has_atoms": True, "note": "atoms exist but unexpected format"}
    else:
        context["atoms"] = {"count": 0, "has_atoms": False, "items": []}
    
    # Slides: slice all slides but only key fields (slide_number, layout, title)
    if state.slides:
        slides_slice = []
        themes_used = set()
        layouts_used = set()
        for i, slide in enumerate(state.slides):
            if "theme" in slide:
                theme_val = slide["theme"]
                # Handle both dict (full theme) and string (theme ID)
                if isinstance(theme_val, dict):
                    themes_used.add(theme_val.get("id", "unknown"))
                elif isinstance(theme_val, str):
                    themes_used.add(theme_val)
            layout = slide.get("layout", "unknown")
            layouts_used.add(layout)
            # Extract title from content if available
            title = ""
            if "content" in slide and isinstance(slide["content"], dict):
                title = slide["content"].get("title", "")
            elif "title" in slide:
                title = slide["title"]
            slides_slice.append({
                "slide_number": i + 1,
                "layout": layout,
                "title": title[:50] if title else "",  # Truncate long titles
                "state": slide.get("state", "active"),  # draft or active
            })
        context["slides"] = {
            "count": len(state.slides),
            "themes_used": list(themes_used),
            "layouts_used": list(layouts_used),
            "items": slides_slice,  # All slides, sliced fields
            "has_slides": True,
        }
    else:
        context["slides"] = {"count": 0, "has_slides": False, "items": []}
    
    # Theme info
    context["active_theme"] = state.active_theme
    context["available_themes"] = list(state.themes.keys()) if state.themes else []
    
    # Constitution
    if state.constitution:
        context["constitution"] = {
            "tone": state.constitution.tone,
            "target_slides": state.constitution.target_slides,
            "style_rules": state.constitution.style_rules[:5] if state.constitution.style_rules else [],
        }
    else:
        context["constitution"] = None
    
    return context


# =============================================================================
# PLANNER PROMPT BUILDER
# =============================================================================

PLANNER_SYSTEM_PROMPT = """You are a presentation pipeline planner. Your job is to analyze the user's instruction and current state, then decide which tools to run and in what order.

You have access to these tools:

{tool_descriptions}

## Rules:
1. Only include tools that are needed for the user's request
2. Respect tool dependencies - read each tool's "requires" field
3. When generating slides from source, ALWAYS include both atoms AND story**
   - Atoms: Extract content for future refinement
   - Story: Generate slides directly from source using SCQA framework
   - Both should depend only on constitution (they can run in parallel)
4. If atoms already exist and user just wants to change theme/style, skip atoms extraction
5. If slides already exist and user wants refinement, only run content + codegen + export
6. Whenever the content tool is included in the pipeline (especially in mode="generate"), ALWAYS include codegen immediately after it.
7. DO NOT include theming/color requirements to content tool instructions.
8. Always include export at the end if content changes
9. Read each tool's description and examples carefully

## Output Format:
Return a JSON array of todo items. Each item has:
- id: unique string identifier
- type: one of "constitution", "atoms", "theme", "story", "content", "codegen", "export"
- params: tool-specific parameters (object) - read tool's args_description!
- depends_on: array of todo ids this depends on (optional)

## Tool Pipeline:
- story: Plans narrative arc. Can generate directly from source (SCQA framework) OR use atoms (for refinement). Does NOT depend on atoms for initial generation.
- content: Generates layouts and widgets for draft slides (depends on story). May include <InventComponent> placeholders for custom visualizations.
- codegen: Generates React code for <InventComponent> placeholders in content MDX. Only needed if content step produces InventComponents.
- export: Exports slides to final format. MUST depend on codegen (not just content) because it needs generated components to replace InventComponent tags.
- When creating slides from scratch: constitution → [atoms + story in parallel] → content → codegen → export
  (atoms and story can run simultaneously - story uses source directly, atoms extracted for future refinement)
- When refining existing slides: story (to update draft) → content → codegen → export

CRITICAL: export MUST have depends_on=["codegen"] (not depends_on=["content"]). Export needs codegen to finish first so it can replace InventComponent tags with generated components.

Refer to each tool's examples for proper JSON format.

Only return the JSON array, no other text."""


def build_planner_prompt(
    state: "PipelineState",
    user_instruction: str,
) -> tuple[str, str]:
    """Build system and user prompts for the planner LLM.
    
    Returns:
        (system_prompt, user_prompt)
    """
    # Get tool descriptions
    tool_descriptions = get_all_descriptions()
    
    # Build system prompt
    system_prompt = PLANNER_SYSTEM_PROMPT.format(tool_descriptions=tool_descriptions)
    
    # Get state context
    state_context = slice_state_for_planner(state)
    
    # Build user prompt
    user_prompt = f"""## Current State:
```json
{json.dumps(state_context, indent=2)}
```

## User Instruction:
{user_instruction}

Based on the current state and user instruction, generate the todo list (JSON array) for the pipeline to execute."""
    
    return system_prompt, user_prompt


# =============================================================================
# RESPONSE PARSER
# =============================================================================

def parse_planner_response(response: str, state: "PipelineState") -> TodoQueue:
    """Parse LLM response into TodoQueue.
    
    Args:
        response: LLM response (should be JSON array)
        state: Current state (for filling in missing params)
    
    Returns:
        TodoQueue with parsed todos
    """
    queue = TodoQueue()
    
    # Extract JSON from response (handle markdown code blocks)
    json_str = response.strip()
    if json_str.startswith("```"):
        # Remove markdown code block
        lines = json_str.split("\n")
        json_lines = []
        in_block = False
        for line in lines:
            if line.startswith("```"):
                in_block = not in_block
                continue
            if in_block:
                json_lines.append(line)
        json_str = "\n".join(json_lines)
    
    try:
        todos_data = json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse planner response: {e}")
        logger.error(f"Response: {response}")
        # Return minimal queue on parse failure
        return _create_fallback_queue(state)
    
    # Handle case where LLM returns {"todos": [...]} instead of [...]
    if isinstance(todos_data, dict):
        if "todos" in todos_data:
            todos_data = todos_data["todos"]
        elif len(todos_data) == 1:
            # Single key dict, extract its value
            todos_data = list(todos_data.values())[0]
        else:
            logger.error(f"Expected list or {{'todos': [...]}}, got dict with keys: {list(todos_data.keys())}")
            return _create_fallback_queue(state)
    
    if not isinstance(todos_data, list):
        logger.error(f"Expected list, got {type(todos_data)}")
        return _create_fallback_queue(state)
    
    # Convert to TodoItems
    for todo_data in todos_data:
        try:
            todo_type = TodoType(todo_data.get("type", "").lower())
            params = todo_data.get("params", {})
            depends_on = todo_data.get("depends_on") or []  # Use empty list if None or empty
            
            # Create typed params based on todo type
            typed_params = _create_typed_params(todo_type, params, state)
            
            todo = TodoItem(
                id=todo_data.get("id", todo_type.value),
                type=todo_type,
                params=typed_params,
                depends_on=depends_on,  # Always a list now
                status=TodoStatus.PENDING,
            )
            queue.add(todo)
        except Exception as e:
            logger.warning(f"Failed to parse todo: {todo_data}, error: {e}")
            continue
    
    return queue


def _create_typed_params(
    todo_type: TodoType, 
    params: Dict[str, Any], 
    state: "PipelineState"
) -> Any:
    """Create typed parameters for a todo based on its type."""
    
    if todo_type == TodoType.CONSTITUTION:
        return ConstitutionPatch(
            tone=params.get("tone"),
            target_slides=params.get("target_slides"),
            style_rules=params.get("style_rules", []),
            content_exclusions=params.get("content_exclusions", []),
            content_requirements=params.get("content_requirements", []),
            audience=params.get("audience"),
            purpose=params.get("purpose"),
            layout_preferences=params.get("layout_preferences", []),
        )
    
    elif todo_type == TodoType.ATOMS:
        # Use source from state if not specified
        source_path = params.get("source_path")
        if not source_path and state.source:
            source_path = state.source.path
        return AtomsParams(
            source_path=source_path or "",
            content_type=params.get("content_type", state.source.content_type if state.source else "text"),
        )
    
    elif todo_type == TodoType.THEME:
        theme_id = params.get("base_theme_id") or params.get("theme_id")
        return ThemeParams(
            base_theme_id=theme_id or state.active_theme,
            color_keywords=params.get("color_keywords"),
            generate_new=params.get("generate_new", False),
        )
    
    elif todo_type == TodoType.STORY:
        # Build atom filter if filter params provided
        atom_filter = None
        filter_params = params.get("atom_filter")
        if filter_params:
            from src.generation.todo.models import AtomFilter
            atom_filter = AtomFilter(
                include_types=filter_params.get("include_types", []),
                exclude_types=filter_params.get("exclude_types", []),
                min_rank=filter_params.get("min_rank"),
                max_rank=filter_params.get("max_rank"),
                keywords=filter_params.get("keywords", []),
                exclude_keywords=filter_params.get("exclude_keywords", []),
            )
        return StoryParams(
            mode=params.get("mode", "generate"),
            instruction=params.get("instruction", params.get("user_instruction", "")),
            slide_count=params.get("slide_count"),
            atom_filter=atom_filter,
        )
    
    elif todo_type == TodoType.CONTENT:
        # Content now works on draft slides from story
        return ContentParams(
            mode=params.get("mode", "generate"),
            instruction=params.get("instruction", params.get("user_instruction", "")),
            slide_ids=params.get("slide_ids", []),
        )
    
    elif todo_type == TodoType.CODEGEN:
        return CodegenParams(
            component_types=params.get("component_types", []),
            instruction=params.get("instruction", params.get("user_instruction", "")),
        )
    
    elif todo_type == TodoType.EXPORT:
        return ExportParams(
            output_dir=params.get("output_dir", "output"),
            format=params.get("format", "slidev"),
        )
    
    # Fallback: return raw params
    return params


def _create_fallback_queue(state: "PipelineState") -> TodoQueue:
    """Create a fallback queue when parsing fails."""
    queue = TodoQueue()
    
    # Always have constitution
    queue.add(TodoItem(
        id="constitution",
        type=TodoType.CONSTITUTION,
        params=ConstitutionPatch(),
        status=TodoStatus.PENDING,
    ))
    
    # Add atoms if source exists and no atoms yet
    if state.source and not state.atoms:
        queue.add(TodoItem(
            id="atoms",
            type=TodoType.ATOMS,
            params=AtomsParams(
                source_path=state.source.path,
                content_type=state.source.content_type,
            ),
            depends_on=["constitution"],
            status=TodoStatus.PENDING,
        ))
    
    # Add story (plan narrative arc)
    # Story can generate from source directly (SCQA mode) OR use atoms (refine mode)
    # So it only depends on constitution, not atoms
    queue.add(TodoItem(
        id="story",
        type=TodoType.STORY,
        params=StoryParams(mode="generate"),
        depends_on=["constitution"],
        status=TodoStatus.PENDING,
    ))
    
    # Add content (generate layouts from draft slides)
    queue.add(TodoItem(
        id="content",
        type=TodoType.CONTENT,
        params=ContentParams(),
        depends_on=["story"],
        status=TodoStatus.PENDING,
    ))
    
    # Add codegen (generate React code for invented components - optional, runs if InventComponent exists)
    queue.add(TodoItem(
        id="codegen",
        type=TodoType.CODEGEN,
        params=CodegenParams(),
        depends_on=["content"],
        status=TodoStatus.PENDING,
    ))
    
    # Add export
    queue.add(TodoItem(
        id="export",
        type=TodoType.EXPORT,
        params=ExportParams(),
        depends_on=["codegen"],
        status=TodoStatus.PENDING,
    ))
    
    return queue


# =============================================================================
# MAIN PLANNER FUNCTION
# =============================================================================

def plan(state: "PipelineState", user_instruction: str) -> TodoQueue:
    """Plan todos from state + user instruction using LLM.
    
    This is the main entry point for the planner.
    
    Args:
        state: Current pipeline state
        user_instruction: User's natural language instruction
    
    Returns:
        TodoQueue: Queue of todos to execute
    """
    # Build prompts
    system_prompt, user_prompt = build_planner_prompt(state, user_instruction)
    
    # Get deployment from env
    deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')
    
    logger.info(f"Planning todos for instruction: {user_instruction[:100]}...")
    
    try:
        # Call LLM
        response = call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            deployment=deployment,
            temperature=0.3,  # Low temperature for consistent planning
            max_tokens=2000,
            response_format="json",  # Request JSON output
        )
        
        logger.debug(f"Planner LLM response: {response}")
        
        # Parse response into TodoQueue
        queue = parse_planner_response(response, state)
        
        logger.info(f"Planned {len(queue.todos)} todos: {[t.type.value for t in queue.todos]}")
        
        return queue
        
    except Exception as e:
        logger.error(f"Planner LLM call failed: {e}")
        # Return fallback queue
        return _create_fallback_queue(state)


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def plan_export_only(state: "PipelineState") -> TodoQueue:
    """Create a queue with just export todo (for theme/vibe changes)."""
    queue = TodoQueue()
    queue.add(TodoItem(
        id="export",
        type=TodoType.EXPORT,
        params=ExportParams(format="slidev"),
        status=TodoStatus.PENDING,
    ))
    return queue


def plan_with_theme(state: "PipelineState", theme_id: str) -> TodoQueue:
    """Create a queue to apply a theme and export."""
    queue = TodoQueue()
    
    # Theme update
    queue.add(TodoItem(
        id="theme",
        type=TodoType.THEME,
        params=ThemeParams(base_theme_id=theme_id),
        status=TodoStatus.PENDING,
    ))
    
    # Export
    queue.add(TodoItem(
        id="export",
        type=TodoType.EXPORT,
        params=ExportParams(format="slidev"),
        depends_on=["theme"],
        status=TodoStatus.PENDING,
    ))
    
    return queue
