"""
PatchableContext V4: Using Pydantic for validation and schema management.

Design principles:
- Pydantic models for automatic validation
- Schema generated from models
- Patch class with operations
- Single patch() method on collections
"""

import json
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class PatchableContextState(str, Enum):
    """Standard states for context objects"""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class ValidationError(Exception):
    """Raised when validation fails"""
    pass


class PatchError(Exception):
    """Raised when a patch operation fails"""
    pass


class PatchableContextBase(BaseModel):
    """
    Base Pydantic model for all patchable contexts.
    
    Mandatory fields: id, rank, state
    All validation handled by Pydantic automatically.
    """
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)

    id: str = Field(..., min_length=1, description="Unique identifier")
    rank: int = Field(..., ge=0, description="Ordering/priority indicator")
    state: PatchableContextState = Field(default=PatchableContextState.DRAFT, description="Current state")

    def format_abstract(self) -> str:
        """Format as abstract"""
        return f"Context #{self.rank} [{self.state}]: {self.id}"

    def format_summary(self) -> str:
        """Format as summary"""
        lines = [f"Context #{self.rank} [{self.state}]", f"ID: {self.id}"]
        for key, value in self.model_dump(exclude={'id', 'rank', 'state'}).items():
            value_str = str(value)
            if len(value_str) > 50:
                value_str = value_str[:50] + "..."
            lines.append(f"{key}: {value_str}")
        return "\n".join(lines)

    def format_full(self) -> str:
        """Format with full details"""
        lines = [f"Context #{self.rank} [{self.state}]", f"ID: {self.id}", "Data:"]
        for key, value in self.model_dump(exclude={'id', 'rank', 'state'}).items():
            if isinstance(value, dict):
                lines.append(f"  {key}:")
                for k, v in value.items():
                    lines.append(f"    {k}: {v}")
            else:
                lines.append(f"  {key}: {value}")
        return "\n".join(lines)


class AddOperation(BaseModel):
    """Add operation - full context data (dict or Pydantic model)"""
    add: Union[Dict[str, Any], PatchableContextBase]

    model_config = ConfigDict(extra='forbid')


class RemoveOperation(BaseModel):
    """Remove operation - only needs id"""
    remove: Dict[Literal['id'], str]

    model_config = ConfigDict(extra='forbid')


class ReplaceOperation(BaseModel):
    """Replace operation - full context data (dict or Pydantic model)"""
    replace: Union[Dict[str, Any], PatchableContextBase]

    model_config = ConfigDict(extra='forbid')


class Patch(BaseModel):
    """
    Patch containing operations (add, remove, replace).
    
    Uses Pydantic for validation.
    Can be created from JSON directly.
    """
    operations: List[Union[AddOperation, ReplaceOperation, RemoveOperation]] = Field(
        ...,
        min_length=1,
        description="List of operations to apply"
    )

    model_config = ConfigDict(extra='forbid')

    @classmethod
    def from_json_str(cls, json_str: str) -> 'Patch':
        """
        Create a Patch from JSON string.
        
        Expected format: [{"add": {...}}, {"replace": {...}}, {"set_theme": {...}}, ...]
        Also accepts: {"operations": [{"add": {...}}, ...]}
        """
        data = json.loads(json_str)

        # If already has operations key, use directly
        if isinstance(data, dict) and "operations" in data:
            return cls.model_validate(data)
        
        # If bare array (expected from LLM), wrap in operations key
        if isinstance(data, list):
            return cls.model_validate({"operations": data})
        
        # If single operation object, wrap in array then operations
        if isinstance(data, dict) and ("add" in data or "replace" in data or "remove" in data or "set_theme" in data or "set_preset" in data):
            return cls.model_validate({"operations": [data]})
        
        # Otherwise try to validate as-is (will fail with helpful error)
        return cls.model_validate(data)

    def __len__(self) -> int:
        return len(self.operations)

    def __repr__(self) -> str:
        return f"Patch({len(self)} operations)"


class PatchableCollection:
    """
    Base class for collections managing Pydantic model instances.
    
    Model class defines schema automatically.
    Single patch() method applies operations.
    """

    def __init__(self, id: str, model_class: type[PatchableContextBase]):
        """
        Initialize a collection.
        
        Args:
            id: Collection identifier
            model_class: Pydantic model class (defines schema automatically)
        """
        self._id = id
        self._model_class = model_class
        self._contexts: Dict[str, PatchableContextBase] = {}

    @property
    def id(self) -> str:
        return self._id

    @property
    def model_class(self) -> type[PatchableContextBase]:
        return self._model_class

    @property
    def schema(self) -> Dict[str, Any]:
        """Get JSON schema from Pydantic model"""
        return self._model_class.model_json_schema()

    def patch(self, patch: Patch) -> 'PatchableCollection':
        """
        Apply a Patch to this collection.
        
        Args:
            patch: Patch instance with operations
            
        Returns:
            Self for chaining
        """
        for op in patch.operations:
            if isinstance(op, AddOperation):
                self._patch_add(op.add)
            elif isinstance(op, RemoveOperation):
                self._patch_remove(op.remove["id"])
            elif isinstance(op, ReplaceOperation):
                self._patch_replace(op.replace)

        return self

    def _patch_add(self, context_data: Dict[str, Any]):
        """Execute add operation"""
        # Validate with model class (supports both dict and Pydantic model input)
        if isinstance(context_data, dict):
            context = self._model_class.model_validate(context_data)
        else:
            # Already a Pydantic model (from Python code, not JSON)
            context = self._model_class.model_validate(context_data.model_dump())

        if context.id in self._contexts:
            raise PatchError(f"Cannot add: context '{context.id}' already exists")

        self._contexts[context.id] = context

    def _patch_remove(self, context_id: str):
        """Execute remove operation"""
        if context_id not in self._contexts:
            raise PatchError(f"Cannot remove: context '{context_id}' not found")

        del self._contexts[context_id]

    def _patch_replace(self, context_data: Dict[str, Any]):
        """Execute replace operation - merges new data with existing context"""
        context_id = context_data.get("id") if isinstance(context_data, dict) else context_data.id
        
        if context_id not in self._contexts:
            raise PatchError(f"Cannot replace: context '{context_id}' not found")
        
        # Get existing context
        existing = self._contexts[context_id]
        
        # Merge: start with existing data, then overlay new data
        if isinstance(context_data, dict):
            merged_data = existing.model_dump()
            merged_data.update(context_data)
            context = self._model_class.model_validate(merged_data)
        else:
            # Already a Pydantic model (from Python code, not JSON)
            merged_data = existing.model_dump()
            merged_data.update(context_data.model_dump())
            context = self._model_class.model_validate(merged_data)

        self._contexts[context_id] = context

    def get(self, context_id: str) -> Optional[PatchableContextBase]:
        """Get a context by id"""
        return self._contexts.get(context_id)

    def list_contexts(self, state: Optional[PatchableContextState] = None) -> List[PatchableContextBase]:
        """List all contexts, optionally filtered by state, sorted by rank"""
        contexts = list(self._contexts.values())
        if state:
            contexts = [c for c in contexts if c.state == state]
        return sorted(contexts, key=lambda c: c.rank)

    def to_dict(self) -> Dict[str, Any]:
        """Convert collection to dictionary"""
        return {
            "id": self.id,
            "model": self._model_class.__name__,
            "contexts": [c.model_dump() for c in self.list_contexts()]
        }

    def to_json(self) -> str:
        """Serialize collection to JSON"""
        return json.dumps(self.to_dict(), indent=2)

    def format_abstract(self) -> str:
        """Format as abstract list"""
        contexts = self.list_contexts()
        lines = [f"Collection '{self.id}' ({len(contexts)} items):"]
        for context in contexts:
            lines.append(f"  {context.format_abstract()}")
        return "\n".join(lines)

    def format_summary(self) -> str:
        """Format with summary of each context"""
        contexts = self.list_contexts()
        lines = [f"Collection '{self.id}' ({len(contexts)} items):", ""]
        for i, context in enumerate(contexts):
            if i > 0:
                lines.append("")
            lines.append(context.format_summary())
        return "\n".join(lines)

    def format_full(self) -> str:
        """Format with full details"""
        contexts = self.list_contexts()
        lines = [f"Collection '{self.id}' ({len(contexts)} items):", "=" * 60, ""]
        for i, context in enumerate(contexts):
            if i > 0:
                lines.append("")
                lines.append("-" * 60)
                lines.append("")
            lines.append(context.format_full())
        return "\n".join(lines)

    def __len__(self) -> int:
        return len(self._contexts)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(id='{self.id}', count={len(self)})"
