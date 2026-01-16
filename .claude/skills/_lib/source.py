"""Source content models for atom extraction."""
from datetime import datetime
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field


class SourceReference(BaseModel):
    """
    Reference to specific location in source content.
    
    Links atoms back to their origin in the source material
    for traceability and validation.
    
    Attributes:
        source_id: References Source.source_id
        file_path: Denormalized file path for convenience
        offset: Character offset in source content (0-indexed)
        length: Number of characters referenced
        line_number: Line number for text sources (1-indexed, optional)
    """
    
    source_id: str = Field(..., description="Source identifier")
    file_path: str = Field(..., description="Source file path")
    offset: int = Field(..., ge=0, description="Character offset (0-indexed)")
    length: int = Field(..., gt=0, description="Number of characters")
    line_number: Optional[int] = Field(
        default=None,
        ge=1,
        description="Line number (1-indexed)"
    )
    
    class Config:
        """Pydantic configuration."""
        frozen = False


class Source(BaseModel):
    """
    Grounding content input for atom extraction.
    
    Represents a source file (text or VTT) from which atoms
    will be extracted. Immutable once loaded.
    
    Attributes:
        source_id: Unique identifier (UUID4 recommended)
        name: Display name or filename
        file_path: Absolute path to source file
        content_type: MIME type (text/plain or text/vtt)
        content: Raw content from file (must not be empty)
        metadata: Additional metadata (file size, encoding, etc.)
        created_at: When source was loaded (auto-generated)
    """
    
    source_id: str = Field(..., description="Unique identifier")
    name: str = Field(..., description="Display name or filename")
    file_path: str = Field(..., description="Absolute path to source file")
    content_type: Literal["text/plain", "text/vtt"] = Field(
        ...,
        description="MIME type"
    )
    content: str = Field(..., min_length=1, description="Raw file content")
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When source was loaded"
    )
    
    class Config:
        """Pydantic configuration."""
        frozen = False  # Allow modification if needed
