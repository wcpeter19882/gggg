"""Task-based execution model for compound instructions.

Supports:
- Compound instructions (theme change + storyline edit + layout)
- Task DAG with dependencies
- Incremental execution with page ranges
- Subagent response protocol
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional, Union
import logging

logger = logging.getLogger("cliv2.task")


class TaskStatus(str, Enum):
    """Task execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Task:
    """A single execution task in the DAG.
    
    Attributes:
        id: Unique task identifier
        stage: Pipeline stage (create, research, theme, storyline, layout, export)
        target: Slide targets - list of indices or "all"
        params: Stage-specific parameters
        depends: List of task IDs this task depends on
        status: Current execution status
        result: Execution result data
    """
    id: int
    stage: str
    target: Union[list[int], Literal["all"]] = "all"
    params: dict = field(default_factory=dict)
    depends: list[int] = field(default_factory=list)
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[dict] = None
    error: Optional[str] = None
    duration_ms: int = 0


@dataclass
class SubagentResponse:
    """Standardized response from subagents.
    
    All subagents (storyline, layout) return this structure
    to enable incremental execution and task continuation.
    """
    status: Literal["partial", "complete", "error"]
    completed: list[int]  # Slide indices that were processed
    pending: list[int]  # Slide indices remaining (for follow-up tasks)
    summary: str  # Human-readable summary
    output: Any = None  # Stage-specific output data
    error: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "completed": self.completed,
            "pending": self.pending,
            "summary": self.summary,
            "error": self.error,
        }


@dataclass
class InstructionPlan:
    """Parsed instruction plan for task generation.
    
    Extracted by LLM from user instruction. Determines what
    stages to run and with what parameters.
    """
    # Full generation flag
    is_full_generation: bool = False
    
    # Research
    research_needed: bool = False
    skip_research_reason: Optional[str] = None
    
    # Theme changes
    theme_change: Optional[dict] = None  # {name: "dark"} or {generate: True, style: "..."}
    
    # Storyline changes
    storyline_action: Optional[str] = None  # "generate", "update", "add", "remove"
    storyline_targets: Union[list[int], Literal["all"], None] = None
    storyline_params: dict = field(default_factory=dict)
    
    # Layout changes
    layout_action: Optional[str] = None  # "generate", "fix", "update"
    layout_targets: Union[list[int], Literal["all"], None] = None
    layout_params: dict = field(default_factory=dict)
    
    # Direct export (no changes, just re-export)
    export_only: bool = False
    
    def build_task_dag(self, existing_slide_count: int = 0) -> list[Task]:
        """Build task DAG from instruction plan.
        
        Dependency rules:
        - theme → ALL layouts (theme affects styling globally)
        - storyline[X] → layout[X] (storyline changes need layout)
        - If theme changes AND storyline changes: layout for ALL
        
        Args:
            existing_slide_count: Number of slides already in project
            
        Returns:
            List of tasks with proper dependencies
        """
        tasks: list[Task] = []
        task_id = 1
        
        # Track task IDs for dependency wiring
        create_id: Optional[int] = None
        research_id: Optional[int] = None
        theme_id: Optional[int] = None
        storyline_id: Optional[int] = None
        layout_ids: list[int] = []
        
        # === Create project (always first for full generation) ===
        if self.is_full_generation:
            tasks.append(Task(
                id=task_id,
                stage="create",
                target="all",
                params={},
                depends=[],
            ))
            create_id = task_id
            task_id += 1
        
        # === Research ===
        if self.research_needed:
            depends = [create_id] if create_id else []
            tasks.append(Task(
                id=task_id,
                stage="research",
                target="all",
                params={},
                depends=depends,
            ))
            research_id = task_id
            task_id += 1
        
        # === Theme ===
        if self.theme_change:
            depends = [create_id] if create_id else []
            tasks.append(Task(
                id=task_id,
                stage="theme",
                target="all",
                params=self.theme_change,
                depends=depends,
            ))
            theme_id = task_id
            task_id += 1
        
        # === Storyline ===
        if self.storyline_action and self.storyline_targets:
            depends = []
            if research_id:
                depends.append(research_id)
            elif create_id:
                depends.append(create_id)
            
            tasks.append(Task(
                id=task_id,
                stage="storyline",
                target=self.storyline_targets,
                params={
                    "action": self.storyline_action,
                    **self.storyline_params,
                },
                depends=depends,
            ))
            storyline_id = task_id
            task_id += 1
        
        # === Layout ===
        # Determine layout targets and dependencies
        layout_needed = (
            self.is_full_generation or 
            self.theme_change or 
            self.storyline_action or 
            self.layout_action
        )
        
        if layout_needed:
            depends = []
            
            # Theme change affects ALL layouts
            if theme_id:
                depends.append(theme_id)
                # If theme changed, layout must be for all slides
                layout_target = "all"
            elif storyline_id:
                depends.append(storyline_id)
                # Layout follows storyline targets
                layout_target = self.storyline_targets or "all"
            else:
                # Direct layout action
                layout_target = self.layout_targets or "all"
            
            # If both theme and storyline changed, still ALL (theme wins)
            if theme_id and storyline_id:
                depends = [theme_id, storyline_id]
                layout_target = "all"
            
            tasks.append(Task(
                id=task_id,
                stage="layout",
                target=layout_target,
                params={
                    "action": self.layout_action or "generate",
                    **self.layout_params,
                },
                depends=depends,
            ))
            layout_ids.append(task_id)
            task_id += 1
        
        # === Export (always last) ===
        if tasks or self.export_only:
            depends = layout_ids if layout_ids else []
            # If no layout but has theme/storyline, depend on those
            if not layout_ids:
                if storyline_id:
                    depends.append(storyline_id)
                if theme_id:
                    depends.append(theme_id)
            
            tasks.append(Task(
                id=task_id,
                stage="export",
                target="all",
                params={},
                depends=depends,
            ))
        
        return tasks
    
    def __post_init__(self):
        """Ensure field defaults for dataclass."""
        if self.storyline_params is None:
            self.storyline_params = {}
        if self.layout_params is None:
            self.layout_params = {}


class TaskExecutor:
    """Execute tasks respecting dependencies.
    
    Features:
    - Runs tasks in dependency order
    - Handles partial completion and follow-up tasks
    - Tracks progress for UI updates
    """
    
    def __init__(self, tasks: list[Task]):
        self.tasks = {t.id: t for t in tasks}
        self.completed: set[int] = set()
        self.failed: set[int] = set()
    
    def get_ready_tasks(self) -> list[Task]:
        """Get tasks whose dependencies are satisfied."""
        ready = []
        for task in self.tasks.values():
            if task.status != TaskStatus.PENDING:
                continue
            
            # Check all dependencies are completed
            deps_satisfied = all(
                d in self.completed 
                for d in task.depends
            )
            
            # Check no dependency failed
            deps_failed = any(
                d in self.failed
                for d in task.depends
            )
            
            if deps_failed:
                task.status = TaskStatus.SKIPPED
                task.error = "Dependency failed"
                continue
            
            if deps_satisfied:
                ready.append(task)
        
        return ready
    
    def mark_completed(self, task_id: int, result: dict):
        """Mark a task as completed with result."""
        task = self.tasks.get(task_id)
        if task:
            task.status = TaskStatus.COMPLETED
            task.result = result
            self.completed.add(task_id)
    
    def mark_failed(self, task_id: int, error: str):
        """Mark a task as failed."""
        task = self.tasks.get(task_id)
        if task:
            task.status = TaskStatus.FAILED
            task.error = error
            self.failed.add(task_id)
    
    def add_follow_up_task(self, original_task: Task, pending_targets: list[int]) -> Task:
        """Add a follow-up task for remaining targets.
        
        Used when a subagent returns partial completion.
        """
        new_id = max(self.tasks.keys()) + 1
        
        follow_up = Task(
            id=new_id,
            stage=original_task.stage,
            target=pending_targets,
            params=original_task.params,
            depends=[original_task.id],  # Depends on the partial completion
            status=TaskStatus.PENDING,
        )
        
        self.tasks[new_id] = follow_up
        return follow_up
    
    def is_complete(self) -> bool:
        """Check if all tasks are done (completed, failed, or skipped)."""
        return all(
            t.status in (TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.SKIPPED)
            for t in self.tasks.values()
        )
    
    def get_progress_summary(self) -> str:
        """Get human-readable progress summary."""
        total = len(self.tasks)
        completed = len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED])
        failed = len([t for t in self.tasks.values() if t.status == TaskStatus.FAILED])
        running = len([t for t in self.tasks.values() if t.status == TaskStatus.RUNNING])
        
        return f"{completed}/{total} completed, {running} running, {failed} failed"
    
    def get_task_list_display(self) -> list[dict]:
        """Get task list for UI display."""
        status_icons = {
            TaskStatus.PENDING: "⏳",
            TaskStatus.RUNNING: "🔄",
            TaskStatus.COMPLETED: "✅",
            TaskStatus.FAILED: "❌",
            TaskStatus.SKIPPED: "⏭️",
        }
        
        return [
            {
                "id": t.id,
                "stage": t.stage,
                "target": t.target,
                "status": t.status.value,
                "icon": status_icons[t.status],
                "error": t.error,
            }
            for t in sorted(self.tasks.values(), key=lambda x: x.id)
        ]
