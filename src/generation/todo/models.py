"""Todo models for task queue based pipeline execution.

This module defines the todo types that represent discrete tasks in the pipeline:
- constitution: Global rules and constraints (not LLM-based)
- atoms: Extract information from sources
- theme: Theme selection/generation
- content: Content generation with atom assignment
- export: Layout and render to output

Design principles:
1. Todos are resumable - can pick up from where left off
2. Todos are ordered but some can run in parallel
3. Each todo type has specific inputs/outputs
4. State is the single source of truth
"""
from enum import Enum
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field
from datetime import datetime


class TodoType(str, Enum):
    """Types of todos in the pipeline."""
    CONSTITUTION = "constitution"  # Update global rules (non-LLM, direct patch)
    ATOMS = "atoms"                # Extract atoms from source
    THEME = "theme"                # Generate/update theme
    STORY = "story"                # Plan story arc (atoms -> draft slides with story/visual_design)
    CONTENT = "content"            # Generate layouts/widgets (draft slides -> active slides)
    CODEGEN = "codegen"            # Generate React code for invented components
    EXPORT = "export"              # Layout + render


class TodoStatus(str, Enum):
    """Status of a todo item."""
    PENDING = "pending"        # Not started
    IN_PROGRESS = "in_progress"  # Currently executing
    COMPLETED = "completed"    # Finished successfully
    FAILED = "failed"          # Failed with error
    SKIPPED = "skipped"        # Skipped (not needed)


class ConstitutionPatch(BaseModel):
    """Patch for constitution updates.
    
    Constitution contains global rules that guide all downstream generation.
    These are NOT LLM-generated but derived directly from user intent.
    """
    # Style constraints
    style_rules: List[str] = Field(
        default_factory=list,
        description="Style rules like 'use professional tone', 'avoid jargon'"
    )
    
    # Content constraints
    content_exclusions: List[str] = Field(
        default_factory=list,
        description="Content to exclude like 'do not mention competitors'"
    )
    content_requirements: List[str] = Field(
        default_factory=list,
        description="Required content like 'must include call to action'"
    )
    
    # Structural constraints
    slide_count_target: Optional[int] = Field(
        default=None,
        description="Target number of slides (e.g., 10)"
    )
    slide_count_max: Optional[int] = Field(
        default=None,
        description="Maximum slides allowed"
    )
    
    # Layout constraints
    layout_preferences: List[str] = Field(
        default_factory=list,
        description="Layout preferences like 'prefer visual layouts', 'use data charts'"
    )
    
    # Audience and purpose
    audience: Optional[str] = Field(
        default=None,
        description="Target audience"
    )
    purpose: Optional[str] = Field(
        default=None,
        description="Presentation purpose"
    )
    tone: Optional[str] = Field(
        default=None,
        description="Tone (professional, casual, etc.)"
    )
    target_slides: Optional[int] = Field(
        default=None,
        description="Target number of slides"
    )
    
    # Theme and vibe selections from UI
    selected_theme: Optional[str] = Field(
        default=None,
        description="Theme ID selected by user (e.g., 'duolingo_v1')"
    )
    selected_vibe: Optional[str] = Field(
        default=None,
        description="Vibe selected by user (e.g., 'duolingo', 'professional')"
    )


class AtomsParams(BaseModel):
    """Parameters for atoms extraction todo."""
    source_path: str = Field(
        ...,
        description="Path to source file"
    )
    content_type: str = Field(
        default="text/plain",
        description="MIME type of source content"
    )
    extraction_prompt: str = Field(
        default="",
        description="Specific extraction guidance"
    )


class ThemeParams(BaseModel):
    """Parameters for theme generation todo."""
    theme_id: Optional[str] = Field(
        default=None,
        description="Specific theme ID to use (if user specified)"
    )
    visual_guidance: str = Field(
        default="",
        description="Visual guidance from intent"
    )
    tone: str = Field(
        default="professional",
        description="Visual tone"
    )
    generate_new: bool = Field(
        default=True,
        description="Whether to generate new theme or use existing"
    )


class AtomFilter(BaseModel):
    """Filter criteria for selecting atoms at execution time.
    
    Solves the planning problem: at planning time, atoms don't exist yet,
    so we can't specify atom_ids. Instead, we specify filter criteria
    that are evaluated when the content executor runs.
    """
    include_types: List[str] = Field(
        default_factory=list,
        description="Atom types to include (e.g., ['FACT', 'STAT', 'QUOTE']). Empty = all types."
    )
    exclude_types: List[str] = Field(
        default_factory=list,
        description="Atom types to exclude (e.g., ['BIO', 'VISUAL'])"
    )
    min_rank: Optional[int] = Field(
        default=None,
        description="Minimum atom rank to include (1=highest importance)"
    )
    max_rank: Optional[int] = Field(
        default=None,
        description="Maximum atom rank to include"
    )
    keywords: List[str] = Field(
        default_factory=list,
        description="Keywords to filter atoms by (matches abstract/text)"
    )
    exclude_keywords: List[str] = Field(
        default_factory=list,
        description="Keywords to exclude atoms by"
    )
    
    def apply(self, atoms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply filter criteria to a list of atoms.
        
        Args:
            atoms: List of atom dictionaries (from AtomCollection contexts)
            
        Returns:
            Filtered list of atoms matching criteria
        """
        result = []
        for atom in atoms:
            atom_type = atom.get("type", "").upper()
            atom_rank = atom.get("rank", 5)  # Default to mid-rank if not specified
            atom_abstract = atom.get("abstract", "").lower()
            atom_text = atom.get("text", "").lower()
            atom_content = f"{atom_abstract} {atom_text}"
            
            # Type inclusion filter
            if self.include_types:
                if atom_type not in [t.upper() for t in self.include_types]:
                    continue
            
            # Type exclusion filter
            if self.exclude_types:
                if atom_type in [t.upper() for t in self.exclude_types]:
                    continue
            
            # Rank filters
            if self.min_rank is not None and atom_rank < self.min_rank:
                continue
            if self.max_rank is not None and atom_rank > self.max_rank:
                continue
            
            # Keyword inclusion filter
            if self.keywords:
                if not any(kw.lower() in atom_content for kw in self.keywords):
                    continue
            
            # Keyword exclusion filter
            if self.exclude_keywords:
                if any(kw.lower() in atom_content for kw in self.exclude_keywords):
                    continue
            
            result.append(atom)
        
        return result


class StoryParams(BaseModel):
    """Parameters for story planning todo.
    
    Story tool plans the narrative arc and assigns atoms to slides.
    Output: draft slides with story, atoms, density, visual_design populated.
    Layout and widgets are empty (filled by content tool).
    """
    mode: str = Field(
        default="generate",
        description="Mode: 'generate' for full creation, 'refine' for editing existing story"
    )
    instruction: str = Field(
        default="",
        description="User instruction for story planning"
    )
    slide_count: Optional[int] = Field(
        default=None,
        description="Target number of slides"
    )
    atom_filter: Optional[AtomFilter] = Field(
        default=None,
        description="Filter criteria for selecting atoms"
    )


class ContentParams(BaseModel):
    """Parameters for content generation todo.
    
    Content tool takes draft slides (from story tool) and generates
    layouts and widgets based on story and visual_design.
    Depends on story tool completing first.
    """
    mode: str = Field(
        default="generate",
        description="Mode: 'generate' for full creation, 'refine' for editing specific slides"
    )
    instruction: str = Field(
        default="",
        description="User instruction for content generation"
    )
    slide_ids: List[str] = Field(
        default_factory=list,
        description="Specific slide IDs to generate (empty = all draft slides)"
    )


class CodegenParams(BaseModel):
    """Parameters for code generation todo.
    
    Codegen tool generates React components for InventComponent placeholders.
    """
    component_ids: List[str] = Field(
        default_factory=list,
        description="Specific component IDs to generate (empty = all invented components)"
    )


class ExportParams(BaseModel):
    """Parameters for export todo."""
    layout_engine: str = Field(
        default="slidev",
        description="Layout engine to use"
    )
    output_format: str = Field(
        default="html",
        description="Output format"
    )
    output_path: Optional[str] = Field(
        default=None,
        description="Output path"
    )


class TodoItem(BaseModel):
    """A single todo item in the task queue.
    
    Each todo represents a discrete, resumable task.
    """
    id: str = Field(
        ...,
        description="Unique ID for this todo"
    )
    type: TodoType = Field(
        ...,
        description="Type of todo"
    )
    status: TodoStatus = Field(
        default=TodoStatus.PENDING,
        description="Current status"
    )
    
    # Type-specific parameters
    params: Union[ConstitutionPatch, AtomsParams, ThemeParams, StoryParams, ContentParams, CodegenParams, ExportParams, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Type-specific parameters"
    )
    
    # Execution metadata
    created_at: str = Field(
        default_factory=lambda: datetime.now().isoformat()
    )
    started_at: Optional[str] = Field(default=None)
    completed_at: Optional[str] = Field(default=None)
    error: Optional[str] = Field(default=None)
    
    # Dependencies (other todo IDs that must complete first)
    depends_on: List[str] = Field(
        default_factory=list,
        description="IDs of todos that must complete before this one"
    )
    
    def is_ready(self, completed_ids: set) -> bool:
        """Check if this todo is ready to execute (all dependencies met)."""
        return all(dep_id in completed_ids for dep_id in self.depends_on)
    
    def mark_started(self):
        """Mark todo as started."""
        self.status = TodoStatus.IN_PROGRESS
        self.started_at = datetime.now().isoformat()
    
    def mark_completed(self):
        """Mark todo as completed."""
        self.status = TodoStatus.COMPLETED
        self.completed_at = datetime.now().isoformat()
    
    def mark_failed(self, error: str):
        """Mark todo as failed."""
        self.status = TodoStatus.FAILED
        self.completed_at = datetime.now().isoformat()
        self.error = error
    
    def mark_skipped(self):
        """Mark todo as skipped."""
        self.status = TodoStatus.SKIPPED
        self.completed_at = datetime.now().isoformat()


class TodoQueue(BaseModel):
    """Task queue for pipeline execution.
    
    The queue is the central coordination point:
    - Todos are added based on user intent
    - Executor picks up pending todos in dependency order
    - State is updated after each todo completes
    - Can resume from any point
    """
    todos: List[TodoItem] = Field(
        default_factory=list,
        description="List of todos in the queue"
    )
    
    def add(self, todo: TodoItem):
        """Add a todo to the queue."""
        # Check for duplicate ID
        if any(t.id == todo.id for t in self.todos):
            raise ValueError(f"Todo with ID '{todo.id}' already exists")
        self.todos.append(todo)
    
    def get_next_ready(self) -> Optional[TodoItem]:
        """Get the next todo that is ready to execute.
        
        Returns:
            Next pending todo with all dependencies met, or None
        """
        completed_ids = {t.id for t in self.todos if t.status == TodoStatus.COMPLETED}
        
        for todo in self.todos:
            if todo.status == TodoStatus.PENDING and todo.is_ready(completed_ids):
                return todo
        return None
    
    def get_by_id(self, todo_id: str) -> Optional[TodoItem]:
        """Get a todo by ID."""
        for todo in self.todos:
            if todo.id == todo_id:
                return todo
        return None
    
    def get_by_type(self, todo_type: TodoType) -> List[TodoItem]:
        """Get all todos of a specific type."""
        return [t for t in self.todos if t.type == todo_type]
    
    def get_pending(self) -> List[TodoItem]:
        """Get all pending todos."""
        return [t for t in self.todos if t.status == TodoStatus.PENDING]
    
    def get_completed(self) -> List[TodoItem]:
        """Get all completed todos."""
        return [t for t in self.todos if t.status == TodoStatus.COMPLETED]
    
    def has_pending(self) -> bool:
        """Check if there are any pending todos."""
        return any(t.status == TodoStatus.PENDING for t in self.todos)
    
    def all_completed(self) -> bool:
        """Check if all todos are completed (or skipped)."""
        return all(
            t.status in (TodoStatus.COMPLETED, TodoStatus.SKIPPED) 
            for t in self.todos
        )
    
    def clear(self):
        """Clear all todos from queue."""
        self.todos.clear()
    
    def summary(self) -> str:
        """Get human-readable summary of queue status."""
        by_status = {}
        for todo in self.todos:
            status = todo.status.value
            if status not in by_status:
                by_status[status] = []
            by_status[status].append(f"{todo.type.value}:{todo.id}")
        
        lines = ["Todo Queue:"]
        for status, items in by_status.items():
            lines.append(f"  {status}: {', '.join(items)}")
        return '\n'.join(lines)
