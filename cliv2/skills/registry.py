"""Skill handler registry.

Maps skill names to their handlers for the subagent pipeline.
"""
from typing import Optional

from cliv2.skills.base import SkillHandler
from cliv2.skills.theme_handler import ThemeHandler
from cliv2.skills.storyline_handler import StorylineHandler
from cliv2.skills.layout_handler import LayoutHandler
from cliv2.skills.research_handler import ResearchHandler
from cliv2.skills.export_handler import ExportHandler


# Registry of skill handlers
_HANDLERS: dict[str, SkillHandler] = {}


def _init_handlers():
    """Initialize handlers on first access."""
    global _HANDLERS
    if not _HANDLERS:
        _HANDLERS = {
            # Theme skill
            "theme": ThemeHandler(),
            "theme-generator": ThemeHandler(),
            
            # Storyline skill
            "storyline": StorylineHandler(),
            "storyline-planner": StorylineHandler(),
            
            # Layout skills
            "layout": LayoutHandler(),
            "ant-paged-layout": LayoutHandler(),
            "paged-layout-content": LayoutHandler(),  # Original renderer
            
            # Research skill
            "research": ResearchHandler(),
            "research-agent": ResearchHandler(),
            
            # Export skills
            "export": ExportHandler(),
            "ant-slides-export": ExportHandler(),
            "slides-export": ExportHandler(),
        }


def get_handler(skill_name: str) -> Optional[SkillHandler]:
    """Get handler for a skill.
    
    Args:
        skill_name: Skill name or alias
        
    Returns:
        SkillHandler or None if not found
    """
    _init_handlers()
    return _HANDLERS.get(skill_name)


def get_handler_for_stage(stage: str, renderer: str = "antd") -> Optional[SkillHandler]:
    """Get handler for a pipeline stage.
    
    Args:
        stage: Pipeline stage name (theme, storyline, layout, etc.)
        renderer: Renderer type (antd or original)
        
    Returns:
        SkillHandler or None if not found
    """
    _init_handlers()
    
    # Map stages to handlers
    stage_map = {
        "theme": "theme",
        "storyline": "storyline",
        "layout": "layout",
        "research": "research",
        "export": "export",
    }
    
    skill_name = stage_map.get(stage)
    if skill_name:
        return _HANDLERS.get(skill_name)
    
    return None


def list_handlers() -> list[str]:
    """List all registered handler names."""
    _init_handlers()
    return list(_HANDLERS.keys())
