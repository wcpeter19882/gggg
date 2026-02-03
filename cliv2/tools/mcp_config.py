"""MCP tool configuration for OpenHands SDK.

Discovers MCP server scripts from .claude/tools/ and builds
configuration for OpenHands Agent.
"""
import sys
from pathlib import Path
from typing import Optional


def get_mcp_config(tools_dir: Optional[Path] = None) -> dict:
    """Build MCP server configuration for OpenHands SDK.
    
    Discovers mcp_*.py scripts and creates server configs.
    
    Args:
        tools_dir: Directory containing MCP server scripts.
                   Defaults to .claude/tools/ in current directory.
    
    Returns:
        MCP configuration dict for OpenHands Agent
    """
    if tools_dir is None:
        tools_dir = Path(".claude/tools")
    
    tools_path = tools_dir.resolve()
    python_exe = sys.executable
    
    servers = {}
    
    # Known MCP server scripts
    mcp_scripts = [
        ("create-project", "mcp_create_project.py"),
        ("apply-patch", "mcp_apply_patch.py"),
        ("export-mdx", "mcp_export_mdx.py"),
    ]
    
    for server_name, script_name in mcp_scripts:
        script_path = tools_path / script_name
        if script_path.exists():
            servers[server_name] = {
                "command": python_exe,
                "args": [str(script_path)],
            }
    
    return {"mcpServers": servers}


def discover_mcp_scripts(tools_dir: Optional[Path] = None) -> list[Path]:
    """Discover all MCP server scripts in the tools directory.
    
    Args:
        tools_dir: Directory containing MCP server scripts.
                   Defaults to .claude/tools/ in current directory.
    
    Returns:
        List of paths to MCP server scripts
    """
    if tools_dir is None:
        tools_dir = Path(".claude/tools")
    
    tools_path = tools_dir.resolve()
    
    if not tools_path.exists():
        return []
    
    # Find all mcp_*.py files
    return list(tools_path.glob("mcp_*.py"))


def validate_mcp_config(config: dict) -> bool:
    """Validate MCP configuration.
    
    Args:
        config: MCP configuration dict
        
    Returns:
        True if configuration is valid
    """
    if "mcpServers" not in config:
        return False
    
    servers = config["mcpServers"]
    if not isinstance(servers, dict):
        return False
    
    for name, server_config in servers.items():
        if "command" not in server_config:
            return False
        if "args" not in server_config:
            return False
    
    return True
