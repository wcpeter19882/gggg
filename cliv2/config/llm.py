"""LLM configuration for Azure OpenAI via LiteLLM.

Lightweight wrapper around LiteLLM for Azure OpenAI.
Supports both API key and Azure AD authentication.
"""
import logging
import os
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Optional

import litellm

from cliv2.config.env import load_env, validate_azure_config
from cliv2.core.errors import ConfigError

logger = logging.getLogger(__name__)

# Cache for Azure credential and token
_cached_credential = None
_cached_token = None
_token_expires_at = 0

# Background refresh thread
_refresh_thread = None
_refresh_stop_event = threading.Event()


@dataclass
class LLMConfig:
    """LLM configuration for Azure OpenAI."""
    model: str
    api_key: str
    base_url: str
    api_version: str


class LLM:
    """LiteLLM wrapper for Azure OpenAI completions."""
    
    def __init__(self, config: LLMConfig):
        self.config = config
        
        # Set environment for LiteLLM Azure
        os.environ["AZURE_API_KEY"] = config.api_key
        os.environ["AZURE_API_BASE"] = config.base_url
        os.environ["AZURE_API_VERSION"] = config.api_version
    
    def completion(self, messages: list[dict], **kwargs) -> Any:
        """Synchronous completion using LiteLLM.
        
        Args:
            messages: List of message dicts with role and content
            **kwargs: Additional args passed to litellm.completion
            
        Returns:
            LiteLLM completion response
        """
        return litellm.completion(
            model=self.config.model,
            messages=messages,
            api_key=self.config.api_key,
            api_base=self.config.base_url,
            api_version=self.config.api_version,
            **kwargs
        )
    
    async def acompletion(self, messages: list[dict], **kwargs) -> Any:
        """Async completion using LiteLLM.
        
        Args:
            messages: List of message dicts with role and content
            **kwargs: Additional args passed to litellm.acompletion
            
        Returns:
            LiteLLM completion response
        """
        return await litellm.acompletion(
            model=self.config.model,
            messages=messages,
            api_key=self.config.api_key,
            api_base=self.config.base_url,
            api_version=self.config.api_version,
            **kwargs
        )


def create_llm() -> LLM:
    """Create LLM with Azure OpenAI configuration.
    
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
    
    # Handle authentication
    api_key = config['api_key']
    if not api_key:
        # Use Azure AD authentication
        api_key = _get_azure_ad_token()
        # Start background refresh thread to prevent token expiration during idle
        start_token_refresh_thread(interval_minutes=30)
    
    # Create LLM config
    llm_config = LLMConfig(
        model=model,
        api_key=api_key,
        base_url=config['endpoint'],
        api_version=config['api_version'],
    )
    
    return LLM(config=llm_config)


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


def start_token_refresh_thread(interval_minutes: int = 30) -> None:
    """Start background thread to refresh Azure AD token periodically.
    
    This prevents token expiration during idle periods.
    Token is refreshed every `interval_minutes` (default 30 min).
    Azure AD tokens typically last 1 hour.
    
    Args:
        interval_minutes: How often to refresh (default 30 min)
    """
    global _refresh_thread, _refresh_stop_event
    
    if _refresh_thread and _refresh_thread.is_alive():
        logger.debug("Token refresh thread already running")
        return
    
    _refresh_stop_event.clear()
    
    def refresh_loop():
        while not _refresh_stop_event.wait(timeout=interval_minutes * 60):
            try:
                _get_azure_ad_token()
                logger.debug(f"Background token refresh successful, expires at {_token_expires_at}")
            except Exception as e:
                logger.warning(f"Background token refresh failed: {e}")
    
    _refresh_thread = threading.Thread(target=refresh_loop, daemon=True, name="azure-token-refresh")
    _refresh_thread.start()
    logger.info(f"Started Azure AD token refresh thread (every {interval_minutes} min)")


def stop_token_refresh_thread() -> None:
    """Stop the background token refresh thread."""
    global _refresh_thread, _refresh_stop_event
    
    if _refresh_thread and _refresh_thread.is_alive():
        _refresh_stop_event.set()
        _refresh_thread.join(timeout=5)
        logger.info("Stopped Azure AD token refresh thread")


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
