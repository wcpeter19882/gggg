"""
Project utilities for content-manager skill.

Provides functions for project ID generation and directory management.
"""

import os
import shutil
import sys
from pathlib import Path
from typing import Optional

# Add skill directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from project import Project, create_project, get_project_base_dir, generate_project_id as _gen_id


def generate_project_id(source_name: str, source_content: str) -> str:
    """
    Generate a unique project ID from source name and content.
    
    Re-exported from models for convenience.
    
    Args:
        source_name: Original source file name (without extension)
        source_content: Full content of the source file
        
    Returns:
        Project ID string matching pattern ^[a-z0-9_]+_[a-f0-9]{8}$
    """
    return _gen_id(source_name, source_content)


def create_project_directory(project: Project, force: bool = False) -> Path:
    """
    Create the project directory structure on disk.
    
    Creates:
    - {project_dir}/
    - {project_dir}/files/
    - {project_dir}/patches/
    - {project_dir}/output/
    
    Args:
        project: Project instance with directory path
        force: If True, remove existing directory first
        
    Returns:
        Path to created project directory
        
    Raises:
        FileExistsError: If directory exists and force=False
    """
    project_dir = Path(project.directory)
    
    if project_dir.exists():
        if force:
            shutil.rmtree(project_dir)
        else:
            raise FileExistsError(f"Project directory already exists: {project_dir}")
    
    # Create directory structure
    project_dir.mkdir(parents=True, exist_ok=True)
    (project_dir / "files").mkdir(exist_ok=True)
    (project_dir / "patches").mkdir(exist_ok=True)
    (project_dir / "output").mkdir(exist_ok=True)
    
    return project_dir


def copy_source_to_project(
    project: Project,
    source_path: str | Path,
    target_name: Optional[str] = None
) -> Path:
    """
    Copy a source file to the project's files directory.
    
    Args:
        project: Project instance
        source_path: Path to source file
        target_name: Optional target filename (default: original name)
        
    Returns:
        Path to copied file
    """
    source = Path(source_path)
    
    if target_name is None:
        target_name = source.name
    
    target = Path(project.files_dir) / target_name
    shutil.copy2(source, target)
    
    return target


def copy_content_to_project(
    project: Project,
    content: str,
    filename: str
) -> Path:
    """
    Write content directly to a file in the project's files directory.
    
    Args:
        project: Project instance
        content: Content to write
        filename: Target filename
        
    Returns:
        Path to created file
    """
    target = Path(project.files_dir) / filename
    target.write_text(content, encoding="utf-8")
    return target


def get_project_path(project_id: str, base_dir: Optional[str] = None) -> Path:
    """
    Get the path to a project directory by ID.
    
    Args:
        project_id: Project ID
        base_dir: Optional base directory
        
    Returns:
        Path to project directory (may not exist)
    """
    return get_project_base_dir(base_dir) / project_id


def project_exists(project_id: str, base_dir: Optional[str] = None) -> bool:
    """
    Check if a project directory exists.
    
    Args:
        project_id: Project ID
        base_dir: Optional base directory
        
    Returns:
        True if project directory exists
    """
    return get_project_path(project_id, base_dir).exists()


def list_projects(base_dir: Optional[str] = None) -> list[str]:
    """
    List all project IDs in the base directory.
    
    Args:
        base_dir: Optional base directory
        
    Returns:
        List of project ID strings
    """
    project_base = get_project_base_dir(base_dir)
    if not project_base.exists():
        return []
    
    return [
        d.name for d in project_base.iterdir()
        if d.is_dir() and "_" in d.name  # Basic validation
    ]


def delete_project(project_id: str) -> bool:
    """
    Delete a project directory.
    
    Args:
        project_id: Project ID
        
    Returns:
        True if deleted, False if not found
    """
    project_path = get_project_path(project_id)
    if not project_path.exists():
        return False
    
    shutil.rmtree(project_path)
    return True


__all__ = [
    "generate_project_id",
    "create_project_directory",
    "copy_source_to_project",
    "copy_content_to_project",
    "get_project_path",
    "project_exists",
    "list_projects",
    "delete_project",
]
