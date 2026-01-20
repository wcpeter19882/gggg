"""
Content I/O utilities for content-manager skill.

Provides functions for reading and writing content.json files.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

# Add skill directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from project import Project, Metadata
from content_json import ContentJson, Constitution, ContentMetadata


def read_content_json(content_json_path: str | Path) -> Optional[ContentJson]:
    """
    Read and parse a content.json file.
    
    Args:
        content_json_path: Path to content.json file
        
    Returns:
        ContentJson instance, or None if file doesn't exist or is invalid
    """
    path = Path(content_json_path)
    
    if not path.exists():
        return None
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return ContentJson(**data)
    except (json.JSONDecodeError, Exception):
        return None


def read_content_json_raw(content_json_path: str | Path) -> Optional[Dict[str, Any]]:
    """
    Read content.json as raw dict (no validation).
    
    Args:
        content_json_path: Path to content.json file
        
    Returns:
        Dict, or None if file doesn't exist or is invalid JSON
    """
    path = Path(content_json_path)
    
    if not path.exists():
        return None
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return None


def write_content_json(content_json_path: str | Path, content: ContentJson) -> None:
    """
    Write a ContentJson instance to file.
    
    Args:
        content_json_path: Path to write to
        content: ContentJson instance to write
    """
    path = Path(content_json_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(content.model_dump(mode="json"), f, indent=2, ensure_ascii=False)


def write_content_json_raw(content_json_path: str | Path, data: Dict[str, Any]) -> None:
    """
    Write raw dict to content.json file.
    
    Args:
        content_json_path: Path to write to
        data: Dict to write as JSON
    """
    path = Path(content_json_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def initialize_content_json(
    project: Project,
    constitution: Optional[Constitution] = None,
    instruction: str = ""
) -> ContentJson:
    """
    Create an initial content.json for a new project.
    
    Args:
        project: Project instance
        constitution: Optional constitution to set
        instruction: Initial instruction text
        
    Returns:
        Initialized ContentJson instance
    """
    return ContentJson(
        project={
            "id": project.id,
            "source_name": project.source_name,
            "hash": project.hash,
            "directory": project.directory,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        },
        constitution=constitution or Constitution(),
        theme=None,
        atoms=None,
        slides=[],
        metadata=ContentMetadata(
            version=1,
            pipeline_stage="initialized",
            last_instruction=instruction,
        ),
    )


def update_pipeline_stage(
    content_json_path: str | Path,
    stage: str
) -> bool:
    """
    Update the pipeline_stage in content.json metadata.
    
    Args:
        content_json_path: Path to content.json
        stage: New pipeline stage
        
    Returns:
        True if successful, False if file not found
    """
    data = read_content_json_raw(content_json_path)
    if data is None:
        return False
    
    if "metadata" not in data:
        data["metadata"] = {}
    
    data["metadata"]["pipeline_stage"] = stage
    data["metadata"]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    write_content_json_raw(content_json_path, data)
    return True


def get_pipeline_stage(content_json_path: str | Path) -> Optional[str]:
    """
    Get the current pipeline stage from content.json.
    
    Args:
        content_json_path: Path to content.json
        
    Returns:
        Pipeline stage string, or None if not found
    """
    data = read_content_json_raw(content_json_path)
    if data is None:
        return None
    
    return data.get("metadata", {}).get("pipeline_stage")


__all__ = [
    "read_content_json",
    "read_content_json_raw",
    "write_content_json",
    "write_content_json_raw",
    "initialize_content_json",
    "update_pipeline_stage",
    "get_pipeline_stage",
]
