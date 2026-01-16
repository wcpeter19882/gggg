"""Shared data models library for Claude skills.

This module provides common data models used across skills:
- Atom models (BioAtom, FactAtom, StatAtom, etc.)
- AtomCollection for managing atoms
- PatchableContext for version-controlled contexts
- Source and SourceReference for content tracking
- Patch and PatchResult for content.json updates
- Todo models for pipeline tracking
"""
from pathlib import Path
import sys

# Add _lib to path for imports
_lib_dir = Path(__file__).parent
if str(_lib_dir) not in sys.path:
    sys.path.insert(0, str(_lib_dir))

from source import Source, SourceReference
from patchable_context import (
    PatchableContextState,
    PatchableContextBase,
    PatchableCollection,
    Patch,
    AddOperation,
    RemoveOperation,
    ReplaceOperation,
    PatchError,
    ValidationError,
)
from atom_models import (
    Atom,
    BioAtom,
    FactAtom,
    StatAtom,
    QuoteAtom,
    TensionAtom,
    ConceptAtom,
    VisualAtom,
)
from atom_collection import AtomCollection, ATOM_TYPE_MAP
from patch import Patch as ContentPatch, PatchResult, PatchOperation, PatchTarget, deep_merge
from todos import Todo, TodoList, TodoStatus, create_default_todos, todos_to_markdown, parse_todos_from_markdown, update_todo_status, get_next_todo, get_current_todo

__all__ = [
    # Source models
    "Source",
    "SourceReference",
    # Patchable context
    "PatchableContextState",
    "PatchableContextBase",
    "PatchableCollection",
    "Patch",
    "AddOperation",
    "RemoveOperation",
    "ReplaceOperation",
    "PatchError",
    "ValidationError",
    # Atom models
    "Atom",
    "BioAtom",
    "FactAtom",
    "StatAtom",
    "QuoteAtom",
    "TensionAtom",
    "ConceptAtom",
    "VisualAtom",
    "AtomCollection",
    "ATOM_TYPE_MAP",
    # Content patch
    "ContentPatch",
    "PatchResult",
    "PatchOperation",
    "PatchTarget",
    "deep_merge",
    # Todo models
    "Todo",
    "TodoList",
    "TodoStatus",
    "create_default_todos",
    "todos_to_markdown",
    "parse_todos_from_markdown",
    "update_todo_status",
    "get_next_todo",
    "get_current_todo",
]
