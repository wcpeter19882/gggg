"""Core data models for generation requests and results.

These models are interface-agnostic - all interfaces (CLI, Gradio, MCP)
convert their inputs to GenerationRequest and format GenerationResult.
"""
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


class GenerationRequest(BaseModel):
    """Interface-agnostic request for slide generation.
    
    All interfaces (CLI, Gradio, MCP) convert their inputs to this model.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Required
    source_path: Path = Field(..., description="Path to source markdown file")
    
    # Optional generation settings
    output_path: Optional[Path] = Field(None, description="Output file path")
    instruction: str = Field("", description="Custom generation instructions")
    theme: Optional[str] = Field(None, description="Pre-selected theme name or .pptx path")
    template_path: Optional[Path] = Field(None, description="Path to .pptx template file")
    renderer: Literal["antd", "original"] = Field("antd", description="Renderer choice")
    
    # Pipeline control
    skip_research: bool = Field(False, description="Skip research stage")
    stop_after: Optional[str] = Field(None, description="Stop after this stage")
    start_from: Optional[str] = Field(None, description="Start from this stage (requires existing project)")
    project_dir: Optional[Path] = Field(None, description="Existing project directory (for start_from)")
    verbose: bool = Field(False, description="Enable verbose output")
    
    # Progress tracking (excluded from serialization)
    progress_callback: Optional[Callable[["StageResult"], None]] = Field(
        None, description="Callback for progress updates", exclude=True
    )


class StageResult(BaseModel):
    """Result of a single pipeline stage execution."""
    
    stage: str = Field(..., description="Stage identifier")
    status: Literal["pending", "running", "completed", "skipped", "failed", "waiting"] = Field(
        ..., description="Execution status"
    )
    message: str = Field("", description="Human-readable message")
    duration_ms: int = Field(0, description="Execution duration in milliseconds")
    data: dict[str, Any] = Field(default_factory=dict, description="Stage-specific output data")


class GenerationResult(BaseModel):
    """Interface-agnostic result from slide generation.
    
    All interfaces receive this model and format it appropriately.
    """
    
    project_dir: Path = Field(..., description="Created project directory")
    project_id: str = Field(..., description="Project identifier")
    stages: list[StageResult] = Field(default_factory=list, description="Results from each stage")
    started_at: datetime = Field(..., description="Pipeline start time")
    completed_at: Optional[datetime] = Field(None, description="Pipeline completion time")
    
    @property
    def is_success(self) -> bool:
        """Check if generation completed successfully."""
        return all(s.status in ("completed", "skipped") for s in self.stages)
    
    @property
    def failed_stage(self) -> Optional[StageResult]:
        """Get the failed stage, if any."""
        return next((s for s in self.stages if s.status == "failed"), None)
    
    @property
    def preview_url(self) -> str:
        """Get the preview URL for the generated slides."""
        # Determine port based on renderer (stored in export stage data)
        export_stage = next((s for s in self.stages if s.stage == "export"), None)
        port = export_stage.data.get("port", 3001) if export_stage else 3001
        return f"http://localhost:{port}/slides/{self.project_id}"
    
    @property
    def total_duration_ms(self) -> int:
        """Get total pipeline duration in milliseconds."""
        if self.completed_at and self.started_at:
            return int((self.completed_at - self.started_at).total_seconds() * 1000)
        return sum(s.duration_ms for s in self.stages)
