"""OpenHands Agent factory for slide generation.

Creates and configures OpenHands Agent with LLM, skills, and MCP tools.
"""
from pathlib import Path
from typing import Optional

from cliv2.config.llm import create_llm
from cliv2.core.errors import ConfigError
from cliv2.core.models import GenerationRequest
from cliv2.skills.loader import load_skills, get_skill_content
from cliv2.tools.mcp_config import get_mcp_config


def create_agent(request: GenerationRequest):
    """Create an OpenHands Agent configured for slide generation.
    
    The agent is configured with:
    - LLM from environment (Azure OpenAI)
    - MCP tools from .claude/tools/
    - Skills from .claude/skills/
    - Context tailored to the generation request
    
    Args:
        request: Generation request with source and options
        
    Returns:
        Configured Agent instance
        
    Raises:
        ConfigError: If agent creation fails
    """
    try:
        from openhands.core.config import AppConfig, AgentConfig
        from openhands.agenthub.codeact_agent import CodeActAgent
        from openhands.controller import AgentController
        from openhands.runtime.client.runtime import EventStreamRuntime
    except ImportError as e:
        raise ConfigError(
            message="OpenHands SDK not installed",
            details=str(e),
            hint="Install with: pip install openhands-ai"
        ) from e
    
    # Create LLM
    llm = create_llm()
    
    # Get MCP config
    mcp_config = get_mcp_config()
    
    # Build agent context
    context_suffix = _build_context_suffix(request)
    
    # Load content-manager skill as main orchestrator
    skills_content = _load_orchestrator_skills()
    
    # Create agent config
    agent_config = AgentConfig(
        codeact_enable_browsing=False,
        codeact_enable_jupyter=False,
    )
    
    # Create app config
    app_config = AppConfig(
        workspace_base=str(Path.cwd()),
        workspace_mount_path=str(Path.cwd()),
    )
    
    # Create runtime
    runtime = EventStreamRuntime(
        config=app_config,
        event_stream=None,  # Will be set by controller
        sid="cliv2-session",
    )
    
    # Create agent
    agent = CodeActAgent(
        llm=llm,
        config=agent_config,
    )
    
    return agent, runtime, app_config, mcp_config, context_suffix, skills_content


def _build_context_suffix(request: GenerationRequest) -> str:
    """Build context suffix for agent system prompt.
    
    Args:
        request: Generation request
        
    Returns:
        Context string to append to system prompt
    """
    parts = [
        f"Source file: {request.source_path.resolve()}",
        f"Renderer: {request.renderer}",
    ]
    
    if request.instruction:
        parts.append(f"User Instructions: {request.instruction}")
    
    if request.theme:
        parts.append(f"Theme: {request.theme}")
    
    if request.skip_research:
        parts.append("Note: Research stage should be skipped.")
    
    if request.stop_after:
        parts.append(f"Note: Stop after '{request.stop_after}' stage.")
    
    return "\n".join(parts)


def _load_orchestrator_skills() -> str:
    """Load the content-manager skill as orchestrator context.
    
    Returns:
        Combined skill content for orchestration
    """
    skills_dir = Path(".claude/skills")
    
    # Load content-manager skill (main orchestrator)
    content = []
    
    try:
        cm_content = get_skill_content("content-manager", skills_dir)
        content.append("# Content Manager Skill\n" + cm_content)
    except Exception:
        pass  # Skill not found, continue without it
    
    return "\n\n---\n\n".join(content)


def load_stage_skills(stage: str, renderer: str = "antd") -> str:
    """Load skills appropriate for a specific pipeline stage.
    
    Args:
        stage: Pipeline stage name (research, theme, storyline, layout, export)
        renderer: Renderer type (antd, original)
        
    Returns:
        Combined skill content for the stage
    """
    skills_dir = Path(".claude/skills")
    content = []
    
    # Stage-to-skill mapping - each stage uses its dedicated skill
    stage_skills = {
        "create": [],  # Uses MCP tools directly, no LLM skill needed
        "research": ["research"],
        "theme": ["theme"],
        "storyline": ["storyline"],
        "layout": ["ant-paged-layout"] if renderer == "antd" else ["paged-layout"],
        "export": ["ant-export"] if renderer == "antd" else ["export"],
    }
    
    skill_names = stage_skills.get(stage, [])
    
    for skill_name in skill_names:
        try:
            skill_content = get_skill_content(skill_name, skills_dir)
            content.append(f"# {skill_name} Skill\n\n{skill_content}")
        except Exception as e:
            # Log but continue
            print(f"Warning: Could not load skill {skill_name}: {e}")
    
    # For layout stage with antd renderer, also load ant-export for component reference
    if stage == "layout" and renderer == "antd":
        try:
            export_content = get_skill_content("ant-export", skills_dir)
            content.append(f"# ant-export Skill (Component Reference)\n\n{export_content}")
        except Exception:
            pass
    
    return "\n\n---\n\n".join(content) if content else ""


def get_agent_info() -> dict:
    """Get information about agent configuration.
    
    Useful for debugging and testing.
    
    Returns:
        Dictionary with agent configuration info
    """
    mcp_config = get_mcp_config()
    skills = load_skills()
    
    return {
        "mcp_servers": list(mcp_config.get("mcpServers", {}).keys()),
        "skills_loaded": len(skills),
        "workspace": str(Path.cwd()),
    }
