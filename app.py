"""Gradio UI for UCE Slide Generation.

Features:
- Session management with auto-load state
- Source file upload/management
- Chat interface for instructions
- Todo progress display (live updates)
- Theme/Vibe switching via todos (unified orchestrator)
- Live preview iframe via FastAPI output mount
"""
import asyncio
import gradio as gr
import json
import random
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, AsyncGenerator
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Import pipeline components
from src.generation.state import PipelineState
from src.generation.todo.runner import PipelineRunner
from src.generation.todo.models import TodoStatus
from src.paged.render import SlidevRenderer


# Constants
OUTPUT_BASE = Path("output")
DATA_CONTEXT = Path("data/context")


def get_available_themes() -> List[str]:
    """Get list of available theme IDs."""
    try:
        from src.common.asset_manager import AssetManager
        result = AssetManager.list_themes()
        return [t['id'] for t in result.get('available_themes', [])]
    except Exception:
        return ["corp_modern_v1", "minimal_dark_v1", "default"]


AVAILABLE_VIBES = [
    "professional", "casual", "dramatic", "minimal", 
    "playful", "serious", "dynamic", "calm", "duolingo"
]


def generate_session_id() -> str:
    """Generate session ID in format slide_yyyymmdd_XX."""
    date_str = datetime.now().strftime("%Y%m%d")
    random_suffix = f"{random.randint(0, 99):02d}"
    return f"slide_{date_str}_{random_suffix}"


def get_session_dir(session_id: str) -> Path:
    """Get output directory for session."""
    return OUTPUT_BASE / session_id


def load_session_state(session_id: str) -> tuple[Optional[PipelineState], str]:
    """Load state for session if exists."""
    session_dir = get_session_dir(session_id)
    state_path = session_dir / "state.json"
    
    if state_path.exists():
        try:
            state = PipelineState.load(state_path)
            return state, f"✓ Loaded existing session: {session_id}"
        except Exception as e:
            return None, f"⚠ Failed to load state: {e}"
    return None, f"New session: {session_id}"


def get_session_files(session_id: str) -> List[str]:
    """Get list of source files for session."""
    session_dir = get_session_dir(session_id)
    sources_dir = session_dir / "sources"
    if sources_dir.exists():
        return [f.name for f in sources_dir.glob("*") if f.is_file()]
    return []


def add_source_file(session_id: str, file) -> tuple[List[str], str]:
    """Add a source file to the session."""
    if file is None:
        return get_session_files(session_id), "No file selected"
    
    session_dir = get_session_dir(session_id)
    sources_dir = session_dir / "sources"
    sources_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = Path(file.name)
    dest_path = sources_dir / file_path.name
    shutil.copy(file.name, dest_path)
    
    return get_session_files(session_id), f"✓ Added: {file_path.name}"


def remove_source_file(session_id: str, filename: str) -> tuple[List[str], str]:
    """Remove a source file from the session."""
    if not filename:
        return get_session_files(session_id), "No file selected"
    
    session_dir = get_session_dir(session_id)
    file_path = session_dir / "sources" / filename
    
    if file_path.exists():
        file_path.unlink()
        return get_session_files(session_id), f"✓ Removed: {filename}"
    return get_session_files(session_id), f"File not found: {filename}"


def get_todo_display(state: Optional[PipelineState], current_idx: Optional[int] = None) -> str:
    """Format todos for display with enhanced status.
    
    Args:
        state: Pipeline state with todos
        current_idx: Index of currently executing todo (None if not executing)
    """
    if state is None or state.todos is None:
        return "No todos yet"
    
    lines = []
    for i, todo in enumerate(state.todos.todos):
        # Determine status icon and label based on actual status
        if todo.status == TodoStatus.IN_PROGRESS:
            # Currently executing
            status_icon = "🔄"
            label = _get_todo_label(todo.type.value)
        elif todo.status == TodoStatus.COMPLETED:
            status_icon = "✅"
            label = todo.type.value
        elif todo.status == TodoStatus.FAILED:
            status_icon = "❌"
            label = todo.type.value
        else:
            # Pending
            status_icon = "⏳"
            label = todo.type.value
        
        lines.append(f"{status_icon} {label}")
    
    return "\n".join(lines) if lines else "No todos"


def _get_todo_label(todo_type: str) -> str:
    """Get descriptive label for todo type during execution."""
    labels = {
        "constitution": "Loading constitution...",
        "atoms": "Extracting content atoms...",
        "theme": "Applying theme...",
        "story": "Generating story arc...",
        "content": "Creating slide content...",
        "export": "Exporting presentation...",
    }
    return labels.get(todo_type, f"Processing {todo_type}...")


def format_chat_message(role: str, content: str) -> Dict[str, str]:
    """Format a chat message for Gradio 6.x chatbot."""
    return {"role": role, "content": content}


def get_preview_html(session_id: str) -> str:
    """Get preview iframe HTML using FastAPI output mount."""
    if not session_id:
        return "<div style='height:600px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;'>No session selected</div>"
    timestamp = datetime.now().timestamp()
    # Use FastAPI output mount: /output/{session_id}/index.html
    return f'<iframe src="/output/{session_id}/?t={timestamp}" width="100%" height="600" style="border:1px solid #ccc;"></iframe>'


async def run_generation_async(
    session_id: str, 
    message: str, 
    chat_history: List[Dict[str, str]],
    theme_id: str = None,
    vibe: str = None,
) -> AsyncGenerator[tuple[List[Dict[str, str]], str, str, str], None]:
    """Run the generation pipeline with live updates.
    
    Yields: (chat_history, todo_display, status, preview_html)
    """
    if not session_id:
        yield chat_history, "No todos", "⚠ Please set a session ID", ""
        return
    
    if not message.strip():
        yield chat_history, "No todos", "⚠ Please enter an instruction", ""
        return
    
    session_dir = get_session_dir(session_id)
    
    # Find source files
    sources_dir = session_dir / "sources"
    source_files = list(sources_dir.glob("*")) if sources_dir.exists() else []
    
    if source_files:
        source_path = source_files[0]
    else:
        source_path = DATA_CONTEXT / "career_talk.txt"
    
    # Add user message to chat
    chat_history = chat_history + [format_chat_message("user", message)]
    yield chat_history, "⏳ Initializing...", "🔄 Starting generation...", ""
    
    try:
        # Create runner
        runner = PipelineRunner(
            verbose=True,
            use_cache=True,
            output_dir=session_dir
        )
        
        # Initialize state
        from src.generation.state import PipelineState
        from src.generation.todo.planner import plan
        
        # Load or create state
        state_path = session_dir / "state.json"
        if state_path.exists():
            state = PipelineState.load(state_path)
        else:
            state = PipelineState()
        
        state.set_source(source_path)
        
        # Initialize constitution if needed
        if state.constitution is None:
            from src.generation.todo.models import ConstitutionPatch
            state.constitution = ConstitutionPatch()
        
        # Store selected theme and vibe in state constitution for generation
        if theme_id:
            state.constitution.selected_theme = theme_id
        if vibe:
            state.constitution.selected_vibe = vibe
        
        # Plan todos
        yield chat_history, "⏳ Planning todos...", "🔄 Planning...", ""
        await asyncio.sleep(0.1)  # Allow UI update
        
        todos = plan(state, message)
        state.todos = todos
        
        # Persist state immediately after planning
        state_path.parent.mkdir(parents=True, exist_ok=True)
        state.save(state_path)
        
        todo_display = get_todo_display(state, current_idx=None)
        yield chat_history, todo_display, "🔄 Executing todos...", ""
        
        # Execute all todos with live progress updates
        import queue
        import threading
        
        status_queue = queue.Queue()
        
        def status_callback(updated_state):
            """Callback to notify UI of status changes."""
            # Signal an update - we'll reload from disk in the main thread
            print(f"📢 Status callback triggered - queuing update signal")
            status_queue.put("update")
        
        # Set callback on executor
        runner.executor.on_status_change = status_callback
        print(f"✅ Callback registered on executor")
        
        # Run executor in background thread
        def run_executor():
            try:
                runner.executor.execute_all(state, message)
                status_queue.put("done")  # Signal completion
            except Exception as e:
                import traceback
                traceback.print_exc()
                status_queue.put(("error", e))  # Signal error
        
        executor_thread = threading.Thread(target=run_executor)
        executor_thread.start()
        
        # Poll status queue and yield updates
        last_todo_display = None
        try:
            while True:
                # Check for status updates (non-blocking with timeout)
                try:
                    signal = status_queue.get(timeout=0.1)
                    
                    if signal == "done":
                        # Completion signal
                        break
                    elif isinstance(signal, tuple) and signal[0] == "error":
                        # Error signal
                        raise signal[1]
                    elif signal == "update":
                        # Status update - reload state from disk and yield
                        print(f"🔄 Received update signal - reloading state from {state_path}")
                        try:
                            current_state = PipelineState.load(state_path)
                            current_display = get_todo_display(current_state, current_idx=None)
                            print(f"📊 Todo display:\n{current_display}")
                            
                            # Only yield if display changed (avoid redundant updates)
                            if current_display != last_todo_display:
                                print(f"✨ Display changed - yielding to UI")
                                last_todo_display = current_display
                                yield chat_history, current_display, "🔄 Executing todos...", ""
                            else:
                                print(f"⏭️ Display unchanged - skipping yield")
                        except Exception as load_err:
                            print(f"⚠ Failed to reload state: {load_err}")
                        
                except queue.Empty:
                    # No update yet, just continue polling
                    await asyncio.sleep(0.05)
                    continue
        finally:
            # Wait for thread to complete
            executor_thread.join(timeout=2.0)
            # Reload final state
            state = PipelineState.load(state_path)
        
        # Save state
        state_path.parent.mkdir(parents=True, exist_ok=True)
        state.save(state_path)
        
        # Final todo display
        final_todo_display = get_todo_display(state, current_idx=None)
        
        # Add assistant response
        slide_count = len(state.slides or [])
        chat_history = chat_history + [format_chat_message("assistant", f"✓ Generated {slide_count} slides")]
        
        # Preview
        preview_html = get_preview_html(session_id)
        
        yield chat_history, final_todo_display, "✓ Generation complete!", preview_html
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        chat_history = chat_history + [format_chat_message("assistant", f"❌ Error: {str(e)}")]
        yield chat_history, "Error", f"❌ {str(e)}", ""


async def apply_theme_async(
    session_id: str, 
    theme_id: str,
    chat_history: List[Dict[str, str]]
) -> AsyncGenerator[tuple[List[Dict[str, str]], str, str, str], None]:
    """Apply theme via todo orchestrator (export only).
    
    Updates:
    1. state.active_theme - the selected theme
    2. slides[].parameters.theme - for export to use
    3. Files export todo
    """
    if not session_id or not theme_id:
        yield chat_history, "No todos", "⚠ Session or theme not selected", ""
        return
    
    session_dir = get_session_dir(session_id)
    state_path = session_dir / "state.json"
    
    if not state_path.exists():
        yield chat_history, "No todos", "⚠ No state found for session", ""
        return
    
    try:
        # Load state and update theme
        state = PipelineState.load(state_path)
        
        # Set active theme
        state.set_active_theme(theme_id)
        
        # Update slides' parameters.theme (this is what export uses)
        if state.slides:
            for slide in state.slides:
                if 'parameters' not in slide or slide['parameters'] is None:
                    slide['parameters'] = {}
                slide['parameters']['theme'] = theme_id
        
        state.save(state_path)
        
        # Add user message
        chat_history = chat_history + [format_chat_message("user", f"Change theme to {theme_id}")]
        yield chat_history, "⏳ Preparing export...", "🔄 Updating theme...", ""
        
        # Create export-only todo queue
        from src.generation.todo.models import TodoItem, TodoType, TodoStatus, TodoQueue
        queue = TodoQueue()
        export_todo = TodoItem(
            id="export",
            type=TodoType.EXPORT,
            params={"format": "slidev"},
            status=TodoStatus.PENDING
        )
        queue.add(export_todo)
        state.todos = queue
        
        # Execute via runner
        yield chat_history, "🔄 export: export", "🔄 Exporting...", ""
        runner = PipelineRunner(verbose=True, use_cache=False, output_dir=session_dir)
        await asyncio.to_thread(runner.executor.execute_todo, export_todo, state, f"theme {theme_id}")
        
        # Save updated state
        state.save(state_path)
        
        chat_history = chat_history + [format_chat_message("assistant", f"✓ Applied theme: {theme_id}")]
        preview_html = get_preview_html(session_id)
        
        yield chat_history, "✅ export: export", f"✓ Applied theme: {theme_id}", preview_html
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        chat_history = chat_history + [format_chat_message("assistant", f"❌ Error: {str(e)}")]
        yield chat_history, "Error", f"❌ Error: {str(e)}", ""


async def apply_vibe_async(
    session_id: str, 
    vibe: str,
    chat_history: List[Dict[str, str]]
) -> AsyncGenerator[tuple[List[Dict[str, str]], str, str, str], None]:
    """Apply vibe via todo orchestrator (export only).
    
    Updates:
    1. state.selected_vibe - for tracking (optional)
    2. slides[].parameters.vibe - for export to use
    3. Files export todo
    """
    if not session_id or not vibe:
        yield chat_history, "No todos", "⚠ Session or vibe not selected", ""
        return
    
    session_dir = get_session_dir(session_id)
    state_path = session_dir / "state.json"
    
    if not state_path.exists():
        yield chat_history, "No todos", "⚠ No state found for session", ""
        return
    
    try:
        # Load state and update vibe
        state = PipelineState.load(state_path)
        
        # Update slides' parameters.vibe (this is what export uses)
        if state.slides:
            for slide in state.slides:
                if 'parameters' not in slide or slide['parameters'] is None:
                    slide['parameters'] = {}
                slide['parameters']['vibe'] = vibe
        
        state.save(state_path)
        
        # Add user message
        chat_history = chat_history + [format_chat_message("user", f"Change vibe to {vibe}")]
        yield chat_history, "⏳ Preparing export...", "🔄 Updating vibe...", ""
        
        # Create export-only todo queue
        from src.generation.todo.models import TodoItem, TodoType, TodoStatus, TodoQueue
        queue = TodoQueue()
        export_todo = TodoItem(
            id="export",
            type=TodoType.EXPORT,
            params={"format": "slidev"},
            status=TodoStatus.PENDING
        )
        queue.add(export_todo)
        state.todos = queue
        
        # Execute via runner
        yield chat_history, "🔄 export: export", "🔄 Exporting...", ""
        runner = PipelineRunner(verbose=True, use_cache=False, output_dir=session_dir)
        await asyncio.to_thread(runner.executor.execute_todo, export_todo, state, f"vibe {vibe}")
        
        # Save updated state
        state.save(state_path)
        
        chat_history = chat_history + [format_chat_message("assistant", f"✓ Applied vibe: {vibe}")]
        preview_html = get_preview_html(session_id)
        
        yield chat_history, "✅ export: export", f"✓ Applied vibe: {vibe}", preview_html
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        chat_history = chat_history + [format_chat_message("assistant", f"❌ Error: {str(e)}")]
        yield chat_history, "Error", f"❌ Error: {str(e)}", ""


def refresh_preview(session_id: str) -> str:
    """Refresh the preview iframe."""
    return get_preview_html(session_id)


def on_session_change(session_id: str) -> tuple[str, List[str], str, str, List[Dict[str, str]]]:
    """Handle session ID change."""
    state, status = load_session_state(session_id)
    files = get_session_files(session_id)
    todo_display = get_todo_display(state, current_idx=None)
    current_theme = state.active_theme if state else "corp_modern_v1"
    
    # Clear chat history on session change
    chat_history = []
    
    return status, files, todo_display, current_theme, chat_history


def create_app():
    """Create the Gradio application."""
    
    with gr.Blocks(title="UCE Slide Generator") as app:
        gr.Markdown("# 🎯 UCE Slide Generator")
        gr.Markdown("Generate professional presentations from source content")
        
        with gr.Row():
            # Left Column - Controls
            with gr.Column(scale=1):
                gr.Markdown("### 📁 Session")
                session_id = gr.Textbox(
                    label="Session ID",
                    value=generate_session_id(),
                    placeholder="slide_yyyymmdd_XX"
                )
                session_status = gr.Textbox(
                    label="Status",
                    value="New session",
                    interactive=False
                )
                
                gr.Markdown("### 📄 Source Files")
                source_files = gr.Dropdown(
                    label="Current Files",
                    choices=[],
                    multiselect=False,
                    interactive=True
                )
                with gr.Row():
                    file_upload = gr.File(label="Upload", file_types=[".txt", ".md", ".vtt"])
                    remove_btn = gr.Button("🗑️ Remove", size="sm")
                
                gr.Markdown("### 🎨 Style")
                theme_dropdown = gr.Dropdown(
                    label="Theme",
                    choices=get_available_themes(),
                    value="corp_modern_v1"
                )
                vibe_dropdown = gr.Dropdown(
                    label="Vibe",
                    choices=AVAILABLE_VIBES,
                    value="professional"
                )
                style_status = gr.Textbox(label="Style Status", interactive=False, visible=False)
                
                gr.Markdown("### 📋 Todos")
                todo_display = gr.Textbox(
                    label="Progress",
                    value="No todos",
                    lines=8,
                    interactive=False
                )
            
            # Right Column - Chat & Preview
            with gr.Column(scale=2):
                gr.Markdown("### 💬 Instructions")
                chatbot = gr.Chatbot(
                    label="Chat History",
                    height=200
                )
                with gr.Row():
                    msg_input = gr.Textbox(
                        label="Your instruction",
                        placeholder="Create 10 slides with professional theme...",
                        scale=4
                    )
                    send_btn = gr.Button("🚀 Send", variant="primary", scale=1)
                
                gen_status = gr.Textbox(label="Generation Status", interactive=False)
                
                gr.Markdown("### 👁️ Preview")
                refresh_btn = gr.Button("🔄 Refresh Preview")
                preview_frame = gr.HTML(
                    value="<div style='height:600px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;'>Preview will appear here after generation</div>"
                )
        
        # Event Handlers
        
        # Session change
        session_id.change(
            fn=on_session_change,
            inputs=[session_id],
            outputs=[session_status, source_files, todo_display, theme_dropdown, chatbot]
        )
        
        # File upload
        file_upload.change(
            fn=add_source_file,
            inputs=[session_id, file_upload],
            outputs=[source_files, session_status]
        )
        
        # File remove
        remove_btn.click(
            fn=remove_source_file,
            inputs=[session_id, source_files],
            outputs=[source_files, session_status]
        )
        
        # Send message - async with streaming updates
        send_btn.click(
            fn=run_generation_async,
            inputs=[session_id, msg_input, chatbot, theme_dropdown, vibe_dropdown],
            outputs=[chatbot, todo_display, gen_status, preview_frame]
        ).then(
            fn=lambda: "",
            outputs=[msg_input]
        )
        
        # Enter key to send
        msg_input.submit(
            fn=run_generation_async,
            inputs=[session_id, msg_input, chatbot, theme_dropdown, vibe_dropdown],
            outputs=[chatbot, todo_display, gen_status, preview_frame]
        ).then(
            fn=lambda: "",
            outputs=[msg_input]
        )
        
        # Theme change - async with todo orchestrator
        theme_dropdown.change(
            fn=apply_theme_async,
            inputs=[session_id, theme_dropdown, chatbot],
            outputs=[chatbot, todo_display, gen_status, preview_frame]
        )
        
        # Vibe change - async with todo orchestrator
        vibe_dropdown.change(
            fn=apply_vibe_async,
            inputs=[session_id, vibe_dropdown, chatbot],
            outputs=[chatbot, todo_display, gen_status, preview_frame]
        )
        
        # Refresh preview
        refresh_btn.click(
            fn=refresh_preview,
            inputs=[session_id],
            outputs=[preview_frame]
        )
    
    return app


if __name__ == "__main__":
    import argparse
    import uvicorn
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="UCE Slide Generation Gradio UI")
    parser.add_argument("--port", "-p", type=int, default=7860, help="Port to run the server on (default: 7860)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    args = parser.parse_args()
    
    # Create output directory if not exists
    OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
    
    # Create Gradio app
    gradio_app = create_app()
    
    # Get the FastAPI app from Gradio and mount output files
    fastapi_app = FastAPI()
    fastapi_app.mount("/output", StaticFiles(directory="output", html=True), name="output")
    fastapi_app = gr.mount_gradio_app(fastapi_app, gradio_app, path="/gradio")
    
    print("🚀 Starting server...")
    print(f"   Gradio UI: http://127.0.0.1:{args.port}/gradio/")
    print(f"   Static files: http://127.0.0.1:{args.port}/output/")
    
    uvicorn.run(fastapi_app, host=args.host, port=args.port)
