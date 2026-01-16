# DEPRECATED: Todos are now managed by the built-in manage_todo_list tool
# This file is kept for backward compatibility but should not be used

"""Todos management for content-manager skill.

Manages todos.md file which tracks the current task queue for the pipeline.
This is used to coordinate work between subagents and track progress.

Todos are simpler than the full todo system in src/generation/todo - 
they just track what needs to be done in the current session.
"""
from typing import List, Literal, Optional
from pathlib import Path
from datetime import datetime

from pydantic import BaseModel, Field


TodoStatus = Literal["pending", "in_progress", "completed", "skipped", "failed"]
TodoType = Literal["atoms", "theme", "storyline", "layout", "export"]


class Todo(BaseModel):
    """A single todo item."""
    
    id: str = Field(..., description="Todo ID like todo_01")
    type: TodoType = Field(..., description="Type of task")
    description: str = Field(..., description="What needs to be done")
    status: TodoStatus = Field(default="pending", description="Current status")
    notes: str = Field(default="", description="Additional notes or results")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)


class TodoList(BaseModel):
    """Collection of todos for a project."""
    
    todos: List[Todo] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    current_instruction: str = Field(default="", description="The instruction being worked on")


def create_default_todos(instruction: str = "") -> TodoList:
    """
    Create a default todo list for a new project.
    
    Standard pipeline: atoms → theme → storyline → layout → export
    """
    todos = [
        Todo(
            id="todo_01",
            type="atoms",
            description="Extract atoms from source document",
            status="pending"
        ),
        Todo(
            id="todo_02", 
            type="theme",
            description="Select or generate visual theme",
            status="pending"
        ),
        Todo(
            id="todo_03",
            type="storyline",
            description="Plan slide storyline and assign atoms",
            status="pending"
        ),
        Todo(
            id="todo_04",
            type="layout",
            description="Generate layouts and widgets for each slide",
            status="pending"
        ),
        Todo(
            id="todo_05",
            type="export",
            description="Export to MDX and start preview",
            status="pending"
        ),
    ]
    
    return TodoList(
        todos=todos,
        current_instruction=instruction
    )


def todos_to_markdown(todo_list: TodoList) -> str:
    """
    Convert todo list to human-readable markdown.
    
    Used for todos.md file in project directory.
    """
    status_emoji = {
        "pending": "⬜",
        "in_progress": "🔄",
        "completed": "✅",
        "skipped": "⏭️",
        "failed": "❌"
    }
    
    lines = ["# Todos", ""]
    
    if todo_list.current_instruction:
        lines.append(f"**Instruction**: {todo_list.current_instruction}")
        lines.append("")
    
    lines.append("## Pipeline Tasks")
    lines.append("")
    
    for todo in todo_list.todos:
        emoji = status_emoji.get(todo.status, "⬜")
        status_text = f"[{todo.status}]"
        lines.append(f"{emoji} **{todo.id}** ({todo.type}): {todo.description} {status_text}")
        if todo.notes:
            lines.append(f"   - Notes: {todo.notes}")
    
    lines.append("")
    lines.append(f"*Last updated: {todo_list.last_updated.isoformat()}*")
    
    return "\n".join(lines)


def parse_todos_from_markdown(content: str) -> TodoList:
    """
    Parse todos.md back into TodoList.
    
    This allows subagents to read and update todos.
    """
    import re
    
    todos = []
    instruction = ""
    
    # Extract instruction
    instruction_match = re.search(r'\*\*Instruction\*\*:\s*(.+)', content)
    if instruction_match:
        instruction = instruction_match.group(1).strip()
    
    # Extract todos
    # Pattern: emoji **todo_id** (type): description [status]
    todo_pattern = re.compile(
        r'[⬜🔄✅⏭️❌]\s*\*\*(\w+)\*\*\s*\((\w+)\):\s*(.+?)\s*\[(\w+)\]'
    )
    
    for match in todo_pattern.finditer(content):
        todo_id, todo_type, description, status = match.groups()
        if todo_type in ["atoms", "theme", "storyline", "layout", "export"]:
            todos.append(Todo(
                id=todo_id,
                type=todo_type,
                description=description.strip(),
                status=status
            ))
    
    return TodoList(
        todos=todos,
        current_instruction=instruction
    )


def update_todo_status(
    todo_list: TodoList, 
    todo_id: str, 
    status: TodoStatus,
    notes: str = ""
) -> TodoList:
    """Update the status of a specific todo."""
    for todo in todo_list.todos:
        if todo.id == todo_id:
            todo.status = status
            if notes:
                todo.notes = notes
            if status == "completed":
                todo.completed_at = datetime.utcnow()
            break
    
    todo_list.last_updated = datetime.utcnow()
    return todo_list


def get_next_todo(todo_list: TodoList) -> Optional[Todo]:
    """Get the next pending todo."""
    for todo in todo_list.todos:
        if todo.status == "pending":
            return todo
    return None


def get_current_todo(todo_list: TodoList) -> Optional[Todo]:
    """Get the currently in-progress todo."""
    for todo in todo_list.todos:
        if todo.status == "in_progress":
            return todo
    return None


__all__ = [
    "Todo",
    "TodoList",
    "TodoStatus",
    "TodoType",
    "create_default_todos",
    "todos_to_markdown",
    "parse_todos_from_markdown",
    "update_todo_status",
    "get_next_todo",
    "get_current_todo",
]

