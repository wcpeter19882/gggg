"""CLI interface adapter for slide generation.

This is a thin wrapper that:
1. Parses command-line arguments
2. Converts them to GenerationRequest
3. Calls core orchestrator
4. Formats output for terminal
"""
import asyncio
import sys
from pathlib import Path
from typing import Optional

import click

from cliv2 import __version__
from cliv2.core.errors import Cliv2Error, ConfigError
from cliv2.core.models import GenerationRequest, StageResult
from cliv2.core.orchestrator import generate
from cliv2.interfaces.cli.formatters import (
    format_progress,
    format_summary,
    format_error,
    format_config_info,
)


@click.group()
@click.version_option(version=__version__, prog_name="cliv2")
def main():
    """CLIv2: Headless slide generation with OpenHands SDK.
    
    Generate slide presentations from markdown source files using
    AI-powered orchestration.
    
    Examples:
    
      cliv2 generate docs/pitch.md
      
      cliv2 generate docs/pitch.md --theme cyber --skip-research
      
      cliv2 generate docs/pitch.md -v -o output/slides.html
    """
    pass


@main.command("generate")
@click.argument("source", type=click.Path(exists=True, path_type=Path))
@click.option(
    "-o", "--output",
    type=click.Path(path_type=Path),
    help="Output file path"
)
@click.option(
    "--skip-research",
    is_flag=True,
    help="Skip research stage (for confidential content)"
)
@click.option(
    "-t", "--theme",
    help="Pre-select theme name (skips theme selection)"
)
@click.option(
    "-i", "--instruction",
    help="Custom generation instructions"
)
@click.option(
    "-r", "--renderer",
    type=click.Choice(["antd", "original"]),
    default="antd",
    help="Renderer choice (default: antd)"
)
@click.option(
    "-s", "--stop-after",
    type=click.Choice(["create", "research", "theme", "storyline", "layout"]),
    help="Stop after specified stage"
)
@click.option(
    "-v", "--verbose",
    is_flag=True,
    help="Show detailed progress"
)
@click.option(
    "-c", "--config",
    type=click.Path(exists=True, path_type=Path),
    help="Config file path (.cliv2.yaml)"
)
def generate_cmd(
    source: Path,
    output: Optional[Path],
    skip_research: bool,
    theme: Optional[str],
    instruction: Optional[str],
    renderer: str,
    stop_after: Optional[str],
    verbose: bool,
    config: Optional[Path],
):
    """Generate slides from a source markdown file.
    
    SOURCE is the path to the markdown file to process.
    
    Examples:
    
      cliv2 generate docs/pitch.md
      
      cliv2 generate docs/pitch.md --theme cyber
      
      cliv2 generate docs/pitch.md --skip-research -v
    """
    try:
        # Progress callback for verbose mode
        def progress_callback(result: StageResult):
            if verbose:
                click.echo(format_progress(result))
        
        # Convert CLI args to GenerationRequest
        request = GenerationRequest(
            source_path=source,
            output_path=output,
            skip_research=skip_research,
            theme=theme,
            instruction=instruction or "",
            renderer=renderer,
            stop_after=stop_after,
            verbose=verbose,
            progress_callback=progress_callback if verbose else None,
        )
        
        # Show starting message
        if verbose:
            click.echo(f"Generating slides from: {source}")
            click.echo("")
        
        # Call core orchestrator
        result = asyncio.run(generate(request))
        
        # Format output for terminal
        click.echo(format_summary(result, verbose))
        
        # Exit with appropriate code
        if not result.is_success:
            sys.exit(1)
        
    except ConfigError as e:
        click.echo(format_error(e.message, e.hint), err=True)
        sys.exit(2)
    except Cliv2Error as e:
        click.echo(format_error(e.message, e.hint), err=True)
        sys.exit(1)
    except KeyboardInterrupt:
        click.echo("\nGeneration cancelled by user.", err=True)
        sys.exit(130)


@main.command("config")
@click.option("--show", is_flag=True, help="Show current configuration")
@click.option("--validate", is_flag=True, help="Validate configuration")
@click.option("--init", is_flag=True, help="Create .cliv2.yaml template")
def config_cmd(show: bool, validate: bool, init: bool):
    """Show or validate configuration.
    
    Examples:
    
      cliv2 config --show
      
      cliv2 config --validate
      
      cliv2 config --init
    """
    if init:
        _init_config()
        return
    
    if show or validate:
        _show_or_validate_config(validate)
        return
    
    # Default: show help
    ctx = click.get_current_context()
    click.echo(ctx.get_help())


def _init_config():
    """Create a .cliv2.yaml template file."""
    template = """# CLIv2 Configuration
# See https://github.com/your-org/cliv2 for documentation

# LLM settings (optional - uses environment variables by default)
# llm:
#   model: azure/gpt-4

# Pipeline defaults
pipeline:
  default_theme: business
  skip_research: false
  renderer: antd
  verbose: false

# Tool paths (optional - uses defaults)
# tools:
#   mcp_servers_path: .claude/tools

# Skill paths (optional - uses defaults)
# skills:
#   skills_path: .claude/skills
"""
    
    config_path = Path(".cliv2.yaml")
    if config_path.exists():
        click.echo(f"Config file already exists: {config_path}")
        if not click.confirm("Overwrite?"):
            return
    
    config_path.write_text(template)
    click.echo(f"Created config file: {config_path}")


def _show_or_validate_config(validate_only: bool):
    """Show or validate configuration."""
    from cliv2.config.env import load_env, validate_azure_config
    from cliv2.config.llm import get_llm_config
    from cliv2.tools.mcp_config import get_mcp_config
    from cliv2.skills.loader import discover_skills
    from cliv2.interfaces.cli.formatters import CHECK, CROSS
    
    load_env()
    
    try:
        llm_config = get_llm_config()
        llm_status = f"{CHECK} Configured"
    except ConfigError as e:
        llm_config = {}
        llm_status = f"{CROSS} {e.message}"
    
    mcp_config = get_mcp_config()
    mcp_servers = list(mcp_config.get("mcpServers", {}).keys())
    
    skills = discover_skills()
    skill_names = [s["name"] for s in skills]
    
    config_info = {
        "LLM": llm_status,
        "Model": llm_config.get("model", "Not configured"),
        "MCP Servers": ", ".join(mcp_servers) if mcp_servers else "None found",
        "Skills": ", ".join(skill_names) if skill_names else "None found",
    }
    
    click.echo(format_config_info(config_info))
    
    if validate_only:
        # Check for issues
        issues = []
        if CROSS in llm_status:
            issues.append("LLM configuration missing")
        if not mcp_servers:
            issues.append("No MCP servers found in .claude/tools/")
        if not skills:
            issues.append("No skills found in .claude/skills/")
        
        click.echo("")
        if issues:
            for issue in issues:
                click.echo(f"  ! {issue}")
            sys.exit(1)
        else:
            click.echo(f"{CHECK} Configuration is valid")


if __name__ == "__main__":
    main()
