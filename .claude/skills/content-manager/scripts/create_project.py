#!/usr/bin/env python3
"""Create a new project directory and initialize content.json.

This script handles only file I/O - no LLM calls.

Usage:
    python scripts/create_project.py --source FILE [--instruction TEXT] [--force]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add _lib directory for imports
_lib_dir = Path(__file__).parent.parent.parent / "_lib"
sys.path.insert(0, str(_lib_dir))

from project import create_project, Project
from project_utils import create_project_directory, copy_source_to_project, project_exists
from constitution import extract_constitution, constitution_to_markdown
from content_io import initialize_content_json, write_content_json


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a new project directory"
    )
    parser.add_argument("--source", "-s", required=True, help="Source markdown file")
    parser.add_argument("--instruction", "-i", default="", help="User instruction")
    parser.add_argument("--base-dir", "-b", default=None, help="Base directory for projects (default: $tmp/content-manager/)")
    parser.add_argument("--force", "-f", action="store_true", help="Overwrite existing")
    
    args = parser.parse_args()
    
    source_path = Path(args.source)
    if not source_path.exists():
        print(json.dumps({"error": f"Source file not found: {source_path}"}))
        return 1
    
    # Read source content
    source_content = source_path.read_text(encoding="utf-8")
    source_name = source_path.stem
    
    # Create project with optional base_dir
    # Project ID is generated from instruction + timestamp (unique per generation)
    project = create_project(source_name, source_content, args.instruction, args.base_dir)
    
    # Check if exists
    if project_exists(project.id, args.base_dir) and not args.force:
        print(json.dumps({
            "error": f"Project already exists: {project.id}",
            "hint": "Use --force to overwrite"
        }))
        return 1
    
    # Create directory structure
    try:
        create_project_directory(project, force=args.force)
    except Exception as e:
        print(json.dumps({"error": f"Failed to create directory: {e}"}))
        return 1
    
    # Copy source file
    copy_source_to_project(project, source_path, f"{source_name}.md")
    
    # Save instruction if provided
    if args.instruction:
        instruction_path = Path(project.directory) / "instruction.md"
        instruction_path.write_text(args.instruction, encoding="utf-8")
    
    # Extract constitution (rule-based, no LLM)
    constitution = extract_constitution(args.instruction)
    constitution_md = constitution_to_markdown(constitution)
    Path(project.directory, "constitution.md").write_text(constitution_md, encoding="utf-8")
    
    # Initialize content.json (todos now managed by built-in manage_todo_list tool)
    content = initialize_content_json(project, constitution, args.instruction)
    write_content_json(project.content_json_path, content)
    
    # Output result
    print(json.dumps({
        "project_id": project.id,
        "project_dir": project.directory,
        "content_json": project.content_json_path,
        "source_file": str(Path(project.files_dir) / f"{source_name}.md"),
    }, indent=2))
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
