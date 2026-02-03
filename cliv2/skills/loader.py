"""Skill loading for OpenHands SDK.

Loads skills from .claude/skills/ directory using OpenHands SDK's
skill loading utilities.
"""
from pathlib import Path
from typing import Optional

from cliv2.core.errors import SkillError


def load_skills(skills_dir: Optional[Path] = None) -> list:
    """Load all skills from the .claude/skills directory.
    
    Uses OpenHands SDK's load_skills_from_dir() for SKILL.md files.
    
    Args:
        skills_dir: Directory containing skill subdirectories.
                    Defaults to .claude/skills/ in current directory.
    
    Returns:
        List of Skill objects for AgentContext
    """
    if skills_dir is None:
        skills_dir = Path(".claude/skills")
    
    skills_path = skills_dir.resolve()
    
    if not skills_path.exists():
        return []
    
    try:
        # Import here to avoid import errors if SDK not installed
        from openhands.core.config import AgentSkillsConfig
    except ImportError:
        # SDK not installed, return empty list
        # Skills will be loaded from SKILL.md files directly
        return _load_skills_fallback(skills_path)
    
    # Use OpenHands SDK skill loading
    try:
        skills_config = AgentSkillsConfig(
            skills_dir=str(skills_path),
        )
        return skills_config.skills if hasattr(skills_config, 'skills') else []
    except Exception as e:
        raise SkillError(
            message="Failed to load skills",
            details=str(e),
            hint=f"Check skill files in {skills_path}"
        ) from e


def _load_skills_fallback(skills_path: Path) -> list:
    """Fallback skill loading when SDK is not available.
    
    Loads SKILL.md files as simple text content.
    
    Args:
        skills_path: Directory containing skill subdirectories
        
    Returns:
        List of skill information dicts
    """
    skills = []
    
    for skill_dir in skills_path.iterdir():
        if skill_dir.is_dir():
            skill_file = skill_dir / "SKILL.md"
            if skill_file.exists():
                skills.append({
                    "name": skill_dir.name,
                    "path": str(skill_file),
                    "content": skill_file.read_text(encoding="utf-8"),
                })
    
    return skills


def discover_skills(skills_dir: Optional[Path] = None) -> list[dict]:
    """Discover available skills in the skills directory.
    
    Args:
        skills_dir: Directory containing skill subdirectories.
                    Defaults to .claude/skills/ in current directory.
    
    Returns:
        List of skill info dicts with name and path
    """
    if skills_dir is None:
        skills_dir = Path(".claude/skills")
    
    skills_path = skills_dir.resolve()
    
    if not skills_path.exists():
        return []
    
    skills = []
    for skill_dir in skills_path.iterdir():
        if skill_dir.is_dir():
            skill_file = skill_dir / "SKILL.md"
            if skill_file.exists():
                skills.append({
                    "name": skill_dir.name,
                    "path": str(skill_file),
                })
    
    return skills


def get_skill_content(skill_name: str, skills_dir: Optional[Path] = None) -> str:
    """Get the content of a specific skill.
    
    Args:
        skill_name: Name of the skill
        skills_dir: Directory containing skill subdirectories
        
    Returns:
        Content of the SKILL.md file
        
    Raises:
        SkillError: If skill is not found
    """
    if skills_dir is None:
        skills_dir = Path(".claude/skills")
    
    skill_file = skills_dir / skill_name / "SKILL.md"
    
    if not skill_file.exists():
        raise SkillError(
            message=f"Skill not found: {skill_name}",
            skill_name=skill_name,
            hint=f"Check that {skill_file} exists"
        )
    
    return skill_file.read_text(encoding="utf-8")
