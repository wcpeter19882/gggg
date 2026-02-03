"""CLIv2: Headless slide generation with OpenHands SDK.

This package provides a command-line interface for generating slide presentations
from markdown source files using OpenHands SDK for LLM orchestration.

Public API:
    generate: Async function to generate slides from a source file
    generate_sync: Synchronous wrapper for generate()
    GenerationRequest: Request model for slide generation
    GenerationResult: Result model with pipeline state
    StageResult: Result of a single pipeline stage
"""

__version__ = "1.0.0"

# Public API exports
from cliv2.core.orchestrator import generate, generate_sync
from cliv2.core.models import GenerationRequest, GenerationResult, StageResult
from cliv2.core.errors import Cliv2Error, ConfigError, GenerationError

__all__ = [
    "__version__",
    "generate",
    "generate_sync",
    "GenerationRequest",
    "GenerationResult",
    "StageResult",
    "Cliv2Error",
    "ConfigError",
    "GenerationError",
]
