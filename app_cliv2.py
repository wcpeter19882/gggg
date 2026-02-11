"""Gradio UI for CLIv2 Slide Generation.

Features:
- Uses cliv2 orchestrator for slide generation
- Source file upload with markdown preview
- Pipeline stage progress visualization
- content.json display in sidebar (with section filtering)
- Live preview iframe
- Example source files
"""
import asyncio
import gradio as gr
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, AsyncGenerator
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Import cliv2 components
from cliv2 import generate, GenerationRequest, GenerationResult, StageResult


# Constants
TEMP_BASE = Path("temp/content-manager")
OUTPUT_BASE = Path("output")
EXAMPLES_DIR = Path("data/context")


def get_example_files() -> List[str]:
    """Get list of example source files."""
    if not EXAMPLES_DIR.exists():
        return []
    return sorted([f.name for f in EXAMPLES_DIR.glob("*.txt")] + [f.name for f in EXAMPLES_DIR.glob("*.md")])


def get_project_dirs() -> List[str]:
    """Get list of existing project directories."""
    if not TEMP_BASE.exists():
        return []
    return sorted([d.name for d in TEMP_BASE.iterdir() if d.is_dir()], reverse=True)


def load_content_json(project_id: str) -> tuple[str, str]:
    """Load content.json for a project.
    
    Returns:
        Tuple of (formatted_json, raw_json)
    """
    if not project_id:
        return "No project selected", "{}"
    
    project_dir = TEMP_BASE / project_id
    content_path = project_dir / "content.json"
    
    if not content_path.exists():
        return f"content.json not found in {project_dir}", "{}"
    
    try:
        content = json.loads(content_path.read_text(encoding="utf-8"))
        formatted = json.dumps(content, indent=2, ensure_ascii=False)
        return formatted, formatted
    except Exception as e:
        return f"Error loading content.json: {e}", "{}"


def get_content_section(project_id: str, section: str) -> str:
    """Get a specific section from content.json."""
    if not project_id:
        return "No project selected"
    
    project_dir = TEMP_BASE / project_id
    content_path = project_dir / "content.json"
    
    if not content_path.exists():
        return "content.json not found"
    
    try:
        content = json.loads(content_path.read_text(encoding="utf-8"))
        
        if section == "all":
            return json.dumps(content, indent=2, ensure_ascii=False)
        elif section in content:
            return json.dumps(content[section], indent=2, ensure_ascii=False)
        else:
            return f"Section '{section}' not found"
    except Exception as e:
        return f"Error: {e}"


def get_slides_summary(project_id: str) -> str:
    """Get a summary of slides from content.json."""
    if not project_id:
        return "No project selected"
    
    project_dir = TEMP_BASE / project_id
    content_path = project_dir / "content.json"
    
    if not content_path.exists():
        return "No slides yet"
    
    try:
        content = json.loads(content_path.read_text(encoding="utf-8"))
        slides = content.get("slides", [])
        
        if not slides:
            return "No slides generated yet"
        
        lines = [f"📊 **{len(slides)} slides**\n"]
        for i, slide in enumerate(slides):
            slide_id = slide.get("id", f"slide_{i+1}")
            intent = slide.get("intent", "unknown")
            title = slide.get("title", "Untitled")[:50]
            state = slide.get("state", "active")
            status = "✅" if state == "active" else "⏸️"
            lines.append(f"{status} **{i+1}. {slide_id}** ({intent})\n   {title}")
        
        return "\n".join(lines)
    except Exception as e:
        return f"Error: {e}"


def format_stage_status(result: StageResult) -> str:
    """Format a stage result for display."""
    icons = {
        "pending": "⏳",
        "running": "🔄",
        "completed": "✅",
        "skipped": "⏭️",
        "failed": "❌",
    }
    icon = icons.get(result.status, "❓")
    duration = f" ({result.duration_ms}ms)" if result.duration_ms else ""
    return f"{icon} **{result.stage}**: {result.message}{duration}"


def format_progress(stages: List[StageResult]) -> str:
    """Format all stage results for display."""
    if not stages:
        return "No stages executed yet"
    return "\n".join(format_stage_status(s) for s in stages)


def get_preview_url(project_id: str, port: int = 3001) -> str:
    """Get the preview URL for the slides."""
    return f"http://localhost:{port}/slides/{project_id}"


def get_preview_html(project_id: str, port: int = 3001) -> str:
    """Get preview iframe HTML."""
    if not project_id:
        return "<div style='height:600px;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;border-radius:8px;'>No project selected</div>"
    
    timestamp = datetime.now().timestamp()
    url = f"http://localhost:{port}/slides/{project_id}?t={timestamp}"
    return f'<iframe src="{url}" width="100%" height="600" style="border:1px solid #333;border-radius:8px;"></iframe>'


def load_example_file(filename: str) -> tuple[Optional[str], str]:
    """Load an example file content.
    
    Returns:
        Tuple of (file_path for gr.File, preview_text)
    """
    if not filename:
        return None, ""
    
    file_path = EXAMPLES_DIR / filename
    if not file_path.exists():
        return None, f"File not found: {filename}"
    
    try:
        content = file_path.read_text(encoding="utf-8")
        # Truncate preview if too long
        preview = content[:2000] + "..." if len(content) > 2000 else content
        return str(file_path), preview
    except Exception as e:
        return None, f"Error loading file: {e}"


def copy_example_to_temp(filename: str) -> Optional[Path]:
    """Copy an example file to a temp location for upload.
    
    Returns the path to the copied file.
    """
    if not filename:
        return None
    
    source = EXAMPLES_DIR / filename
    if not source.exists():
        return None
    
    # Copy to temp directory
    temp_dir = Path("temp/uploads")
    temp_dir.mkdir(parents=True, exist_ok=True)
    dest = temp_dir / filename
    shutil.copy(source, dest)
    return dest


async def run_generation(
    source_file,
    source_path_from_state: Optional[str],
    instruction: str,
    theme: Optional[str],
    skip_research: bool,
    stop_after: Optional[str],
    chat_history: List[Dict[str, str]],
) -> AsyncGenerator[tuple[List[Dict[str, str]], str, str, str, str, str, gr.update], None]:
    """Run the cliv2 generation pipeline.
    
    Yields: (chat_history, progress, status, slides_summary, content_json, preview_html, project_dropdown)
    """
    # Determine source path - prefer uploaded file, then example from state
    if source_file is not None:
        source_path = Path(source_file.name)
    elif source_path_from_state:
        source_path = Path(source_path_from_state)
    else:
        chat_history = chat_history + [{"role": "assistant", "content": "❌ Please upload a source file or select an example first"}]
        yield chat_history, "", "⚠️ No source file", "", "{}", "", gr.update()
        return
    
    # Add user message
    chat_history = chat_history + [{"role": "user", "content": f"Generate slides from: {source_path.name}\nInstruction: {instruction or 'Default'}"}]
    yield chat_history, "⏳ Initializing pipeline...", "🔄 Starting...", "", "{}", "", gr.update()
    
    # Track progress
    stages: List[StageResult] = []
    current_project_id = ""
    
    def progress_callback(result: StageResult):
        nonlocal stages, current_project_id
        # Update or add stage result
        existing = next((i for i, s in enumerate(stages) if s.stage == result.stage), None)
        if existing is not None:
            stages[existing] = result
        else:
            stages.append(result)
    
    try:
        # Create generation request
        request = GenerationRequest(
            source_path=source_path,
            instruction=instruction or "",
            theme=theme if theme and theme != "auto" else None,
            skip_research=skip_research,
            stop_after=stop_after if stop_after and stop_after != "none" else None,
            renderer="antd",
            verbose=True,
            progress_callback=progress_callback,
        )
        
        # Run generation in background
        result: GenerationResult = await generate(request)
        current_project_id = result.project_id
        
        # Get final outputs
        progress_text = format_progress(result.stages)
        slides_summary = get_slides_summary(current_project_id)
        content_json, _ = load_content_json(current_project_id)
        preview_html = get_preview_html(current_project_id)
        
        # Status message
        if result.is_success:
            status = f"✅ Generation complete! ({result.total_duration_ms}ms)"
            chat_history = chat_history + [{"role": "assistant", "content": f"✅ Generated slides for project: **{current_project_id}**\n\nPreview: {result.preview_url}"}]
        else:
            failed = result.failed_stage
            status = f"❌ Failed at stage: {failed.stage if failed else 'unknown'}"
            chat_history = chat_history + [{"role": "assistant", "content": f"❌ Generation failed: {failed.message if failed else 'Unknown error'}"}]
        
        # Update project dropdown
        project_choices = get_project_dirs()
        
        yield (
            chat_history,
            progress_text,
            status,
            slides_summary,
            content_json,
            preview_html,
            gr.update(choices=project_choices, value=current_project_id),
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        chat_history = chat_history + [{"role": "assistant", "content": f"❌ Error: {str(e)}"}]
        yield chat_history, format_progress(stages), f"❌ Error: {str(e)}", "", "{}", "", gr.update()


def on_project_select(project_id: str) -> tuple[str, str, str]:
    """Handle project selection from dropdown."""
    slides_summary = get_slides_summary(project_id)
    content_json, _ = load_content_json(project_id)
    preview_html = get_preview_html(project_id)
    return slides_summary, content_json, preview_html


def on_section_select(project_id: str, section: str) -> str:
    """Handle section selection for content.json view."""
    return get_content_section(project_id, section)


def refresh_projects() -> gr.update:
    """Refresh the project dropdown."""
    choices = get_project_dirs()
    return gr.update(choices=choices)


def create_app():
    """Create the Gradio application."""
    
    # Custom CSS for better styling
    custom_css = """
    .content-json-box textarea {
        font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        font-size: 12px !important;
    }
    .slides-summary {
        font-size: 13px;
    }
    """
    
    with gr.Blocks(
        title="CLIv2 Slide Generator",
    ) as app:
        gr.Markdown("# 🎯 CLIv2 Slide Generator")
        gr.Markdown("Generate professional presentations using the cliv2 pipeline")
        
        with gr.Row():
            # Left Sidebar - Content JSON & Slides
            with gr.Column(scale=1, min_width=350):
                gr.Markdown("### 📁 Project")
                with gr.Row():
                    project_dropdown = gr.Dropdown(
                        label="Select Project",
                        choices=get_project_dirs(),
                        interactive=True,
                        scale=4,
                    )
                    refresh_btn = gr.Button("🔄", scale=1, size="sm")
                
                gr.Markdown("### 📊 Slides Summary")
                slides_summary = gr.Markdown(
                    value="No project selected",
                    elem_classes=["slides-summary"],
                )
                
                gr.Markdown("### 📄 content.json")
                section_dropdown = gr.Dropdown(
                    label="Section",
                    choices=["all", "atoms", "theme", "slides", "story", "constitution", "issues", "metadata"],
                    value="all",
                    interactive=True,
                )
                content_json_box = gr.Code(
                    label="Content",
                    language="json",
                    lines=20,
                    interactive=False,
                    elem_classes=["content-json-box"],
                )
            
            # Main Area - Generation & Preview
            with gr.Column(scale=2):
                with gr.Tabs():
                    # Tab 1: Generate
                    with gr.TabItem("🚀 Generate"):
                        gr.Markdown("### 📤 Source File")
                        with gr.Row():
                            example_dropdown = gr.Dropdown(
                                label="Or Select Example",
                                choices=get_example_files(),
                                interactive=True,
                                scale=2,
                            )
                            use_example_btn = gr.Button("📂 Use Example", scale=1)
                        
                        source_file = gr.File(
                            label="Upload Markdown Source",
                            file_types=[".md", ".txt", ".vtt"],
                        )
                        
                        with gr.Accordion("📖 Source Preview", open=False):
                            source_preview = gr.Textbox(
                                label="Content Preview",
                                lines=10,
                                interactive=False,
                            )
                        
                        gr.Markdown("### ⚙️ Options")
                        with gr.Row():
                            instruction_input = gr.Textbox(
                                label="Instruction",
                                placeholder="e.g., Create 8 slides for executive review, professional tone",
                                scale=3,
                            )
                            theme_input = gr.Dropdown(
                                label="Theme",
                                choices=["auto", "business", "businessLight", "tech", "cyber", "academic", "creative", "dark", "minimal", "duolingo", "teamsDark", "teamsLight"],
                                value="auto",
                                scale=1,
                            )
                        
                        with gr.Row():
                            skip_research = gr.Checkbox(
                                label="Skip Research",
                                value=False,
                                info="Skip external research stage",
                            )
                            stop_after = gr.Dropdown(
                                label="Stop After",
                                choices=["none", "create", "research", "theme", "storyline", "layout"],
                                value="none",
                                info="Stop pipeline after this stage",
                            )
                        
                        generate_btn = gr.Button("🚀 Generate Slides", variant="primary", size="lg")
                        
                        gr.Markdown("### 📋 Progress")
                        progress_display = gr.Markdown(value="No generation started")
                        status_display = gr.Textbox(label="Status", interactive=False)
                    
                    # Tab 2: Chat
                    with gr.TabItem("💬 Chat"):
                        chatbot = gr.Chatbot(
                            label="Generation Log",
                            height=300,
                        )
                
                gr.Markdown("### 👁️ Preview")
                with gr.Row():
                    preview_url_display = gr.Textbox(
                        label="Preview URL",
                        value="",
                        interactive=False,
                        scale=4,
                    )
                    refresh_preview_btn = gr.Button("🔄 Refresh", scale=1)
                
                preview_frame = gr.HTML(
                    value="<div style='height:600px;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;border-radius:8px;'>Preview will appear here after generation</div>"
                )
        
        # State for chat history
        chat_state = gr.State([])
        # State for source file path (for examples)
        source_path_state = gr.State(None)
        
        # Event Handlers
        
        # Example file selection - show preview
        example_dropdown.change(
            fn=lambda fname: load_example_file(fname)[1] if fname else "",
            inputs=[example_dropdown],
            outputs=[source_preview],
        )
        
        # Use example button
        def use_example(filename):
            if not filename:
                return None, "", "Please select an example file first"
            path = copy_example_to_temp(filename)
            if path:
                content = path.read_text(encoding="utf-8")
                preview = content[:2000] + "..." if len(content) > 2000 else content
                return str(path), preview, f"✅ Loaded: {filename}"
            return None, "", f"❌ Failed to load: {filename}"
        
        use_example_btn.click(
            fn=use_example,
            inputs=[example_dropdown],
            outputs=[source_path_state, source_preview, status_display],
        )
        
        # Source file upload - show preview
        def on_file_upload(file):
            if file is None:
                return ""
            try:
                content = Path(file.name).read_text(encoding="utf-8")
                return content[:2000] + "..." if len(content) > 2000 else content
            except Exception as e:
                return f"Error reading file: {e}"
        
        source_file.change(
            fn=on_file_upload,
            inputs=[source_file],
            outputs=[source_preview],
        )
        
        # Refresh projects
        refresh_btn.click(
            fn=refresh_projects,
            outputs=[project_dropdown],
        )
        
        # Project selection
        project_dropdown.change(
            fn=on_project_select,
            inputs=[project_dropdown],
            outputs=[slides_summary, content_json_box, preview_frame],
        ).then(
            fn=lambda pid: get_preview_url(pid) if pid else "",
            inputs=[project_dropdown],
            outputs=[preview_url_display],
        )
        
        # Section selection for content.json
        section_dropdown.change(
            fn=on_section_select,
            inputs=[project_dropdown, section_dropdown],
            outputs=[content_json_box],
        )
        
        # Generate slides
        generate_btn.click(
            fn=run_generation,
            inputs=[source_file, source_path_state, instruction_input, theme_input, skip_research, stop_after, chat_state],
            outputs=[chatbot, progress_display, status_display, slides_summary, content_json_box, preview_frame, project_dropdown],
        ).then(
            fn=lambda pid: get_preview_url(pid) if pid else "",
            inputs=[project_dropdown],
            outputs=[preview_url_display],
        )
        
        # Refresh preview
        refresh_preview_btn.click(
            fn=lambda pid: get_preview_html(pid) if pid else "",
            inputs=[project_dropdown],
            outputs=[preview_frame],
        )
    
    return app


def main():
    """Main entry point."""
    import argparse
    import uvicorn
    
    parser = argparse.ArgumentParser(description="CLIv2 Slide Generation Gradio UI")
    parser.add_argument("--port", "-p", type=int, default=7861, help="Port to run the server on (default: 7861)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--share", action="store_true", help="Create a public link")
    args = parser.parse_args()
    
    # Create directories
    TEMP_BASE.mkdir(parents=True, exist_ok=True)
    OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
    
    # Create Gradio app
    gradio_app = create_app()
    
    if args.share:
        # Simple launch with share
        gradio_app.launch(server_name=args.host, server_port=args.port, share=True)
    else:
        # Launch with FastAPI for static file serving
        fastapi_app = FastAPI()
        
        # Mount output directory if it has content
        if OUTPUT_BASE.exists():
            fastapi_app.mount("/output", StaticFiles(directory=str(OUTPUT_BASE), html=True), name="output")
        
        # Mount Gradio app
        fastapi_app = gr.mount_gradio_app(fastapi_app, gradio_app, path="/")
        
        print("🚀 Starting CLIv2 Gradio UI...")
        print(f"   URL: http://127.0.0.1:{args.port}/")
        print(f"   Make sure the Ant Design preview server is running on port 3001")
        
        uvicorn.run(fastapi_app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
