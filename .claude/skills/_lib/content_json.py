"""
ContentJson model - the central data store for all generated content.

This is the single source of truth for all generated content within a project.
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


# Constitution types
ToneType = Literal[
    "professional", "casual", "academic", "creative", 
    "technical", "marketing", "minimal", "neutral"
]


class Constitution(BaseModel):
    """Global rules and constraints extracted from user instruction."""
    
    tone: Optional[ToneType] = Field(default=None, description="Presentation tone")
    style_rules: List[str] = Field(default_factory=list, description="Persistent style guidelines")
    content_exclusions: List[str] = Field(default_factory=list, description="Content to never include")
    content_requirements: List[str] = Field(default_factory=list, description="Content that must be included")
    target_slides: Optional[int] = Field(default=None, description="Maximum slide count constraint")
    verbose: bool = Field(default=False, description="If true, persist all patches to files for debugging")
    refinement_rounds: int = Field(default=1, description="Number of refinement rounds after validation (default: 1)")


# Theme types
class ThemeColors(BaseModel):
    """Color palette for theme."""
    
    primary: str = Field(..., description="Primary brand color")
    secondary: str = Field(default="#666666", description="Secondary color")
    accent: str = Field(..., description="Accent/highlight color")
    background: str = Field(default="#ffffff", description="Background color")
    text: str = Field(default="#1a1a1a", description="Primary text color")


class ThemeFonts(BaseModel):
    """Font configuration for theme."""
    
    heading: str = Field(default="Inter", description="Heading font family")
    body: str = Field(default="Inter", description="Body text font family")
    mono: str = Field(default="JetBrains Mono", description="Monospace font family")


class ThemeSpacing(BaseModel):
    """Spacing configuration for theme."""
    
    page_margin: str = Field(default="48px", description="Page margin")
    content_gap: str = Field(default="24px", description="Gap between content elements")


class Theme(BaseModel):
    """Visual styling configuration for slides."""
    
    id: str = Field(..., description="Theme identifier")
    name: str = Field(..., description="Human-readable theme name")
    colors: ThemeColors = Field(..., description="Color palette")
    fonts: ThemeFonts = Field(default_factory=ThemeFonts, description="Font configuration")
    spacing: ThemeSpacing = Field(default_factory=ThemeSpacing, description="Spacing configuration")


# Atom types
AtomType = Literal["BIO", "FACT", "STAT", "QUOTE", "TENSION", "CONCEPT", "VISUAL"]


class AtomMetadata(BaseModel):
    """Metadata for an atom."""
    
    confidence: float = Field(default=0.8, ge=0.0, le=1.0, description="Extraction confidence")
    keywords: List[str] = Field(default_factory=list, description="Keywords for this atom")


class Atom(BaseModel):
    """A discrete unit of content extracted from source material."""
    
    id: str = Field(..., description="Atom ID: {type}_{sequence}, e.g., stat_01")
    type: AtomType = Field(..., description="Category of content")
    content: str = Field(..., description="The actual content text")
    source_ref: str = Field(default="", description="Reference to source location")
    metadata: AtomMetadata = Field(default_factory=AtomMetadata, description="Atom metadata")


class AtomCollection(BaseModel):
    """Collection of atoms extracted from source."""
    
    atoms: List[Atom] = Field(default_factory=list, description="List of extracted atoms")
    source_hash: str = Field(default="", description="Hash of source content")


# Layout types
LayoutFamily = Literal["Bento", "Swiss", "Cinematic"]
LayoutVariant = Literal[
    # Bento variants
    "Standard", "HeroLeft", "HeroTop", "Quarter",
    # Swiss variants
    "Poster", "Asymmetry", "SplitTypo",
    # Cinematic variants
    "Split_50_50", "FullBleed", "Split_30_70"
]
SlotSize = Literal["S", "M", "L", "XL"]


class SlotPosition(BaseModel):
    """Position and dimensions of a layout slot."""
    
    x: float = Field(..., description="X position")
    y: float = Field(..., description="Y position")
    width: float = Field(..., description="Slot width")
    height: float = Field(..., description="Slot height")


class Slot(BaseModel):
    """A slot in a layout where content can be placed."""
    
    id: str = Field(..., description="Slot identifier")
    size: SlotSize = Field(..., description="Slot size category")
    position: SlotPosition = Field(..., description="Position and dimensions")


class Layout(BaseModel):
    """Layout strategy configuration for a slide."""
    
    family: LayoutFamily = Field(..., description="Layout family")
    variant: LayoutVariant = Field(..., description="Specific layout variant")
    slots: List[Slot] = Field(default_factory=list, description="Available slots")


# Widget types
WidgetCategory = Literal["Type", "Data"]
WidgetType = Literal[
    # Type.* widgets
    "Display", "Heading", "Body", "List", "Quote",
    # Data.* widgets
    "BigNum", "Trend", "Progress"
]
TrendDirection = Literal["up", "down", "flat"]


class WidgetContent(BaseModel):
    """Content payload for widgets."""
    
    # Type widgets
    text: Optional[str] = Field(default=None, description="Text content")
    items: Optional[List[str]] = Field(default=None, description="List items")
    level: Optional[int] = Field(default=None, description="Heading level")
    citation: Optional[str] = Field(default=None, description="Quote citation")
    
    # Data widgets
    value: Optional[Any] = Field(default=None, description="Numeric/string value")
    label: Optional[str] = Field(default=None, description="Value label")
    change: Optional[float] = Field(default=None, description="Change percentage")
    direction: Optional[TrendDirection] = Field(default=None, description="Trend direction")


class Widget(BaseModel):
    """Content widget placed in a layout slot."""
    
    id: str = Field(..., description="Widget identifier")
    category: WidgetCategory = Field(..., description="Widget category")
    type: WidgetType = Field(..., description="Widget type")
    slot_id: str = Field(..., description="Reference to layout slot")
    content: WidgetContent = Field(default_factory=WidgetContent, description="Widget content")


# Slide types
SlideState = Literal["draft", "active", "exported"]
SlideDensity = Literal["sparse", "normal", "dense"]


class Slide(BaseModel):
    """A single slide in the presentation."""
    
    id: str = Field(..., description="Slide ID: slide_{nn}")
    state: SlideState = Field(default="draft", description="Slide processing state")
    
    # Story layer (from storyline subagent)
    story: str = Field(default="", description="Narrative description")
    atoms: List[str] = Field(default_factory=list, description="Referenced atom IDs")
    density: SlideDensity = Field(default="normal", description="Content density")
    visual_design: str = Field(default="", description="Hint for layout selection")
    
    # Layout layer (from paged-layout-content subagent)
    layout: Optional[Layout] = Field(default=None, description="Layout configuration")
    widgets: List[Widget] = Field(default_factory=list, description="Widget instances")
    
    # Rendering parameters
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Rendering parameters")


# Central data store
class ContentMetadata(BaseModel):
    """Metadata about the content.json state."""
    
    version: int = Field(default=1, description="Schema version number")
    pipeline_stage: Literal["initialized", "atoms", "storyline", "layout", "exported"] = Field(
        default="initialized",
        description="Current pipeline stage"
    )
    last_instruction: str = Field(default="", description="Last user instruction processed")


class ContentJson(BaseModel):
    """
    Central data store - the single source of truth for all generated content.
    
    Stored at: {project_dir}/content.json
    """
    
    # Import Project here to avoid circular import
    project: Dict[str, Any] = Field(..., description="Project information")
    constitution: Constitution = Field(default_factory=Constitution, description="Global rules")
    theme: Optional[Theme] = Field(default=None, description="Visual theme")
    atoms: Optional[AtomCollection] = Field(default=None, description="Extracted atoms")
    slides: List[Slide] = Field(default_factory=list, description="Presentation slides")
    metadata: ContentMetadata = Field(default_factory=ContentMetadata, description="Content metadata")


__all__ = [
    # Constitution
    "ToneType",
    "Constitution",
    # Theme
    "ThemeColors",
    "ThemeFonts",
    "ThemeSpacing",
    "Theme",
    # Atoms
    "AtomType",
    "AtomMetadata",
    "Atom",
    "AtomCollection",
    # Layout
    "LayoutFamily",
    "LayoutVariant",
    "SlotSize",
    "SlotPosition",
    "Slot",
    "Layout",
    # Widgets
    "WidgetCategory",
    "WidgetType",
    "TrendDirection",
    "WidgetContent",
    "Widget",
    # Slides
    "SlideState",
    "SlideDensity",
    "Slide",
    # Content
    "ContentMetadata",
    "ContentJson",
]
