"""
Apply patch to content.json.

Implements merge/replace/delete operations on content.json file.
"""

import json
import sys
from pathlib import Path
from typing import Any

# Add skill directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from patch import (
    Patch,
    PatchResult,
    PatchOperation,
    PatchTarget,
    deep_merge,
)
from content_json import ContentJson


def apply_patch(content_json_path: str | Path, patch: Patch) -> PatchResult:
    """
    Apply a patch to a content.json file.
    
    Args:
        content_json_path: Path to the content.json file
        patch: Patch to apply
        
    Returns:
        PatchResult indicating success or failure
    """
    path = Path(content_json_path)
    
    try:
        # Read current content
        if not path.exists():
            return PatchResult(
                success=False,
                target=patch.target,
                operation=patch.operation,
                error=f"File not found: {path}"
            )
        
        with open(path, "r", encoding="utf-8") as f:
            content = json.load(f)
        
        # Apply patch based on operation
        if patch.operation == "merge":
            content = _apply_merge(content, patch.target, patch.data)
        elif patch.operation == "replace":
            content = _apply_replace(content, patch.target, patch.data)
        elif patch.operation == "delete":
            content = _apply_delete(content, patch.target)
        else:
            return PatchResult(
                success=False,
                target=patch.target,
                operation=patch.operation,
                error=f"Unknown operation: {patch.operation}"
            )
        
        # Write updated content
        with open(path, "w", encoding="utf-8") as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        
        return PatchResult(
            success=True,
            target=patch.target,
            operation=patch.operation,
        )
        
    except json.JSONDecodeError as e:
        return PatchResult(
            success=False,
            target=patch.target,
            operation=patch.operation,
            error=f"Invalid JSON: {e}"
        )
    except Exception as e:
        return PatchResult(
            success=False,
            target=patch.target,
            operation=patch.operation,
            error=str(e)
        )


def _apply_merge(content: dict, target: PatchTarget, data: Any) -> dict:
    """Apply merge operation - deep merge data into target."""
    if target not in content:
        content[target] = data
    elif isinstance(content[target], dict) and isinstance(data, dict):
        content[target] = deep_merge(content[target], data)
    elif isinstance(content[target], list) and isinstance(data, list):
        # For lists (like slides), merge by ID if items have IDs
        content[target] = _merge_lists_by_id(content[target], data)
    else:
        content[target] = data
    return content


def _merge_lists_by_id(base_list: list, update_list: list) -> list:
    """
    Merge two lists by 'id' field.
    
    Items with matching IDs are merged, new items are appended.
    """
    result = {item.get("id"): item for item in base_list if isinstance(item, dict)}
    
    for update_item in update_list:
        if isinstance(update_item, dict) and "id" in update_item:
            item_id = update_item["id"]
            if item_id in result:
                result[item_id] = deep_merge(result[item_id], update_item)
            else:
                result[item_id] = update_item
        else:
            # No ID, just append
            result[id(update_item)] = update_item
    
    return list(result.values())


def _apply_replace(content: dict, target: PatchTarget, data: Any) -> dict:
    """Apply replace operation - completely replace target with data."""
    content[target] = data
    return content


def _apply_delete(content: dict, target: PatchTarget) -> dict:
    """Apply delete operation - set target to null/empty."""
    if target == "slides":
        content[target] = []
    elif target == "atoms":
        content[target] = None
    elif target == "theme":
        content[target] = None
    elif target == "constitution":
        content[target] = {
            "tone": None,
            "style_rules": [],
            "content_exclusions": [],
            "content_requirements": [],
            "target_slides": None
        }
    elif target == "metadata":
        # Don't delete metadata, just reset pipeline stage
        content[target] = {
            "version": content.get("metadata", {}).get("version", 1),
            "pipeline_stage": "initialized",
            "last_instruction": ""
        }
    return content


def apply_patch_from_file(content_json_path: str | Path, patch_file_path: str | Path) -> PatchResult:
    """
    Apply a patch from a JSON file to content.json.
    
    Args:
        content_json_path: Path to the content.json file
        patch_file_path: Path to the patch JSON file
        
    Returns:
        PatchResult indicating success or failure
    """
    patch_path = Path(patch_file_path)
    
    try:
        with open(patch_path, "r", encoding="utf-8") as f:
            patch_data = json.load(f)
        
        patch = Patch(**patch_data)
        return apply_patch(content_json_path, patch)
        
    except json.JSONDecodeError as e:
        return PatchResult(
            success=False,
            target="constitution",  # Default, will be overridden
            operation="merge",
            error=f"Invalid patch JSON: {e}"
        )
    except Exception as e:
        return PatchResult(
            success=False,
            target="constitution",
            operation="merge",
            error=str(e)
        )


__all__ = [
    "apply_patch",
    "apply_patch_from_file",
]
