"""CLI interface for slide generation.

Simple chat-based interface that formats input and calls the orchestrator.
"""
import asyncio
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

# Fix Windows console encoding for Unicode characters
if sys.platform == "win32":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    # Force UTF-8 for stdout/stderr
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import click

from cliv2 import __version__
from cliv2.core.errors import Cliv2Error, ConfigError
from cliv2.core.models import StageResult


@click.group()
@click.version_option(version=__version__, prog_name="cliv2")
def main():
    """CLIv2: Chat-based slide generation.
    
    Generate slide presentations through natural language.
    
    Examples:
    
      cliv2 generate source.md "Create 10 slides"
      
      cliv2 generate source.md -t template.pptx "Match this style"
      
      cliv2 generate source.md --skip-search "Internal deck"
    """
    pass


def format_chat_message(
    source: Optional[Path] = None,
    template: Optional[Path] = None,
    context_files: Optional[list[Path]] = None,
    image_files: Optional[list[Path]] = None,
    instruction: str = "",
) -> tuple[str, list[dict]]:
    """Format inputs into chat message and files list.
    
    Returns:
        (message, files_list) tuple
    """
    files = []
    msg_parts = []
    
    # Add source file
    if source and source.exists():
        files.append({
            "path": str(source),
            "name": source.name,
            "purpose": "source",
        })
        msg_parts.append(f"Source: {source.name}")
    
    # Add template file
    if template and template.exists():
        files.append({
            "path": str(template),
            "name": template.name,
            "purpose": "template",
        })
        msg_parts.append(f"Template: {template.name}")
    
    # Add context files
    if context_files:
        for ctx in context_files:
            if ctx.exists():
                files.append({
                    "path": str(ctx),
                    "name": ctx.name,
                    "purpose": "context",
                })
                msg_parts.append(f"Context: {ctx.name}")
    
    # Add image files
    if image_files:
        for img in image_files:
            if img.exists():
                files.append({
                    "path": str(img),
                    "name": img.name,
                    "purpose": "images",
                })
                msg_parts.append(f"Image: {img.name}")
    
    # Build final message
    if msg_parts:
        message = ", ".join(msg_parts) + "\n\n" + instruction
    else:
        message = instruction
    
    return message, files


@main.command("generate")
@click.argument("source", type=click.Path(exists=True, path_type=Path), required=False)
@click.argument("instruction", required=False)
@click.option(
    "-t", "--template",
    type=click.Path(exists=True, path_type=Path),
    help="PowerPoint template for theme extraction"
)
@click.option(
    "-c", "--context",
    type=click.Path(exists=True, path_type=Path),
    multiple=True,
    help="Additional context files (can be repeated)"
)
@click.option(
    "--image",
    type=click.Path(exists=True, path_type=Path),
    multiple=True,
    help="Image files for background or slides (can be repeated)"
)
@click.option(
    "-p", "--project",
    type=click.Path(exists=True, path_type=Path),
    help="Continue from existing project directory"
)
@click.option(
    "-i", "--instruction",
    "instruction_opt",
    help="Generation instruction (alternative to positional arg)"
)
@click.option(
    "-o", "--output",
    type=click.Path(path_type=Path),
    help="Output file path"
)
@click.option(
    "--skip-search",
    is_flag=True,
    help="Disable web search in research subagent"
)
@click.option(
    "-r", "--renderer",
    type=click.Choice(["antd", "original"]),
    default="antd",
    help="Renderer (default: antd)"
)
@click.option(
    "-v", "--verbose",
    is_flag=True,
    help="Show detailed progress"
)
@click.option(
    "-vv", "--log-file",
    type=click.Path(path_type=Path),
    help="Write full untruncated LLM logs to file"
)
def generate_cmd(
    source: Optional[Path],
    instruction: Optional[str],
    template: Optional[Path],
    context: tuple[Path, ...],
    image: tuple[Path, ...],
    project: Optional[Path],
    instruction_opt: Optional[str],
    output: Optional[Path],
    skip_search: bool,
    renderer: str,
    verbose: bool,
    log_file: Optional[Path],
):
    """Generate slides via chat interface.
    
    SOURCE is the content file (markdown, text, pptx).
    INSTRUCTION describes what to generate.
    
    Examples:
    
      cliv2 generate notes.md "Create 10 executive slides"
      
      cliv2 generate notes.md -t brand.pptx "Match brand style"
      
      cliv2 generate deck.pptx "Redesign with modern layout"
      
      cliv2 generate -i "Create a blank 5-slide deck about AI"
    """
    # Use positional or option instruction
    final_instruction = instruction or instruction_opt or "Generate slides from the provided content"
    
    # Configure verbose file logging (full LLM input/output)
    if log_file:
        from cliv2.core import verbose_logger
        verbose_logger.set_log_file(str(log_file))
        click.echo(f"📝 Verbose logging to: {log_file}")
    
    # Configure logging
    if verbose:
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%H:%M:%S",
        )
        for noisy in ["httpx", "httpcore", "urllib3", "openai", "LiteLLM", "litellm", 
                      "azure", "msal", "asyncio", "aiohttp", "charset_normalizer"]:
            logging.getLogger(noisy).setLevel(logging.WARNING)
    
    # Format chat message
    message, files = format_chat_message(
        source=source,
        template=template,
        context_files=list(context) if context else None,
        image_files=list(image) if image else None,
        instruction=final_instruction,
    )
    
    if verbose:
        click.echo(f"📝 Message: {message[:100]}{'...' if len(message) > 100 else ''}")
        click.echo(f"📎 Files: {[f['name'] for f in files]}")
        click.echo("")
    
    # Progress callback
    def progress_callback(result: StageResult):
        if verbose:
            status_icon = {"running": "🔄", "completed": "✅", "failed": "❌"}.get(result.status, "•")
            click.echo(f"  {status_icon} {result.stage}: {result.message}")
    
    try:
        # Run orchestrator
        from cliv2.core.orchestrator_session import OrchestratorSession
        from cliv2.config.llm import create_llm
        
        click.echo("🚀 Starting slide generation...")
        start_time = datetime.now()
        
        # Create session and run
        llm = create_llm()
        session = OrchestratorSession(llm, progress_callback if verbose else None, verbose)
        
        result = asyncio.run(session.chat(
            message=message,
            files=files if files else None,
            project_dir=str(project) if project else None,
            skip_search=skip_search,
            renderer=renderer,
        ))
        
        duration = (datetime.now() - start_time).total_seconds()
        
        # Show result
        if result.get("success"):
            project_id = result.get("project_id", "")
            slide_count = len(result.get("completed_slides", []))
            click.echo("")
            click.echo(f"✅ Generated {slide_count} slides in {duration:.1f}s")
            click.echo(f"📋 Project: {project_id}")
            click.echo(f"🌐 Preview: http://localhost:3001/slides/{project_id}")
        else:
            click.echo("")
            click.echo(f"⚠️  Generation incomplete after {duration:.1f}s")
            if result.get("project_id"):
                click.echo(f"📋 Project: {result.get('project_id')}")
        
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)
        if verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


@main.command("chat")
@click.option("-v", "--verbose", is_flag=True, help="Verbose output")
def chat_cmd(verbose: bool):
    """Interactive chat mode for slide generation.
    
    Start an interactive session where you can send multiple messages.
    """
    from cliv2.core.orchestrator_session import OrchestratorSession
    from cliv2.config.llm import create_llm
    
    click.echo("🎯 CLIv2 Interactive Chat")
    click.echo("Type your instructions. Use 'quit' to exit.")
    click.echo("Upload files by prefixing with @: @notes.md @template.pptx")
    click.echo("")
    
    # Configure logging
    if verbose:
        logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    
    # Progress callback
    def progress_callback(result: StageResult):
        if verbose:
            click.echo(f"  • {result.stage}: {result.message}")
    
    # Create session
    llm = create_llm()
    session = OrchestratorSession(llm, progress_callback if verbose else None, verbose)
    
    while True:
        try:
            user_input = click.prompt("You", default="", show_default=False)
            
            if not user_input:
                continue
            
            if user_input.lower() in ("quit", "exit", "q"):
                click.echo("Goodbye!")
                break
            
            # Parse @file references
            files = []
            message_parts = []
            for word in user_input.split():
                if word.startswith("@"):
                    file_path = Path(word[1:])
                    if file_path.exists():
                        files.append({"path": str(file_path), "name": file_path.name})
                        click.echo(f"  📎 {file_path.name}")
                    else:
                        click.echo(f"  ⚠️  File not found: {word[1:]}")
                else:
                    message_parts.append(word)
            
            message = " ".join(message_parts)
            
            # Run
            click.echo("🔄 Processing...")
            result = asyncio.run(session.chat(
                message=message,
                files=files if files else None,
            ))
            
            # Show result
            if result.get("success"):
                project_id = result.get("project_id", "")
                slide_count = len(result.get("completed_slides", []))
                click.echo(f"✅ {slide_count} slides ready")
                click.echo(f"🌐 http://localhost:3001/slides/{project_id}")
            else:
                click.echo("⚠️  Processing incomplete")
            
            click.echo("")
            
        except (KeyboardInterrupt, EOFError):
            click.echo("\nGoodbye!")
            break


if __name__ == "__main__":
    main()
