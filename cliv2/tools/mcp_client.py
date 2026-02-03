"""MCP client for calling tools from cliv2 pipeline.

Provides synchronous wrapper for calling MCP tool functions directly.
Imports actual implementations from .claude/tools/*.py
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# Add skills _lib to path for shared modules
_lib_dir = Path(__file__).parent.parent.parent / ".claude" / "skills" / "_lib"
if _lib_dir.exists():
    sys.path.insert(0, str(_lib_dir))


def call_create_project(
    source_path: str,
    instruction: str = "",
    base_dir: Optional[str] = None,
    force: bool = False,
) -> dict[str, Any]:
    """Call the create-project MCP tool.
    
    Args:
        source_path: Path to source markdown file
        instruction: User instruction for the project
        base_dir: Optional base directory for projects
        force: Whether to overwrite existing project
        
    Returns:
        Result dict with project_dir, project_id, etc.
    """
    from project import create_project
    from project_utils import create_project_directory, copy_source_to_project, project_exists
    from constitution import extract_constitution, constitution_to_markdown
    from content_io import initialize_content_json, write_content_json
    
    source = Path(source_path)
    
    if not source.exists():
        return {"error": f"Source file not found: {source_path}"}
    
    # Read source content
    source_content = source.read_text(encoding="utf-8")
    source_name = source.stem
    
    # Create project with optional base_dir
    project = create_project(source_name, source_content, instruction, base_dir)
    
    # Check if exists
    if project_exists(project.id, base_dir) and not force:
        return {
            "error": f"Project already exists: {project.id}",
            "hint": "Use force=true to overwrite",
            "project_dir": project.directory
        }
    
    # Create directory structure
    create_project_directory(project, force=force)
    
    # Copy source file
    copy_source_to_project(project, source, f"{source_name}.md")
    
    # Save instruction if provided
    if instruction:
        instruction_path = Path(project.directory) / "instruction.md"
        instruction_path.write_text(instruction, encoding="utf-8")
    
    # Extract constitution (rule-based, no LLM)
    constitution = extract_constitution(instruction)
    constitution_md = constitution_to_markdown(constitution)
    Path(project.directory, "constitution.md").write_text(constitution_md, encoding="utf-8")
    
    # Initialize content.json
    content = initialize_content_json(project, constitution, instruction)
    write_content_json(project.content_json_path, content)
    
    return {
        "project_id": project.id,
        "project_dir": project.directory,
        "content_json": project.content_json_path,
        "success": True,
    }


def call_apply_patch(
    project_dir: str,
    target: str,
    data: Any,
) -> dict[str, Any]:
    """Call the apply-patch MCP tool.
    
    Args:
        project_dir: Path to project directory
        target: Section to update (atoms, theme, slides, story, constitution, issues)
        data: Data to apply
        
    Returns:
        Result dict with success status
    """
    project_path = Path(project_dir)
    content_json_path = project_path / "content.json"
    
    if not content_json_path.exists():
        return {"error": f"content.json not found at {content_json_path}"}
    
    # Read current content
    try:
        content = json.loads(content_json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON in content.json: {e}"}
    
    # Apply patch based on target
    valid_targets = ["atoms", "theme", "slides", "story", "constitution", "issues"]
    if target not in valid_targets:
        return {"error": f"Invalid target '{target}'. Must be one of: {valid_targets}"}
    
    # Special handling for slides: parse MDX format and merge
    if target == "slides":
        if isinstance(data, str):
            # Parse MDX-like format
            import re
            pattern = r'<Slide\s+(?:id=["\']([^"\']+)["\'])?\s*(?:index=\{?(\d+)\}?)?\s*(?:rank=\{?(\d+)\}?)?\s*>(.*?)</Slide>'
            matches = re.findall(pattern, data, re.DOTALL)
            
            new_slides = []
            for i, match in enumerate(matches):
                slide_id = match[0] or f"slide_{i+1}"
                index = int(match[1]) if match[1] else i
                rank = int(match[2]) if match[2] else index
                content_mdx = match[3].strip()
                
                new_slides.append({
                    "id": slide_id,
                    "rank": rank,
                    "mdx": content_mdx,
                    "state": "active"
                })
            
            if not new_slides:
                return {"error": "No valid <Slide> tags found in MDX content"}
            
            # Merge with existing slides
            existing_slides = content.get("slides", [])
            existing_by_id = {s.get("id"): s.copy() for s in existing_slides if isinstance(s, dict)}
            
            for slide in new_slides:
                slide_id = slide["id"]
                if slide_id in existing_by_id:
                    existing_by_id[slide_id].update(slide)
                else:
                    existing_by_id[slide_id] = slide
            
            merged = list(existing_by_id.values())
            merged.sort(key=lambda s: s.get("rank", 999))
            content["slides"] = merged
        elif isinstance(data, list):
            content["slides"] = data
        else:
            return {"error": "slides data must be string (MDX) or list of objects"}
    else:
        # Direct replacement for other targets
        content[target] = data
    
    if "metadata" in content:
        content["metadata"]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Write back
    content_json_path.write_text(
        json.dumps(content, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    
    return {"success": True, "target": target}


def call_export_mdx(
    project_dir: str,
    renderer: str = "antd",
    start_server: bool = True,
) -> dict[str, Any]:
    """Call the export-mdx MCP tool.
    
    Args:
        project_dir: Path to project directory
        renderer: Renderer to use (antd or original)
        start_server: Whether to start preview server
        
    Returns:
        Result dict with output path and preview URL
    """
    project_path = Path(project_dir)
    content_json_path = project_path / "content.json"
    
    if not content_json_path.exists():
        return {"error": f"content.json not found at {content_json_path}"}
    
    # Read content
    try:
        content = json.loads(content_json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON in content.json: {e}"}
    
    # Get slides
    slides_data = content.get("slides", [])
    if isinstance(slides_data, dict):
        slides_data = slides_data.get("slides", [])
    
    slides = [s for s in slides_data if isinstance(s, dict) and s.get("state") == "active"]
    
    if not slides:
        return {"error": "No active slides found", "hint": "Ensure slides have state='active'"}
    
    # Determine output file based on renderer
    output_file = "slides.jsx" if renderer == "antd" else "slides.mdx"
    port = 3001 if renderer == "antd" else 3000
    
    # Generate combined output
    theme_id = content.get("theme", {}).get("id", "business") if content.get("theme") else "business"
    
    output_parts = [
        f"// Auto-generated {'JSX' if renderer == 'antd' else 'MDX'} - Do not edit manually",
        "",
        "export const meta = {",
        f'  title: "Presentation",',
        f'  theme: "{theme_id}",',
        f'  renderer: "{renderer}",',
        f"  slideCount: {len(slides)},",
        "};",
        "",
    ]
    
    for i, slide in enumerate(slides):
        mdx_content = slide.get("mdx") or slide.get("layout") or slide.get("mdx_content", "")
        if mdx_content:
            output_parts.append(f"<Slide index={{{i}}}>")
            output_parts.append(mdx_content)
            output_parts.append("</Slide>")
            output_parts.append("")
    
    output_text = "\n".join(output_parts)
    
    # Write output file
    output_path = project_path / output_file
    output_path.write_text(output_text, encoding="utf-8")
    
    project_id = project_path.name
    
    return {
        "success": True,
        "output_path": str(output_path),
        "preview_url": f"http://localhost:{port}/slides/{project_id}",
        "port": port,
        "slide_count": len(slides),
    }


def call_read_section(
    project_dir: str,
    section: str,
) -> dict[str, Any]:
    """Read a section from content.json or project files.
    
    Args:
        project_dir: Path to project directory
        section: Section to read:
            - atoms, theme, slides, story, constitution, issues, metadata: from content.json
            - source: reads all files from files/ directory
            - all: returns content.json + source files
        
    Returns:
        Section data
    """
    project_path = Path(project_dir)
    content_json_path = project_path / "content.json"
    
    if not content_json_path.exists():
        return {"error": f"content.json not found in {project_dir}"}
    
    try:
        content = json.loads(content_json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON: {e}"}
    
    # Read source files from files/ directory
    def read_source_files() -> str:
        files_dir = project_path / "files"
        if not files_dir.exists():
            return ""
        
        source_parts = []
        for file_path in sorted(files_dir.glob("*")):
            if file_path.is_file() and file_path.suffix in [".md", ".txt", ".json"]:
                try:
                    file_content = file_path.read_text(encoding="utf-8")
                    source_parts.append(f"=== {file_path.name} ===\n{file_content}")
                except Exception:
                    pass
        return "\n\n".join(source_parts)
    
    if section == "source":
        return {"source": read_source_files()}
    
    if section == "all":
        # Include source files in the response
        content["source"] = read_source_files()
        return content
    
    return content.get(section, {})
