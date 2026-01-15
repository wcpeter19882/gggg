"""CLI for UCE Render - uce-render command."""
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Optional, List

import click

from src.common.asset_manager import AssetManager
from src.common.exceptions import UCERenderError
from src.common.patchable_context_pydantic import Patch
from src.common.slide import Slide
from src.common.slides import Slides
from src.paged.layout.engine_registry import LayoutEngineRegistry
from src.paged.layout.dummy.style import Style
from src.paged.layout.dummy.theme import Theme
from src.paged.render.dummy.html_renderer import HTMLRenderer
from src.paged.render.slidev.markdown_renderer import SlidevRenderer

# Default instruction when --user-instruction is not provided
DEFAULT_INSTRUCTION = "create slides, 10 page, professional, corp_modern_v1 theme"


def parse_instruction_file(file_path: Path) -> List[str]:
    """Parse a markdown instruction file into multiple instruction rounds.
    
    Each paragraph (text separated by one or more blank lines) becomes
    a separate instruction round.
    
    Args:
        file_path: Path to the markdown instruction file
        
    Returns:
        List of instruction strings, one per round
    """
    content = file_path.read_text(encoding='utf-8')
    
    # Split by blank lines (one or more empty lines)
    paragraphs = re.split(r'\n\s*\n', content.strip())
    
    # Clean up each paragraph and filter empty ones
    instructions = []
    for para in paragraphs:
        # Strip whitespace and remove any leading markdown artifacts
        cleaned = para.strip()
        if cleaned:
            instructions.append(cleaned)
    
    return instructions


@click.command()
@click.argument('config_file', type=click.Path(exists=True, path_type=Path), required=False)
@click.option(
    '--output', '-o',
    type=click.Path(path_type=Path),
    help='Output HTML file path (default: stdout)'
)
@click.option(
    '--format', '-f',
    type=click.Choice(['html', 'json', 'table'], case_sensitive=False),
    default='html',
    help='Output format (default: html)'
)
@click.option(
    '--layout-engine',
    type=click.Choice(['dummy', 'slidev', 'react'], case_sensitive=False),
    default=None,
    help='Layout engine to use (auto-selected based on project: react for react-mdx, slidev otherwise)'
)
@click.option(
    '--validate-only', '--validate',
    is_flag=True,
    help='Validate configuration without rendering'
)
@click.option(
    '--verbose', '-v',
    is_flag=True,
    help='Enable verbose logging'
)
@click.option(
    '--width', '-w',
    type=int,
    default=None,
    help='Layout width in pixels (default: 1920 or from config)'
)
@click.option(
    '--height', '-h',
    type=int,
    default=None,
    help='Layout height in pixels (default: 1080 or from config)'
)
@click.option(
    '--list-themes',
    is_flag=True,
    help='List all available themes'
)
@click.option(
    '--list-styles',
    is_flag=True,
    help='List all available styles'
)
@click.option(
    '--list-widgets',
    is_flag=True,
    help='List all available widget types'
)
@click.option(
    '--list-strategies',
    is_flag=True,
    help='List all available layout strategies'
)
@click.option(
    '--source',
    type=click.Path(exists=True, path_type=Path),
    help='Source content file (.txt or .vtt) for LLM-based generation'
)
@click.option(
    '--user-instruction',
    type=str,
    help='User guidance for LLM content generation'
)
@click.option(
    '--user-instruction-file',
    type=click.Path(exists=True, path_type=Path),
    help='Markdown file with instructions. Each paragraph (separated by blank lines) is a separate round.'
)
@click.option(
    '--use-cache',
    type=click.Choice(['true', 'false'], case_sensitive=False),
    default='true',
    help='Enable caching for LLM calls (default: true)'
)
@click.option(
    '--maxiter',
    type=int,
    default=3,
    help='Maximum refinement iterations for layout validation (default: 3, 0 to disable)'
)
@click.option(
    '--interactive', '-i',
    is_flag=True,
    help='Interactive mode: prompt for source and instructions'
)
@click.option(
    '--render',
    type=click.Path(exists=True, path_type=Path),
    help='Render from JSON file (skip LLM generation). Only works with --format html.'
)
@click.option(
    '--stage',
    type=click.Choice(['intent', 'visual', 'atoms', 'content', 'render'], case_sensitive=False),
    default=None,
    help='Stop after this pipeline stage (intent|visual|atoms|content|render). Requires --source.'
)
@click.option(
    '--state',
    type=click.Path(path_type=Path),
    default=None,
    help='Path to state.json for stage-based pipeline. Created if not exists.'
)
@click.option(
    '--force-rerun',
    is_flag=True,
    help='Force re-run all stages even if completed in state'
)
@click.option(
    '--project', '-p',
    type=click.Choice(['slidev', 'duolingo', 'cyberpunk', 'handdrawn', 'editorial', 'business', 'simple', 'react-mdx'], case_sensitive=False),
    default='react-mdx',
    help='Project style to use (default: react-mdx)'
)
@click.option(
    '--active-theme',
    type=click.Choice(['business', 'cyber', 'minimal', 'academic', 'creative', 'duolingo', 'dark', 'purple'], case_sensitive=False),
    default='business',
    help='Theme for react-mdx export (default: business)'
)
def cli(
    config_file: Optional[Path],
    output: Optional[Path],
    format: str,
    layout_engine: str,
    validate_only: bool,
    verbose: bool,
    width: Optional[int],
    height: Optional[int],
    list_themes: bool,
    list_styles: bool,
    list_widgets: bool,
    list_strategies: bool,
    source: Optional[Path],
    user_instruction: Optional[str],
    user_instruction_file: Optional[Path],
    use_cache: str,
    maxiter: int,
    interactive: bool,
    render: Optional[Path],
    stage: Optional[str],
    state: Optional[Path],
    force_rerun: bool,
    project: str,
    active_theme: str,
) -> None:
    """Render layouts using the Universal Content Engine.
    
    CONFIG_FILE: Path to JSON configuration file with layout specification.
    
    Examples:
    
        # Render from config file
        uce-render config.json
        
        # Render to file
        uce-render config.json --output result.html
        
        # Render from previous JSON output (skip LLM generation)
        uce-render --render intermediate.json --output slides.html --layout-engine slidev
        
        # Interactive mode (prompts for input)
        uce-render --interactive --output presentation.html
        uce-render -i -o slides.html
        
        # LLM-based generation from source content
        uce-render --source input.txt --output presentation.html
        uce-render --source subtitles.vtt --output slides.html
        
        # LLM generation with user guidance
        uce-render --source doc.txt --user-instruction "Focus on key concepts" --output result.html
        
        # Disable caching for LLM calls
        uce-render --source input.txt --use-cache false --output result.html
        
        # Combine LLM generation with custom dimensions
        uce-render --source input.txt --width 3840 --height 2160 --output 4k.html
        
        # Validate configuration only
        uce-render config.json --validate-only
        
        # Output JSON format
        uce-render config.json --format json
        
        # List available assets
        uce-render --list-themes
        uce-render --list-styles
        uce-render --list-widgets
        uce-render --list-strategies
        uce-render --list-themes --format json
        
        # Stage-based pipeline (with state.json for testability)
        # Run intent detection only
        uce-render --source input.txt --user-instruction "tech pitch" --stage intent --output career_talk
        
        # Run up to visual generation (depends on intent)
        uce-render --source input.txt --user-instruction "tech pitch" --stage visual --output career_talk
        
        # Run up to atom extraction
        uce-render --source input.txt --user-instruction "tech pitch" --stage atoms --output career_talk
        
        # Run up to content generation
        uce-render --source input.txt --user-instruction "tech pitch" --stage content --output career_talk
        
        # Run full pipeline including render
        uce-render --source input.txt --user-instruction "tech pitch" --stage render --output career_talk
        
        # Custom state file location
        uce-render --source input.txt --stage content --state myproject/state.json --output myproject
        
        # Force re-run all stages
        uce-render --source input.txt --stage render --output career_talk --force-rerun
    """
    try:
        # Auto-default to stage='render' when source is provided without explicit stage
        # This routes all LLM generation through PipelineRunner
        if source and not stage and not render:
            stage = 'render'
            if verbose:
                click.echo("[INFO] Defaulting to --stage render for source-based generation", err=True)
        
        # Handle stage-based pipeline OR state-only execution
        if stage or state:
            # If state is provided without source, load source from state
            source_from_state = None
            if state and not source:
                state_path = Path(state)
                if state_path.exists():
                    from src.generation.state import PipelineState
                    loaded_state = PipelineState.load(state_path)
                    if loaded_state.source and loaded_state.source.path:
                        source_from_state = Path(loaded_state.source.path)
                        if verbose:
                            click.echo(f"📂 Loaded source from state: {source_from_state}", err=True)
                    # Also infer output from state path if not provided
                    if not output:
                        output = state_path.parent
                        if verbose:
                            click.echo(f"📂 Inferred output from state: {output}", err=True)
            
            effective_source = source or source_from_state
            
            if not effective_source:
                click.echo("Error: --stage/--state requires --source or a state.json with source_path", err=True)
                sys.exit(1)
            if not output:
                click.echo("Error: --stage/--state requires --output directory to be specified", err=True)
                sys.exit(1)
            
            # Run todo-based pipeline
            from src.generation.todo.runner import PipelineRunner
            
            output_dir = Path(output)
            
            # Parse instruction(s) - file takes precedence, then inline, then default
            if user_instruction_file:
                instructions = parse_instruction_file(user_instruction_file)
                if not instructions:
                    click.echo(f"Warning: No instructions found in {user_instruction_file}, using default", err=True)
                    instructions = [DEFAULT_INSTRUCTION]
                if verbose:
                    click.echo(f"📄 Loaded {len(instructions)} instruction round(s) from {user_instruction_file}", err=True)
            elif user_instruction:
                instructions = [user_instruction]
            else:
                instructions = [DEFAULT_INSTRUCTION]
            
            # Auto-select layout engine based on project if not specified
            effective_engine = layout_engine
            if not effective_engine:
                effective_engine = 'react' if project in ('react-mdx', 'react') else 'slidev'
            
            # Set layout engine
            from src.paged.layout.engine_registry import LayoutEngineRegistry
            try:
                LayoutEngineRegistry.set_active_engine(effective_engine.lower())
                if verbose:
                    click.echo(f"Set active layout engine: {effective_engine.lower()}", err=True)
            except KeyError as e:
                click.echo(f"Warning: Unknown layout engine '{effective_engine}', using default", err=True)
            
            runner = PipelineRunner(
                use_cache=(use_cache.lower() == 'true'),
                verbose=verbose,
                output_dir=output_dir,
                refine_iterations=maxiter
            )
            
            # Run pipeline for each instruction round
            result_state = None
            for round_idx, instruction in enumerate(instructions, 1):
                if len(instructions) > 1:
                    click.echo(f"\n{'='*50}")
                    click.echo(f"📝 Round {round_idx}/{len(instructions)}")
                    click.echo(f"   Instruction: {instruction[:100]}{'...' if len(instruction) > 100 else ''}")
                    click.echo(f"{'='*50}")
                
                result_state = runner.run(
                    source_path=effective_source,
                    user_instruction=instruction,
                    project=project,
                    active_theme=active_theme,
                    force_rerun=force_rerun,
                )
            
            click.echo(f"\n{'='*50}")
            click.echo(result_state.summary())
            click.echo(f"{'='*50}")
            click.echo(f"\n[OK] Pipeline completed ({len(instructions)} round{'s' if len(instructions) > 1 else ''})")
            click.echo(f"  Output: {output_dir}")
            return
        
        # Validate --render option
        if render:
            if format != 'html':
                click.echo("Error: --render only works with --format html", err=True)
                sys.exit(1)
            if not output:
                click.echo("Error: --render requires --output to be specified", err=True)
                sys.exit(1)
        
        # Handle list commands
        if list_themes:
            result = AssetManager.list_themes()
            if format == 'json':
                click.echo(json.dumps(result, indent=2))
            else:
                themes = result['available_themes']
                schema_fields = result['schema']['fields']
                
                click.echo("\nAvailable Themes:")
                click.echo("=" * 80)
                for theme in themes:
                    click.echo(f"\nName: {theme['name']}")
                    click.echo(f"  ID: {theme['id']}")
                    click.echo(f"  File: {theme['file']}")
                
                click.echo("\n" + "=" * 80)
                click.echo(f"Total: {len(themes)} themes\n")
                
                click.echo("\nTheme Schema (Supported Fields):")
                click.echo("=" * 80)
                for field_name, field_info in sorted(schema_fields.items()):
                    required = " [REQUIRED]" if field_info.get('required') else ""
                    click.echo(f"\n{field_name}{required}:")
                    click.echo(f"  Type: {field_info['type']}")
                    if field_info.get('description'):
                        click.echo(f"  Description: {field_info['description']}")
                    if 'default' in field_info:
                        click.echo(f"  Default: {field_info['default']}")
                click.echo("\n" + "=" * 80 + "\n")
            sys.exit(0)
        
        if list_styles:
            result = AssetManager.list_styles()
            if format == 'json':
                click.echo(json.dumps(result, indent=2))
            else:
                styles = result['available_styles']
                schema_fields = result['schema']['fields']
                
                click.echo("\nAvailable Styles:")
                click.echo("=" * 80)
                for style in styles:
                    click.echo(f"\nName: {style['name']}")
                    click.echo(f"  Theme: {style['theme_name']}")
                    click.echo(f"  File: {style['file']}")
                
                click.echo("\n" + "=" * 80)
                click.echo(f"Total: {len(styles)} styles\n")
                
                click.echo("\nStyle Schema (Supported Fields):")
                click.echo("=" * 80)
                for field_name, field_info in sorted(schema_fields.items()):
                    required = " [REQUIRED]" if field_info.get('required') else ""
                    click.echo(f"\n{field_name}{required}:")
                    click.echo(f"  Type: {field_info['type']}")
                    if field_info.get('description'):
                        click.echo(f"  Description: {field_info['description']}")
                    if 'default' in field_info:
                        click.echo(f"  Default: {field_info['default']}")
                click.echo("\n" + "=" * 80 + "\n")
            sys.exit(0)
        
        if list_widgets:
            widgets = AssetManager.list_widgets()
            if format == 'json':
                click.echo(json.dumps(widgets, indent=2))
            else:
                click.echo("\nAvailable Widgets:")
                click.echo("=" * 80)
                for widget in widgets:
                    click.echo(f"\nType: {widget['type']}")
                    click.echo(f"  Category: {widget['category']}")
                    click.echo(f"  Minimum Size: {widget['allowed_sizes'][0]}")
                    click.echo(f"  Allowed Sizes: {', '.join(widget['allowed_sizes'])}")
                    
                    if widget.get('description'):
                        # Multi-line description formatting
                        desc_lines = widget['description'].strip().split('\n')
                        click.echo(f"  Description:")
                        for line in desc_lines:
                            click.echo(f"    {line.strip()}")
                    
                    if widget.get('fields'):
                        click.echo("  Schema Fields:")
                        for field_name, field_info in sorted(widget['fields'].items()):
                            field_type = field_info['type']
                            field_desc = field_info.get('description', '')
                            default_val = field_info.get('default', '')
                            
                            click.echo(f"    - {field_name}:")
                            click.echo(f"        Type: {field_type}")
                            if field_desc:
                                click.echo(f"        Description: {field_desc}")
                            if default_val:
                                click.echo(f"        Default: {default_val}")
                            
                            # Expand parameters if available
                            if field_name == 'parameters' and 'parameters' in field_info:
                                params = field_info['parameters']
                                if params:
                                    click.echo(f"        Accepted Parameters:")
                                    for param in params:
                                        click.echo(f"          - {param['name']} ({param['type']}): {param['description']}")
                
                click.echo("\n" + "=" * 80)
                click.echo(f"Total: {len(widgets)} widgets\n")
            sys.exit(0)
        
        if list_strategies:
            strategies = AssetManager.list_strategies()
            if format == 'json':
                click.echo(json.dumps(strategies, indent=2))
            else:
                click.echo("\nAvailable Layout Strategies:")
                click.echo("=" * 80)
                for strategy in strategies:
                    click.echo(f"\nStrategy: {strategy['name']}")
                    click.echo(f"  Family: {strategy['family']}")
                    click.echo(f"  Slots:")
                    for slot in strategy['slots']:
                        click.echo(f"    - {slot['role']}: {slot['size']}")
                click.echo("\n" + "=" * 80)
                click.echo(f"Total: {len(strategies)} strategies\n")
            sys.exit(0)
        
        # Convert use_cache string to boolean
        use_cache_bool = use_cache.lower() == 'true'
        
        # Handle render-only mode (skip LLM generation)
        if render:
            if verbose:
                click.echo(f"Render-only mode: loading from {render}", err=True)
            
            # Load JSON file
            try:
                with open(render, 'r', encoding='utf-8') as f:
                    render_data = json.load(f)
            except json.JSONDecodeError as e:
                click.echo(f"Error: Invalid JSON in render file: {e}", err=True)
                sys.exit(1)
            except Exception as e:
                click.echo(f"Error: Could not read render file: {e}", err=True)
                sys.exit(1)
            
            # Extract slides, theme, and style from JSON
            if 'slides' not in render_data:
                click.echo("Error: Render JSON must contain 'slides' array", err=True)
                sys.exit(1)
            
            slides_data = render_data.get('slides', [])
            
            # Support 'themes' as dict (state.json), array, or legacy 'theme' (single object)
            themes_raw = render_data.get('themes', {})
            if isinstance(themes_raw, dict):
                # themes is an object with named keys - convert to list
                themes_data = list(themes_raw.values())
            elif isinstance(themes_raw, list):
                # themes is already an array
                themes_data = themes_raw
            else:
                themes_data = []
            
            if not themes_data and 'theme' in render_data:
                themes_data = [render_data['theme']]
            
            # Get active theme if specified, otherwise use first theme
            active_theme = render_data.get('active_theme')
            if active_theme and isinstance(themes_raw, dict) and active_theme in themes_raw:
                theme_data = themes_raw[active_theme]
            else:
                theme_data = themes_data[0] if themes_data else {}
            
            style_data = render_data.get('style', {})
            layout_width = width if width is not None else render_data.get('width', 1920)
            layout_height = height if height is not None else render_data.get('height', 1080)
            
            # Create Slides collection
            slides = Slides()
            operations = []
            for slide_data in slides_data:
                if 'id' not in slide_data:
                    slide_data['id'] = f"slide-{slide_data.get('rank', len(operations) + 1)}"
                if 'rank' not in slide_data:
                    slide_data['rank'] = len(operations)
                if 'state' not in slide_data:
                    slide_data['state'] = 'active'
                
                try:
                    slide = Slide(**slide_data)
                    operations.append({"add": slide})
                except Exception as e:
                    click.echo(f"Error: Invalid slide in render JSON: {e}", err=True)
                    sys.exit(1)
            
            if operations:
                patch = Patch(operations=operations)
                slides.patch(patch)
            
            # Create theme and style
            theme = Theme(**theme_data) if theme_data else Theme()
            
            # Note: style is not used by Slidev, only kept for legacy engines
            # For Slidev, we only need theme
            
            if verbose:
                click.echo(f"Loaded {slides.count()} slides from render JSON", err=True)
            
            # For render-only mode, skip to rendering by setting continue_generation = False
            # But ensure we have theme and slides set up
            # The rendering happens after the while loop
        
        # Handle interactive mode - setup phase
        elif interactive:
            click.echo("\n" + "=" * 80)
            click.echo("Interactive Mode - UCE Render")
            click.echo("=" * 80 + "\n")
            
            # Ensure source is provided or prompt for it
            if not source:
                source_input = click.prompt(
                    "Enter source content file path (.txt or .vtt)",
                    type=str
                ).strip()
                source = Path(source_input)
                
                if not source.exists():
                    click.echo(f"Error: File not found: {source}", err=True)
                    sys.exit(1)
            
            # Ensure user_instruction is provided or prompt for it
            if not user_instruction:
                click.echo("💬 Provide generation instructions (or press Enter to use intent guidance only):")
                click.echo("   Examples:")
                click.echo("   - 'Focus on key technical concepts'")
                click.echo("   - 'Create executive summary slides'")
                click.echo("   - 'Target audience: entry-level developers'")
                click.echo()
                user_instruction = click.prompt(
                    "Your instructions",
                    type=str,
                    default="",
                    show_default=False
                ).strip()
                
                if not user_instruction:
                    user_instruction = None
                    click.echo("✓ Using intent detection guidance only.\n")
                else:
                    click.echo(f"\n✓ Instructions: {user_instruction}\n")
            
            # Ensure output is provided or prompt for it
            if not output:
                default_output = source.stem + "_slides.html"
                output_input = click.prompt(
                    "Output HTML file path",
                    type=str,
                    default=default_output,
                    show_default=True
                ).strip()
                output = Path(output_input)
        
        # Validate that we have a source for LLM generation or config file
        if not source and not config_file and not render:
            click.echo("Error: Either CONFIG_FILE, --source, or --render is required when not using --list-* options", err=True)
            sys.exit(1)
        
        # Interactive loop for iterative refinement
        continue_generation = True
        iteration_count = 0
        
        # Skip generation loop if in render-only mode
        # But allow one iteration to reach rendering code
        if render:
            continue_generation = True  # Allow one iteration to render
            max_iterations = 1  # Limit to single pass
        
        # Auto-select layout engine based on project if not specified
        effective_engine = layout_engine
        if not effective_engine:
            effective_engine = 'react' if project in ('react-mdx', 'react') else 'slidev'
        
        # Set active layout engine for content generation
        from src.paged.layout.engine_registry import LayoutEngineRegistry
        try:
            LayoutEngineRegistry.set_active_engine(effective_engine.lower())
            if verbose:
                click.echo(f"Set active layout engine: {effective_engine.lower()}", err=True)
        except KeyError as e:
            click.echo(f"Warning: {e}", err=True)
        
        # Create orchestrator for all LLM generation (both interactive and non-interactive)
        # Skip if in render-only mode
        orchestrator = GenerationOrchestrator(use_cache=use_cache_bool) if (source and not render) else None
        
        while continue_generation:
            iteration_count += 1
            
            # Skip generation if in render-only mode
            if render:
                # Slides and theme already loaded from render JSON
                # Skip directly to rendering section
                pass
            elif interactive and iteration_count > 1:
                click.echo("\n" + "=" * 80)
                click.echo(f"Iteration {iteration_count} - Refine Generation")
                click.echo("=" * 80 + "\n")
                
                # Prompt for new instructions
                click.echo("💬 Enter new instructions to refine the presentation (or 'quit' to exit):")
                click.echo("   Examples:")
                click.echo("   - 'Make it more technical'")
                click.echo("   - 'Add more examples'")
                click.echo("   - 'Simplify for beginners'")
                click.echo("   - 'Use different layouts'")
                click.echo()
                
                new_instruction = click.prompt(
                    "New instructions",
                    type=str,
                    default="",
                    show_default=False
                ).strip()
                
                if new_instruction.lower() in ['quit', 'exit', 'q']:
                    click.echo("\n✓ Exiting interactive mode.\n")
                    break
                
                if not new_instruction:
                    click.echo("\n⚠ No instructions provided. Please provide instructions or type 'quit' to exit.\n")
                    continue  # Skip this iteration and prompt again
                
                user_instruction = new_instruction
                click.echo(f"\n✓ New instructions: {user_instruction}\n")
            
            # Handle LLM-based generation workflow (skip if render-only mode)
            if source and not render:
                if verbose:
                    click.echo(f"LLM-based generation from source: {source}", err=True)
                
                # Show file preview and run intent detection on first iteration in interactive mode
                if interactive and iteration_count == 1:
                    # Show file preview
                    click.echo(f"\n📄 Source file: {source}")
                    try:
                        with open(source, 'r', encoding='utf-8') as f:
                            preview = f.read(500)
                            click.echo(f"\nPreview (first 500 chars):")
                            click.echo("-" * 80)
                            click.echo(preview)
                            if len(preview) == 500:
                                click.echo("...")
                            click.echo("-" * 80 + "\n")
                    except Exception as e:
                        click.echo(f"Warning: Could not preview file: {e}", err=True)
                    
                    # Run intent detection
                    click.echo("🔍 Detecting intent...")
                    try:
                        from src.generation.todo.planner import parse_intent
                        
                        # Provide minimal user instruction for standalone intent detection
                        user_instruction_text = user_instruction if user_instruction else DEFAULT_INSTRUCTION
                        
                        intent_result = parse_intent(user_instruction_text)
                        
                        click.echo("\n✓ Intent Detection Results:")
                        click.echo("-" * 80)
                        click.echo(f"Action: {intent_result.action.value}")
                        click.echo(f"Tone: {intent_result.tone_style.value if intent_result.tone_style else 'default'}")
                        click.echo(f"Density: {intent_result.density}")
                        click.echo(f"Slide Count: {intent_result.slide_count or 'auto'}")
                        if intent_result.color_keywords:
                            click.echo(f"Colors: {', '.join(intent_result.color_keywords)}")
                        click.echo("-" * 80 + "\n")
                        
                    except Exception as e:
                        click.echo(f"Warning: Intent detection failed: {e}", err=True)
                        if verbose:
                            import traceback
                            traceback.print_exc()
                    
                    click.echo(f"\n🎨 Generating presentation...")
                    if user_instruction:
                        click.echo(f"   Instructions: {user_instruction}")
                    click.echo(f"   Output: {output}\n")
                
                # Try to generate from file
                try:
                    # Use orchestrator for first iteration
                    if iteration_count == 1:
                        # Use orchestrator instance for all modes
                        slides = orchestrator.generate_from_source(
                            source_path=source,
                            user_instruction=user_instruction,
                            layout_engine=layout_engine
                        )
                    else:
                        # Subsequent iterations - use orchestrator's regenerate method
                        slides = orchestrator.regenerate_with_instruction(
                            new_instruction=user_instruction,
                            reuse_atoms=True,  # Reuse atoms for faster iteration
                            redetect_intent=True  # Re-detect intent with new instruction
                        )
                    
                    if verbose:
                        click.echo(f"Generated {slides.count()} slides", err=True)
                        # Print debug output paths
                        output_dir = Path("output").absolute()
                        click.echo(f"Debug output: {output_dir / 'debug_content.json'}", err=True)
                    
                except FileNotFoundError as e:
                    click.echo(f"Error: {e}", err=True)
                    sys.exit(1)
                except ValueError as e:
                    click.echo(f"Error: {e}", err=True)
                    sys.exit(1)
                except RuntimeError as e:
                    click.echo(f"Error: {e}", err=True)
                    sys.exit(1)
                except Exception as e:
                    click.echo(f"Error: Generation failed: {e}", err=True)
                    if verbose:
                        import traceback
                        traceback.print_exc()
                    sys.exit(1)
                
                # Get visual styling from orchestrator (always available now)
                visual = orchestrator.get_visual()
                
                # Use generated theme if available, otherwise default theme
                if visual and visual.theme:
                    if verbose:
                        click.echo(f"Using generated theme from Visual object", err=True)
                    theme = Theme(**visual.theme)
                else:
                    if verbose:
                        click.echo(f"Using default theme (no visual generated by LLM)", err=True)
                    theme = Theme()
                
                # Use generated style if available, otherwise default style
                if visual and visual.style:
                    if verbose:
                        click.echo(f"Using generated style from Visual object", err=True)
                    style = Style(**visual.style)
                else:
                    if verbose:
                        click.echo(f"Using default style", err=True)
                    style = Style()
                
                layout_width = width if width is not None else 1920
                layout_height = height if height is not None else 1080
            
            elif config_file and not render:
                # Original config file workflow
                # Load configuration
                if verbose:
                    click.echo(f"Loading configuration from {config_file}", err=True)

                try:
                    with open(config_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                except json.JSONDecodeError as e:
                    click.echo(f"Error: Invalid JSON in configuration file: {e}", err=True)
                    sys.exit(1)
                except Exception as e:
                    click.echo(f"Error: Could not read configuration file: {e}", err=True)
                    sys.exit(1)

                # Multi-slide format required
                if 'slides' not in config:
                    click.echo("Error: Configuration must contain 'slides' array", err=True)
                    sys.exit(1)
                
                # Extract common configuration
                theme_data = config.get('theme', {})
                style_data = config.get('style', {})
                layout_width = width if width is not None else config.get('width', 1920)
                layout_height = height if height is not None else config.get('height', 1080)

                # Ensure style has theme_name
                if 'theme_name' not in style_data:
                    style_data['theme_name'] = 'default'

                # Ensure style has default widget styles if not provided
                if 'widgets' not in style_data or not style_data['widgets']:
                    from src.paged.layout.dummy.style import WidgetStyle
                    
                    # Create default widget styles for all widget types
                    default_widget_styles = {
                        # Typography widgets
                        "Type.Display": {"font": "h1", "align": "left"},
                        "Type.Heading": {"font": "h2", "align": "left"},
                        "Type.Body": {"font": "body", "align": "left"},
                        "Type.Caption": {"font": "caption", "align": "left"},
                        "Type.Quote": {"font": "h3", "align": "left"},
                        "Type.List": {"font": "body", "align": "left"},
                        "Type.Comparison": {"font": "body", "align": "left"},
                        
                        # Data widgets
                        "Data.BigNum": {"font": "h1", "align": "center"},
                        "Data.Metric": {"font": "h2", "align": "center"},
                        "Data.Table": {"font": "body", "align": "left"},
                        "Data.Chart": {"align": "center"},
                    }
                    
                    style_data['widgets'] = default_widget_styles

                # Create theme and style models
                try:
                    theme = Theme(**theme_data)
                    style = Style(**style_data)
                except Exception as e:
                    click.echo(f"Error: Invalid theme or style configuration: {e}", err=True)
                    sys.exit(1)

                if verbose:
                    click.echo("Processing multi-slide configuration", err=True)

                slides_data = config.get('slides', [])
                
                # Create Slides collection
                slides = Slides()
                
                # Add slides using patch operations
                operations = []
                for slide_data in slides_data:
                    # Ensure required fields
                    if 'id' not in slide_data:
                        slide_data['id'] = f"slide-{slide_data.get('rank', len(operations) + 1)}"
                    if 'rank' not in slide_data:
                        slide_data['rank'] = len(operations)
                    if 'state' not in slide_data:
                        slide_data['state'] = 'active'
                    
                    # Create Slide instance for validation
                    try:
                        slide = Slide(**slide_data)
                        operations.append({"add": slide})
                    except Exception as e:
                        click.echo(f"Error: Invalid slide configuration: {e}", err=True)
                        sys.exit(1)
                
                # Apply patch to add all slides
                if operations:
                    patch = Patch(operations=operations)
                    slides.patch(patch)

                if verbose:
                    click.echo(f"Loaded {slides.count()} slides", err=True)
                    click.echo(f"Size: {layout_width}x{layout_height}", err=True)
            
            # Common rendering workflow (for both config file and LLM-generated content)
            
            print(f"⚙ Rendering {slides.count()} slides with templates...")
            
            # Calculate layouts for all slides using active layout engine
            # Skip calculation for render-only engines like Slidev
            if layout_engine.lower() == 'slidev':
                # Slidev is render-only, skip calculate step
                renderables = None
            else:
                try:
                    active_engine = LayoutEngineRegistry.get_active_engine()
                    renderables = active_engine.calculate_slides(
                        slides=slides,
                        theme=theme,
                        style=style,
                        width=layout_width,
                        height=layout_height
                    )
                except UCERenderError as e:
                    click.echo(f"Error: {e}", err=True)
                    sys.exit(1)
            
            # Refinement loop for LLM-generated content (if enabled)
            # Skip for render-only engines like Slidev
            if source and maxiter > 0 and layout_engine.lower() != 'slidev':
                from src.generation.content.generator import refine_layout_with_validation
                from src.generation.atom.collection import AtomCollection
                from src.utils.generation_config import GenerationConfig
                from src.generation.atom.prompts import get_atom_extraction_config
                
                if verbose:
                    click.echo(f"Validating layout (maxiter={maxiter})...", err=True)
                
                # Get atoms from orchestrator (always available since we always use orchestrator now)
                atoms = orchestrator._atoms
                if verbose:
                    click.echo(f"✓ Using cached atom extraction", err=True)
                
                # Get config for refinement
                config = get_atom_extraction_config()
                
                # Run refinement iterations
                refined_slides = slides
                iteration = 0
                while iteration < maxiter:
                    iteration += 1
                    
                    # Validate current renderables
                    from src.paged.layout.dummy.validation import LayoutValidator, format_issues_for_llm
                    all_issues = []
                    for renderable in renderables:
                        issues = LayoutValidator.validate(renderable)
                        all_issues.extend(issues)
                    
                    # If no issues, done
                    if not all_issues:
                        if verbose:
                            click.echo(f"✓ Validation passed on iteration {iteration}", err=True)
                        break
                    
                    # Show issues
                    if verbose:
                        click.echo(f"⚠ Found {len(all_issues)} issue(s) - refining (iteration {iteration}/{maxiter})...", err=True)
                        for issue in all_issues:
                            click.echo(f"  [{issue.severity}] {issue.category}: {issue.message}", err=True)
                    
                    # Generate refinement
                    feedback = format_issues_for_llm(all_issues)
                    from src.generation.content.generator import _generate_refinement
                    
                    refinement_patch_ops = _generate_refinement(
                        current_slides=refined_slides,
                        atoms=atoms,
                        user_instruction=user_instruction or "Create slides from the content",
                        config=config,
                        intent_guidance="",  # Could pass from orchestrator
                        validation_feedback=feedback
                    )
                    
                    # Apply refinement
                    if isinstance(refinement_patch_ops, dict):
                        refinement_patch_ops = [refinement_patch_ops]
                    
                    refinement_patch = Patch.from_json_str(json.dumps(refinement_patch_ops))
                    refined_slides.patch(refinement_patch)
                    
                    # Re-render with refined slides
                    try:
                        active_engine = LayoutEngineRegistry.get_active_engine()
                        renderables = active_engine.calculate_slides(
                            slides=refined_slides,
                            theme=theme,
                            style=style,
                            width=layout_width,
                            height=layout_height
                        )
                    except UCERenderError as e:
                        click.echo(f"Warning: Refinement caused rendering error: {e}", err=True)
                        break
                
                if iteration >= maxiter and all_issues:
                    if verbose:
                        click.echo(f"⚠ Max iterations ({maxiter}) reached with {len(all_issues)} remaining issue(s)", err=True)
                
                # Update slides to refined version
                slides = refined_slides

            if validate_only:
                click.echo(f"✓ Configuration is valid ({len(renderables)} slides)", err=True)
                sys.exit(0)

            # Render multi-slide output
            if format.lower() == 'html':
                if layout_engine.lower() == 'slidev':
                    # Use Slidev renderer for markdown generation
                    if verbose:
                        click.echo(f"Using Slidev layout engine - converting {slides.count()} slides to Slidev format", err=True)
                        click.echo(f"Using project style: {project}", err=True)
                    
                    slidev_renderer = SlidevRenderer(project=project)
                    
                    # Extract theme colors for Slidev
                    theme_data = {}
                    if theme:
                        theme_data["primary_color"] = getattr(theme, "primary_color", "#2563eb")
                        theme_data["background_color"] = getattr(theme, "background_color", "#ffffff")
                        theme_data["text_color"] = getattr(theme, "text_color", "#1f2937")
                    
                    # Convert slides to Slidev JSON format
                    slidev_slides = []
                    active_slides = slides.get_active_slides()
                    
                    for idx, slide_obj in enumerate(active_slides):
                        # Extract layout and theme from slide
                        slide_json = {
                            "layout": slide_obj.layout if slide_obj.layout else "smart-grid",
                            "theme": theme_data if theme_data else {"primary_color": "#2563eb"},
                            "parameters": slide_obj.parameters if slide_obj.parameters else {"cols": 2},
                            "widgets": {}
                        }
                        
                        # Add header and footer if present
                        if slide_obj.header:
                            slide_json["header"] = slide_obj.header
                        if slide_obj.footer:
                            slide_json["footer"] = slide_obj.footer
                        
                        # Flatten widget structure - renderer expects flat params, not nested
                        if slide_obj.widgets:
                            for slot_name, widget_dict in slide_obj.widgets.items():
                                # Extract type and flatten parameters
                                flattened_widget = {"type": widget_dict.get("type", "Type.Body")}
                                if "parameters" in widget_dict:
                                    flattened_widget.update(widget_dict["parameters"])
                                slide_json["widgets"][slot_name] = flattened_widget
                            
                        if verbose:
                            click.echo(f"  Slide {idx+1}: layout={slide_json['layout']}, {len(slide_json['widgets'])} widgets", err=True)
                        
                        slidev_slides.append(slide_json)
                    
                    if verbose:
                        click.echo(f"Converted {len(slidev_slides)} slides, rendering to markdown...", err=True)
                    
                    html_output = slidev_renderer.render(slidev_slides)
                    
                    if verbose:
                        click.echo(f"Rendered HTML with embedded Slidev: {len(html_output) if html_output else 0} chars", err=True)
                        # Print markdown debug path
                        output_dir = Path("output").absolute()
                        click.echo(f"  Markdown: {output_dir / 'debug_markdown.md'}", err=True)
                else:
                    # Use dummy HTMLRenderer
                    # Load presets from config if available (config file workflow)
                    presets_data = None
                    if not source and config_file:
                        presets_data = config.get('presets')
                    
                    renderer = HTMLRenderer(presets=presets_data)
                    html_output = renderer.render(renderables)  # Pass list for multi-slide

                if output:
                    if verbose:
                        click.echo(f"Writing multi-slide HTML to {output}", err=True)
                    
                    # Create output directory if it doesn't exist
                    output.parent.mkdir(parents=True, exist_ok=True)
                    
                    output.write_text(html_output, encoding='utf-8')
                    
                    # For Slidev, also copy the dist folder
                    if layout_engine == "slidev":
                        import shutil
                        slidev_build_dir = Path.cwd() / "slidev_build" / "dist"
                        if slidev_build_dir.exists():
                            output_dist = output.parent / f"{output.stem}_dist"
                            if output_dist.exists():
                                shutil.rmtree(output_dist)
                            shutil.copytree(slidev_build_dir, output_dist)
                            if verbose:
                                click.echo(f"Copied Slidev assets to {output_dist}/", err=True)
                                click.echo(f"To view: python -m http.server 8000 --directory '{output.parent}' then open http://localhost:8000/{output_dist.name}/", err=True)
                    
                    if verbose:
                        click.echo(f"HTML output written successfully", err=True)
                else:
                    click.echo(html_output)

            elif format.lower() == 'json':
                # Skip rendering, write full JSON output
                # Collect all unique themes from slides
                themes_dict = {}
                if theme:
                    themes_dict[theme.id if hasattr(theme, 'id') else 'default'] = theme.model_dump()
                
                # Note: slide.theme is now a string (theme ID reference), not a theme object
                # The actual theme objects are in the themes_dict above
                
                json_output = {
                    "total_slides": slides.count(),
                    "width": layout_width,
                    "height": layout_height,
                    "themes": list(themes_dict.values()),
                    "slides": [slide.model_dump() for slide in slides.get_active_slides()],
                }

                if output:
                    if verbose:
                        click.echo(f"Writing full JSON to {output}", err=True)
                    
                    # Create output directory if it doesn't exist
                    output.parent.mkdir(parents=True, exist_ok=True)
                    
                    output.write_text(json.dumps(json_output, indent=2), encoding='utf-8')
                else:
                    click.echo(json.dumps(json_output, indent=2))

            # Always show completion summary
            if renderables:
                click.echo(f"✓ Rendered {len(renderables)} slides → {output}")
            else:
                click.echo(f"✓ Rendered {slides.count()} slides → {output}")
            
            # Interactive mode continuation - show completion message and loop
            if interactive:
                click.echo("\n" + "=" * 80)
                click.echo("✓ Generation complete!")
                click.echo(f"   Output: {output}")
                click.echo("   Open the file in a browser to view the presentation.")
                click.echo("=" * 80)
                # Loop will continue to next iteration and prompt for refinement
            else:
                # Non-interactive mode - exit after one generation
                continue_generation = False

        sys.exit(0)

    except Exception as e:
        click.echo(f"Unexpected error: {e}", err=True)
        if verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    cli()
