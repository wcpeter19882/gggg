"""MCP client for calling tools from cliv2 pipeline.

Provides synchronous wrapper for calling MCP tool functions directly.
Imports actual implementations from .claude/tools/*.py
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import yaml

# Add skills _lib to path for shared modules
_lib_dir = Path(__file__).parent.parent.parent / ".claude" / "skills" / "_lib"
if _lib_dir.exists():
    sys.path.insert(0, str(_lib_dir))


def _extract_pptx_text(pptx_path: Path) -> str:
    """Extract text content from a PowerPoint file.
    
    Args:
        pptx_path: Path to .pptx file
        
    Returns:
        Extracted text as markdown-formatted string
    """
    try:
        from pptx import Presentation
    except ImportError:
        return f"[PPTX: python-pptx not installed]"
    
    try:
        prs = Presentation(str(pptx_path))
        slides_text = []
        
        for slide_num, slide in enumerate(prs.slides, 1):
            slide_content = [f"## Slide {slide_num}"]
            
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    if hasattr(shape, "text_frame"):
                        for para in shape.text_frame.paragraphs:
                            para_text = para.text.strip()
                            if para_text:
                                slide_content.append(para_text)
                    else:
                        slide_content.append(shape.text.strip())
                
                # Handle tables
                if hasattr(shape, "has_table") and shape.has_table:
                    table = shape.table
                    table_rows = []
                    for row in table.rows:
                        row_cells = [cell.text.strip() for cell in row.cells]
                        table_rows.append(" | ".join(row_cells))
                    if table_rows:
                        slide_content.append("\n".join(table_rows))
            
            if len(slide_content) > 1:
                slides_text.append("\n".join(slide_content))
        
        return "\n\n".join(slides_text) if slides_text else ""
    except Exception as e:
        return f"[PPTX extraction error: {e}]"


def _fix_yaml_colons(yaml_str: str) -> str:
    """Fix YAML values that contain unquoted colons.
    
    YAML interprets `key: value: more` as invalid because the second colon
    looks like a mapping separator. This function quotes such values.
    
    Example:
        story: Make the risk concrete: AI in the meeting
    Becomes:
        story: "Make the risk concrete: AI in the meeting"
    """
    lines = yaml_str.split('\n')
    fixed_lines = []
    
    for line in lines:
        # Skip empty lines or lines that don't look like key-value pairs
        if not line.strip() or not ':' in line:
            fixed_lines.append(line)
            continue
        
        # Find the first colon (key separator)
        first_colon = line.find(':')
        if first_colon == -1:
            fixed_lines.append(line)
            continue
        
        key = line[:first_colon]
        value = line[first_colon + 1:]
        
        # Skip if value is empty or already quoted
        value_stripped = value.strip()
        if not value_stripped or value_stripped.startswith('"') or value_stripped.startswith("'"):
            fixed_lines.append(line)
            continue
        
        # Check if value contains another colon (the problem case)
        if ':' in value_stripped:
            # Quote the value
            # Escape any existing quotes in the value
            value_escaped = value_stripped.replace('"', '\\"')
            fixed_lines.append(f'{key}: "{value_escaped}"')
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


def _parse_mdx_slides(data: str) -> list[dict]:
    """Parse YAML frontmatter + content format into slides.
    
    Format:
    ---
    id: slide_01
    rank: 1
    density: moderate
    intent: statement
    category: Situation
    story: What audience should understand
    ---
    # Headline
    
    Content (markdown for storyline, JSX for layout)
    
    ---
    id: slide_02
    ...
    
    Skips batch_info blocks (used for batching metadata).
    
    Returns:
        List of slide dicts with parsed metadata and content
    """
    slides = []
    
    # Split by --- at line start, keeping track of frontmatter vs content
    # Pattern: start with ---, then YAML, then ---, then content until next ---
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*?)(?=^---\s*\n|\Z)'
    matches = re.findall(pattern, data, re.MULTILINE | re.DOTALL)
    
    for frontmatter_str, content in matches:
        try:
            # Fix YAML values with unquoted colons before parsing
            frontmatter_str_fixed = _fix_yaml_colons(frontmatter_str)
            frontmatter = yaml.safe_load(frontmatter_str_fixed)
            if not isinstance(frontmatter, dict):
                continue
            
            # Skip batch_info blocks (batching metadata, not a slide)
            if "batch_info" in frontmatter:
                continue
            
            # Skip if no id field (not a valid slide)
            if "id" not in frontmatter:
                continue
            
            slide_id = frontmatter.get("id")
            
            # Skip slide_end marker (used to signal end of content)
            if slide_id == "slide_end":
                continue
            
            slide = {
                "id": slide_id,
                "rank": frontmatter.get("rank", len(slides) + 1),
            }
            
            # Copy over known metadata fields
            for field in ["density", "intent", "category", "story", "transition_to", "modifier", "images"]:
                if field in frontmatter:
                    slide[field] = frontmatter[field]
            
            # Content field: markdown for storyline, mdx for layout
            content_stripped = content.strip()
            if content_stripped:
                # If content looks like JSX (has < tags), put in mdx field
                if re.search(r'<[A-Z][a-zA-Z]*', content_stripped):
                    slide["mdx"] = content_stripped
                    slide["state"] = "active"
                else:
                    # Markdown content
                    slide["content"] = content_stripped
                    slide["state"] = "draft"
            
            slides.append(slide)
            
        except yaml.YAMLError:
            # Skip malformed frontmatter
            continue
    
    return slides


def call_create_project(
    instruction: str = "",
    source_path: Optional[str] = None,
    base_dir: Optional[str] = None,
    force: bool = False,
) -> dict[str, Any]:
    """Call the create-project MCP tool.
    
    Creates project directory structure. Source files are copied separately
    using copy_to_project, allowing flexible file handling by the LLM.
    
    Args:
        instruction: User instruction for the project (used for project ID)
        source_path: Optional source file path (legacy support)
        base_dir: Optional base directory for projects
        force: Whether to overwrite existing project
        
    Returns:
        Result dict with project_dir, project_id, etc.
    """
    from project import create_project
    from project_utils import create_project_directory, copy_source_to_project, project_exists
    from content_io import initialize_content_json, write_content_json
    
    # Generate project name from instruction or timestamp
    if instruction:
        # Use first few words of instruction as project name
        words = instruction.split()[:3]
        source_name = "_".join(w.lower() for w in words if w.isalnum())[:30] or "project"
    else:
        source_name = f"project_{datetime.now().strftime('%H%M%S')}"
    
    # Create project - source_content not used for ID generation
    project = create_project(source_name, "", instruction, base_dir)
    
    # Check if exists
    if project_exists(project.id, base_dir) and not force:
        return {
            "error": f"Project already exists: {project.id}",
            "hint": "Use force=true to overwrite",
            "project_dir": project.directory
        }
    
    # Create directory structure
    create_project_directory(project, force=force)
    
    # Legacy support: copy source file if provided
    if source_path:
        source = Path(source_path)
        if source.exists():
            source_ext = source.suffix.lower()
            if source_ext == ".pptx":
                copy_source_to_project(project, source, "template.pptx")
            else:
                copy_source_to_project(project, source, source.name)
    
    # Save instruction if provided
    if instruction:
        instruction_path = Path(project.directory) / "instruction.md"
        instruction_path.write_text(instruction, encoding="utf-8")
    
    # NOTE: Constitution is now managed by orchestrator via constitution subagent
    # Initialize content.json with empty constitution (will be populated by subagent)
    content = initialize_content_json(project, {}, instruction)
    write_content_json(project.content_json_path, content)
    
    return {
        "project_id": project.id,
        "project_dir": project.directory,
        "content_json": project.content_json_path,
        "success": True,
        "note": "Constitution will be extracted by constitution subagent",
    }


def call_copy_to_project(
    project_dir: str,
    file_path: str = None,
    dest_name: str = None,
    purpose: str = "source",
    content: str = None,
) -> dict[str, Any]:
    """Copy a file or write content to the project directory.
    
    Two modes:
    1. Copy file: provide file_path + dest_name
    2. Write content: provide content + dest_name (for user-provided context)
    
    Args:
        project_dir: Path to project directory
        file_path: Path to source file (mode 1)
        dest_name: Destination filename (e.g., "company_overview.md", "market_data.md")
        purpose: File purpose - "source", "template", "context", "data", "images"
        content: Text content to write directly (mode 2)
        
    Returns:
        Result dict with dest_path
    """
    import shutil
    
    project_path = Path(project_dir)
    
    if not project_path.exists():
        return {"error": f"Project directory not found: {project_dir}"}
    
    if not dest_name:
        return {"error": "dest_name is required"}
    
    # Mode 2: Write content directly
    if content is not None:
        if not dest_name:
            return {"error": "dest_name required when writing content"}
        # Continue to destination logic below
        source = None
    # Mode 1: Copy from file
    elif file_path:
        source = Path(file_path)
        if not source.exists():
            return {"error": f"File not found: {file_path}"}
    else:
        return {"error": "Either file_path or content must be provided"}
    
    # Sanitize dest_name - extract just the filename if path separators present
    # This handles cases where LLM passes "context/file.md" instead of just "file.md"
    dest_name = Path(dest_name).name
    
    # Determine destination based on purpose
    files_dir = project_path / "files"
    files_dir.mkdir(parents=True, exist_ok=True)
    
    if purpose == "context":
        dest_dir = files_dir / "context"
        dest_dir.mkdir(exist_ok=True)
        dest_path = dest_dir / dest_name
    elif purpose == "data":
        dest_dir = files_dir / "data"
        dest_dir.mkdir(exist_ok=True)
        dest_path = dest_dir / dest_name
    elif purpose == "images":
        # Images go to project_dir/images/ (not files/images/)
        images_dir = project_path / "images"
        images_dir.mkdir(exist_ok=True)
        dest_path = images_dir / dest_name
    else:
        # source or template go directly in files/
        dest_path = files_dir / dest_name
    
    # Write content or copy file
    if content is not None:
        dest_path.write_text(content, encoding="utf-8")
    else:
        shutil.copy2(source, dest_path)
    
    return {
        "success": True,
        "dest_path": str(dest_path),
        "purpose": purpose,
        "file_name": dest_name,
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
            # Parse YAML frontmatter + content format
            # Format: ---\nid: slide_01\nrank: 1\n...\n---\ncontent
            new_slides = _parse_mdx_slides(data)
            
            if not new_slides:
                # Fallback: try legacy <Slide> tag format
                pattern = r'<Slide\s+(?:id=["\']([^"\']+)["\'])?\s*(?:index=\{?(\d+)\}?)?\s*(?:rank=\{?(\d+)\}?)?\s*>(.*?)</Slide>'
                matches = re.findall(pattern, data, re.DOTALL)
                
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
                # Fallback: try JSON format (legacy)
                try:
                    parsed = json.loads(data)
                    if isinstance(parsed, dict) and "slides" in parsed:
                        new_slides = parsed["slides"]
                    elif isinstance(parsed, list):
                        new_slides = parsed
                except json.JSONDecodeError:
                    pass
            
            if not new_slides:
                return {"error": f"No valid slides found. Expected YAML frontmatter format, <Slide> tags, or JSON. Got: {data[:200]}..."}
            
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
    
    # Read source files from files/ directory (including subdirectories)
    def read_source_files() -> str:
        files_dir = project_path / "files"
        if not files_dir.exists():
            return ""
        
        source_parts = []
        image_files = []
        
        # Use rglob("*") to recursively read all files including subdirectories
        for file_path in sorted(files_dir.rglob("*")):
            if file_path.is_file():
                # Get relative path from files/ for better labeling
                rel_path = file_path.relative_to(files_dir)
                # Text files: read directly
                if file_path.suffix.lower() in [".md", ".txt", ".json", ".vtt"]:
                    try:
                        file_content = file_path.read_text(encoding="utf-8")
                        source_parts.append(f"=== {rel_path} ===\n{file_content}")
                    except Exception:
                        pass
                # PPTX files: extract text content
                elif file_path.suffix.lower() == ".pptx":
                    try:
                        extracted = _extract_pptx_text(file_path)
                        if extracted:
                            source_parts.append(f"=== {rel_path} (extracted text) ===\n{extracted}")
                    except Exception:
                        pass
                # Image files: list path only (for LLM awareness)
                elif file_path.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]:
                    image_files.append(str(rel_path))
        
        # Append image file listing if any exist
        if image_files:
            source_parts.append(f"=== Available Images ===\n" + "\n".join(f"- {img}" for img in image_files))
        
        return "\n\n".join(source_parts)
    
    if section == "source":
        return {"source": read_source_files()}
    
    if section == "all":
        # Include source files in the response
        content["source"] = read_source_files()
        return content
    
    return content.get(section, {})


def call_extract_pptx_theme(
    pptx_path: str,
    project_dir: Optional[str] = None,
    theme_name: Optional[str] = None,
) -> dict[str, Any]:
    """Extract theme data from a PowerPoint template file.
    
    Calls the pptx_extractor directly (no MCP server needed).
    
    Args:
        pptx_path: Path to .pptx file
        project_dir: Project directory where extracted images will be saved
        theme_name: Optional theme name (defaults to filename stem)
        
    Returns:
        Extracted theme data dict with:
        - theme_name: Name of the theme
        - colors: Dict of color scheme (background, text, accent colors)
        - fonts: Dict of font scheme (major/minor fonts)
        - layouts: List of layout patterns with positions and background_image paths
    """
    from dataclasses import asdict
    
    pptx_file = Path(pptx_path)
    
    if not pptx_file.exists():
        return {"error": f"File not found: {pptx_path}"}
    
    if pptx_file.suffix.lower() != ".pptx":
        return {"error": f"Not a PowerPoint file: {pptx_path}"}
    
    # Determine output directory for extracted images
    output_dir: Path | None = None
    if project_dir:
        output_dir = Path(project_dir) / "images"
        output_dir.mkdir(parents=True, exist_ok=True)
    
    # Import the extractor
    tools_dir = Path(__file__).parent.parent.parent / ".claude" / "tools"
    sys.path.insert(0, str(tools_dir))
    
    try:
        from pptx_extractor import extract_theme
        
        extracted = extract_theme(pptx_file, theme_name, output_dir=output_dir)
        
        # Convert dataclass to dict
        result = asdict(extracted)
        
        # Rename 'name' to 'theme_name' for consistency
        result["theme_name"] = result.pop("name", pptx_file.stem.lower().replace(" ", "_"))
        
        # Flatten colors and typography for easier access
        if "colors" in result and isinstance(result["colors"], dict):
            # Keep colors as nested dict
            pass
        if "typography" in result and isinstance(result["typography"], dict):
            # Rename typography to fonts for API consistency
            result["fonts"] = {
                "display": result["typography"].get("font_display", "Inter, system-ui, sans-serif"),
                "body": result["typography"].get("font_body", "Inter, system-ui, sans-serif"),
                "mono": result["typography"].get("font_mono", "JetBrains Mono, ui-monospace, monospace"),
            }
        
        return result
        
    except ImportError as e:
        return {"error": f"Failed to import pptx_extractor: {e}"}
    except Exception as e:
        return {"error": f"Failed to extract theme: {e}"}
