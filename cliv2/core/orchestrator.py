"""Core orchestrator for slide generation pipeline.

This is the main entry point for all interfaces (CLI, Gradio, MCP).
Interfaces convert their inputs to GenerationRequest and call generate().
"""
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

from cliv2.core.agent import create_agent, _build_context_suffix, _load_orchestrator_skills, load_stage_skills
from cliv2.core.errors import GenerationError, ConfigError
from cliv2.core.models import GenerationRequest, GenerationResult, StageResult
from cliv2.core.pipeline import STAGES, execute_stage, get_stage_index
from cliv2.config.llm import create_llm
from cliv2.tools.mcp_config import get_mcp_config


async def generate(request: GenerationRequest) -> GenerationResult:
    """Execute the slide generation pipeline.
    
    This is the main entry point for all interfaces.
    
    Args:
        request: Generation request with source and options
        
    Returns:
        GenerationResult with all stage results
        
    Raises:
        GenerationError: If pipeline execution fails
        ConfigError: If configuration is invalid
    """
    # Validate source file exists
    if not request.source_path.exists():
        raise GenerationError(
            message=f"Source file not found: {request.source_path}",
            hint="Check that the source file path is correct"
        )
    
    # Initialize result
    result = GenerationResult(
        project_dir=Path(""),  # Set after create stage
        project_id="",
        stages=[],
        started_at=datetime.now(),
    )
    
    # Initialize LLM and config
    try:
        llm = create_llm()
    except ConfigError:
        # LLM not configured, use mock mode
        llm = None
    
    mcp_config = get_mcp_config()
    context_suffix = _build_context_suffix(request)
    skills_content = _load_orchestrator_skills()
    
    # Notify start
    _notify_progress(request, StageResult(
        stage="pipeline",
        status="running",
        message="Starting generation pipeline",
    ))
    
    # Execute pipeline stages
    for stage_name in STAGES:
        # Check stop_after
        if request.stop_after:
            stop_index = get_stage_index(request.stop_after)
            current_index = get_stage_index(stage_name)
            if current_index > stop_index:
                break
        
        # Check skip conditions
        if stage_name == "research" and request.skip_research:
            stage_result = StageResult(
                stage=stage_name,
                status="skipped",
                message="Skipped by user request",
            )
            result.stages.append(stage_result)
            _notify_progress(request, stage_result)
            continue
        
        if stage_name == "theme" and request.theme:
            stage_result = StageResult(
                stage=stage_name,
                status="skipped",
                message=f"Using preset theme: {request.theme}",
            )
            result.stages.append(stage_result)
            _notify_progress(request, stage_result)
            continue
        
        # Notify stage starting
        _notify_progress(request, StageResult(
            stage=stage_name,
            status="running",
            message=f"Executing stage: {stage_name}",
        ))
        
        # Load stage-specific skills
        stage_skills = load_stage_skills(stage_name, request.renderer)
        
        try:
            stage_result = await execute_stage(
                stage=stage_name,
                request=request,
                current_result=result,
                llm=llm,
                mcp_config=mcp_config,
                skills_content=stage_skills,
                context_suffix=context_suffix,
            )
            result.stages.append(stage_result)
            
            # Update result from create stage
            if stage_name == "create" and stage_result.status == "completed":
                project_dir = stage_result.data.get("project_dir", "")
                result.project_dir = Path(project_dir) if project_dir else Path("")
                result.project_id = stage_result.data.get("project_id", "")
            
            _notify_progress(request, stage_result)
            
        except Exception as e:
            stage_result = StageResult(
                stage=stage_name,
                status="failed",
                message=str(e),
            )
            result.stages.append(stage_result)
            _notify_progress(request, stage_result)
            
            result.completed_at = datetime.now()
            raise GenerationError(
                message=f"Stage '{stage_name}' failed",
                details=str(e),
                hint=f"Check the {stage_name} stage configuration"
            ) from e
    
    result.completed_at = datetime.now()
    
    # Notify completion
    _notify_progress(request, StageResult(
        stage="pipeline",
        status="completed",
        message="Generation pipeline completed",
        duration_ms=result.total_duration_ms,
    ))
    
    return result


def generate_sync(request: GenerationRequest) -> GenerationResult:
    """Synchronous wrapper for generate().
    
    Args:
        request: Generation request with source and options
        
    Returns:
        GenerationResult with all stage results
    """
    return asyncio.run(generate(request))


def _notify_progress(request: GenerationRequest, result: StageResult) -> None:
    """Notify progress callback if provided.
    
    Args:
        request: Generation request (contains callback)
        result: Stage result to notify
    """
    if request.progress_callback:
        try:
            request.progress_callback(result)
        except Exception:
            pass  # Don't let callback errors affect pipeline


async def validate_request(request: GenerationRequest) -> list[str]:
    """Validate a generation request before execution.
    
    Args:
        request: Generation request to validate
        
    Returns:
        List of validation error messages (empty if valid)
    """
    errors = []
    
    if not request.source_path.exists():
        errors.append(f"Source file not found: {request.source_path}")
    
    if request.stop_after and request.stop_after not in STAGES:
        errors.append(f"Invalid stop_after stage: {request.stop_after}")
    
    if request.renderer not in ("antd", "original"):
        errors.append(f"Invalid renderer: {request.renderer}")
    
    return errors
