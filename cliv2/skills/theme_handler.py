"""Theme skill handler.

Aligns with .claude/skills/theme/SKILL.md ## Workflow section.

Supports:
1. Preset theme selection (default)
2. PowerPoint template extraction (if template.pptx exists)
"""
import hashlib
import json
import logging
import re
from pathlib import Path
from typing import Any

from cliv2.skills.base import SkillHandler, SkillInput, SkillOutput, SkillContext

logger = logging.getLogger(__name__)

# Default theme preset - aligns with React renderer default
DEFAULT_THEME = "businessLight"

# Theme cache directory
THEME_CACHE_DIR = Path.home() / "AppData" / "Local" / "Temp" / "content-manager" / "_theme_cache"


class ThemeHandler(SkillHandler):
    """Theme selection/generation handler.
    
    Workflow:
    - Input: Read constitution to check for tone/style preferences
    - Output: Save theme to content.json (target: theme)
    - Format: JSON theme object
    - Default: businessLight preset
    
    PowerPoint Template Support:
    - If template.pptx exists in files/, extract and generate custom theme
    - Generate {theme_name}.ts and {theme_name}_layout.md
    """
    
    @property
    def name(self) -> str:
        return "theme"
    
    @property
    def input_spec(self) -> SkillInput:
        return SkillInput(
            needs_constitution=True,
            needs_source=False,
            needs_theme=False,
            needs_slides=False,
        )
    
    @property
    def output_spec(self) -> SkillOutput:
        return SkillOutput(
            target="theme",
            format="json",
        )
    
    def _find_template_file(self, project_dir: str) -> Path | None:
        """Find template.pptx in project files directory."""
        files_dir = Path(project_dir) / "files"
        template_path = files_dir / "template.pptx"
        if template_path.exists():
            return template_path
        return None
    
    def _register_theme_in_react(self, theme_name: str, theme_ts: str, logger: Any) -> None:
        """Copy generated theme.ts to React themes folder for runtime use.
        
        This allows the generated theme to be used as a built-in theme option,
        avoiding conflicts between template tokens and built-in tokens.
        """
        try:
            # Find React themes directory
            react_themes_dir = Path(__file__).parent.parent.parent / ".claude" / "skills" / "ant-export" / "react" / "themes"
            
            if not react_themes_dir.exists():
                logger.warning(f"React themes directory not found: {react_themes_dir}")
                return
            
            # Write theme file
            theme_file = react_themes_dir / f"{theme_name}.ts"
            theme_file.write_text(theme_ts, encoding="utf-8")
            logger.info(f"Registered theme in React: {theme_file}")
            
            # Update index.ts to include the new theme
            index_file = react_themes_dir / "index.ts"
            if index_file.exists():
                index_content = index_file.read_text(encoding="utf-8")
                
                # Check if theme is already imported
                import_line = f"import {{ {theme_name}Theme }} from './{theme_name}';"
                if import_line not in index_content:
                    # Add import after existing imports
                    import_section_end = index_content.find("// =============")
                    if import_section_end > 0:
                        index_content = (
                            index_content[:import_section_end] +
                            import_line + "\n" +
                            index_content[import_section_end:]
                        )
                
                # Check if theme is already in registry
                registry_entry = f"  {theme_name}: {theme_name}Theme,"
                if registry_entry not in index_content:
                    # Add to themes registry
                    registry_marker = "  teamsLight: teamsLightTheme,"
                    if registry_marker in index_content:
                        index_content = index_content.replace(
                            registry_marker,
                            registry_marker + f"\n  {theme_name}: {theme_name}Theme,"
                        )
                
                index_file.write_text(index_content, encoding="utf-8")
                logger.info(f"Updated themes index.ts with {theme_name}")
                
        except Exception as e:
            logger.warning(f"Failed to register theme in React: {e}")
    
    def _get_pptx_cache_key(self, template_path: Path) -> str:
        """Generate cache key from PPTX file hash."""
        with open(template_path, "rb") as f:
            file_hash = hashlib.md5(f.read()).hexdigest()[:12]
        return f"{template_path.stem}_{file_hash}"
    
    def _get_cached_theme(self, cache_key: str) -> tuple[str | None, str | None, dict | None]:
        """Get cached theme from disk if exists.
        
        Returns:
            (theme_ts, layout_md, theme_json) or (None, None, None) if not cached
        """
        cache_dir = THEME_CACHE_DIR / cache_key
        if not cache_dir.exists():
            return None, None, None
        
        theme_ts = None
        layout_md = None
        theme_json = None
        
        ts_path = cache_dir / "theme.ts"
        md_path = cache_dir / "layout.md"
        json_path = cache_dir / "theme.json"
        
        if ts_path.exists():
            theme_ts = ts_path.read_text(encoding="utf-8")
        if md_path.exists():
            layout_md = md_path.read_text(encoding="utf-8")
        if json_path.exists():
            theme_json = json.loads(json_path.read_text(encoding="utf-8"))
        
        if theme_ts or theme_json:
            logger.info(f"Using cached theme: {cache_key}")
            return theme_ts, layout_md, theme_json
        
        return None, None, None
    
    def _cache_theme(self, cache_key: str, theme_ts: str | None, layout_md: str | None, theme_json: dict) -> None:
        """Cache generated theme to disk."""
        cache_dir = THEME_CACHE_DIR / cache_key
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        if theme_ts:
            (cache_dir / "theme.ts").write_text(theme_ts, encoding="utf-8")
        if layout_md:
            (cache_dir / "layout.md").write_text(layout_md, encoding="utf-8")
        (cache_dir / "theme.json").write_text(json.dumps(theme_json, indent=2), encoding="utf-8")
        
        logger.info(f"Cached theme: {cache_key}")
    
    def _extract_pptx_data(self, template_path: Path, project_dir: str) -> dict | None:
        """Extract theme data from PowerPoint template using MCP tool."""
        from cliv2.tools.mcp_client import call_extract_pptx_theme
        
        result = call_extract_pptx_theme(
            pptx_path=str(template_path),
            project_dir=project_dir,
            theme_name=None,  # Use default from filename
        )
        
        if "error" in result:
            return None
        
        return result
    
    def build_prompt(self, context: SkillContext) -> str:
        """Build theme-specific prompt.
        
        Includes:
        - Constitution for tone/style hints
        - User instruction for theme preferences
        - Default theme guidance
        """
        parts = [f"Project directory: {context.project_dir}"]
        
        if context.user_instruction:
            parts.append(f"User instruction: {context.user_instruction}")
        
        parts.append("\n=== CONTEXT ===")
        
        if context.constitution:
            # Constitution is now markdown string
            parts.append(f"Constitution:\n{context.constitution}")
        
        parts.append("\n=== OUTPUT ===")
        parts.append(f"Return ONLY a valid JSON theme object with id='{DEFAULT_THEME}' (the default preset).")
        parts.append(f"Unless user/constitution specifies a different theme, use '{DEFAULT_THEME}'.")
        parts.append("Available presets: businessLight, business, cyber, minimal, academic, creative, duolingo, dark, teamsDark, teamsLight")
        
        return "\n\n".join(parts)
    
    def _build_pptx_prompt(self, context: SkillContext, extracted_data: dict, existing_theme_ts: str | None = None, existing_layout_md: str | None = None) -> str:
        """Build USER prompt with extracted PowerPoint data.
        
        Args:
            context: Skill context with project_dir and user_instruction
            extracted_data: Data extracted from PPTX template
            existing_theme_ts: Existing theme.ts content if modifying (optional)
            existing_layout_md: Existing layout.md content if modifying (optional)
        
        Note: This is the USER prompt only. The SKILL.md is loaded as system prompt
        by the Subagent class. SKILL.md contains all instructions for generating
        theme.ts and theme_layout.md from extracted data.
        """
        theme_name = extracted_data.get("theme_name", "template")
        
        parts = []
        
        # If user has instruction and we have existing files, this is a MODIFICATION
        if context.user_instruction and (existing_theme_ts or existing_layout_md):
            parts.extend([
                "## MODIFICATION REQUEST",
                "",
                f"**User instruction:** {context.user_instruction}",
                "",
            ])
            
            if existing_theme_ts:
                parts.extend([
                    "**Current theme.ts to modify:**",
                    "```typescript",
                    existing_theme_ts,
                    "```",
                    "",
                ])
            
            if existing_layout_md:
                parts.extend([
                    "**Current layout.md to modify:**",
                    "```markdown",
                    existing_layout_md,
                    "```",
                    "",
                ])
            
            parts.extend([
                "Apply the user's instruction to the existing files. Keep everything else unchanged.",
                "",
                "---",
                "",
            ])
        
        parts.extend([
            f"Project directory: {context.project_dir}",
            "",
            "## PowerPoint Template Detected",
            "",
            f"A PowerPoint template was found at: files/template.pptx",
            f"Theme name: {theme_name}",
            "",
            "=== EXTRACTED POWERPOINT DATA ===",
            "",
            "**Background (use for isDark detection and average_color):**",
            json.dumps(extracted_data.get("background", {}), indent=2),
            "",
            "**Raw PowerPoint Colors (DERIVE adapted colors from these - do NOT use directly):**",
            json.dumps(extracted_data.get("colors", {}), indent=2),
            "",
            "**Typography (fonts AND sizes - USE THESE DIRECTLY):**",
            json.dumps(extracted_data.get("typography", {}), indent=2),
            "",
            f"**Slide Dimensions:** {extracted_data.get('slide_width_px', 960)}px × {extracted_data.get('slide_height_px', 540)}px",
            f"**Aspect Ratio:** {extracted_data.get('aspect_ratio', '16:9')}",
            "",
            "**Layouts (extracted slide layouts with placeholder positions):**",
        ])
        
        # Add layout summary
        layouts = extracted_data.get("layouts", [])
        for layout in layouts[:20]:  # Limit to first 20
            name = layout.get("name", "Unknown")
            layout_type = layout.get("layout_type", "custom")
            structure = layout.get("structure", "")
            slots = layout.get("slots", [])
            background = layout.get("background", {})
            
            slot_summary = []
            for slot in slots[:5]:  # Limit slots shown
                slot_type = slot.get("type", "unknown")
                left = slot.get("left_pct", 0)
                top = slot.get("top_pct", 0)
                width = slot.get("width_pct", 0)
                height = slot.get("height_pct", 0)
                slot_summary.append(f"{slot_type}({left}%,{top}% {width}x{height}%)")
            
            parts.append(f"- **{name}** ({layout_type})")
            parts.append(f"  Suggested structure: `{structure}`")
            parts.append(f"  Slots: {', '.join(slot_summary)}")
            
            # Add background info if available
            if background:
                bg_type = background.get("type", "none")
                if bg_type == "image" and background.get("image_path"):
                    # Extract just the filename from the path
                    import os
                    img_filename = os.path.basename(background.get("image_path", ""))
                    parts.append(f"  **Background: image** → `images/{img_filename}`")
                elif bg_type == "solid" and background.get("color"):
                    parts.append(f"  **Background: solid** → `{background.get('color')}`")
        
        parts.append("")
        parts.append("=== TASK ===")
        parts.append("")
        parts.append("**THEME_TS** - for color, typography, background:")
        parts.append(f"- Generate `{theme_name}.ts` TypeScript theme file")
        parts.append("- Typography: USE extracted font sizes directly")
        parts.append("- Colors: DERIVE using Color Adaptation methodology")
        parts.append("- Background: Set image path if template has background image")
        parts.append("")
        parts.append("**LAYOUT_MD** - for template layout adoption:")
        parts.append(f"- Generate `{theme_name}_layout.md` layout patterns file")
        parts.append("- Structure: DERIVE from slot positions")
        parts.append("- Constraints: PRESERVE from predefined patterns")
        parts.append("")
        parts.append("=== OUTPUT FORMAT ===")
        parts.append("")
        parts.append("**Each section is OPTIONAL.** Only include sections that need changes.")
        parts.append("- Color/typography/background changes → include THEME_TS")
        parts.append("- Layout adoption → include LAYOUT_MD")
        parts.append("- If modifying existing files, only include sections that changed")
        parts.append("")
        parts.append("---THEME_TS---")
        parts.append("(TypeScript theme file - omit if no change needed)")
        parts.append("---END_THEME_TS---")
        parts.append("")
        parts.append("---LAYOUT_MD---")
        parts.append("(Layout patterns markdown - omit if no change needed)")
        parts.append("---END_LAYOUT_MD---")
        
        return "\n".join(parts)
    
    def _load_skill_sections(self) -> dict[str, str]:
        """Load relevant sections from theme SKILL.md for PPTX conversion.
        
        Returns a dict with section names as keys and content as values.
        """
        skill_path = Path(__file__).parent.parent.parent / ".claude" / "skills" / "theme" / "SKILL.md"
        
        if not skill_path.exists():
            return {}
        
        content = skill_path.read_text(encoding="utf-8")
        
        sections = {}
        
        # Extract "Step 3: Generate Theme TypeScript AND Layout Patterns" section
        # This contains the TypeScript structure and instructions
        ts_match = re.search(
            r'### Step 3: Generate Theme TypeScript AND Layout Patterns\s*\n(.*?)(?=### Step 4:|---\n## )',
            content, re.DOTALL
        )
        if ts_match:
            sections["theme_generation"] = ts_match.group(1).strip()
        
        # Extract "Color Adaptation for Dark Themes" section
        color_match = re.search(
            r'\*\*Color Adaptation for Dark Themes.*?\n(.*?)(?=\*\*B\. Layout Patterns)',
            content, re.DOTALL
        )
        if color_match:
            sections["color_adaptation"] = color_match.group(1).strip()
        
        # Extract Layout Patterns section (B. Layout Patterns)
        layout_match = re.search(
            r'\*\*B\. Layout Patterns.*?\n(.*?)(?=### Step 4:)',
            content, re.DOTALL
        )
        if layout_match:
            sections["layout_patterns"] = layout_match.group(1).strip()
        
        return sections
    
    def _get_pptx_system_prompt(self, theme_name: str) -> str:
        """Build system prompt for PPTX theme conversion using SKILL.md sections.
        
        Loads relevant sections from theme SKILL.md for comprehensive instructions.
        """
        sections = self._load_skill_sections()
        
        parts = [
            "You are an expert visual designer converting PowerPoint themes to TypeScript.",
            "",
            "## Task",
            "Generate theme.ts and/or layout.md files from extracted PowerPoint data.",
            "Each section is OPTIONAL - only include sections that need changes.",
            "",
        ]
        
        # Add theme generation section from SKILL.md
        if sections.get("theme_generation"):
            parts.append("## Theme TypeScript Generation")
            parts.append("")
            parts.append(sections["theme_generation"])
            parts.append("")
        
        # Add color adaptation section from SKILL.md
        if sections.get("color_adaptation"):
            parts.append("## Color Adaptation Rules")
            parts.append("")
            parts.append(sections["color_adaptation"])
            parts.append("")
        
        # Add layout patterns section from SKILL.md
        if sections.get("layout_patterns"):
            parts.append("## Layout Patterns Generation")
            parts.append("")
            parts.append(sections["layout_patterns"])
            parts.append("")
        
        # Add output format (always needed)
        parts.extend([
            "## Output Format",
            "",
            "Return with these exact delimiters. Each section is OPTIONAL:",
            "- Include THEME_TS if color/typography/background changes needed",
            "- Include LAYOUT_MD if layout adoption needed",
            "- If modifying existing files, only include sections that changed",
            "",
            "---THEME_TS---",
            "(TypeScript file content - omit if no change)",
            "---END_THEME_TS---",
            "",
            "---LAYOUT_MD---",
            "(Markdown file content - omit if no change)",
            "---END_LAYOUT_MD---",
        ])
        
        return "\n".join(parts)
    
    def _strip_code_fences(self, content: str) -> str:
        """Remove markdown code fences from content."""
        # Remove opening code fence with optional language
        content = re.sub(r'^```(?:typescript|markdown|json|ts|md)?\s*\n?', '', content.strip())
        # Remove closing code fence
        content = re.sub(r'\n?```\s*$', '', content)
        return content.strip()
    
    def _parse_pptx_response(self, response: str, theme_name: str) -> tuple[str, str]:
        """Parse LLM response into theme.ts and layout.md content."""
        # Extract theme.ts
        theme_ts_match = re.search(r'---THEME_TS---\s*(.*?)\s*---END_THEME_TS---', response, re.DOTALL)
        theme_ts = self._strip_code_fences(theme_ts_match.group(1)) if theme_ts_match else ""
        
        # Extract layout.md
        layout_md_match = re.search(r'---LAYOUT_MD---\s*(.*?)\s*---END_LAYOUT_MD---', response, re.DOTALL)
        layout_md = self._strip_code_fences(layout_md_match.group(1)) if layout_md_match else ""
        
        return theme_ts, layout_md
    
    async def execute(self, context: SkillContext, llm: Any, logger: Any) -> dict:
        """Execute theme skill with optional PowerPoint template handling.
        
        Uses the theme SKILL.md as system prompt (loaded by Subagent).
        The user prompt contains either:
        - Extracted PowerPoint data (if template.pptx exists)
        - Standard context for preset theme selection
        
        Output is parsed based on delimiter markers.
        """
        from cliv2.core.subagent import Subagent
        
        # Check for template.pptx
        template_path = self._find_template_file(context.project_dir)
        
        if template_path:
            logger.info(f"Found PowerPoint template: {template_path}")
            
            # Extract data using MCP tool
            extracted_data = self._extract_pptx_data(template_path, context.project_dir)
            
            if extracted_data and "error" not in extracted_data:
                theme_name = extracted_data.get("theme_name", "template")
                logger.info(f"Extracted theme: {theme_name}")
                
                # Check cache - but skip if user has instruction (they want changes)
                cache_key = self._get_pptx_cache_key(template_path)
                
                if context.user_instruction:
                    logger.info(f"User has instruction, skipping cache")
                    cached_ts, cached_md, cached_json = None, None, None
                else:
                    cached_ts, cached_md, cached_json = self._get_cached_theme(cache_key)
                
                if cached_ts or cached_json:
                    # Use cached theme - skip LLM call
                    theme_ts = cached_ts
                    layout_md = cached_md
                    theme_json = cached_json or {"id": theme_name, "name": theme_name}
                    
                    # Save to project
                    project_dir = Path(context.project_dir)
                    if theme_ts:
                        ts_path = project_dir / f"{theme_name}.ts"
                        ts_path.write_text(theme_ts, encoding="utf-8")
                        logger.info(f"Used cached theme TypeScript: {ts_path}")
                        theme_json["theme_ts_path"] = str(ts_path)
                    
                    if layout_md:
                        md_path = project_dir / f"{theme_name}_layout.md"
                        md_path.write_text(layout_md, encoding="utf-8")
                        logger.info(f"Used cached layout markdown: {md_path}")
                        theme_json["layout_md_path"] = str(md_path)
                    
                    theme_json["source"] = "pptx_template_cached"
                    theme_json["template_path"] = str(template_path)
                    theme_json["colors"] = extracted_data.get("colors", {})
                    theme_json["fonts"] = extracted_data.get("fonts", {})
                    theme_json["background"] = extracted_data.get("background", {})
                    
                    # Register in React
                    if theme_ts:
                        self._register_theme_in_react(theme_name, theme_ts, logger)
                    
                    return {"output": theme_json}
                
                # No cache - generate with LLM
                logger.info(f"No cached theme, generating with LLM...")
                
                # Check if project already has theme files (for modifications)
                project_dir = Path(context.project_dir)
                existing_theme_ts = None
                existing_layout_md = None
                
                if context.user_instruction:
                    existing_ts_path = project_dir / f"{theme_name}.ts"
                    existing_md_path = project_dir / f"{theme_name}_layout.md"
                    
                    if existing_ts_path.exists():
                        existing_theme_ts = existing_ts_path.read_text(encoding="utf-8")
                        logger.info(f"Found existing theme to modify: {existing_ts_path}")
                    
                    if existing_md_path.exists():
                        existing_layout_md = existing_md_path.read_text(encoding="utf-8")
                        logger.info(f"Found existing layout to modify: {existing_md_path}")
                
                # Build user prompt with extracted data (and existing files if modifying)
                user_prompt = self._build_pptx_prompt(context, extracted_data, existing_theme_ts, existing_layout_md)
                
                # Use a minimal system prompt for PPTX conversion (NOT the full SKILL.md)
                # The full SKILL.md is 24K+ chars which slows down LLM significantly
                system_prompt = self._get_pptx_system_prompt(theme_name)
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ]
                
                # Log LLM input
                logger.debug(f"[theme-pptx] LLM Input - System prompt length: {len(system_prompt)} chars")
                logger.debug(f"[theme-pptx] LLM Input - User prompt length: {len(user_prompt)} chars")
                logger.debug(f"[theme-pptx] LLM Input - User prompt:\n{user_prompt[:2000]}{'...(truncated)' if len(user_prompt) > 2000 else ''}")
                
                try:
                    response = llm.completion(messages=messages)
                    content = response.choices[0].message.content if hasattr(response, 'choices') else str(response)
                    content = content.strip()
                    
                    # Log LLM output
                    logger.debug(f"[theme-pptx] LLM Output length: {len(content)} chars")
                    logger.debug(f"[theme-pptx] LLM Output:\n{content[:2000]}{'...(truncated)' if len(content) > 2000 else ''}")
                    
                    # Parse response using delimiters (sections are optional)
                    new_theme_ts, new_layout_md = self._parse_pptx_response(content, theme_name)
                    
                    # Use new content if provided, otherwise keep existing
                    theme_ts = new_theme_ts if new_theme_ts else existing_theme_ts
                    layout_md = new_layout_md if new_layout_md else existing_layout_md
                    
                    # Build metadata
                    theme_json = {"id": theme_name, "name": theme_name.replace("_", " ").title()}
                    
                    # Save theme.ts (if we have content)
                    project_dir = Path(context.project_dir)
                    if theme_ts:
                        ts_path = project_dir / f"{theme_name}.ts"
                        ts_path.write_text(theme_ts, encoding="utf-8")
                        logger.info(f"{'Updated' if new_theme_ts else 'Preserved'} theme TypeScript: {ts_path}")
                        theme_json["theme_ts_path"] = str(ts_path)
                    
                    # Save layout.md (if we have content)
                    if layout_md:
                        md_path = project_dir / f"{theme_name}_layout.md"
                        md_path.write_text(layout_md, encoding="utf-8")
                        logger.info(f"{'Updated' if new_layout_md else 'Preserved'} layout markdown: {md_path}")
                        theme_json["layout_md_path"] = str(md_path)
                    
                    # Add source info
                    theme_json["source"] = "pptx_template"
                    theme_json["template_path"] = str(template_path)
                    
                    # Register theme.ts in React (if we have it)
                    if theme_ts:
                        self._register_theme_in_react(theme_name, theme_ts, logger)
                    
                    # Cache for future use
                    self._cache_theme(cache_key, theme_ts, layout_md, theme_json)
                    
                    return {"output": theme_json}
                    
                except Exception as e:
                    logger.error(f"Failed to generate theme from template: {e}")
                    # Fall through to default behavior
            else:
                logger.warning(f"Failed to extract template data: {extracted_data}")
        
        # Default: use subagent for preset theme selection
        subagent = Subagent(self.name, llm)
        result = await subagent.run_with_handler(handler=self, context=context)
        
        if not result.success:
            raise RuntimeError(f"Skill {self.name} failed: {result.error}")
        
        processed = self.process_output(result.output)
        return {"output": processed}
    
    def process_output(self, output: Any) -> Any:
        """Ensure output is a valid theme dict with default fallback."""
        if isinstance(output, dict):
            # If no id specified, set to default
            if not output.get("id"):
                output["id"] = DEFAULT_THEME
            return output
        # Return default theme if output is invalid
        return {"id": DEFAULT_THEME, "name": "Business Light"}
