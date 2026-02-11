"""Verbose logging for full LLM input/output capture.

When enabled via set_log_file(), writes untruncated LLM calls to a file.
"""
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

# Module-level state
_log_file: Optional[Path] = None
_file_handler: Optional[logging.FileHandler] = None
_verbose_logger: Optional[logging.Logger] = None


def set_log_file(log_path: Optional[str]) -> None:
    """Set the verbose log file path.
    
    Args:
        log_path: Path to log file, or None to disable verbose logging
    """
    global _log_file, _file_handler, _verbose_logger
    
    # Clean up existing handler
    if _file_handler and _verbose_logger:
        _verbose_logger.removeHandler(_file_handler)
        _file_handler.close()
        _file_handler = None
    
    if log_path is None:
        _log_file = None
        _verbose_logger = None
        return
    
    _log_file = Path(log_path)
    
    # Create parent directories
    _log_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Create logger
    _verbose_logger = logging.getLogger("cliv2.verbose")
    _verbose_logger.setLevel(logging.DEBUG)
    _verbose_logger.propagate = False  # Don't propagate to root logger
    
    # Create file handler with UTF-8 encoding
    _file_handler = logging.FileHandler(_log_file, mode="a", encoding="utf-8")
    _file_handler.setLevel(logging.DEBUG)
    
    # Simple format for readability
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    _file_handler.setFormatter(formatter)
    _verbose_logger.addHandler(_file_handler)
    
    # Write header
    _verbose_logger.info("=" * 80)
    _verbose_logger.info(f"Verbose logging started: {datetime.now().isoformat()}")
    _verbose_logger.info("=" * 80)


def is_verbose_enabled() -> bool:
    """Check if verbose logging is enabled."""
    return _verbose_logger is not None


def log_llm_call(
    skill_name: str,
    system_prompt: str,
    user_prompt: str,
    response: Optional[str] = None,
    streaming: bool = False,
    error: Optional[str] = None,
) -> None:
    """Log a complete LLM call with full input/output.
    
    Args:
        skill_name: Name of the skill making the call
        system_prompt: Full system prompt (untruncated)
        user_prompt: Full user prompt (untruncated)
        response: Full LLM response (untruncated), or None if streaming
        streaming: Whether this is a streaming call
        error: Error message if call failed
    """
    if not _verbose_logger:
        return
    
    mode = "STREAMING" if streaming else "SYNC"
    
    _verbose_logger.info("")
    _verbose_logger.info("=" * 80)
    _verbose_logger.info(f"LLM CALL [{skill_name}] - {mode}")
    _verbose_logger.info("=" * 80)
    
    _verbose_logger.info("")
    _verbose_logger.info("-" * 40 + " SYSTEM PROMPT " + "-" * 40)
    _verbose_logger.info(f"Length: {len(system_prompt)} chars")
    _verbose_logger.info("")
    _verbose_logger.info(system_prompt)
    
    _verbose_logger.info("")
    _verbose_logger.info("-" * 40 + " USER PROMPT " + "-" * 40)
    _verbose_logger.info(f"Length: {len(user_prompt)} chars")
    _verbose_logger.info("")
    _verbose_logger.info(user_prompt)
    
    if response is not None:
        _verbose_logger.info("")
        _verbose_logger.info("-" * 40 + " RESPONSE " + "-" * 40)
        _verbose_logger.info(f"Length: {len(response)} chars")
        _verbose_logger.info("")
        _verbose_logger.info(response)
    
    if error:
        _verbose_logger.info("")
        _verbose_logger.info("-" * 40 + " ERROR " + "-" * 40)
        _verbose_logger.info(error)
    
    _verbose_logger.info("")
    _verbose_logger.info("=" * 80)
    _verbose_logger.info("")


def log_streaming_chunk(skill_name: str, chunk: str) -> None:
    """Log a streaming chunk (only if verbose enabled)."""
    if not _verbose_logger:
        return
    # Don't log individual chunks - too noisy
    # Just use log_llm_call with full response after streaming completes


def log_streaming_complete(skill_name: str, full_response: str) -> None:
    """Log the complete response after streaming finishes."""
    if not _verbose_logger:
        return
    
    _verbose_logger.info("")
    _verbose_logger.info("-" * 40 + f" STREAMING RESPONSE [{skill_name}] " + "-" * 40)
    _verbose_logger.info(f"Length: {len(full_response)} chars")
    _verbose_logger.info("")
    _verbose_logger.info(full_response)
    _verbose_logger.info("")


def log_info(message: str) -> None:
    """Log an info message to verbose log."""
    if _verbose_logger:
        _verbose_logger.info(message)


def log_error(message: str) -> None:
    """Log an error message to verbose log."""
    if _verbose_logger:
        _verbose_logger.error(message)
