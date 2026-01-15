"""Pipeline tools for slide generation.

Each tool is in its own file:
- constitution.py: Extract rules from user instruction (DirectTool)
- atoms.py: Extract content atoms from source (LLMTool)
- theme.py: Load or generate themes (LLMTool)
- src/paged/content.py: Generate slides from atoms (LLMTool, depends on layout engine)
- src/paged/export.py: Render slides to output format (DirectTool, depends on layout render)

Usage:
    from src.tools import get_tool, get_all_descriptions
    
    # Get tool by name
    tool = get_tool("content", verbose=True)
    
    # Get all tool descriptions for planner
    descriptions = get_all_descriptions()
"""
from src.common.tool_protocol import (
    Tool,
    DirectTool,
    LLMTool,
    ToolContext,
    ToolPatch,
    ToolDescription,
    register_tool,
    get_tool,
    get_all_tools,
    get_all_descriptions,
    get_all_descriptions_structured,
)

# Import tools to register them
from src.tools import constitution
from src.tools import atoms
from src.tools import theme
from src.tools import codegen
# Content and export are in src/paged (connect to layout/render)
from src.paged import content
from src.paged import export

__all__ = [
    # Protocol
    "Tool",
    "DirectTool",
    "LLMTool",
    "ToolContext",
    "ToolPatch",
    "ToolDescription",
    # Registry
    "register_tool",
    "get_tool",
    "get_all_tools",
    "get_all_descriptions",
    "get_all_descriptions_structured",
]
