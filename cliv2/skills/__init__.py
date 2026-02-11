"""Skill handlers for cliv2 subagent pipeline.

This module provides skill-specific handlers that define:
- Input: What context to pre-load before LLM call
- Output: How to save LLM results to content.json
- Prompt: Skill-specific prompt instructions

Each handler aligns with the ## Workflow section in the corresponding SKILL.md
but executes via Python pipeline (not Claude's MCP tools).
"""
from cliv2.skills.base import SkillHandler, SkillContext, SkillContextWithTarget, SkillInput, SkillOutput
from cliv2.skills.registry import get_handler, get_handler_for_stage, list_handlers

__all__ = [
    "SkillHandler",
    "SkillContext",
    "SkillContextWithTarget",
    "SkillInput",
    "SkillOutput",
    "get_handler",
    "get_handler_for_stage",
    "list_handlers",
]
