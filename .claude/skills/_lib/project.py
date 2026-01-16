"""
Project model for content-manager skill.

Defines the Project entity representing a presentation generation session
with unique identifier and isolated workspace.
"""

import hashlib
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field, computed_field


class Metadata(BaseModel):
    """Metadata about the content.json state."""
    
    version: int = Field(default=1, description="Schema version number")
    pipeline_stage: str = Field(
        default="initialized",
        description="Current pipeline stage: initialized | atoms | storyline | layout | exported"
    )
    last_instruction: str = Field(default="", description="Last user instruction processed")


class Project(BaseModel):
    """
    A presentation generation session with unique identifier and isolated workspace.
    
    Format: {source_name}_{hash8} where hash8 is 8-char SHA256 of source content.
    """
    
    id: str = Field(..., description="Unique project identifier: {source_name}_{hash8}")
    source_name: str = Field(..., description="Derived from source file name")
    hash: str = Field(..., description="8-char SHA256 of source content")
    directory: str = Field(..., description="Full path to project directory")
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 creation timestamp"
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 last update timestamp"
    )
    
    @computed_field
    @property
    def files_dir(self) -> str:
        """Path to input files directory."""
        return str(Path(self.directory) / "files")
    
    @computed_field
    @property
    def patches_dir(self) -> str:
        """Path to patches directory."""
        return str(Path(self.directory) / "patches")
    
    @computed_field
    @property
    def output_dir(self) -> str:
        """Path to output directory."""
        return str(Path(self.directory) / "output")
    
    @computed_field
    @property
    def content_json_path(self) -> str:
        """Path to content.json file."""
        return str(Path(self.directory) / "content.json")
    
    def touch_updated(self) -> None:
        """Update the updated_at timestamp to current time."""
        self.updated_at = datetime.now(timezone.utc).isoformat()


def generate_project_id(source_name: str, instruction: str, timestamp: Optional[str] = None) -> str:
    """
    Generate a unique project ID from source name, instruction, and timestamp.
    
    Format: {sanitized_source_name}_{hash8}
    
    The hash is based on instruction + timestamp, ensuring:
    - Same source with different instructions → different project
    - Multiple runs with same instruction → different project (unique timestamp)
    - Continuing/finetuning uses existing project ID (don't call this)
    
    Args:
        source_name: Original source file name (without extension)
        instruction: User instruction for this generation
        timestamp: ISO timestamp (defaults to current UTC time)
        
    Returns:
        Project ID string matching pattern ^[a-z0-9_]+_[a-f0-9]{8}$
    """
    # Sanitize source name: lowercase, replace non-alphanumeric with underscore
    sanitized = "".join(c if c.isalnum() else "_" for c in source_name.lower())
    sanitized = "_".join(filter(None, sanitized.split("_")))  # Remove multiple underscores
    
    # Use current timestamp if not provided
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    # Generate hash from instruction + timestamp (unique per generation)
    hash_input = f"{instruction}|{timestamp}"
    hash8 = hashlib.sha256(hash_input.encode()).hexdigest()[:8]
    
    return f"{sanitized}_{hash8}"


def get_project_base_dir(base_dir: Optional[str] = None) -> Path:
    """
    Get the base directory for all projects.
    
    Args:
        base_dir: Optional explicit base directory path
        
    Returns:
        Path to base directory. Uses base_dir if provided,
        otherwise defaults to $tmp/content-manager/
    """
    if base_dir:
        return Path(base_dir)
    return Path(tempfile.gettempdir()) / "content-manager"


def create_project(
    source_name: str, 
    source_content: str, 
    instruction: str = "",
    base_dir: Optional[str] = None
) -> Project:
    """
    Create a new Project with generated ID and directory path.
    
    For new/regenerate: Call this to create a new unique project ID.
    For continue/finetune: Load existing project instead of calling this.
    
    Args:
        source_name: Original source file name (without extension)
        source_content: Full content of the source file (stored but not used for hash)
        instruction: User instruction for this generation (used for hash)
        base_dir: Optional base directory for project (defaults to $tmp/content-manager/)
        
    Returns:
        New Project instance (directory not yet created on disk)
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    project_id = generate_project_id(source_name, instruction, timestamp)
    hash8 = project_id.split("_")[-1]
    project_base = get_project_base_dir(base_dir)
    project_dir = project_base / project_id
    
    return Project(
        id=project_id,
        source_name=source_name,
        hash=hash8,
        directory=str(project_dir),
        created_at=timestamp,
        updated_at=timestamp,
    )


__all__ = [
    "Project",
    "Metadata",
    "generate_project_id",
    "get_project_base_dir",
    "create_project",
]
