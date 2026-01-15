"""Codegen Tool - Generate React code for invented components.

LLMTool: Uses LLM to generate React/TypeScript code for InventComponent placeholders.

This tool:
1. Extracts all <InventComponent> from content step MDX output
2. Generates React component code for each
3. Stores generated code in state.generated_components
"""
from __future__ import annotations

import os
import re
import json
import asyncio
from pathlib import Path
from typing import TYPE_CHECKING, Optional, List, Dict, Any, ClassVar
from pydantic import Field

from src.common.tool_protocol import LLMTool, ToolContext, ToolPatch, register_tool
from src.utils.llm_client import call_llm, call_llm_async
from src.generation.theme.css_variables import THEME_CSS_VARIABLES_SECTION

if TYPE_CHECKING:
    from src.generation.state import PipelineState
    from src.generation.todo.models import ConstitutionPatch


class CodegenContext(ToolContext):
    """Context for code generation."""
    invented_components: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of InventComponent specs extracted from slides"
    )
    existing_components: List[str] = Field(
        default_factory=list,
        description="Names of existing components for reference"
    )


class CodegenPatch(ToolPatch):
    """Patch containing generated component code."""
    generated_components: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Map of component_id -> {name, code, props_interface, mdx_usage}"
    )
    # mdx_usage is the replacement string provided by LLM (e.g. <MyComp />)


def _extract_invent_components_from_mdx(mdx_text: str) -> List[Dict[str, Any]]:
    """Extract all InventComponent specs from MDX text (content step output)."""
    if not mdx_text:
        return []
    
    text = mdx_text.strip()
    
    # 1. Handle code fences: find ALL fences and join them.
    #    This mirrors ui.py logic and handles cases with multiple blocks.
    fence_pattern = r'```(?:mdx|jsx|xml|html)?\s*\n([\s\S]*?)\n```'
    fence_matches = re.findall(fence_pattern, text, flags=re.IGNORECASE)
    if fence_matches:
        text = "\n".join(m.strip() for m in fence_matches)

    # 2. Extract slides and components
    #    Use a dict keyed by component ID to deduplicate (latest wins)
    #    This fixes issues with draft/history blocks being included
    components_map = {}
    
    slide_pattern = r'<Slide\b([^>]*)>(.*?)</Slide>'
    
    for slide_match in re.finditer(slide_pattern, text, re.DOTALL | re.IGNORECASE):
        slide_attrs = slide_match.group(1)
        slide_body = slide_match.group(2)
        
        # Extract slide ID
        m_sid = re.search(r"\bid\s*=\s*\"([^\"]+)\"", slide_attrs)
        slide_id = (m_sid.group(1) if m_sid else "unknown").strip()

        # Find InventComponent tags
        invent_pattern = r'<InventComponent\s+([\s\S]*?)(?:/>|>\s*</InventComponent>)'
        
        for match in re.finditer(invent_pattern, slide_body):
            attrs_str = match.group(1)
            
            # Extract id (required)
            id_match = re.search(r'id\s*=\s*["\']([^"\']+)["\']', attrs_str)
            comp_id = id_match.group(1) if id_match else f"invented_{slide_id}_{len(components_map)}"
            
            component = {
                "slide_id": slide_id,
                "id": comp_id,
                "raw": match.group(0),
            }

            # Extract intent
            intent_match = re.search(r'intent\s*=\s*"([^"]+)"', attrs_str, re.DOTALL)
            if intent_match:
                component["intent"] = intent_match.group(1).strip()
            
            # Extract name (optional, generate if missing)
            name_match = re.search(r'name\s*=\s*["\']([^"\']+)["\']', attrs_str)
            if name_match:
                component["name"] = name_match.group(1)
            else:   
                # Generate PascalCase name: Invented{SlideID}{Index}
                # Ensure slide_id part is alphanumeric and capitalized
                clean_sid = re.sub(r'[^a-zA-Z0-9]', '', slide_id) or "Slide"
                component["name"] = f"Invented{clean_sid.capitalize()}{len(components_map)}"
            
            # Extract raw_story
            raw_story_match = re.search(r'raw_story\s*=\s*"([^"]+)"', attrs_str, re.DOTALL)
            if raw_story_match:
                component["raw_story"] = raw_story_match.group(1).strip()

            # Extract space
            space_match = re.search(r'space\s*=\s*["\']([^"\']+)["\']', attrs_str)
            if space_match:
                component["space"] = space_match.group(1).strip()
            
            # Upsert into map (latest occurrence wins)
            components_map[comp_id] = component
            
    return list(components_map.values())


def _read_content_mdx_from_trace() -> str:
    """Read the content step MDX output from the LLM trace file."""
    trace_file = os.getenv("LLM_TRACE_FILE")
    if not trace_file:
        return ""
    
    trace_path = Path(trace_file)
    if not trace_path.exists():
        return ""
    
    try:
        content_responses = []
        with open(trace_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    if record.get("step") == "content" and record.get("response"):
                        content_responses.append(record["response"])
                except json.JSONDecodeError:
                    continue
        
        # Return the last (most recent) content response
        return content_responses[-1] if content_responses else ""
    except Exception:
        return ""


def _get_existing_component_names() -> List[str]:
    """Get list of existing component names from the library."""
    # Standard components available in the system
    return [
        "Heading", "Text", "SmartList", "BigNum", "MetricGroup",
        "ChartBar", "ChartLine", "ChartPie", "NetworkGraph", "ProcessStrip",
        "Callout", "Quote", "Image", "Icon", "Badge", "Tag",
        "DataTable", "Timeline", "Comparison", "FeatureGrid"
    ]


def _validate_and_fix_component_code(
    code: str, 
    props_interface: str, 
    component_name: str
) -> tuple[str, str, list[str]]:
    """Validate and fix common issues in LLM-generated component code.
    
    Args:
        code: The component code (should be just the export const ... function)
        props_interface: The props interface definition
        component_name: Expected component name
        
    Returns:
        Tuple of (fixed_code, fixed_props_interface, list_of_fixes_applied)
    """
    fixes = []
    fixed_code = code.strip()
    fixed_props = props_interface.strip()

    # 1. Remove disallowed imports, keep only react / framer-motion
    allowed_modules = {"react", "framer-motion"}
    import_line_re = re.compile(r'^\s*import\s+.*?from\s+["\']([^"\']+)["\'];?\s*$', re.MULTILINE)
    kept_lines: list[str] = []
    removed_count = 0
    for line in fixed_code.splitlines():
        m = import_line_re.match(line)
        if not m:
            kept_lines.append(line)
            continue
        module = m.group(1)
        if module in allowed_modules:
            kept_lines.append(line)
        else:
            removed_count += 1
    if removed_count:
        fixes.append(f"Removed {removed_count} disallowed import(s)")
    fixed_code = "\n".join(kept_lines).strip()

    # 1.1 Auto-inject missing allowed imports if referenced
    has_react_import = bool(re.search(r"^\s*import\s+.*from\s+['\"]react['\"]", fixed_code, re.MULTILINE))
    has_motion_import = bool(re.search(r"^\s*import\s+.*from\s+['\"]framer-motion['\"]", fixed_code, re.MULTILINE))

    needs_react = bool(re.search(r"\bReact\.", fixed_code))
    needs_motion = bool(re.search(r"<\s*motion\b|\bmotion\.", fixed_code))

    import_inserts: list[str] = []
    if needs_react and not has_react_import:
        import_inserts.append("import React from 'react';")
        fixes.append("Added missing react import")
    if needs_motion and not has_motion_import:
        import_inserts.append("import { motion } from 'framer-motion';")
        fixes.append("Added missing framer-motion import")

    if import_inserts:
        fixed_code = "\n".join(import_inserts) + "\n\n" + fixed_code
    
    # 2. Remove duplicate interface definitions from code
    # Match interface definitions that appear in code but belong in props_interface
    interface_pattern = r'^(?:export\s+)?interface\s+\w+Props\s*\{[^}]*\}\s*\n?'
    interface_matches = re.findall(interface_pattern, fixed_code, re.MULTILINE | re.DOTALL)
    if interface_matches:
        # Keep only the component function in code
        fixed_code = re.sub(interface_pattern, '', fixed_code, flags=re.MULTILINE | re.DOTALL)
        fixes.append(f"Removed {len(interface_matches)} duplicate interface(s) from code")
    
    # 3. Remove duplicate type definitions from code
    type_pattern = r'^(?:export\s+)?type\s+\w+\s*=\s*[^;]+;\s*\n?'
    type_matches = re.findall(type_pattern, fixed_code, re.MULTILINE)
    if type_matches:
        fixed_code = re.sub(type_pattern, '', fixed_code, flags=re.MULTILINE)
        fixes.append(f"Removed {len(type_matches)} duplicate type definition(s) from code")
    
    # 4. Remove imports from props_interface (should only have interface)
    props_import_pattern = r'^\s*import\s+.*?\n'
    if re.search(props_import_pattern, fixed_props, re.MULTILINE):
        fixed_props = re.sub(props_import_pattern, '', fixed_props, flags=re.MULTILINE)
        fixes.append("Removed import statement(s) from props_interface")
    
    # 5. Ensure props_interface has export keyword
    if fixed_props and not fixed_props.strip().startswith('export'):
        # Check if it starts with 'interface' and add export
        if fixed_props.strip().startswith('interface'):
            fixed_props = 'export ' + fixed_props.strip()
            fixes.append("Added 'export' keyword to interface")
    
    # 6. Ensure code has export keyword for the component
    if fixed_code and 'export' not in fixed_code[:50]:
        # Check if it starts with 'const ComponentName'
        const_pattern = rf'^const\s+{re.escape(component_name)}\s*'
        if re.match(const_pattern, fixed_code.strip()):
            fixed_code = 'export ' + fixed_code.strip()
            fixes.append("Added 'export' keyword to component")
    
    # 7. Clean up excessive whitespace
    fixed_code = re.sub(r'\n{3,}', '\n\n', fixed_code).strip()
    fixed_props = re.sub(r'\n{3,}', '\n\n', fixed_props).strip()
    
    # 8. Validate component name matches expected
    expected_export = f"export const {component_name}"
    if expected_export not in fixed_code:
        # Try to find what was actually exported
        actual_match = re.search(r'export\s+const\s+(\w+)', fixed_code)
        if actual_match and actual_match.group(1) != component_name:
            actual_name = actual_match.group(1)
            fixes.append(f"Warning: Component name mismatch - expected '{component_name}', found '{actual_name}'")
    
    return fixed_code, fixed_props, fixes


@register_tool
class CodegenTool(LLMTool[CodegenContext, CodegenPatch]):
    """Generates React components for InventComponent placeholders.
    
    Takes invented component specs and generates TypeScript/React code.
    """
    
    # Self-description
    name: ClassVar[str] = "codegen"
    description: ClassVar[str] = "Generate React/TypeScript code for invented components found in slide MDX."
    query_description: ClassVar[str] = "Runs after content step if any <InventComponent> tags exist in slides."
    args_description: ClassVar[List[str]] = [
        "component_ids (specific components to generate, empty = all)",
    ]
    requires: ClassVar[List[str]] = ["content"]
    produces: ClassVar[List[str]] = ["generated_components"]
    examples: ClassVar[List[str]] = [
        '{"id": "codegen", "type": "codegen", "params": {}, "depends_on": ["content"]}',
    ]
    
    system_prompt: ClassVar[str] = """
Generate a simple and clean ppt block:

- Only use `react`, `framer-motion`.
- Avoid long text or redundant words
- Fit into `space`, center gravity, responsive
- Do not add component title

""" + THEME_CSS_VARIABLES_SECTION + """
# Output Format
Return a JSON object:
{
  "mdx_replacement": "<ComponentName />",
  "component": {
    "id": "original-invent-id",
    "name": "PascalCaseName",
    "props_interface": "export interface ComponentNameProps {}",
    "code": "import React from 'react';
import { motion } from 'framer-motion';

export const ComponentName: React.FC = () => {
  // Implementation logic...
}"
  }
}
"""
    
    def slice(self, state: "PipelineState", params: Optional[Dict[str, Any]] = None) -> CodegenContext:
        """Extract invented components from content step MDX output."""
        params = params or {}
        
        # Read content MDX from trace file (preferred)
        content_mdx = _read_content_mdx_from_trace()
        invented = []
        
        if content_mdx:
            invented = _extract_invent_components_from_mdx(content_mdx)
            print(f"[codegen] Found {len(invented)} InventComponent(s) in content MDX")
        
        # Fallback: Check state.slides if trace missing or no components found
        if not invented and hasattr(state, "slides") and state.slides:
            print("[codegen] Checking state.slides for InventComponent...")
            for slide in state.slides:
                slide_id = slide.get("id", "unknown")
                # MDX content is in "mdx" field, not "content" (which is a dict with structured data)
                mdx_content = slide.get("mdx", "")
                if not isinstance(mdx_content, str):
                    continue
                
                # Regex to find <InventComponent ... />
                invent_pattern = r'<InventComponent\s+([\s\S]*?)(?:/>|>\s*</InventComponent>)'
                
                for match in re.finditer(invent_pattern, mdx_content):
                    attrs_str = match.group(1)
                    
                    # Extract id
                    id_match = re.search(r'id\s*=\s*["\']([^"\']+)["\']', attrs_str)
                    comp_id = id_match.group(1) if id_match else f"invented_{slide_id}_{len(invented)}"
                    
                    component = {
                        "slide_id": slide_id,
                        "id": comp_id,
                        "raw": match.group(0),
                    }

                    # Extract intent
                    intent_match = re.search(r'intent\s*=\s*["\']([^"\']+)["\']', attrs_str)
                    if intent_match:
                        component["intent"] = intent_match.group(1)

                    # Extract name (optional, generate if missing)
                    name_match = re.search(r'name\s*=\s*["\']([^"\']+)["\']', attrs_str)
                    if name_match:
                        component["name"] = name_match.group(1)
                    else:   
                        # Generate PascalCase name: Invented{SlideID}{Index}
                        # Ensure slide_id part is alphanumeric and capitalized
                        clean_sid = re.sub(r'[^a-zA-Z0-9]', '', slide_id) or "Slide"
                        component["name"] = f"Invented{clean_sid.capitalize()}{len(invented)}"
                    
                    # Extract new format attributes
                    raw_story_match = re.search(r'raw_story\s*=\s*"([^"]+)"', attrs_str, re.DOTALL)
                    if raw_story_match:
                        component["raw_story"] = raw_story_match.group(1).strip()

                    space_match = re.search(r'space\s*=\s*["\']([^"\']+)["\']', attrs_str)
                    if space_match:
                        component["space"] = space_match.group(1).strip()
                        
                    invented.append(component)
            
            if invented:
                print(f"[codegen] Found {len(invented)} InventComponent(s) in state.slides")

        if not invented:
            print("[codegen] No invented components found in trace or slides")
            return CodegenContext(
                invented_components=[],
                existing_components=_get_existing_component_names(),
            )
        
        # Filter by specific IDs if provided
        component_ids = params.get("component_ids", [])
        if component_ids:
            invented = [c for c in invented if c.get("id") in component_ids]
        
        return CodegenContext(
            invented_components=invented,
            existing_components=_get_existing_component_names(),
        )
    
    def generate(
        self,
        constitution: "ConstitutionPatch",
        context: CodegenContext,
        user_instruction: str,
    ) -> CodegenPatch:
        """Generate React code for invented components - concurrent LLM calls."""
        if not context.invented_components:
            print("[codegen] No invented components found, skipping")
            return CodegenPatch(generated_components={})
        
        print(f"[codegen] Generating code for {len(context.invented_components)} components concurrently")
        
        # Run async generation in a new event loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an event loop, create a new one
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    generated = pool.submit(
                        lambda: asyncio.run(self._generate_all_async(context, user_instruction))
                    ).result()
            else:
                generated = loop.run_until_complete(self._generate_all_async(context, user_instruction))
        except RuntimeError:
            # No event loop, create one
            generated = asyncio.run(self._generate_all_async(context, user_instruction))
        
        print(f"[codegen] Generated {len(generated)} components total")
        return CodegenPatch(generated_components=generated)
    
    async def _generate_all_async(self, context: CodegenContext, user_instruction: str) -> Dict[str, Dict[str, Any]]:
        """Generate all components concurrently."""
        deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')
        
        # Create tasks for all components
        tasks = []
        for i, comp in enumerate(context.invented_components, 1):
            comp_id = comp.get("id", f"component_{i}")
            task = self._generate_component_async(
                comp, comp_id, i, len(context.invented_components),
                context.existing_components, user_instruction, deployment
            )
            tasks.append((comp_id, task))
        
        # Run all tasks concurrently
        results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)
        
        # Collect successful results
        generated = {}
        for (comp_id, _), result in zip(tasks, results):
            if isinstance(result, Exception):
                print(f"[codegen] Error generating {comp_id}: {result}")
            elif result is not None:
                generated[comp_id] = result
        
        return generated
    
    async def _generate_component_async(
        self,
        comp: Dict[str, Any],
        comp_id: str,
        index: int,
        total: int,
        existing_components: List[str],
        user_instruction: str,
        deployment: str
    ) -> Optional[Dict[str, Any]]:
        """Generate a single component asynchronously."""
        print(f"[codegen] ({index}/{total}) Starting: {comp_id}")
        
        # Build component-specific user prompt
        user_prompt = self._build_single_component_prompt(comp, existing_components, user_instruction)
        
        try:
            response = await call_llm_async(
                system_prompt=self.system_prompt,
                user_prompt=user_prompt,
                deployment=deployment,
                temperature=0.3,
                max_tokens=4000,
                response_format="json",
                component_id=comp_id,  # Pass component ID for tracing
            )
            
            # Parse response
            data = json.loads(response)
            
            mdx_replacement = data.get("mdx_replacement", "")
            
            # Handle new component-nested format or legacy formats
            comp_data = data
            if "component" in data and isinstance(data["component"], dict):
                comp_data = data["component"]
            elif "components" in data and isinstance(data["components"], list):
                comp_data = data["components"][0] if data["components"] else {}
            elif "code" in data:
                comp_data = data
            else:
                comp_data = {}
            
            if comp_data:
                raw_code = comp_data.get("code", "")
                raw_props = comp_data.get("props_interface", "")
                comp_name = comp_data.get("name", comp_id)
                
                # Validate and fix common issues
                fixed_code, fixed_props, fixes = _validate_and_fix_component_code(
                    raw_code, raw_props, comp_name
                )
                
                if fixes:
                    print(f"[codegen] Fixes applied to {comp_name}:")
                    for fix in fixes:
                        print(f"[codegen]   - {fix}")
                
                print(f"[codegen] ({index}/{total}) Completed: {comp_name}")
                
                return {
                    "name": comp_name,
                    "props_interface": fixed_props,
                    "code": fixed_code,
                    "mdx_usage": mdx_replacement
                }
            else:
                print(f"[codegen] Warning: Empty response for {comp_id}")
                return None
                
        except json.JSONDecodeError as e:
            print(f"[codegen] Failed to parse JSON for {comp_id}: {e}")
            return None
        except Exception as e:
            print(f"[codegen] Error generating {comp_id}: {e}")
            raise
    
    def _build_single_component_prompt(
        self, 
        comp: Dict[str, Any], 
        existing_components: List[str],
        user_instruction: str
    ) -> str:
        """
        Build user prompt for a single bespoke presentation component.
        Focuses on Design Brief rather than Data Schema.
        """
        lines = [
            f"**Name:** {comp.get('name', 'N/A')}",
            f"**Intent:** {comp.get('intent', 'N/A')}",
            f"**Raw Story:** {comp.get('raw_story', 'N/A')}",
            f"**Space(width*height):** {comp.get('space', 'N/A')}",
            "",
        ]
    
        return "\n".join(lines)
    
    def apply(self, state: "PipelineState", patch: CodegenPatch) -> None:
        """Store generated components in state."""
        if not hasattr(state, 'generated_components'):
            state.generated_components = {}
        
        state.generated_components.update(patch.generated_components)
        
        if self.verbose:
            for comp_id, comp_data in patch.generated_components.items():
                print(f"[codegen] Generated: {comp_data.get('name', comp_id)}")

    # === Abstract method implementations (required by LLMTool) ===
    # We override generate() directly, so these are not used but must be defined.
    
    def format_context(self, context: CodegenContext) -> str:
        """Format context for prompt. Not used - generate() is overridden."""
        return ""
    
    def call_llm(self, prompt: str) -> str:
        """Call LLM. Not used - generate() is overridden."""
        return ""
    
    def parse_response(self, response: str) -> CodegenPatch:
        """Parse response. Not used - generate() is overridden."""
        return CodegenPatch(generated_components={})
