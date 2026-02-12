"""Gradio UI for UCE Slide Generation with ChatInterface (Gradio 6.x).

Simplified version using gr.ChatInterface for cleaner code.

Features:
- Conversational LLM orchestrator from cliv2
- Multimodal input (text + files) via ChatInterface
- Theme selection (predefined or from PPTX template)
- Persistent session for follow-up messages
- Live preview iframe
"""
import asyncio
import os
import sys

# Fix Windows console encoding for Unicode characters
if sys.platform == "win32":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import gradio as gr
import logging
from datetime import datetime
from pathlib import Path
from typing import List, AsyncGenerator, Any

# Constants
CONTENT_MANAGER_BASE = Path.home() / "AppData" / "Local" / "Temp" / "content-manager"
DATA_DIR = Path(__file__).parent / "data"

# Logging with timestamps
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s:%(name)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("app_v3")


def _prewarm_llm():
    """Pre-warm LLM imports and Azure credential at startup.
    
    OpenHands import takes ~40s (loads tokenizers, model registries).
    Azure AD token acquisition takes ~4s.
    """
    import time
    start = time.time()
    
    # 1. Import OpenHands (the slow part - ~40s first time)
    logger.info("Pre-warming LLM imports (this may take ~40s on first run)...")
    try:
        from openhands.core.config import LLMConfig
        from openhands.llm import LLM
        logger.info(f"OpenHands imported ({time.time()-start:.1f}s)")
    except ImportError as e:
        logger.warning(f"OpenHands not installed: {e}")
        return
    
    # 2. Get Azure AD token (~4s)
    try:
        from cliv2.config.llm import _get_azure_ad_token
        _get_azure_ad_token()
        logger.info(f"Azure credential ready ({time.time()-start:.1f}s total)")
    except Exception as e:
        logger.warning(f"Azure credential warmup failed: {e}")

# Session storage - keyed by project_id, not global
_sessions: dict[str, Any] = {}
# Note: _current_project_id and _pending_files are now per-request, extracted from history


def _extract_project_id_from_history(history: list) -> str:
    """Extract project_id from chat history by looking for project creation messages."""
    import re
    for msg in reversed(history):
        # Check both user and assistant messages
        content = ""
        if isinstance(msg, dict):
            raw_content = msg.get("content", "") or msg.get("text", "")
            # Handle multimodal content (list of parts)
            if isinstance(raw_content, list):
                content = " ".join(str(part) for part in raw_content if part)
            else:
                content = str(raw_content) if raw_content else ""
        elif isinstance(msg, (list, tuple)) and len(msg) >= 2:
            raw = msg[1]
            if isinstance(raw, list):
                content = " ".join(str(part) for part in raw if part)
            else:
                content = str(raw) if raw else ""
        else:
            content = str(msg) if msg else ""
        
        # Look for project ID pattern in messages
        match = re.search(r'Project[:\s]+`?([a-zA-Z0-9_]+_[a-f0-9]{8})`?', content)
        if match:
            return match.group(1)
    return ""


def list_themes() -> List[str]:
    """List available predefined themes."""
    themes = ["(auto from template)"]  # Default: use PPTX template if provided
    if DATA_DIR.exists():
        for f in DATA_DIR.glob("*_theme.json"):
            theme_name = f.stem.replace("_theme", "")
            themes.append(theme_name)
    return themes


def get_preview_html(project_id: str = "", status_text: str = "", force_reload: bool = False) -> str:
    """Get preview iframe HTML.
    
    Args:
        project_id: Project ID for preview URL
        status_text: Status text to show when no project
        force_reload: If True, add timestamp to force iframe reload (use sparingly - preview uses WebSocket)
    """
    if not project_id:
        status = status_text or "Upload a file and send instructions to start"
        return f"""<div style='height:100%;min-height:calc(100vh - 120px);background:#111;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            color:#888;border-radius:8px;padding:2rem;'>
            <div style='font-size:3rem;margin-bottom:1rem;'>🎯</div>
            <div style='font-size:1.2rem;text-align:center;max-width:400px;'>{status}</div>
        </div>"""
    # No timestamp by default - preview page uses WebSocket for auto-refresh
    url = f"http://localhost:3001/preview/{project_id}"
    if force_reload:
        url += f"?t={datetime.now().timestamp()}"
    return f'<iframe src="{url}" width="100%" height="100%" style="border:none;border-radius:8px;min-height:calc(100vh - 120px);"></iframe>'


def list_recent_projects() -> List[str]:
    """List recent projects."""
    if not CONTENT_MANAGER_BASE.exists():
        return []
    projects = [p.name for p in CONTENT_MANAGER_BASE.iterdir() 
                if p.is_dir() and (p / "content.json").exists()]
    projects.sort(key=lambda x: (CONTENT_MANAGER_BASE / x / "content.json").stat().st_mtime, reverse=True)
    return projects[:20]


async def respond(message: dict, history: list, skip_search: bool, selected_project: str = "") -> AsyncGenerator[tuple[str, str], None]:
    """ChatInterface response function with additional_outputs for preview.
    
    Args:
        message: {"text": str, "files": list} from multimodal input
        history: Chat history (managed by ChatInterface)
        skip_search: When True, disables web search in research (consolidation still runs)
        selected_project: Project ID from recent projects dropdown (for continuing work)
    
    Yields:
        Tuple of (chat_response, preview_html) for streaming with preview updates
    """
    from cliv2.core.orchestrator_session import OrchestratorSession
    from cliv2.config.llm import create_llm
    
    text = message.get("text", "") if isinstance(message, dict) else str(message)
    files = message.get("files", []) if isinstance(message, dict) else []
    
    # Extract project_id from history OR use selected project from dropdown
    current_project_id = _extract_project_id_from_history(history) or selected_project
    
    # Log user input
    logger.info(f"[user input] text={text!r} files={[Path(f if isinstance(f, str) else getattr(f, 'name', 'file')).name for f in files]} project={current_project_id or 'new'}")
    
    # If files provided but no text, prompt for instructions
    # Note: pending files handling removed - each request is independent
    if not text.strip() and files:
        file_names = [Path(f if isinstance(f, str) else getattr(f, 'name', 'file')).name for f in files]
        yield f"📎 Files attached: {', '.join(file_names)}\n\nPlease provide instructions for what to do with these files.", get_preview_html(current_project_id), gr.update()
        return
    
    if not text.strip():
        yield "⚠️ Please enter an instruction.", get_preview_html(current_project_id), gr.update()
        return
    
    # Build files list, identifying templates vs source files
    files_list = []
    template_file = None
    
    for f in files:
        path = f if isinstance(f, str) else getattr(f, 'name', None)
        if path:
            file_name = Path(path).name
            file_ext = Path(path).suffix.lower()
            file_info = {"path": path, "name": file_name}
            
            # PPTX files are templates by default (for theme extraction)
            if file_ext == ".pptx":
                file_info["role"] = "template"
                template_file = path
            else:
                file_info["role"] = "source"
            
            files_list.append(file_info)
    
    # Build enhanced instruction
    enhanced_text = text
    if skip_search:
        enhanced_text = f"{text}\n\nSkip web search."
    if template_file:
        # Use PPTX as template for theme extraction
        enhanced_text = f"{enhanced_text}\n\n[Extract theme from template: {template_file}]"
    
    # Session management:
    # - Each project has its own session keyed by project_id
    # - New requests without project use a unique session
    # - Project ID is extracted from chat history for follow-ups
    
    if current_project_id:
        # We have a project from history - use its session
        session_key = f"project_{current_project_id}"
    else:
        # No project yet - use a unique session for this request
        import uuid
        session_key = f"new_{uuid.uuid4().hex[:8]}"
    
    if session_key not in _sessions:
        logger.info(f"[session] Creating new session: {session_key}")
        llm = create_llm()
        _sessions[session_key] = OrchestratorSession(llm, verbose=True)
        
        # If this is for an existing project, initialize session state
        if current_project_id:
            project_dir = CONTENT_MANAGER_BASE / current_project_id
            if project_dir.exists():
                _sessions[session_key].state.project_id = current_project_id
                _sessions[session_key].state.project_dir = str(project_dir)
                _sessions[session_key].state.project_created = True
                logger.info(f"[session] Loaded existing project: {current_project_id}")
    
    session = _sessions[session_key]
    project_id = current_project_id  # Start with existing or None
    progress = []
    
    # Use queue to stream progress updates
    progress_queue: asyncio.Queue = asyncio.Queue()
    
    # Progress callback - puts updates in queue
    def on_progress(result):
        nonlocal project_id
        stage, status, msg = result.stage, result.status, result.message
        logger.info(f"[{stage}] {status}: {msg}")
        
        update = None
        if stage == "mcp" and result.data and result.data.get("project_id"):
            project_id = result.data["project_id"]
            update = ("project", project_id)
        elif status == "completed":
            if stage == "theme":
                update = ("stage", "🎨 Theme ready")
            elif stage == "storyline":
                n = len(result.data.get("completed_ids", [])) if result.data else 0
                update = ("stage", f"📝 {n} slides planned")
            elif stage == "layout":
                update = ("stage", "🖼️ Layouts generated")
            elif stage == "export":
                update = ("stage", "📤 Exported")
        
        if update:
            try:
                progress_queue.put_nowait(update)
            except:
                pass
    
    session.progress_callback = on_progress
    
    # Show loading state - use existing preview for continuous generation
    existing_project_id = session.state.project_id or current_project_id
    if existing_project_id:
        # Continuous generation - show existing preview
        current_preview = get_preview_html(existing_project_id)
        yield "🔄 Processing...", current_preview, gr.update()
    else:
        # First generation - show "Creating project..."
        current_preview = get_preview_html("", "⏳ Creating project...")
        yield "🔄 Processing...", current_preview, gr.update()
    
    # Run chat in background task so we can yield progress updates
    async def run_chat():
        return await session.chat(
            message=enhanced_text,
            files=files_list if files_list else None,
            renderer="antd",
        )
    
    chat_task = asyncio.create_task(run_chat())
    
    # Poll for progress updates while chat is running
    while not chat_task.done():
        try:
            # Wait for progress update with timeout
            update = await asyncio.wait_for(progress_queue.get(), timeout=0.3)
            update_type, update_value = update
            
            if update_type == "project":
                project_id = update_value
                # Register session with project ID for future lookups
                if project_id and session_key.startswith("new_"):
                    new_session_key = f"project_{project_id}"
                    _sessions[new_session_key] = _sessions.pop(session_key, session)
                    logger.info(f"[session] Renamed session: {session_key} -> {new_session_key}")
                progress.append(f"📁 Project: `{project_id}`")
                # Load preview iframe when NEW project created (force reload to switch project)
                current_preview = get_preview_html(project_id, force_reload=True)
                # Update dropdown to show new project as selected
                dropdown_update = gr.update(choices=list_recent_projects(), value=project_id)
                yield "\n".join(progress) + "\n\n🔄 Generating...", current_preview, dropdown_update
            elif update_type == "stage":
                progress.append(update_value)
                yield "\n".join(progress) + "\n\n🔄 Generating...", current_preview, gr.update()
                
        except asyncio.TimeoutError:
            # No update, just continue waiting
            continue
        except Exception as e:
            logger.warning(f"Progress update error: {e}")
            continue
    
    # Get final result
    try:
        result = await chat_task
        project_id = project_id or result.get("project_id", "")
        
        slides = result.get("completed_slides", [])
        progress_text = "\n".join(progress) if progress else ""
        
        # Final preview - no forced reload, WebSocket handles updates
        final_preview = get_preview_html(project_id) if project_id else current_preview
        
        # Final dropdown update with project selected
        final_dropdown = gr.update(choices=list_recent_projects(), value=project_id) if project_id else gr.update()
        
        # Handle waiting_for_input state (orchestrator needs clarification)
        if result.get("waiting_for_input"):
            question = result.get("question", "Need more information to proceed.")
            yield f"{progress_text}\n\n❓ **Clarification needed:**\n\n{question}", final_preview, final_dropdown
        elif result.get("success"):
            yield f"{progress_text}\n\n✅ **Generated {len(slides)} slides!**\n📋 Project: `{project_id}`", final_preview, final_dropdown
        else:
            error = result.get("error", "Pipeline did not complete")
            yield f"{progress_text}\n\n⚠️ {error}", final_preview, final_dropdown
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        yield f"❌ **Error:** {str(e)}", get_preview_html("", f"Error: {str(e)}"), gr.update()


def create_app():
    """Create Gradio app with ChatInterface."""
    
    # Custom CSS for full-height layout with no overflow
    # Account for ~40px header height
    custom_css = """
    html, body, .gradio-container { height: 100vh; overflow: hidden; margin: 0; padding: 0; }
    .gradio-container > .main { height: 100%; overflow: hidden; }
    .main-row { height: calc(100vh - 80px); overflow: hidden; }
    .main-row > div { height: 100%; overflow: hidden; }
    #preview { height: calc(100vh - 140px); overflow: hidden; }
    #preview iframe { height: 100% !important; border: none; }
    .chatbot { max-height: calc(100vh - 320px) !important; overflow-y: auto; }
    """
    
    with gr.Blocks(title="UCE Slide Generator", fill_width=True, css=custom_css) as app:
        gr.Markdown("## 🎯 UCE Slide Generator", elem_id="header")
        
        with gr.Row(elem_classes=["main-row"]):
            # Left: Chat (30%)
            with gr.Column(scale=3):
                # Placeholder for chat - will be defined below after preview
                chat_container = gr.Column()
            
            # Right: Preview (70%) - define first so we can reference it
            with gr.Column(scale=7):
                preview = gr.HTML(value=get_preview_html(), elem_id="preview")
                with gr.Row():
                    refresh_preview_btn = gr.Button("🔄 Refresh Preview", size="sm")
        
        # Now create ChatInterface with preview as additional_output
        with chat_container:
            # Projects dropdown
            with gr.Accordion("📂 Projects", open=False):
                recent = gr.Dropdown(choices=list_recent_projects(), value=None, show_label=False, allow_custom_value=True)
                refresh_btn = gr.Button("🔄 Refresh", size="sm")
            
            # Options accordion with skip search
            with gr.Accordion("⚙️ Options", open=False):
                skip_search_cb = gr.Checkbox(label="Skip Web Search", value=False)
            
            chat = gr.ChatInterface(
                fn=respond,
                multimodal=True,
                additional_inputs=[
                    skip_search_cb,
                    recent,  # Pass selected project to continue editing
                ],
                additional_outputs=[preview, recent],  # Update preview and project dropdown on response
                textbox=gr.MultimodalTextbox(
                    placeholder="Drop files (MD=source, PPTX=template) + instructions...",
                    file_types=[".txt", ".md", ".vtt", ".pptx", ".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp", ".svg"],
                    file_count="multiple",
                    submit_btn="➤",
                ),
            )
        
        # Event handlers
        recent.change(
            fn=lambda p: get_preview_html(p) if p else get_preview_html(),
            inputs=[recent],
            outputs=[preview]
        )
        
        refresh_btn.click(
            fn=lambda: gr.update(choices=list_recent_projects()),
            outputs=[recent]
        )
        
        # Refresh preview uses recent dropdown value
        refresh_preview_btn.click(
            fn=lambda p: get_preview_html(p, force_reload=True) if p else get_preview_html(),
            inputs=[recent],
            outputs=[preview]
        )
    
    return app


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="UCE Slide Generator v3")
    parser.add_argument("--port", "-p", type=int, default=7860)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--log-file", "-vv", type=str, default=None,
                       help="Write full untruncated LLM logs to file")
    args = parser.parse_args()
    
    # Configure verbose file logging
    if args.log_file:
        from cliv2.core import verbose_logger
        verbose_logger.set_log_file(args.log_file)
        print(f"📝 Verbose logging to: {args.log_file}")
    
    print("🚀 Starting UCE Slide Generator v3...")
    print(f"   UI: http://127.0.0.1:{args.port}")
    print(f"   Note: Ensure React preview server is running at http://localhost:3001")
    
    # Pre-warm LLM imports and Azure credential to avoid first-request delay
    _prewarm_llm()
    
    app = create_app()
    app.queue(default_concurrency_limit=5)  # Support 5 parallel requests
    app.launch(server_name=args.host, server_port=args.port)
