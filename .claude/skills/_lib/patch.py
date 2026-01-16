"""
Patch model for content.json updates.

Defines the patch format used by subagents to update content.json incrementally.
Uses a simplified semantic patch format with merge/replace/delete operations.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field


PatchOperation = Literal["merge", "replace", "delete"]
PatchTarget = Literal["constitution", "theme", "atoms", "slides", "metadata"]


class Patch(BaseModel):
    """
    A patch to apply to content.json.
    
    Operations:
    - merge: Deep merge data into the target (preserves existing fields)
    - replace: Replace the entire target with new data
    - delete: Remove the target (set to null/empty)
    
    Targets:
    - constitution: Global rules and constraints
    - theme: Visual theme configuration
    - atoms: Extracted content atoms
    - slides: Presentation slides
    - metadata: Content metadata (pipeline_stage, etc.)
    """
    
    operation: PatchOperation = Field(..., description="Patch operation type")
    target: PatchTarget = Field(..., description="Target field in content.json")
    data: Any = Field(default=None, description="Data for merge/replace operations")
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "operation": "merge",
                    "target": "theme",
                    "data": {
                        "id": "dark_professional",
                        "name": "Dark Professional",
                        "colors": {"primary": "#1a1a2e", "accent": "#e94560"}
                    }
                },
                {
                    "operation": "replace",
                    "target": "slides",
                    "data": [
                        {"id": "slide_01", "state": "draft", "story": "Introduction"}
                    ]
                },
                {
                    "operation": "delete",
                    "target": "atoms",
                    "data": None
                }
            ]
        }


class PatchResult(BaseModel):
    """Result of applying a patch."""
    
    success: bool = Field(..., description="Whether the patch was applied successfully")
    target: PatchTarget = Field(..., description="Target that was modified")
    operation: PatchOperation = Field(..., description="Operation that was performed")
    error: str | None = Field(default=None, description="Error message if failed")


def deep_merge(base: dict, update: dict) -> dict:
    """
    Deep merge update into base dictionary.
    
    Rules:
    - Scalar values in update override base
    - Dicts are recursively merged
    - Lists in update replace lists in base
    - None values in update do not override (use delete operation for removal)
    
    Args:
        base: Base dictionary to merge into
        update: Dictionary with updates to apply
        
    Returns:
        Merged dictionary (new copy, base is not modified)
    """
    result = base.copy()
    
    for key, value in update.items():
        if value is None:
            # None doesn't override - skip
            continue
        elif key in result and isinstance(result[key], dict) and isinstance(value, dict):
            # Recursively merge dicts
            result[key] = deep_merge(result[key], value)
        else:
            # Override with new value
            result[key] = value
    
    return result


__all__ = [
    "PatchOperation",
    "PatchTarget",
    "Patch",
    "PatchResult",
    "deep_merge",
]
