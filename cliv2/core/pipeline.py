"""Pipeline stage definitions and execution.

Defines the ordered pipeline stages and provides execution logic.
Uses skill handlers for prompt building and MCP tools for I/O.
"""
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, TYPE_CHECKING

from cliv2.core.models import GenerationRequest, GenerationResult, StageResult
from cliv2.core.errors import StageError
from cliv2.core.subagent import Subagent, SubagentResult

if TYPE_CHECKING:
    from cliv2.skills.base import SkillHandler, SkillContext
    from cliv2.core.task import Task


# Ordered list of pipeline stages
STAGES = ["create", "research", "theme", "storyline", "layout", "export"]

# Stage to skill mapping (default renderer: antd)
STAGE_SKILLS = {
    "research": "research-agent",
    "theme": "theme-generator",
    "storyline": "storyline-planner",
    "layout": "ant-paged-layout",  # Overridden by renderer
    "export": "ant-slides-export",  # Overridden by renderer
}

# Renderer-specific skill overrides
RENDERER_SKILLS = {
    "antd": {
        "layout": "ant-paged-layout",
        "export": "ant-slides-export",
    },
    "original": {
        "layout": "paged-layout-content",
        "export": "slides-export",
    },
}


def get_skill_for_stage(stage: str, renderer: str = "antd") -> Optional[str]:
    """Get the skill name for a pipeline stage.
    
    Args:
        stage: Pipeline stage name
        renderer: Renderer type (antd or original)
        
    Returns:
        Skill name or None if stage doesn't use a skill
    """
    # Check renderer-specific override first
    if stage in RENDERER_SKILLS.get(renderer, {}):
        return RENDERER_SKILLS[renderer][stage]
    
    return STAGE_SKILLS.get(stage)


async def execute_stage(
    stage: str,
    request: GenerationRequest,
    current_result: GenerationResult,
    llm: Any,
    mcp_config: dict,
    skills_content: str,
    context_suffix: str,
) -> StageResult:
    """Execute a single pipeline stage.
    
    Calls actual MCP tools to perform real work.
    
    Args:
        stage: Stage name to execute
        request: Generation request
        current_result: Current result with previous stage data
        llm: LLM instance
        mcp_config: MCP server configuration
        skills_content: Loaded skills content (orchestrator skill)
        context_suffix: Context suffix for agent
        
    Returns:
        StageResult with execution status and data
    """
    start_time = datetime.now()
    
    try:
        # Execute the stage using actual MCP tools
        result_data = await _execute_stage_with_tools(
            stage=stage,
            request=request,
            current_result=current_result,
            llm=llm,
            skills_content=skills_content,
            context_suffix=context_suffix,
        )
        
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return StageResult(
            stage=stage,
            status="completed",
            message=f"Stage '{stage}' completed",
            duration_ms=duration_ms,
            data=result_data,
        )
        
    except Exception as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        raise StageError(
            message=f"Stage '{stage}' failed: {e}",
            stage=stage,
            cause=e,
            hint=f"Check the {stage} stage configuration and inputs",
        ) from e


async def _execute_stage_with_tools(
    stage: str,
    request: GenerationRequest,
    current_result: GenerationResult,
    llm: Any,
    skills_content: str,
    context_suffix: str,
) -> dict:
    """Execute a stage using MCP tools and subagents.
    
    Follows Claude's pattern:
    - "create" and "export" stages use MCP tools directly
    - Other stages invoke subagents with dynamic prompts
    
    Args:
        stage: Stage name
        request: Generation request
        current_result: Current result
        llm: LLM instance
        skills_content: Orchestrator skills content
        context_suffix: Context suffix
        
    Returns:
        Stage-specific result data
    """
    from cliv2.tools.mcp_client import (
        call_create_project,
        call_apply_patch,
        call_export_mdx,
        call_read_section,
    )
    
    project_dir = str(current_result.project_dir) if current_result.project_dir else None
    
    # === MCP-only stages (no subagent) ===
    
    if stage == "create":
        # Create project using MCP tool directly
        result = call_create_project(
            source_path=str(request.source_path.resolve()),
            instruction=request.instruction or "",
            force=True,
        )
        
        if "error" in result:
            raise StageError(
                message=result["error"],
                stage=stage,
                hint=result.get("hint", "Check source file path"),
            )
        
        return {
            "project_dir": result["project_dir"],
            "project_id": result["project_id"],
        }
    
    elif stage == "export":
        # Export using MCP tool directly
        if not project_dir:
            raise StageError(message="No project directory", stage=stage)
        
        result = call_export_mdx(
            project_dir=project_dir,
            renderer=request.renderer,
            start_server=True,
        )
        
        if "error" in result:
            raise StageError(message=result["error"], stage=stage)
        
        return {
            "output_path": result["output_path"],
            "preview_url": result["preview_url"],
            "port": result["port"],
        }
    
    # === Subagent stages ===
    import logging
    from cliv2.core.subagent import Subagent
    from cliv2.skills import get_handler_for_stage, SkillContext
    
    logger = logging.getLogger("cliv2.pipeline")
    
    if not project_dir:
        raise StageError(message="No project directory", stage=stage)
    
    # Get skill handler for this stage
    handler = get_handler_for_stage(stage, request.renderer)
    if not handler:
        raise StageError(message=f"No skill handler for stage: {stage}", stage=stage)
    
    # Get skill name for SKILL.md loading
    skill_name = get_skill_for_stage(stage, request.renderer)
    if not skill_name:
        raise StageError(message=f"No skill defined for stage: {stage}", stage=stage)
    
    # Read project context based on handler's input spec
    project_context = call_read_section(project_dir, "all")
    
    # Build SkillContext from project_context
    skill_context = SkillContext(
        project_dir=project_dir,
        user_instruction=request.instruction or "",
        source=project_context.get("source", ""),
        constitution=project_context.get("constitution"),
        theme=project_context.get("theme"),
        slides=project_context.get("slides"),
    )
    
    # Log context for debugging
    logger.debug(f"[{stage}] Handler: {handler.name}")
    logger.debug(f"[{stage}] Input spec: source={handler.input_spec.needs_source}, "
                 f"slides={handler.input_spec.needs_slides}")
    logger.debug(f"[{stage}] Output spec: target={handler.output_spec.target}, "
                 f"format={handler.output_spec.format}")
    
    # === Execute handler's workflow ===
    # Each handler owns its complete execution (simple or multi-phase)
    # - Simple handlers: single LLM call (default in base class)
    # - Research handler: three-phase workflow with tool calls
    result_data = await handler.execute(skill_context, llm, logger)
    
    # Handle output saving based on handler's output spec
    if handler.output_spec.target:
        output = result_data.get("output")
        if output is not None:
            patch_result = call_apply_patch(
                project_dir=project_dir,
                target=handler.output_spec.target,
                data=output,
            )
            if patch_result.get("error"):
                raise StageError(
                    message=f"Failed to save {handler.output_spec.target}: {patch_result['error']}",
                    stage=stage,
                )
            result_data["patch_applied"] = True
    
    # Add port info for export stage
    if stage == "export":
        result_data["port"] = 3001 if request.renderer == "antd" else 3000
    
    return result_data


def get_stage_index(stage: str) -> int:
    """Get numeric index for stage ordering."""
    return STAGES.index(stage) if stage in STAGES else -1


def is_valid_stage(stage: str) -> bool:
    """Check if a stage name is valid."""
    return stage in STAGES


# =============================================================================
# Task-based execution (new)
# =============================================================================

async def execute_task(
    task: "Task",
    request: "GenerationRequest",
    current_result: "GenerationResult",
    llm: Any,
    mcp_config: dict,
) -> dict:
    """Execute a single task from the task DAG.
    
    Supports targeted execution (specific slide ranges) for storyline and layout.
    
    Args:
        task: Task to execute
        request: Generation request
        current_result: Current result with project info
        llm: LLM instance
        mcp_config: MCP server configuration
        
    Returns:
        Task result dict with status, completed, pending, summary
    """
    from cliv2.core.task import Task, SubagentResponse
    from cliv2.skills import get_handler_for_stage, SkillContext
    from cliv2.skills.base import SkillContextWithTarget
    from cliv2.tools.mcp_client import (
        call_create_project,
        call_apply_patch,
        call_export_mdx,
        call_read_section,
    )
    
    logger = logging.getLogger("cliv2.pipeline")
    
    stage = task.stage
    target = task.target
    params = task.params
    
    project_dir = str(current_result.project_dir) if current_result.project_dir else None
    
    # === MCP-only stages (no subagent) ===
    
    if stage == "create":
        result = call_create_project(
            source_path=str(request.source_path.resolve()),
            instruction=request.instruction or "",
            force=True,
        )
        
        if "error" in result:
            raise StageError(
                message=result["error"],
                stage=stage,
                hint=result.get("hint", "Check source file path"),
            )
        
        return {
            "status": "complete",
            "completed": [],
            "pending": [],
            "summary": f"Created project: {result['project_id']}",
            "project_dir": result["project_dir"],
            "project_id": result["project_id"],
        }
    
    elif stage == "export":
        if not project_dir:
            raise StageError(message="No project directory", stage=stage)
        
        result = call_export_mdx(
            project_dir=project_dir,
            renderer=request.renderer,
            start_server=True,
        )
        
        if "error" in result:
            raise StageError(message=result["error"], stage=stage)
        
        return {
            "status": "complete",
            "completed": [],
            "pending": [],
            "summary": f"Exported {result.get('slide_count', '?')} slides",
            "output_path": result["output_path"],
            "preview_url": result["preview_url"],
            "port": result["port"],
        }
    
    # === Subagent stages with target support ===
    
    if not project_dir:
        raise StageError(message="No project directory", stage=stage)
    
    # Get skill handler for this stage
    handler = get_handler_for_stage(stage, request.renderer)
    if not handler:
        raise StageError(message=f"No skill handler for stage: {stage}", stage=stage)
    
    # Read project context
    project_context = call_read_section(project_dir, "all")
    
    # Build extended context with target info
    existing_slides = project_context.get("slides", [])
    
    # Determine target slide indices
    if target == "all":
        target_indices = list(range(1, len(existing_slides) + 1)) if existing_slides else []
    elif isinstance(target, list):
        target_indices = target
    else:
        target_indices = []
    
    # Build SkillContext with target information
    skill_context = SkillContextWithTarget(
        project_dir=project_dir,
        user_instruction=request.instruction or "",
        source=project_context.get("source", ""),
        constitution=project_context.get("constitution"),
        theme=project_context.get("theme"),
        slides=project_context.get("slides"),
        # Extended fields for targeted execution
        target_indices=target_indices,
        task_params=params,
    )
    
    # Log context
    logger.info(f"[{stage}] Executing task {task.id} with target={target}")
    logger.debug(f"[{stage}] Target indices: {target_indices}")
    logger.debug(f"[{stage}] Task params: {params}")
    
    # === Execute handler's workflow ===
    result_data = await handler.execute(skill_context, llm, logger)
    
    # Handle output saving based on handler's output spec
    if handler.output_spec.target:
        output = result_data.get("output")
        if output is not None:
            patch_result = call_apply_patch(
                project_dir=project_dir,
                target=handler.output_spec.target,
                data=output,
            )
            if patch_result.get("error"):
                raise StageError(
                    message=f"Failed to save {handler.output_spec.target}: {patch_result['error']}",
                    stage=stage,
                )
            result_data["patch_applied"] = True
    
    # Build response with completion info
    completed = result_data.get("completed", target_indices)
    pending = result_data.get("pending", [])
    
    return {
        "status": "partial" if pending else "complete",
        "completed": completed,
        "pending": pending,
        "summary": result_data.get("summary", f"Completed {stage} for {len(completed)} slides"),
        "output": result_data.get("output"),
    }
