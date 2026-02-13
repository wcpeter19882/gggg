"""CLIv2: Headless slide generation with LiteLLM.

This package provides a command-line interface for generating slide presentations
from markdown source files using LiteLLM for LLM orchestration.

Public API:
    generate: Async function to generate slides (linear mode)
    generate_sync: Synchronous wrapper for generate()
    generate_with_tasks: Async function with task DAG (compound instructions)
    generate_with_tasks_sync: Synchronous wrapper for generate_with_tasks()
    GenerationRequest: Request model for slide generation
    GenerationResult: Result model with pipeline state
    StageResult: Result of a single pipeline stage
"""

__version__ = "1.1.0"

# Public API exports
from cliv2.core.orchestrator_session import OrchestratorSession, run_orchestrator_session
from cliv2.core.models import GenerationRequest, GenerationResult, StageResult
from cliv2.core.errors import Cliv2Error, ConfigError, GenerationError

__all__ = [
    "__version__",
    # Orchestration
    "OrchestratorSession",
    "run_orchestrator_session",
    # Models
    "GenerationRequest",
    "GenerationResult",
    "StageResult",
    # Errors
    "Cliv2Error",
    "ConfigError",
    "GenerationError",
]
