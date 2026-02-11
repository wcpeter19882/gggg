"""Core orchestration layer for cliv2.

This module contains interface-agnostic logic for slide generation:
- models.py: Data models (GenerationRequest, GenerationResult, StageResult)
- errors.py: Error hierarchy (Cliv2Error, ConfigError, GenerationError)
- agent.py: OpenHands Agent factory
- pipeline.py: Pipeline stage definitions and execution
- orchestrator.py: Main orchestration logic
"""

from cliv2.core.errors import (
    Cliv2Error,
    ConfigError,
    GenerationError,
    StageError,
    LLMError,
    ToolError,
    SkillError,
)
from cliv2.core.models import GenerationRequest, GenerationResult, StageResult
from cliv2.core.orchestrator_session import OrchestratorSession, run_orchestrator_session

__all__ = [
    # Errors
    "Cliv2Error",
    "ConfigError",
    "GenerationError",
    "StageError",
    "LLMError",
    "ToolError",
    "SkillError",
    # Models
    "GenerationRequest",
    "GenerationResult",
    "StageResult",
    # Orchestration
    "OrchestratorSession",
    "run_orchestrator_session",
]
