"""Prompts for theme creation and customization."""
import os
import json
from pathlib import Path
from typing import List, Optional, Dict, Any

from src.utils.generation_config import GenerationConfig
from src.generation.theme.models import Theme, THEME_SCHEMA_REFERENCE


import re

def _read_ts_theme_source(file_path: Path) -> Optional[str]:
    """Read typescript theme source code directly."""
    try:
        content = file_path.read_text(encoding='utf-8')
        # Extract just the object part for clearer context if possible, 
        # or return the whole export statement.
        match = re.search(r'(export const \w+[\s:]+ThemeDefinition\s*=\s*{[\s\S]+?};)', content)
        if match:
            return match.group(1)
        return content # Fallback to full file
    except Exception as e:
        print(f"Failed to read theme {file_path.name}: {e}")
        return None

def get_builtin_theme_ids() -> List[str]:
    """List available built-in theme IDs."""
    root_dir = Path(__file__).parent.parent.parent.parent
    themes_dir = root_dir / "src" / "paged" / "render" / "react" / "themes"
    
    ids = []
    if themes_dir.exists():
        for theme_file in themes_dir.glob("*.ts"):
            if theme_file.name in ["index.ts", "vibes.ts", "base.ts"]:
                continue
            ids.append(theme_file.stem)
    return ids

def get_builtin_theme_source(theme_id: str) -> Optional[str]:
    """Get source code for a built-in theme."""
    root_dir = Path(__file__).parent.parent.parent.parent
    themes_dir = root_dir / "src" / "paged" / "render" / "react" / "themes"
    
    theme_file = themes_dir / f"{theme_id}.ts"
    if theme_file.exists():
        return _read_ts_theme_source(theme_file)
    return None

def get_theme_examples() -> str:
    """Get formatted examples (as TS source) for LLM reference."""
    examples = []
    
    business = get_builtin_theme_source("business")
    if business:
        examples.append(f"// Light Theme Example (business)\n{business}")
        
    dark = get_builtin_theme_source("dark")
    if dark:
        examples.append(f"// Dark Theme Example (dark)\n{dark}")
        
    return "\n\n".join(examples)


THEME_CREATION_SYSTEM_PROMPT = """
Create cohesive, professional presentation themes based on user requirements.

- Ensure sufficient contrast between text and background (WCAG AA minimum)
- All colors should feel like they belong together
- Reference to Base Theme for structure

Return a complete, valid JSON theme object.

"""


def render_theme_creation_prompt(
    user_instruction: str,
    base_theme_source: Optional[str] = None,
    new_theme_name: Optional[str] = None,
    keywords: Optional[List[str]] = None
) -> str:
    """Render user prompt for theme creation.
    
    Args:
        user_instruction: What kind of theme the user wants
        base_theme_source: Optional existing theme source code to customize/modify
        new_theme_name: Optional name for the new theme to ensure uniqueness
        keywords: Optional list of keywords to emphasize
        
    Returns:
        Formatted user prompt
    """
    parts = [f"# User Request:\n{user_instruction}"]
    
    if keywords:
        parts.append(f"## keywords: {', '.join(keywords)}\nEnsure the theme visuals reflect these concepts.")
    
    if new_theme_name:
        parts.append(f"Please name the new theme: {new_theme_name}")
    
    if base_theme_source:
        parts.extend([
            f"## Base Theme Reference (TypeScript)\n```typescript\n{base_theme_source}\n```",
            "Note: The base theme is provided in TypeScript for reference. Please output the new theme as valid JSON matching the schema."
        ])
    
    return "\n\n".join(parts)


def render_theme_customization_prompt(
    base_theme_source: Optional[str],
    modifications: str
) -> str:
    """Render prompt for customizing an existing theme.
    
    Args:
        base_theme_source: The theme source code to modify
        modifications: What to change (e.g., "make it darker", "use green instead of blue")
        
    Returns:
        Formatted prompt for theme customization
    """
    parts = []
    
    if base_theme_source:
        parts.append(f"## Current Theme Reference (TypeScript)\n```typescript\n{base_theme_source}\n```")
    
    parts.extend([
        f"## Requested Modifications\n{modifications}",
        """## Instructions
1. Start with the current theme as base
2. Apply the requested modifications
3. Ensure color harmony is maintained after changes
4. Keep the same structure - only change values
5. Generate a new unique ID for the modified theme (e.g., original_id + "_custom")

Return ONLY the complete modified theme as valid JSON matching the schema."""
    ])
    
    return "\n\n".join(parts)


# JSON Schema for structured output
# We use strict=False because Pydantic models have optional fields which OpenAI strict mode
# doesn't like (it requires all fields to be required).
THEME_JSON_SCHEMA = {
    "name": "theme_response",
    "strict": False,
    "schema": Theme.model_json_schema()
}


def get_theme_creation_config(
    temperature: float = 0.7,
    max_tokens: int = 4000
) -> GenerationConfig:
    """Get GenerationConfig for theme creation.
    
    Args:
        temperature: Sampling temperature (0.7 for creative variety)
        max_tokens: Maximum tokens in response
        
    Returns:
        GenerationConfig for theme creation
    """
    deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4-turbo')
    return GenerationConfig(
        model=deployment,
        temperature=temperature,
        max_tokens=max_tokens,
        system_prompt=THEME_CREATION_SYSTEM_PROMPT,
        user_prompt_template="{content}",
        response_format="json_schema",
        json_schema=THEME_JSON_SCHEMA
    )

def get_builtin_themes() -> List[Dict[str, str]]:
    """Get list of built-in themes for tool consumption.
    
    Returns:
        List of dicts with 'id' key.
    """
    ids = get_builtin_theme_ids()
    return [{"id": i} for i in ids]
