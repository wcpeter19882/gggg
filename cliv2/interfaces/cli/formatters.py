"""Output formatters for CLI interface.

Provides terminal-friendly formatting for stage results and summaries.
"""
import sys
from cliv2.core.models import StageResult, GenerationResult


# Check if terminal supports Unicode
def _supports_unicode() -> bool:
    """Check if stdout supports Unicode characters."""
    try:
        # Try to encode a checkmark to see if it works
        sys.stdout.encoding and "✓".encode(sys.stdout.encoding or "ascii")
        return True
    except (UnicodeEncodeError, LookupError):
        return False


# Use ASCII fallbacks on Windows/non-Unicode terminals
_USE_UNICODE = _supports_unicode()

# Status icons for terminal output (with ASCII fallbacks)
STATUS_ICONS = {
    "pending": "o" if not _USE_UNICODE else "○",
    "running": "~" if not _USE_UNICODE else "⏳",
    "completed": "+" if not _USE_UNICODE else "✓",
    "skipped": "-" if not _USE_UNICODE else "⊘",
    "failed": "x" if not _USE_UNICODE else "✗",
}

# Simple ASCII checkmark/cross for messages
CHECK = "+" if not _USE_UNICODE else "✓"
CROSS = "x" if not _USE_UNICODE else "✗"

# ANSI color codes
COLORS = {
    "reset": "\033[0m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "red": "\033[31m",
    "blue": "\033[34m",
    "gray": "\033[90m",
    "bold": "\033[1m",
}


def format_progress(result: StageResult, use_colors: bool = True) -> str:
    """Format a stage result for progress output.
    
    Args:
        result: Stage result to format
        use_colors: Whether to use ANSI color codes
        
    Returns:
        Formatted progress string
    """
    icon = STATUS_ICONS.get(result.status, "?")
    
    if use_colors:
        color = _get_status_color(result.status)
        reset = COLORS["reset"]
        
        if result.duration_ms > 0:
            duration = f" ({result.duration_ms}ms)"
        else:
            duration = ""
        
        return f"{color}{icon}{reset} {result.stage}: {result.message or result.status}{duration}"
    else:
        duration = f" ({result.duration_ms}ms)" if result.duration_ms > 0 else ""
        return f"{icon} {result.stage}: {result.message or result.status}{duration}"


def format_summary(result: GenerationResult, verbose: bool = False, use_colors: bool = True) -> str:
    """Format final generation result for terminal output.
    
    Args:
        result: Generation result to format
        verbose: Whether to include detailed information
        use_colors: Whether to use ANSI color codes
        
    Returns:
        Formatted summary string
    """
    lines = []
    
    # Stage summary (if not already shown in verbose mode)
    if not verbose:
        lines.append("")
        for stage in result.stages:
            lines.append(format_progress(stage, use_colors))
    
    lines.append("")
    
    # Project info
    if result.project_dir and str(result.project_dir) != ".":
        lines.append(f"Project: {result.project_dir}")
    
    if result.project_id:
        lines.append(f"Preview: {result.preview_url}")
    
    # Duration
    if result.total_duration_ms > 0:
        duration_sec = result.total_duration_ms / 1000
        lines.append(f"Duration: {duration_sec:.1f}s")
    
    # Final status
    lines.append("")
    if result.is_success:
        if use_colors:
            lines.append(f"{COLORS['green']}{COLORS['bold']}{CHECK} Generation complete!{COLORS['reset']}")
        else:
            lines.append(f"{CHECK} Generation complete!")
    else:
        failed = result.failed_stage
        if failed:
            if use_colors:
                lines.append(f"{COLORS['red']}{COLORS['bold']}{CROSS} Failed at stage: {failed.stage}{COLORS['reset']}")
                lines.append(f"  {COLORS['red']}Error: {failed.message}{COLORS['reset']}")
            else:
                lines.append(f"{CROSS} Failed at stage: {failed.stage}")
                lines.append(f"  Error: {failed.message}")
    
    return "\n".join(lines)


def format_error(message: str, hint: str = "", use_colors: bool = True) -> str:
    """Format an error message for terminal output.
    
    Args:
        message: Error message
        hint: Optional hint for resolution
        use_colors: Whether to use ANSI color codes
        
    Returns:
        Formatted error string
    """
    if use_colors:
        lines = [f"{COLORS['red']}{COLORS['bold']}Error:{COLORS['reset']} {message}"]
        if hint:
            lines.append(f"{COLORS['gray']}Hint: {hint}{COLORS['reset']}")
    else:
        lines = [f"Error: {message}"]
        if hint:
            lines.append(f"Hint: {hint}")
    
    return "\n".join(lines)


def format_config_info(config: dict, use_colors: bool = True) -> str:
    """Format configuration information for display.
    
    Args:
        config: Configuration dictionary
        use_colors: Whether to use ANSI color codes
        
    Returns:
        Formatted configuration string
    """
    lines = ["Configuration:"]
    
    for key, value in config.items():
        if use_colors:
            lines.append(f"  {COLORS['blue']}{key}:{COLORS['reset']} {value}")
        else:
            lines.append(f"  {key}: {value}")
    
    return "\n".join(lines)


def _get_status_color(status: str) -> str:
    """Get ANSI color code for a status.
    
    Args:
        status: Stage status
        
    Returns:
        ANSI color code
    """
    colors = {
        "pending": COLORS["gray"],
        "running": COLORS["blue"],
        "completed": COLORS["green"],
        "skipped": COLORS["yellow"],
        "failed": COLORS["red"],
    }
    return colors.get(status, COLORS["reset"])
