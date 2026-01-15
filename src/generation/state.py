"""Pipeline state management for todo-based generation.

Simplified state model:
- todos: Task queue (pending/completed tasks)
- source: Input file info
- constitution: Global rules and constraints
- themes: Theme registry
- atoms: Extracted content atoms
- slides: Generated slide JSONs

NOT in state:
- user_instruction: Input to planner, not persisted
- intent: Replaced by todos + constitution
- visual: Merged into themes registry
"""
from __future__ import annotations

import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import TYPE_CHECKING, Optional, Dict, Any, List
from pydantic import BaseModel, Field

# Direct import to avoid circular dependency via todo/__init__.py
# models.py has no dependency on state.py
from src.generation.todo.models import TodoQueue, ConstitutionPatch
from src.generation.atom.collection import AtomCollection


class SourceInfo(BaseModel):
    """Information about the source file."""
    path: str = Field(..., description="Path to source file")
    content_hash: str = Field(..., description="SHA256 hash of content for change detection")
    content_type: str = Field(default="text/plain", description="MIME type of content")
    
    @classmethod
    def from_file(cls, path: Path) -> "SourceInfo":
        """Create SourceInfo from a file path."""
        content = path.read_text(encoding='utf-8')
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        
        # Determine content type
        suffix = path.suffix.lower()
        content_type = {
            '.vtt': 'text/vtt',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.json': 'application/json',
        }.get(suffix, 'text/plain')
        
        return cls(
            path=str(path.absolute()),
            content_hash=content_hash,
            content_type=content_type
        )


class PipelineState(BaseModel):
    """Simplified state container for todo-based pipeline.
    
    Architecture:
        todos = planner(state, user_instruction)
        for todo in todos:
            patch = executor.do(todo)
            state.apply(patch)
    
    State is the single source of truth. User instruction is NOT stored -
    it's an input to the planner.
    """
    
    # Task queue - drives execution
    todos: TodoQueue = Field(
        default_factory=TodoQueue,
        description="Task queue with pending/completed todos"
    )
    
    # Source information
    source: Optional[SourceInfo] = Field(
        default=None,
        description="Source file info"
    )
    
    # Constitution - global rules (derived from user intent, not LLM)
    constitution: Optional[ConstitutionPatch] = Field(
        default=None,
        description="Global rules and constraints"
    )
    
    # Theme registry - all available themes by ID
    themes: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Theme registry keyed by theme ID"
    )
    
    # Active theme ID (preset or custom)
    active_theme: Optional[str] = Field(
        default=None,
        description="Active theme identifier (e.g., 'business' or 'theme_gen_123')"
    )
    
    # Project selection for export (slidev, duolingo, or react-mdx)
    project: str = Field(
        default="slidev",
        description="Project style for export: 'slidev' (default), 'duolingo', or 'react-mdx'"
    )
    
    # Extracted atoms
    atoms: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Extracted atoms from source"
    )
    
    # Generated slides
    slides: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Generated slide JSONs"
    )
    
    # Generated components (from codegen step)
    generated_components: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Generated React components keyed by component ID"
    )
    
    # Timestamps
    created_at: str = Field(
        default_factory=lambda: datetime.now().isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now().isoformat()
    )
    
    # Version tracking for iterative refinement
    version: int = Field(
        default=1,
        description="Version number, incremented on each instruction iteration"
    )
    
    # Instruction history for tracking what was applied
    instruction_history: List[str] = Field(
        default_factory=list,
        description="History of user instructions applied to this state"
    )
    
    # === CONSTITUTION METHODS ===
    
    def set_constitution(self, patch: ConstitutionPatch):
        """Set or merge constitution from a patch."""
        if self.constitution is None:
            self.constitution = patch
        else:
            # Merge patches - new values override, lists append unique
            current = self.constitution.model_dump()
            new = patch.model_dump()
            
            for key, value in new.items():
                if value is not None:
                    if isinstance(value, list) and isinstance(current.get(key), list):
                        current[key] = list(set(current[key] + value))
                    else:
                        current[key] = value
            
            self.constitution = ConstitutionPatch(**current)
        self._touch()
    
    def get_constitution(self) -> Optional[ConstitutionPatch]:
        """Get constitution."""
        return self.constitution
    
    # === VERSION METHODS ===
    
    def increment_version(self, instruction: str = "") -> int:
        """Increment version and record instruction.
        
        Args:
            instruction: The user instruction applied for this version
            
        Returns:
            The new version number
        """
        self.version += 1
        if instruction:
            self.instruction_history.append(instruction)
        self._touch()
        return self.version
    
    def get_version_suffix(self) -> str:
        """Get version suffix for output files.
        
        Returns:
            Empty string for v1, '_v2', '_v3', etc. for later versions
        """
        if self.version <= 1:
            return ""
        return f"_v{self.version}"
    
    # === TODO METHODS ===
    
    def add_todo(self, todo):
        """Add a todo to the queue."""
        from src.generation.todo.models import TodoItem
        if isinstance(todo, TodoItem):
            self.todos.add(todo)
            self._touch()
        else:
            raise TypeError(f"Expected TodoItem, got {type(todo)}")
    
    def add_todos(self, todos: List):
        """Add multiple todos to the queue."""
        for todo in todos:
            self.add_todo(todo)
    
    def get_next_todo(self):
        """Get the next ready todo from the queue."""
        return self.todos.get_next_ready()
    
    def has_pending_todos(self) -> bool:
        """Check if there are pending todos."""
        return self.todos.has_pending()
    
    def clear_todos(self):
        """Clear all todos from queue."""
        self.todos.clear()
        self._touch()
    
    # === THEME METHODS ===
    
    def add_theme(self, theme: Dict[str, Any]):
        """Add or update a theme in the registry."""
        if 'id' in theme:
            self.themes[theme['id']] = theme
            self._touch()
    
    def get_theme(self, theme_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific theme by ID."""
        return self.themes.get(theme_id)
    
    def get_active_theme(self) -> Optional[Dict[str, Any]]:
        """Get the currently active theme (if it exists in custom themes)."""
        if self.active_theme:
            return self.themes.get(self.active_theme)
        return None
    
    def set_active_theme(self, theme_id: str):
        """Set the active theme."""
        # Note: theme_id might be a built-in TS theme (not in self.themes) 
        # or a custom generated theme (in self.themes)
        self.active_theme = theme_id
        self._touch()
    
    # === ATOMS METHODS ===
    
    def set_atoms(self, atoms: AtomCollection):
        """Set atom extraction result."""
        self.atoms = atoms.to_dict()
        self._touch()
    
    def get_atoms(self) -> Optional[AtomCollection]:
        """Get atoms as AtomCollection object."""
        if self.atoms:
            return AtomCollection.from_dict(self.atoms)
        return None
    
    # === SLIDES METHODS ===
    
    def set_slides(self, slides: List[Dict[str, Any]]):
        """Set generated slides."""
        self.slides = slides
        self._touch()
    
    # === SOURCE METHODS ===
    
    def source_changed(self, new_source: Path) -> bool:
        """Check if source file has changed since last run."""
        if not self.source:
            return True
        new_info = SourceInfo.from_file(new_source)
        return new_info.content_hash != self.source.content_hash
    
    def set_source(self, path: Path):
        """Set source file."""
        self.source = SourceInfo.from_file(path)
        self._touch()
    
    # === PERSISTENCE ===
    
    def save(self, path: Path):
        """Save state to JSON file."""
        path.parent.mkdir(parents=True, exist_ok=True)
        
        def json_serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(self.model_dump(), f, indent=2, ensure_ascii=False, default=json_serializer)
    
    @classmethod
    def load(cls, path: Path) -> "PipelineState":
        """Load state from JSON file."""
        if not path.exists():
            return cls()
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls(**data)
    
    def reset(self):
        """Reset state to initial (keeps source)."""
        source = self.source
        self.todos = TodoQueue()
        self.constitution = None
        self.atoms = None
        self.slides = None
        self.active_theme = None
        self.source = source
        self._touch()
    
    def _touch(self):
        """Update timestamp."""
        self.updated_at = datetime.now().isoformat()
    
    # === SUMMARY ===
    
    def summary(self) -> str:
        """Get human-readable summary of state."""
        lines = ["Pipeline State:"]
        lines.append(f"  Source: {self.source.path if self.source else 'None'}")
        
        # Todos
        pending = len(self.todos.get_pending())
        completed = len(self.todos.get_completed())
        if self.todos.todos:
            lines.append(f"  Todos: {completed} completed, {pending} pending")
        
        # Constitution
        if self.constitution:
            rules = len(self.constitution.style_rules)
            lines.append(f"  Constitution: {rules} style rules")
        
        # Themes
        lines.append(f"  Themes: {len(self.themes)} available")
        if self.active_theme:
            lines.append(f"  Active theme: {self.active_theme}")
        
        # Atoms
        if self.atoms:
            lines.append(f"  Atoms: {len(self.atoms.get('atoms', []))} extracted")
        
        # Slides
        if self.slides:
            lines.append(f"  Slides: {len(self.slides)} generated")
        
        lines.append(f"  Updated: {self.updated_at}")
        
        return '\n'.join(lines)
