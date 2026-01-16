"""Constitution extraction for content-manager skill.

DirectTool: No LLM needed, uses pattern matching to extract global rules from user instruction.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Optional, List

# Add skill directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from content_json import Constitution, ToneType


def parse_intent_simple(instruction: str) -> dict:
    """
    Simple intent parsing from instruction text.
    
    Extracts:
    - tone: professional, casual, academic, etc.
    - slide_count: target number of slides
    - density: sparse, normal, dense
    
    Returns dict with parsed values.
    """
    instruction_lower = instruction.lower()
    result = {
        "tone": None,
        "slide_count": None,
        "density": None,
        "is_create": True,  # Default to create action
    }
    
    # Detect tone
    tone_patterns = {
        "professional": ["professional", "formal", "business"],
        "casual": ["casual", "informal", "friendly", "conversational"],
        "academic": ["academic", "scholarly", "research"],
        "creative": ["creative", "artistic", "innovative"],
        "technical": ["technical", "developer", "engineering"],
        "marketing": ["marketing", "promotional", "sales"],
        "minimal": ["minimal", "minimalist", "clean"],
        "neutral": ["neutral", "objective", "balanced"],
    }
    
    for tone, keywords in tone_patterns.items():
        if any(kw in instruction_lower for kw in keywords):
            result["tone"] = tone
            break
    
    # Detect slide count
    slide_patterns = [
        r"(\d+)\s*slides?",
        r"slides?[:=]\s*(\d+)",
        r"target\s*(\d+)\s*slides?",
        r"maximum\s*(\d+)\s*slides?",
        r"(\d+)\s*page",
    ]
    for pattern in slide_patterns:
        match = re.search(pattern, instruction_lower)
        if match:
            result["slide_count"] = int(match.group(1))
            break
    
    # Detect density
    if any(word in instruction_lower for word in ["sparse", "minimal", "less content", "fewer words"]):
        result["density"] = "sparse"
    elif any(word in instruction_lower for word in ["dense", "packed", "detailed", "more content"]):
        result["density"] = "dense"
    else:
        result["density"] = "normal"
    
    # Detect if it's a refinement vs create
    refinement_words = ["refine", "edit", "change", "modify", "update", "fix", "merge", "split"]
    if any(word in instruction_lower for word in refinement_words):
        result["is_create"] = False
    
    return result


def detect_audience(instruction: str) -> Optional[str]:
    """Detect target audience from instruction."""
    instruction_lower = instruction.lower()
    audience_keywords = {
        "executive": ["executive", "exec", "leadership", "c-suite", "ceo", "cfo", "cto", "cio", "vp", "director", "board"],
        "technical": ["technical", "engineering", "developer", "engineer", "architect", "devops", "sre"],
        "sales": ["sales", "customer", "client", "prospect", "account"],
        "general": ["team", "all-hands", "company", "stakeholder"],
    }
    for audience, keywords in audience_keywords.items():
        for kw in keywords:
            if kw in instruction_lower:
                return audience
    return None


def extract_constitution(instruction: str) -> Constitution:
    """
    Extract constitution from user instruction via pattern matching.
    
    This is a DirectTool - no LLM needed.
    
    Constitution is for PERSISTENT rules that apply across the presentation:
    - Tone settings
    - Style rules
    - Content exclusions
    - Content requirements
    - Target slide count
    
    Args:
        instruction: User instruction text
        
    Returns:
        Constitution with extracted rules
    """
    intent = parse_intent_simple(instruction)
    instruction_lower = instruction.lower()
    
    # Extract tone
    tone: Optional[ToneType] = intent.get("tone")
    
    # Extract slide count
    target_slides: Optional[int] = intent.get("slide_count")
    
    # Build style rules
    style_rules: List[str] = []
    
    if intent.get("is_create", True):
        style_rules.append("Start with a title slide")
    
    density = intent.get("density")
    if density:
        density_map = {
            "sparse": "Use minimal content per slide, prefer larger fonts",
            "normal": "Balance content density",
            "dense": "Pack more content per slide, use smaller fonts"
        }
        if density in density_map:
            style_rules.append(density_map[density])
    
    # Parse keywords for style rules
    if "no animation" in instruction_lower:
        style_rules.append("No animations")
    if "minimalist" in instruction_lower or "clean" in instruction_lower:
        style_rules.append("Minimalist design, plenty of whitespace")
    if "bold" in instruction_lower or "impactful" in instruction_lower:
        style_rules.append("Use bold typography for impact")
    if "data" in instruction_lower or "chart" in instruction_lower:
        style_rules.append("Include data visualizations where appropriate")
    
    # Audience-aware content rules
    audience = detect_audience(instruction_lower)
    if audience:
        style_rules.append(f"Target audience: {audience}")
        if audience in ("executive", "leadership", "c-suite", "board"):
            style_rules.append("Use business-impact quotes, avoid technical jargon")
            style_rules.append("Focus on ROI, risk, and strategic value")
        elif audience in ("technical", "engineering", "developer"):
            style_rules.append("Include technical details and architecture")
            style_rules.append("Use domain-specific terminology")
        elif audience in ("sales", "customer", "client"):
            style_rules.append("Focus on customer pain points and solutions")
            style_rules.append("Use customer success stories and testimonials")
    
    # Extract content exclusions
    content_exclusions: List[str] = []
    exclusion_patterns = [
        r"do not include\s+(.+?)(?:\.|$)",
        r"exclude\s+(.+?)(?:\.|$)",
        r"no\s+(.+?)\s+(?:in|on)\s+(?:the\s+)?slides?",
        r"without\s+(.+?)(?:\.|$)",
    ]
    for pattern in exclusion_patterns:
        matches = re.findall(pattern, instruction_lower)
        content_exclusions.extend(matches)
    
    # Extract content requirements
    content_requirements: List[str] = []
    requirement_patterns = [
        r"must include\s+(.+?)(?:\.|$)",
        r"always include\s+(.+?)(?:\.|$)",
        r"include\s+(.+?)\s+(?:in|on)\s+(?:the\s+)?(?:final|last)\s+slide",
    ]
    for pattern in requirement_patterns:
        matches = re.findall(pattern, instruction_lower)
        content_requirements.extend(matches)
    
    # Detect verbose mode
    verbose = any(word in instruction_lower for word in ["verbose", "debug", "log all", "save patches"])
    
    # Detect refinement rounds
    refinement_rounds = 1  # Default
    refinement_patterns = [
        r"(\d+)\s*refinement\s*rounds?",
        r"refine\s*(\d+)\s*times?",
        r"refinement[:=]\s*(\d+)",
        r"no\s*refine",  # Special case for 0 rounds
    ]
    for pattern in refinement_patterns:
        match = re.search(pattern, instruction_lower)
        if match:
            if "no refine" in pattern:
                refinement_rounds = 0
            else:
                refinement_rounds = int(match.group(1))
            break
    
    return Constitution(
        tone=tone,
        style_rules=style_rules,
        content_exclusions=content_exclusions,
        content_requirements=content_requirements,
        target_slides=target_slides,
        verbose=verbose,
        refinement_rounds=refinement_rounds,
    )


def constitution_to_markdown(constitution: Constitution) -> str:
    """
    Convert constitution to human-readable markdown.
    
    Used for constitution.md file in project directory.
    """
    lines = ["# Constitution", ""]
    
    if constitution.tone:
        lines.append(f"**Tone**: {constitution.tone}")
        lines.append("")
    
    if constitution.target_slides:
        lines.append(f"**Target Slides**: {constitution.target_slides}")
        lines.append("")
    
    if constitution.verbose:
        lines.append(f"**Verbose**: true (all patches will be persisted to files)")
        lines.append("")
    
    if constitution.refinement_rounds is not None:
        lines.append(f"**Refinement Rounds**: {constitution.refinement_rounds}")
        lines.append("")
    
    if constitution.style_rules:
        lines.append("## Style Rules")
        for rule in constitution.style_rules:
            lines.append(f"- {rule}")
        lines.append("")
    
    if constitution.content_requirements:
        lines.append("## Content Requirements")
        for req in constitution.content_requirements:
            lines.append(f"- {req}")
        lines.append("")
    
    if constitution.content_exclusions:
        lines.append("## Content Exclusions")
        for exc in constitution.content_exclusions:
            lines.append(f"- {exc}")
        lines.append("")
    
    return "\n".join(lines)


__all__ = [
    "extract_constitution",
    "constitution_to_markdown",
    "parse_intent_simple",
    "detect_audience",
]
