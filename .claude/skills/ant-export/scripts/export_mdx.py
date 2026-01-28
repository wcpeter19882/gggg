#!/usr/bin/env python3
"""Export slides to JSX and optionally start Ant Design preview server.

This script handles only file I/O and server management - no LLM calls.

The server uses CONTENT_MANAGER_PATH to find projects.
Access slides at: http://localhost:3001/slides/{projectId}

Usage:
    python scripts/export_mdx.py --project DIR [--no-server]
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

# Add parent directory for imports  
_script_dir = Path(__file__).parent
_skill_dir = _script_dir.parent
_skills_dir = _skill_dir.parent
_ant_export_skill_dir = _skills_dir / "ant-export"
sys.path.insert(0, str(_skill_dir))
sys.path.insert(0, str(_ant_export_skill_dir))

REACT_DIR = _ant_export_skill_dir / "react"

# Default content-manager path (temp folder)
DEFAULT_CONTENT_MANAGER_PATH = Path(tempfile.gettempdir()) / "content-manager"

# Port for Ant Design renderer (different from main export on 3000)
ANT_PORT = 3001


def get_project_id(project_dir: Path) -> str:
    """Extract project ID from project directory path."""
    return project_dir.name


def check_server_running(port: int = ANT_PORT) -> bool:
    """Check if server is already running."""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        result = sock.connect_ex(("localhost", port))
        return result == 0
    finally:
        sock.close()


def start_server(project_dir: Path) -> dict:
    """Start the preview server with CONTENT_MANAGER_PATH environment variable.
    
    The server serves ALL projects from the content-manager folder.
    Individual projects are accessed at /slides/{projectId}
    """
    if not REACT_DIR.exists():
        return {"error": f"React directory not found: {REACT_DIR}"}
    
    # Check node_modules
    node_modules = REACT_DIR / "node_modules"
    if not node_modules.exists():
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "install"], cwd=str(REACT_DIR), check=True)
    
    next_bin = REACT_DIR / "node_modules" / "next" / "dist" / "bin" / "next"
    
    # Set CONTENT_MANAGER_PATH to the parent of project_dir (the content-manager folder)
    content_manager_path = project_dir.parent
    
    env = os.environ.copy()
    env["CONTENT_MANAGER_PATH"] = str(content_manager_path.absolute())
    
    if sys.platform == "win32":
        process = subprocess.Popen(
            ["node", str(next_bin), "dev", "--port", str(ANT_PORT)],
            cwd=str(REACT_DIR),
            env=env,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        process = subprocess.Popen(
            ["node", str(next_bin), "dev", "--port", str(ANT_PORT)],
            cwd=str(REACT_DIR),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    
    project_id = get_project_id(project_dir)
    return {"pid": process.pid, "url": f"http://localhost:{ANT_PORT}", "project_id": project_id}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export slides to JSX and start Ant Design server"
    )
    parser.add_argument("--project", "-p", required=True, help="Project directory")
    parser.add_argument("--no-server", action="store_true", help="Don't start server")
    
    args = parser.parse_args()
    
    project_dir = Path(args.project)
    content_json_path = project_dir / "content.json"
    
    if not content_json_path.exists():
        print(json.dumps({"error": "content.json not found"}))
        return 1
    
    # Read content
    content = json.loads(content_json_path.read_text(encoding="utf-8"))
    
    # Handle slides structure - may be a list or nested object
    slides_data = content.get("slides", [])
    if isinstance(slides_data, dict):
        # Slides is an object with a nested "slides" array
        slides_data = slides_data.get("slides", [])
    
    slides = [s for s in slides_data if isinstance(s, dict) and s.get("state") == "active"]
    
    if not slides:
        print(json.dumps({"error": "No active slides found"}))
        return 1
    
    # Generate combined JSX with Slide wrappers
    theme_id = content.get("theme", {}).get("id", "business") if content.get("theme") else "business"
    
    jsx_parts = [
        "// Auto-generated Ant Design JSX - Do not edit manually",
        "",
        "export const meta = {",
        f'  title: "Presentation",',
        f'  theme: "{theme_id}",',
        f"  slideCount: {len(slides)},",
        "};",
        "",
    ]
    
    for i, slide in enumerate(slides):
        # Use "mdx" field (contains Ant Design JSX)
        mdx_content = slide.get("mdx") or slide.get("mdx_content", "")
        if mdx_content:
            # Wrap each slide's JSX in a <Slide index={N}> component
            jsx_parts.append(f"<Slide index={{{i}}}>")
            jsx_parts.append(mdx_content)
            jsx_parts.append("</Slide>")
            jsx_parts.append("")
    
    jsx_output = "\n".join(jsx_parts)
    
    # Write JSX file
    jsx_file = project_dir / "slides.jsx"
    jsx_file.write_text(jsx_output, encoding="utf-8")
    
    result = {
        "jsx_file": str(jsx_file),
        "slide_count": len(slides),
        "chars": len(jsx_output),
        "project_id": get_project_id(project_dir),
        "theme": theme_id,
    }
    
    # Start server if requested
    if not args.no_server:
        project_id = get_project_id(project_dir)
        if check_server_running():
            result["server_url"] = f"http://localhost:{ANT_PORT}/slides/{project_id}"
            result["server_status"] = "already_running"
        else:
            server_info = start_server(project_dir)
            if "error" in server_info:
                result["server_error"] = server_info["error"]
            else:
                result["server_url"] = f"{server_info['url']}/slides/{project_id}"
                result["server_pid"] = server_info["pid"]
    
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
