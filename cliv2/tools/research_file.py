"""Tool for incremental updates to research.md file.

Supports create/edit operations for research sections.
"""
import re
from pathlib import Path
from typing import Any, Literal, Optional
from datetime import datetime


def apply_research_edit(
    project_dir: str,
    operation: Literal["create", "edit", "append"],
    section: Optional[str] = None,
    content: str = "",
) -> dict[str, Any]:
    """Apply an incremental edit to research.md.
    
    Args:
        project_dir: Path to project directory
        operation: Type of operation
            - "create": Create new section (or replace if exists)
            - "edit": Edit existing section content
            - "append": Append to existing section
        section: Section identifier (e.g., "topic_ai_adoption", "images", "citations")
            If None, applies to full file for "create" operation
        content: Content to write/append
        
    Returns:
        Result dict with success status
    """
    files_dir = Path(project_dir) / "files"
    files_dir.mkdir(exist_ok=True)
    research_path = files_dir / "research.md"
    
    # Read existing content
    existing = ""
    if research_path.exists():
        existing = research_path.read_text(encoding="utf-8")
    
    if operation == "create" and section is None:
        # Full file create/replace
        new_content = content
        
    elif operation == "create":
        # Create new section
        new_content = _add_or_replace_section(existing, section, content)
        
    elif operation == "edit":
        if not section:
            return {"error": "Section required for edit operation"}
        # Edit existing section
        new_content = _edit_section(existing, section, content)
        
    elif operation == "append":
        if not section:
            return {"error": "Section required for append operation"}
        # Append to section
        new_content = _append_to_section(existing, section, content)
        
    else:
        return {"error": f"Unknown operation: {operation}"}
    
    # Write result
    research_path.write_text(new_content, encoding="utf-8")
    
    return {
        "success": True,
        "path": str(research_path),
        "operation": operation,
        "section": section,
    }


def _add_or_replace_section(existing: str, section: str, content: str) -> str:
    """Add new section or replace if exists."""
    # Section format: <!-- section:topic_name -->...<!-- /section:topic_name -->
    section_pattern = rf'<!-- section:{re.escape(section)} -->.*?<!-- /section:{re.escape(section)} -->'
    
    wrapped = f"<!-- section:{section} -->\n{content}\n<!-- /section:{section} -->"
    
    if re.search(section_pattern, existing, re.DOTALL):
        # Replace existing section
        return re.sub(section_pattern, wrapped, existing, flags=re.DOTALL)
    else:
        # Add new section at end
        if existing and not existing.endswith("\n"):
            existing += "\n"
        return existing + "\n" + wrapped


def _edit_section(existing: str, section: str, content: str) -> str:
    """Edit existing section, replacing its content."""
    section_pattern = rf'<!-- section:{re.escape(section)} -->.*?<!-- /section:{re.escape(section)} -->'
    wrapped = f"<!-- section:{section} -->\n{content}\n<!-- /section:{section} -->"
    
    if re.search(section_pattern, existing, re.DOTALL):
        return re.sub(section_pattern, wrapped, existing, flags=re.DOTALL)
    else:
        # Section doesn't exist, create it
        return _add_or_replace_section(existing, section, content)


def _append_to_section(existing: str, section: str, content: str) -> str:
    """Append content to existing section."""
    section_pattern = rf'(<!-- section:{re.escape(section)} -->)(.*?)(<!-- /section:{re.escape(section)} -->)'
    
    match = re.search(section_pattern, existing, re.DOTALL)
    if match:
        existing_content = match.group(2).rstrip()
        new_section = f"{match.group(1)}{existing_content}\n{content}\n{match.group(3)}"
        return existing[:match.start()] + new_section + existing[match.end():]
    else:
        # Section doesn't exist, create it
        return _add_or_replace_section(existing, section, content)


def read_research(project_dir: str) -> str:
    """Read research.md content.
    
    Args:
        project_dir: Path to project directory
        
    Returns:
        Content of research.md or empty string if not exists
    """
    research_path = Path(project_dir) / "files" / "research.md"
    if research_path.exists():
        return research_path.read_text(encoding="utf-8")
    return ""


def get_research_sections(project_dir: str) -> list[str]:
    """Get list of section names in research.md.
    
    Args:
        project_dir: Path to project directory
        
    Returns:
        List of section identifiers
    """
    content = read_research(project_dir)
    if not content:
        return []
    
    pattern = r'<!-- section:(\w+) -->'
    return re.findall(pattern, content)


def create_research_header(
    project_dir: str,
    topics: list[str],
) -> dict[str, Any]:
    """Create or update research.md header with metadata.
    
    Args:
        project_dir: Path to project directory
        topics: List of research topics
        
    Returns:
        Result dict
    """
    header = f"""# Research Summary

Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
Topics: {len(topics)}

## Topics Overview
{chr(10).join(f"- {t}" for t in topics)}
"""
    return apply_research_edit(project_dir, "create", "header", header)
