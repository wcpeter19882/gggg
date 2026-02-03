"""YAML configuration file support for cliv2.

Loads configuration from .cliv2.yaml files.
"""
from pathlib import Path
from typing import Any, Optional

import yaml

from cliv2.core.errors import ConfigError


def load_yaml_config(config_path: Optional[Path] = None) -> dict[str, Any]:
    """Load configuration from a YAML file.
    
    Searches for .cliv2.yaml in the following order:
    1. Specified config_path (if provided)
    2. Current working directory
    3. User home directory
    
    Args:
        config_path: Optional explicit path to config file
        
    Returns:
        Configuration dictionary (empty if no config found)
    """
    if config_path:
        if not config_path.exists():
            raise ConfigError(
                message=f"Config file not found: {config_path}",
                hint="Check the path and try again"
            )
        return _load_yaml_file(config_path)
    
    # Search for config file
    search_paths = [
        Path.cwd() / ".cliv2.yaml",
        Path.cwd() / ".cliv2.yml",
        Path.home() / ".cliv2.yaml",
        Path.home() / ".cliv2.yml",
    ]
    
    for path in search_paths:
        if path.exists():
            return _load_yaml_file(path)
    
    # No config file found, return empty dict
    return {}


def _load_yaml_file(path: Path) -> dict[str, Any]:
    """Load and parse a YAML file.
    
    Args:
        path: Path to YAML file
        
    Returns:
        Parsed YAML as dictionary
        
    Raises:
        ConfigError: If file cannot be parsed
    """
    try:
        content = path.read_text(encoding="utf-8")
        config = yaml.safe_load(content)
        return config if config else {}
    except yaml.YAMLError as e:
        raise ConfigError(
            message=f"Invalid YAML in config file: {path}",
            details=str(e),
            hint="Check the YAML syntax"
        ) from e
    except Exception as e:
        raise ConfigError(
            message=f"Error reading config file: {path}",
            details=str(e),
        ) from e


def get_config_value(
    config: dict[str, Any],
    *keys: str,
    default: Any = None,
) -> Any:
    """Get a nested value from config dictionary.
    
    Args:
        config: Configuration dictionary
        *keys: Nested keys to traverse (e.g., "pipeline", "default_theme")
        default: Default value if not found
        
    Returns:
        Configuration value or default
    """
    current = config
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key)
        if current is None:
            return default
    return current


def merge_configs(
    cli_args: dict[str, Any],
    yaml_config: dict[str, Any],
    env_defaults: dict[str, Any],
) -> dict[str, Any]:
    """Merge configurations with priority: CLI > YAML > ENV.
    
    Args:
        cli_args: Command-line arguments
        yaml_config: YAML file configuration
        env_defaults: Environment variable defaults
        
    Returns:
        Merged configuration dictionary
    """
    result = {}
    
    # Start with env defaults
    result.update(env_defaults)
    
    # Apply YAML config (overrides env)
    _deep_merge(result, yaml_config)
    
    # Apply CLI args (overrides YAML, only non-None values)
    for key, value in cli_args.items():
        if value is not None:
            result[key] = value
    
    return result


def _deep_merge(base: dict, overlay: dict) -> None:
    """Deep merge overlay into base dictionary (mutates base).
    
    Args:
        base: Base dictionary to merge into
        overlay: Dictionary to merge from
    """
    for key, value in overlay.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value


def create_default_config() -> str:
    """Create default configuration file content.
    
    Returns:
        YAML string with default configuration
    """
    return """# CLIv2 Configuration
# See https://github.com/your-org/cliv2 for documentation

# LLM settings (optional - uses environment variables by default)
# llm:
#   model: azure/gpt-4

# Pipeline defaults
pipeline:
  default_theme: business
  skip_research: false
  renderer: antd
  verbose: false

# Tool paths (optional - uses defaults)
# tools:
#   mcp_servers_path: .claude/tools

# Skill paths (optional - uses defaults)
# skills:
#   skills_path: .claude/skills
"""
