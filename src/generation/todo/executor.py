"""Todo Executor using unified Tool protocol.

All tools follow:
1. context = tool.slice(state)
2. patch = tool.generate(constitution, context, instruction)
3. tool.apply(state, patch)

Tools are self-describing - planner uses get_all_descriptions().
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING, Optional, Dict, List
from concurrent.futures import ThreadPoolExecutor, as_completed

if TYPE_CHECKING:
    from src.generation.state import PipelineState
from src.generation.todo.models import (
    TodoItem,
    TodoType,
    TodoStatus,
)
from src.generation.todo.tool_protocol import get_tool, Tool

logger = logging.getLogger(__name__)


class TodoExecutor:
    """Executes todos using the unified Tool protocol.
    
    Usage:
        executor = TodoExecutor(verbose=True)
        executor.execute_all(state, user_instruction)
    """
    
    def __init__(
        self,
        use_cache: bool = True,
        verbose: bool = False,
        output_dir: Optional[Path] = None,
        state_path: Optional[Path] = None,
        on_status_change: Optional[callable] = None,
    ):
        self.use_cache = use_cache
        self.verbose = verbose
        self.output_dir = output_dir or Path("output")
        # Path for persisting state on todo status changes
        self.state_path = state_path or (self.output_dir / "state.json")
        # Callback for status changes (for UI updates)
        self.on_status_change = on_status_change
        
        # Tool name mapping
        self._tool_names: Dict[TodoType, str] = {
            TodoType.CONSTITUTION: "constitution",
            TodoType.ATOMS: "atoms",
            TodoType.THEME: "theme",
            TodoType.STORY: "story",
            TodoType.CONTENT: "content",
            TodoType.CODEGEN: "codegen",
            TodoType.EXPORT: "export",
        }
    
    def execute_all(
        self,
        state: PipelineState,
        user_instruction: str,
        stop_on_error: bool = True,
    ) -> int:
        """Execute all pending todos with parallel execution support.
        
        Finds all ready todos (dependencies met) and executes them in parallel.
        This allows atoms and story to run simultaneously after constitution.
        
        Args:
            state: Pipeline state
            user_instruction: User's instruction (passed to tools)
            stop_on_error: Stop on first error
        
        Returns:
            Number of todos executed
        """
        count = 0
        while state.has_pending_todos():
            # Get ALL ready todos (not just the first one)
            ready_todos = self._get_all_ready_todos(state)
            
            if not ready_todos:
                pending = state.todos.get_pending()
                if pending:
                    logger.warning(f"Stuck: {len(pending)} pending, none ready")
                    logger.warning(f"Pending: {[(t.id, t.depends_on) for t in pending]}")
                break
            
            # Log parallel execution
            if len(ready_todos) > 1:
                self._log(f"🔀 Executing {len(ready_todos)} todos in parallel: {[t.id for t in ready_todos]}")
            
            try:
                # Execute in parallel using ThreadPoolExecutor
                executed = self._execute_batch_parallel(ready_todos, state, user_instruction)
                count += executed
            except Exception as e:
                # Persist state on failure
                self._persist_state(state)
                if stop_on_error:
                    raise
                logger.error(f"Batch execution failed: {e}")
                break
        
        return count
    
    def _get_all_ready_todos(self, state: PipelineState) -> List[TodoItem]:
        """Get all todos that are ready to execute (all dependencies met).
        
        Checks both:
        1. Todos completed in current queue
        2. Data already present in state from previous runs (only if NOT in current queue)
        
        Returns:
            List of ready todos (can be multiple for parallel execution)
        """
        # Get completed todos from current queue
        completed_ids = {t.id for t in state.todos.todos if t.status == TodoStatus.COMPLETED}
        
        # Get IDs of todos in current queue (including pending/in-progress)
        # These should NOT be marked as virtually completed even if data exists
        todos_in_queue = {t.id for t in state.todos.todos}
        
        # Add virtual "completed" IDs for data that already exists in state
        # BUT only if the todo is NOT in the current queue
        # This allows refinement runs to satisfy dependencies without re-running completed todos
        if state.constitution is not None and "constitution" not in todos_in_queue:
            completed_ids.add("constitution")
            completed_ids.add("constitution_existing")  # For refinement dependencies
        if state.atoms is not None and "atoms" not in todos_in_queue:
            completed_ids.add("atoms")
            completed_ids.add("atoms_existing")  # For refinement dependencies
        if state.themes and state.active_theme and "theme" not in todos_in_queue:
            completed_ids.add("theme")
            completed_ids.add("theme_existing")  # For refinement dependencies
        if state.slides and len(state.slides) > 0:
            # If slides exist, both story and content were completed previously
            # But only mark them as completed if they're NOT being re-run in current queue
            if "story" not in todos_in_queue:
                completed_ids.add("story")
                completed_ids.add("story_existing")  # For refinement dependencies
            if "content" not in todos_in_queue:
                completed_ids.add("content")
                completed_ids.add("content_existing")  # For refinement dependencies
        
        ready = []
        for todo in state.todos.todos:
            if todo.status == TodoStatus.PENDING and todo.is_ready(completed_ids):
                ready.append(todo)
        
        return ready
    
    def _execute_batch_parallel(
        self,
        todos: List[TodoItem],
        state: PipelineState,
        user_instruction: str,
    ) -> int:
        """Execute a batch of ready todos in parallel.
        
        Uses ThreadPoolExecutor to run multiple todos simultaneously.
        
        Args:
            todos: List of ready todos
            state: Pipeline state
            user_instruction: User instruction
            
        Returns:
            Number of successfully executed todos
        """
        if len(todos) == 1:
            # Single todo - execute directly
            self.execute_todo(todos[0], state, user_instruction)
            return 1
        
        # Multiple todos - execute in parallel
        count = 0
        with ThreadPoolExecutor(max_workers=len(todos)) as executor:
            # Submit all todos
            future_to_todo = {
                executor.submit(self.execute_todo, todo, state, user_instruction): todo
                for todo in todos
            }
            
            # Wait for completion
            for future in as_completed(future_to_todo):
                todo = future_to_todo[future]
                try:
                    future.result()
                    count += 1
                except Exception as e:
                    logger.error(f"Todo {todo.id} failed in parallel execution: {e}")
                    raise
        
        return count
    
    def _persist_state(self, state: "PipelineState"):
        """Persist state to state.json."""
        if self.state_path:
            self.state_path.parent.mkdir(parents=True, exist_ok=True)
            state.save(self.state_path)
            if self.verbose:
                logger.debug(f"State persisted to {self.state_path}")
    
    def execute_todo(
        self,
        todo: TodoItem,
        state: PipelineState,
        user_instruction: str,
    ) -> TodoItem:
        """Execute a single todo using the Tool protocol.
        
        Steps:
        1. Get tool for todo type
        2. context = tool.slice(state, todo.params)
        3. patch = tool.generate(constitution, context, instruction)
        4. tool.apply(state, patch)
        """
        # Get tool name
        tool_name = self._tool_names.get(todo.type)
        if not tool_name:
            raise ValueError(f"No tool for todo type: {todo.type}")
        
        # Create tool instance
        tool_kwargs = {
            "use_cache": self.use_cache,
            "verbose": self.verbose,
        }
        if tool_name == "export":
            tool_kwargs["output_dir"] = self.output_dir
        tool = get_tool(tool_name, **tool_kwargs)

        # Mark started and persist
        todo.mark_started()
        self._persist_state(state)
        self._log(f"▶ {todo.type.value}: {todo.id}")
        
        # Notify status change for UI update
        print(f"📢 Todo {todo.id} started - triggering callback (callback={self.on_status_change is not None})")
        if self.on_status_change:
            self.on_status_change(state)
        
        try:
            # Get constitution from state
            constitution = state.get_constitution()
            
            # Extract params dict for slice
            params = {}
            if todo.params:
                if isinstance(todo.params, dict):
                    params = todo.params
                else:
                    params = todo.params.model_dump() if hasattr(todo.params, 'model_dump') else dict(todo.params)
            
            # Execute tool protocol: slice -> generate -> apply
            context = tool.slice(state, params)
            patch = tool.generate(constitution, context, user_instruction)
            tool.apply(state, patch)
            
            todo.mark_completed()
            self._persist_state(state)
            self._log(f"✓ {todo.type.value}: {todo.id}")
            
            print(f"📢 Todo {todo.id} completed - triggering callback (callback={self.on_status_change is not None})")
            # Notify status change for UI update
            if self.on_status_change:
                self.on_status_change(state)
            
        except Exception as e:
            todo.mark_failed(str(e))
            self._persist_state(state)
            logger.error(f"X {todo.type.value}: {todo.id} - {e}")
            raise
        
        return todo
    
    def _log(self, msg: str):
        if self.verbose:
            # Use ASCII-safe characters for Windows console
            safe_msg = msg.replace('\u25b6', '>').replace('\u2713', '+').replace('\u2717', 'X')
            print(safe_msg, flush=True)
