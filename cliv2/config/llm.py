"""LLM configuration for Azure OpenAI via LiteLLM.

Creates OpenHands LLM instance configured for Azure OpenAI.
Supports both API key and Azure AD authentication.
"""
import os
import time
from typing import Optional

from cliv2.config.env import load_env, validate_azure_config
from cliv2.core.errors import ConfigError

# Cache for Azure credential and token
_cached_credential = None
_cached_token = None
_token_expires_at = 0


def create_llm():
    """Create OpenHands LLM with Azure OpenAI configuration.
    
    Uses LiteLLM format for Azure OpenAI: azure/<deployment>
    
    Returns:
        Configured LLM instance
        
    Raises:
        ConfigError: If Azure configuration is missing or invalid
    """
    # Load environment variables first
    load_env()
    
    # Validate Azure configuration
    config = validate_azure_config()
    
    # Build LiteLLM model string for Azure
    model = f"azure/{config['deployment']}"
    
    # Import here to avoid import errors if SDK not installed
    try:
        from openhands.core.config import LLMConfig
        from openhands.llm import LLM
    except ImportError as e:
        raise ConfigError(
            message="OpenHands SDK not installed",
            details=str(e),
            hint="Install with: pip install openhands-ai"
        ) from e
    
    # Handle authentication
    api_key = config['api_key']
    if not api_key:
        # Use Azure AD authentication
        api_key = _get_azure_ad_token()
    
    # Create LLM config
    llm_config = LLMConfig(
        model=model,
        api_key=api_key,
        base_url=config['endpoint'],
        api_version=config['api_version'],
    )
    
    # Create LLM instance with service_id
    return LLM(config=llm_config, service_id="cliv2")


def _get_azure_ad_token() -> str:
    """Get Azure AD token for Azure OpenAI.
    
    Uses AzureCliCredential directly with caching (faster than DefaultAzureCredential
    which tries IMDS first and times out on non-Azure machines).
    
    Returns:
        Azure AD access token
        
    Raises:
        ConfigError: If token acquisition fails
    """
    global _cached_credential, _cached_token, _token_expires_at
    
    # Check if cached token is still valid (with 5 min buffer)
    if _cached_token and time.time() < (_token_expires_at - 300):
        return _cached_token
    
    try:
        from azure.identity import AzureCliCredential
    except ImportError as e:
        raise ConfigError(
            message="azure-identity package not installed",
            details=str(e),
            hint="Install with: pip install azure-identity"
        ) from e
    
    try:
        # Reuse cached credential if available
        if _cached_credential is None:
            _cached_credential = AzureCliCredential()
        
        token = _cached_credential.get_token("https://cognitiveservices.azure.com/.default")
        
        # Cache token and expiry
        _cached_token = token.token
        _token_expires_at = token.expires_on
        
        # Set for LiteLLM
        os.environ["AZURE_AD_TOKEN"] = token.token
        
        return token.token
    except Exception as e:
        raise ConfigError(
            message="Failed to acquire Azure AD token",
            details=str(e),
            hint="Run 'az login' to authenticate with Azure CLI"
        ) from e


def get_llm_config() -> dict:
    """Get LLM configuration as dictionary.
    
    Useful for testing and debugging.
    
    Returns:
        Dictionary with LLM configuration
    """
    load_env()
    config = validate_azure_config()
    
    return {
        "model": f"azure/{config['deployment']}",
        "base_url": config['endpoint'],
        "api_version": config['api_version'],
        "has_api_key": bool(config['api_key']),
    }
