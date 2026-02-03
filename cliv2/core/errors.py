"""Error hierarchy for cliv2.

All errors inherit from Cliv2Error to enable unified error handling.
"""
from typing import Optional


class Cliv2Error(Exception):
    """Base error for all cliv2 errors.
    
    Attributes:
        message: Human-readable error message
        details: Additional details about the error
        hint: Suggested action to resolve the error
    """
    
    def __init__(
        self,
        message: str,
        details: str = "",
        hint: str = "",
    ) -> None:
        self.message = message
        self.details = details
        self.hint = hint
        super().__init__(message)
    
    def __str__(self) -> str:
        parts = [self.message]
        if self.details:
            parts.append(f"Details: {self.details}")
        if self.hint:
            parts.append(f"Hint: {self.hint}")
        return "\n".join(parts)


class ConfigError(Cliv2Error):
    """Configuration or environment error.
    
    Raised when:
    - Required environment variables are missing
    - Configuration file is invalid
    - LLM configuration is incomplete
    """
    pass


class GenerationError(Cliv2Error):
    """Generation pipeline execution error.
    
    Raised when the overall generation pipeline fails.
    """
    pass


class StageError(GenerationError):
    """Individual pipeline stage error.
    
    Raised when a specific pipeline stage fails.
    
    Attributes:
        stage: The stage that failed (create, research, theme, storyline, layout, export)
        cause: The underlying exception that caused the failure
    """
    
    def __init__(
        self,
        message: str,
        stage: str,
        cause: Optional[Exception] = None,
        details: str = "",
        hint: str = "",
    ) -> None:
        super().__init__(message, details, hint)
        self.stage = stage
        self.cause = cause
    
    def __str__(self) -> str:
        base = super().__str__()
        return f"[Stage: {self.stage}] {base}"


class LLMError(Cliv2Error):
    """LLM API error.
    
    Raised when:
    - LLM API request fails
    - Rate limiting is encountered
    - Token limit is exceeded
    """
    pass


class ToolError(Cliv2Error):
    """MCP tool invocation error.
    
    Raised when an MCP tool fails to execute.
    
    Attributes:
        tool_name: Name of the tool that failed
    """
    
    def __init__(
        self,
        message: str,
        tool_name: str,
        details: str = "",
        hint: str = "",
    ) -> None:
        super().__init__(message, details, hint)
        self.tool_name = tool_name
    
    def __str__(self) -> str:
        base = super().__str__()
        return f"[Tool: {self.tool_name}] {base}"


class SkillError(Cliv2Error):
    """Skill loading or execution error.
    
    Raised when:
    - Skill directory is not found
    - Skill file is malformed
    - Skill execution fails
    
    Attributes:
        skill_name: Name of the skill that failed
    """
    
    def __init__(
        self,
        message: str,
        skill_name: str = "",
        details: str = "",
        hint: str = "",
    ) -> None:
        super().__init__(message, details, hint)
        self.skill_name = skill_name
    
    def __str__(self) -> str:
        base = super().__str__()
        if self.skill_name:
            return f"[Skill: {self.skill_name}] {base}"
        return base
