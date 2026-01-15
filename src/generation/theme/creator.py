"""Theme creator - generates and customizes themes via LLM."""
import json
import logging
from pathlib import Path
import sys
from typing import Optional, Dict, Any, List

from src.generation.theme.models import Theme
from src.generation.theme.prompts import (
    render_theme_creation_prompt,
    render_theme_customization_prompt,
    get_theme_creation_config,
    get_builtin_theme_source,
)
from src.utils.llm_client import call_llm
from src.utils.cache import GenerationCache

logger = logging.getLogger(__name__)

# Module-level cache
_cache = GenerationCache(Path(".cache/themes"))


def create_theme(
    user_instruction: str,
    base_theme_id: Optional[str] = None,
    new_theme_id: Optional[str] = None,
    use_cache: bool = True,
    keywords_list: Optional[List[str]] = None,
) -> Theme:
    """Create a new theme based on user instruction.
    
    This function generates a complete theme using LLM, guided by:
    - User instruction (e.g., "create a dark theme with purple accents")
    - Optional base theme to start from
    
    Args:
        user_instruction: Description of desired theme
        base_theme_id: Optional ID of existing theme to use as base
        new_theme_id: Optional specific ID for the new theme
        use_cache: Whether to use cached results
        keywords_list: Optional list of specific keywords (colors, styles) to emphasize
        
    Returns:
        Generated Theme object
        
    Raises:
        ValueError: If theme generation fails
        
    Example:
        >>> theme = create_theme("professional dark theme with blue accents")
        >>> print(theme.id)  # e.g., "dark_blue_professional_v1"
        >>> print(theme.primary_color)  # e.g., "#3b82f6"
    """
    # Get base theme if specified
    base_theme_source = None
    if base_theme_id:
        base_theme_source = _get_builtin_theme_source(base_theme_id)
    
    # Fallback to a default theme for structure reference if no base provided
    if not base_theme_source:
        base_theme_source = _get_builtin_theme_source("business")
    
    # Check cache
    cache_key = None
    if use_cache:
        cache_input = f"{str(base_theme_source)}|{new_theme_id}"
        cache_key = _cache.hash_key(user_instruction, cache_input)
        cached = _cache.load(cache_key)
        if cached:
            logger.info(f"Cache hit for theme creation")
            print("✓ Using cached theme")
            return Theme.from_dict(cached)
    
    # Get config
    config = get_theme_creation_config()
    
    # Use provided keywords or empty list
    keywords = keywords_list or []

    # Generate a descriptive ID suggestion based on keywords if not provided
    if new_theme_id:
        new_theme_name = new_theme_id
    else:
        short_desc = "_".join(keywords[:4]) if keywords else "custom"
        new_theme_name = f"theme_{short_desc}"

    # Render prompt
    user_prompt = render_theme_creation_prompt(
        user_instruction=user_instruction,
        base_theme_source=base_theme_source,
        new_theme_name=new_theme_name,
        keywords=keywords
    )
    
    logger.info(f"Creating theme via LLM: {user_instruction[:50]}...")
    print(f"⚙ Creating theme via LLM...")
    
    # Call LLM
    response = call_llm(
        system_prompt=config.system_prompt,
        user_prompt=user_prompt,
        deployment=config.model,
        temperature=config.temperature,
        max_tokens=config.max_tokens,
        response_format=config.response_format,
        json_schema=config.json_schema,
    )
    
    # Parse response
    try:
        theme_data = json.loads(response)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse theme JSON: {e}")
        logger.error(f"Response: {response[:500]}")
        raise ValueError(f"Invalid theme JSON from LLM: {e}")
    
    # Validate and create Theme
    theme = Theme.from_dict(theme_data)
    
    logger.info(f"Created theme: {theme.id}")
    print(f"✓ Created theme: {theme.id}")
    
    # Cache result
    if use_cache and cache_key:
        _cache.save(cache_key, theme_data)
    
    return theme


def customize_theme(
    base_theme_id: str,
    modifications: str,
    use_cache: bool = True,
) -> Theme:
    """Customize an existing theme with specific modifications.
    
    This function takes an existing theme and applies modifications using LLM.
    Useful for quick adjustments like:
    - "make it darker"
    - "use green instead of blue"
    - "increase heading sizes"
    
    Args:
        base_theme_id: ID of the theme to customize
        modifications: What to change
        use_cache: Whether to use cached results
        
    Returns:
        Modified Theme object
        
    Raises:
        ValueError: If base theme not found or customization fails
        
    Example:
        >>> theme = customize_theme("corp_modern_v1", "make the accent color red")
        >>> print(theme.accent_color)  # e.g., "#ef4444"
    """
    base_theme_source = _get_builtin_theme_source(base_theme_id) or _get_builtin_theme_source("business")
    
    # Check cache
    cache_key = None
    if use_cache:
        cache_input = f"{base_theme_id}|{modifications}"
        cache_key = _cache.hash_key("customize_theme", cache_input)
        cached = _cache.load(cache_key)
        if cached:
            logger.info(f"Cache hit for theme customization")
            print("✓ Using cached customized theme")
            return Theme.from_dict(cached)
    
    # Get config
    config = get_theme_creation_config()
    
    # Render prompt
    user_prompt = render_theme_customization_prompt(
        base_theme_source=base_theme_source,
        modifications=modifications,
    )
    
    logger.info(f"Customizing theme {base_theme_id}: {modifications[:50]}...")
    print(f"⚙ Customizing theme {base_theme_id}...")
    
    # Call LLM
    response = call_llm(
        system_prompt=config.system_prompt,
        user_prompt=user_prompt,
        deployment=config.model,
        temperature=config.temperature,
        max_tokens=config.max_tokens,
        response_format=config.response_format,
        json_schema=config.json_schema,
    )
    
    # Parse response
    try:
        theme_data = json.loads(response)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse customized theme JSON: {e}")
        raise ValueError(f"Invalid theme JSON from LLM: {e}")
    
    # Validate and create Theme
    theme = Theme.from_dict(theme_data)
    
    logger.info(f"Customized theme: {theme.id}")
    print(f"✓ Customized theme: {theme.id}")
    
    # Cache result
    if use_cache and cache_key:
        _cache.save(cache_key, theme_data)
    
    return theme


def _get_builtin_theme_source(theme_id: str) -> Optional[str]:
    """Get source code of a built-in theme by ID.
    
    Args:
        theme_id: Theme ID to look up
        
    Returns:
        Theme source string or None if not found
    """
    return get_builtin_theme_source(theme_id)


def save_theme(theme: Theme, output_dir: Optional[Path] = None) -> Path:
    """Save a theme to a JSON file.
    
    Args:
        theme: Theme to save
        output_dir: Directory to save to (defaults to assets/themes)
        
    Returns:
        Path to saved file
    """
    if output_dir is None:
        output_dir = Path(__file__).parent.parent.parent.parent / "assets" / "themes"
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename from ID (strip version suffix for filename)
    base_name = theme.id.replace("_v1", "").replace("_v2", "")
    output_path = output_dir / f"{base_name}.json"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(theme.to_dict(), f, indent=2)
    
    logger.info(f"Saved theme to: {output_path}")
    return output_path


def list_builtin_themes() -> list[str]:
    """List all available built-in theme IDs.
    
    Returns:
        List of theme IDs
    """
    from src.generation.theme.prompts import get_builtin_theme_ids
    return get_builtin_theme_ids()
