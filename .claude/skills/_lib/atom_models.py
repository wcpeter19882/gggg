"""Atom models for extracted content units.

Narrative Atoms: A story-driven atom system for presentations.

The system extracts seven types of atoms that map to narrative structure:
- BioAtom → Title/Intro slides (identity, history, credentials)
- FactAtom → Anchor slides (objective foundation, context)
- StatAtom → Data visualization slides (metrics, KPIs, numbers)
- QuoteAtom → Impact slides (verbatim memorable phrases)
- TensionAtom → Friction slides (conflict/problem)  
- ConceptAtom → Insight slides (solution/takeaway)
- VisualAtom → Visual instruction for slide design
"""
from datetime import datetime
from pathlib import Path
from typing import Any
import sys

# Add _lib to path for imports
_lib_dir = Path(__file__).parent
if str(_lib_dir) not in sys.path:
    sys.path.insert(0, str(_lib_dir))

from pydantic import BaseModel, Field
from patchable_context import PatchableContextBase
from source import SourceReference


class Atom(PatchableContextBase):
    """
    Base class for all atom types.
    
    Attributes:
        id: Unique identifier (inherited)
        rank: Ordering indicator (inherited)
        state: Current state (inherited)
        abstract: One-line summary of this atom
        source_ref: Link to source location
        visual: Visual representation suggestion
        created_at: When atom was extracted
        metadata: LLM generation metadata
    """
    
    abstract: str = Field(
        default="",
        description="One-line summary of this atom (max 100 chars)"
    )
    source_ref: SourceReference = Field(..., description="Link to source location")
    visual: str = Field(
        default="none",
        description="Suggested visual representation (e.g., chart, diagram, code, screenshot, photo, icon, quote-card, timeline, comparison-table, flow, architecture, before-after, list, table, graph, infographic, illustration, none)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When atom was extracted"
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="LLM generation metadata"
    )


class BioAtom(Atom):
    """
    Identity information: who the speaker/subject is, credentials, history.
    
    Maps to → Title/Intro slides
    Characteristics: Builds the "Who", establishes credibility
    Use for: Speaker intros, company backgrounds, team credentials
    
    Examples:
    - "John Smith, Principal Engineer at Google with 15 years experience"
    - "Founded in 2010, the company has grown to 500 employees"
    - "PhD in Computer Science from MIT, author of 3 books"
    
    Attributes:
        name: The person/entity name
        role: Role, title, or position
        credentials: Background, history, achievements
        affiliation: Company, organization, or institution
    """
    
    name: str = Field(..., min_length=1, description="The person or entity name")
    role: str = Field(
        default="",
        description="Role, title, or position"
    )
    credentials: str = Field(
        default="",
        description="Background, history, achievements"
    )
    affiliation: str = Field(
        default="",
        description="Company, organization, or institution"
    )


class FactAtom(Atom):
    """
    Objective information: context, status quo, definitions, architecture.
    
    Maps to → Anchor slides
    Characteristics: Objective, no emotion, foundational
    Use for: Background context, definitions, architecture descriptions
    NOT for: Specific numbers/metrics (use StatAtom), memorable quotes (use QuoteAtom)
    
    Examples:
    - "Architecture uses microservices pattern"
    - "Team size: 12 engineers"
    - "The system was built in 2020"
    
    Attributes:
        text: The factual statement
        category: Type of fact (definition, architecture, status, context)
    """
    
    text: str = Field(..., min_length=1, description="The factual statement")
    category: str = Field(
        default="other",
        description="Type of fact (e.g., definition, architecture, status, context)"
    )


class StatAtom(Atom):
    """
    Quantitative data: specific numbers, metrics, KPIs, percentages.
    
    Maps to → Data visualization slides (charts, big numbers)
    Characteristics: Numeric, measurable, impactful
    Use for: Metrics, KPIs, percentages, comparisons with numbers
    
    Examples:
    - "Latency reduced by 50%"
    - "200ms response time"
    - "3x battery drain improvement"
    - "95% accuracy rate"
    
    Attributes:
        value: The numeric value (e.g., "50%", "200ms", "3x")
        label: What the value represents (e.g., "Latency Reduction")
        context: Optional additional context
    """
    
    value: str = Field(..., min_length=1, description="The numeric value (e.g., '50%', '200ms', '3x')")
    label: str = Field(..., min_length=1, description="What the value represents (e.g., 'Latency Reduction')")
    context: str = Field(
        default="",
        description="Optional additional context for the statistic"
    )


class QuoteAtom(Atom):
    """
    Memorable verbatim phrase: punchlines, impactful statements, quotable moments.
    
    Maps to → Impact slides (big typography, high contrast)
    Characteristics: Verbatim, memorable, should NOT be summarized
    Use for: Perfect phrasing that should be preserved exactly
    
    Examples:
    - "Speed is not a feature. It is a requirement."
    - "We don't ship features. We ship outcomes."
    - "The best code is no code at all."
    
    Attributes:
        quote: The exact verbatim text (do not summarize or paraphrase)
        attribution: Who said it (speaker name, role, or empty if self)
        context: Optional context for when/why it was said
    """
    
    quote: str = Field(..., min_length=1, description="The exact verbatim quote (do not summarize)")
    attribution: str = Field(
        default="",
        description="Who said it (speaker name, role, or empty if self)"
    )
    context: str = Field(
        default="",
        description="Optional context for when/why it was said"
    )


class TensionAtom(Atom):
    """
    Conflict/problem: errors, contradictions, broken assumptions, trade-offs.
    
    Maps to → Friction slides  
    Characteristics: Negative/conflicting, story turning point
    
    Examples:
    - "But latency spiked to 2 seconds under load"
    - "The assumption that users prefer X was wrong"
    - "Trade-off: speed vs accuracy"
    
    Attributes:
        text: The tension/problem statement
        tension_type: Type of tension
        resolution_hint: Optional hint about how it was resolved
    """
    
    text: str = Field(..., min_length=1, description="The tension/problem statement")
    tension_type: str = Field(
        default="problem",
        description="Type of tension (e.g., problem, contradiction, trade-off, surprise, mistake)"
    )
    resolution_hint: str = Field(
        default="",
        description="Optional hint about resolution (links to ConceptAtom)"
    )


class ConceptAtom(Atom):
    """
    Solution/insight: key takeaways, methods, mental models, aha moments.
    
    Maps to → Insight slides
    Characteristics: Conclusive, subjective, actionable
    
    Examples:
    - "Solution: Cache at the edge"
    - "Key insight: Users value speed over features"
    - "Mental model: Think of it as a pipeline"
    
    Attributes:
        text: The concept/insight statement
        concept_type: Type of concept
        supporting_facts: IDs of FactAtoms that support this
    """
    
    text: str = Field(..., min_length=1, description="The concept/insight statement")
    concept_type: str = Field(
        default="insight",
        description="Type of concept (e.g., solution, insight, method, principle, takeaway)"
    )
    supporting_facts: list[str] = Field(
        default_factory=list,
        description="IDs of FactAtoms that support this concept"
    )


class VisualAtom(Atom):
    """
    Concrete visual mentioned in source: specific imagery, metaphors, demos.
    
    Used for → Slide visual concepts
    Characteristics: Vivid, concrete, memorable
    
    Examples:
    - "Screen filled with red error messages"
    - "Like a thousand-layer cake structure"
    - "The before/after comparison was striking"
    
    Attributes:
        description: The visual description
        visual_category: Type of visual
        related_atom: ID of atom this visual illustrates
    """
    
    description: str = Field(..., min_length=1, description="The visual description")
    visual_category: str = Field(
        default="other",
        description="Type of visual reference (e.g., metaphor, demo, screenshot, diagram, comparison)"
    )
    related_atom: str = Field(
        default="",
        description="ID of atom this visual illustrates"
    )
