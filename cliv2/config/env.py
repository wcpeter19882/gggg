"""Environment variable loading and validation.

Loads configuration from .env file and validates required variables.
"""
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

from cliv2.core.errors import ConfigError


def load_env(env_path: Optional[Path] = None) -> None:
    """Load environment variables from .env file.
    
    Args:
        env_path: Optional path to .env file. If not provided, searches
                  current directory and parent directories.
    """
    if env_path:
        load_dotenv(env_path)
    else:
        # Load from current directory or find .env in parent directories
        load_dotenv()


def get_required_env(name: str, hint: str = "") -> str:
    """Get a required environment variable.
    
    Args:
        name: Environment variable name
        hint: Hint for how to set the variable
        
    Returns:
        The environment variable value
        
    Raises:
        ConfigError: If the variable is not set
    """
    value = os.getenv(name)
    if not value:
        raise ConfigError(
            message=f"Missing required environment variable: {name}",
            details=f"The environment variable '{name}' must be set.",
            hint=hint or f"Set {name} in your .env file or environment.",
        )
    return value


def get_optional_env(name: str, default: str = "") -> str:
    """Get an optional environment variable with default.
    
    Args:
        name: Environment variable name
        default: Default value if not set
        
    Returns:
        The environment variable value or default
    """
    return os.getenv(name, default)


def validate_azure_config() -> dict[str, str]:
    """Validate Azure OpenAI configuration.
    
    Returns:
        Dictionary with validated Azure configuration
        
    Raises:
        ConfigError: If required Azure variables are missing
    """
    endpoint = get_required_env(
        "AZURE_OPENAI_ENDPOINT",
        hint="Set AZURE_OPENAI_ENDPOINT to your Azure OpenAI endpoint URL"
    )
    deployment = get_required_env(
        "AZURE_OPENAI_DEPLOYMENT",
        hint="Set AZURE_OPENAI_DEPLOYMENT to your deployment name (e.g., gpt-4)"
    )
    api_version = get_optional_env(
        "AZURE_OPENAI_API_VERSION",
        default="2024-02-15-preview"
    )
    # API key is optional - will use Azure AD if not provided
    api_key = get_optional_env("AZURE_OPENAI_API_KEY")
    
    return {
        "endpoint": endpoint,
        "deployment": deployment,
        "api_version": api_version,
        "api_key": api_key,
    }
