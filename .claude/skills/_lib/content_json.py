"""
ContentJson model - the central data store for slides.

Simplified schema:
- project: Project metadata
- slides: List of slides with content and mdx
- metadata: Pipeline state

Removed (now separate files):
- constitution → constitution.md
- theme → {theme_name}.ts in React themes folder  
- atoms → deprecated, content extracted directly to slides
- layout/widgets → deprecated, JSX in mdx field
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


# Slide types
SlideState = Literal["draft", "active", "exported"]
SlideDensity = Literal["sparse", "normal", "dense"]
SlideIntent = Literal["statement", "evidence", "comparison", "process", "structure"]


class Slide(BaseModel):
    """A single slide in the presentation."""
    
    id: str = Field(..., description="Slide ID: slide_{nn}")
    rank: int = Field(default=1, description="Slide order (1-indexed)")
    state: SlideState = Field(default="draft", description="Slide processing state")
    
    # Story layer (from storyline subagent)
    story: str = Field(default="", description="Narrative purpose - what audience should understand")
    density: SlideDensity = Field(default="normal", description="Content density")
    intent: SlideIntent = Field(default="statement", description="Slide intent for layout selection")
    content: Dict[str, Any] = Field(default_factory=dict, description="Structured content from storyline")
    
    # Layout layer (from layout subagent)
    mdx: str = Field(default="", description="JSX/MDX content for rendering")


# Central data store
class ContentMetadata(BaseModel):
    """Metadata about the content.json state."""
    
    version: int = Field(default=1, description="Schema version number")
    pipeline_stage: Literal["initialized", "storyline", "layout", "exported"] = Field(
        default="initialized",
        description="Current pipeline stage"
    )
    last_instruction: str = Field(default="", description="Last user instruction processed")


class ContentJson(BaseModel):
    """
    Central data store for slides.
    
    Stored at: {project_dir}/content.json
    
    Other data stored separately:
    - constitution.md: Global rules (markdown)
    - research.md: Enriched content (markdown)
    - {theme}.ts: Theme config (in React themes folder)
    """
    
    project: Dict[str, Any] = Field(..., description="Project information")
    slides: List[Slide] = Field(default_factory=list, description="Presentation slides")
    metadata: ContentMetadata = Field(default_factory=ContentMetadata, description="Content metadata")


__all__ = [
    # Slides
    "SlideState",
    "SlideDensity", 
    "SlideIntent",
    "Slide",
    # Content
    "ContentMetadata",
    "ContentJson",
]
