"""LLM-driven orchestrator session for slide generation.

This orchestrator:
1. Maintains a long-running conversation context
2. Makes dynamic decisions about subagent calls
3. Supports batching with has_more signal
4. Handles user follow-up instructions
5. Accumulates results for adaptive planning
6. Parallel layout batch execution
"""
import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, Callable

from cliv2.core.subagent import Subagent, SubagentResult

logger = logging.getLogger("cliv2.orchestrator_session")


# Action types the orchestrator can take
ACTION_CALL_SUBAGENT = "call_subagent"
ACTION_CALL_MCP = "call_mcp"
ACTION_WAIT_USER = "wait_for_user"
ACTION_DONE = "done"


@dataclass
class OrchestratorAction:
    """An action decided by the orchestrator LLM."""
    action: str  # call_subagent, call_mcp, wait_for_user, done
    subagent: Optional[str] = None  # storyline, layout, research, theme, export
    params: dict = field(default_factory=dict)
    reasoning: str = ""


@dataclass
class UploadedFile:
    """Represents an uploaded file."""
    path: str
    name: str
    type: str  # md, txt, pptx, pdf, etc.
    purpose: Optional[str] = None  # source, template, context (assigned by LLM)
    copied_to: Optional[str] = None  # path in project after copy


@dataclass
class SessionState:
    """State of the orchestrator session."""
    project_dir: Optional[str] = None
    project_id: Optional[str] = None
    instruction: str = ""
    renderer: str = "antd"
    skip_search: bool = False  # Track current value to detect changes
    
    # Uploaded files tracking
    uploaded_files: list[UploadedFile] = field(default_factory=list)
    
    # Slide tracking
    completed_slide_ids: list[str] = field(default_factory=list)
    
    # Stage completion
    project_created: bool = False
    constitution_done: bool = False
    research_done: bool = False
    theme_done: bool = False
    storyline_done: bool = False
    layout_done: bool = False
    export_done: bool = False
    
    # Wait state
    pending_question: Optional[str] = None


ORCHESTRATOR_SYSTEM_PROMPT = '''You are the orchestrator for a slide generation pipeline.

## CRITICAL: ALWAYS RESPOND WITH JSON
**You MUST ALWAYS respond with a JSON action. Never respond with plain text.**
If you need clarification, use the wait_for_user action.
If you're ready to proceed, return the appropriate action(s).

## Your Role
You orchestrate slide generation through **conversation**. You maintain state across multiple user messages.
You coordinate specialized subagents and make decisions about what to do based on context.

## CRITICAL: Conversation Awareness
- Project may already exist from previous messages - check state first
- Slides may already be generated - update only what's needed  
- User may request changes to specific slides
- New files may add context or replace existing content

## CRITICAL: New Project vs Update Decision
When a project already exists AND user provides new source content:
- **CREATE NEW PROJECT** if user says: "create new slides", "new presentation", "new deck", "start fresh", "different topic"
- **UPDATE EXISTING** if user says: "update", "change", "modify", "add to", "revise", "improve", "make more visual"
- **When ambiguous**: Look at the source content - if it's a DIFFERENT topic than existing slides, create new project

**Example:** Existing project has "AI Product Launch" slides. User uploads "brainstorm_set.md" about a different product and says "create new slides" → CREATE NEW PROJECT (don't ask, just do it)

## Available Subagents
| Subagent | Purpose | When to Use |
|----------|---------|-------------|
| research | Consolidate source, web search, image search → research.md | ALWAYS before storyline (mandatory); also for adding images |
| theme | Select/generate theme | If theme not pre-set, or user provides template.pptx |
| storyline | Plan ALL slides in ONE call | After research creates research.md |
| layout | Generate visual JSX layouts | After storyline completes, or to update specific slides |

## Constitution
After create_project, use `write_constitution` to extract and save user requirements:
- **Target:** slide count (e.g., "5 slides", "~10 slides")
- **Audience:** who will view (executive, technical, general)
- **Tone:** style of communication (professional, casual, academic)
- **Must include:** required topics from user instruction
- **Must NOT include:** excluded topics or constraints

**⚠️ IMPORTANT: Do NOT add `[RULE: NO WEB SEARCH]` unless user EXPLICITLY says:**
- "skip search", "no web search", "don't search the web", "use only the source", etc.
- By default, web/image search is ENABLED to enrich slides with data and visuals

## Research Rules (MANDATORY)
Research is **REQUIRED** before storyline if research.md does not exist.
Research consolidates source content into research.md, which is the ONLY input for storyline.

**Research ALWAYS does by default (unless [RULE: NO WEB SEARCH] in constitution):**
1. **Web search** - Find up-to-date statistics, citations, industry data
2. **Image search** - Find visual assets (photos, illustrations) for slides

**When calling research subagent:**
- Do NOT include "consolidate only" or similar phrasing in instruction
- DO include focus areas: "Focus on market trends, team collaboration visuals"
- Research handler decides what to search based on source content

**Search Control:**
- `skip_search: true` in params → Disable web/image search (consolidation only)
- `[RULE: NO WEB SEARCH]` in constitution → Same effect
- Neither present → Search is ENABLED (default)

**Data Flow:**
- Source files (from files/) → Research → research.md
- Storyline reads ONLY: research.md + constitution.md
- Storyline does NOT read source files directly

## Available MCP Tools
| Tool | Purpose | Params |
|------|---------|--------|
| create_project | Initialize project scaffold | instruction (required) |
| write_constitution | Write/update constitution.md | content (markdown string) |
| copy_to_project | Copy file OR write content | file_path OR content, dest_name, purpose |
| export_mdx | Export and render slides | (none - uses session state) |

**copy_to_project modes:**
- Copy file: `{"file_path": "/path/to/file", "dest_name": "source.md", "purpose": "source"}`
- Write content: `{"content": "User-provided text...", "dest_name": "company_info.md", "purpose": "context"}`

## File Handling
When user uploads files, YOU decide their purpose based on instruction:

| File Type | Possible Purposes | Destination |
|-----------|-------------------|-------------|
| .pptx | template (theme extraction) OR source (convert to slides) | files/template.pptx OR files/source.pptx |
| .md, .txt | source (main content) OR context (supporting info) | files/{name} |
| .pdf, .docx | context (supporting info) | files/context/{name} |
| .json | data (for charts/tables) | files/data/{name} |
| .png, .jpg, .webp, .svg | background (theme) OR slide-image (layout) | files/images/{name} |

**Decision Logic:**
- If user says "use as template" / "match this style" → purpose: template
- If user says "create slides from this" / "convert this" → purpose: source  
- If user says "use for reference" / "add this info" → purpose: context
- If user says "background" / "wallpaper" + image → purpose: images, call Theme ONLY, then export (NO layout needed - background applied via theme CSS)
- If user says "on slide X" / "for the team page" + image → purpose: images, call Layout with target slide_ids, then export
- If ambiguous and .pptx → ask user OR default to template
- If ambiguous and .md/.txt → default to source

## User-Provided Context
When user provides substantial text content (facts, data, background info) in their message:
- **Persistent context** (should be saved for subagents): Write to file using copy_to_project with `content` param
  - Use descriptive filename: "company_overview.md", "market_data.md", "team_bios.md"
  - Purpose: "context"
- **Temporary instruction** (one-time directive): Keep in user_instruction param
  - Examples: "make it more visual", "focus on benefits", "skip research"

## Pipeline Flow (First Generation)
1. **Create project FIRST** (MCP: create_project) - MUST be first action
2. **Write constitution** (MCP: write_constitution) - save global rules
3. Copy files to project (MCP: copy_to_project) - based on purpose
4. **Research (MANDATORY)** - creates research.md from source files
5. Theme (conditional, subagent) - if template.pptx or no preset
6. Storyline - reads ONLY research.md + constitution.md (FAILS if research.md missing)
7. Layout (batches in PARALLEL)
8. Export (MCP: export_mdx)

## Update Flow: Layer-Based Task Dependencies

Changes cascade through layers. Always run the FULL chain from the modified layer down:

| User Request | Layer Modified | Task Chain |
|--------------|----------------|------------|
| "Add more data", "include X topic", new source file | **Content** | research → storyline → layout → export |
| "Find an image for slide X", "add a photo of Y" | **Content** | research (image search) → storyline (slide X only) → layout (slide X only) → export |
| "Restructure slides", "change order", "different narrative" | **Narrative** | storyline → layout → export |
| "Change colors", "new template", "darker theme" | **Theme/Style** | theme → export (NO layout needed) |
| "Make slide 3 more visual", "fix layout on X" | **Layout** | layout (specific slides) → export |

**TARGETED UPDATES (Minimize Work):**

When updating specific slides, pass `slide_ids` to storyline and layout:
```json
research: {"instruction": "find image for slide 5", "skip_source": true}  // skip_source=true for image/light tasks (no need to reload source files)
storyline: {"slide_ids": ["slide_05"]}  // Update slide 5 only, preserve others
layout: {"slide_ids": ["slide_05"]}  // Regenerate layout for slide 5 only
```

**Research skip_source flag:**
- `skip_source: true` → Only load research.md and slides context (for image search, small updates)
- `skip_source: false` (default) → Load all source files (for full research, content changes)

**CRITICAL: Never run a higher layer without its downstream dependencies:**
- ❌ `storyline` alone → makes no sense (slides have no layout)
- ✅ `storyline → layout → export` → correct chain
- ❌ `research` alone → makes no sense (outdated storyline)
- ✅ `research → storyline → layout → export` → correct chain
- ✅ `theme → export` → correct (theme is styling, no layout regen needed)
- ✅ `layout → export` → correct for per-slide visual fixes

## EFFICIENCY: Batch Multiple Actions
**CRITICAL: Return multiple actions when they can run sequentially without waiting for results.**

For example, when starting fresh:
- create_project → write_constitution → copy_file_1 → copy_file_2 can ALL be batched
- research MUST wait for source files to be copied
- storyline MUST wait for research to complete

Return an array of actions when batching:
```json
{
  "actions": [
    {"action": "call_mcp", "params": {"tool": "create_project", "instruction": "..."}, "reasoning": "..."},
    {"action": "call_mcp", "params": {"tool": "write_constitution", "content": "# Constitution\n\n**Tone:** Professional\n..."}, "reasoning": "..."},
    {"action": "call_mcp", "params": {"tool": "copy_to_project", "file_path": "...", "dest_name": "source.md", "purpose": "source"}, "reasoning": "..."}
  ]
}
```

Or return a single action when you need to wait for results:
```json
{
  "action": "call_subagent",
  "subagent": "storyline",
  "params": {},
  "reasoning": "..."
}
```

## Action Format

For creating project (first time only):
```json
{"action": "call_mcp", "params": {"tool": "create_project", "instruction": "User's instruction"}, "reasoning": "..."}
```

For copying files to project:
```json
{"action": "call_mcp", "params": {"tool": "copy_to_project", "file_path": "/path/to/file", "dest_name": "template.pptx", "purpose": "template"}, "reasoning": "..."}
```

For storyline (ALL slides - full generation):
```json
{"action": "call_subagent", "subagent": "storyline", "params": {}, "reasoning": "..."}
```

For storyline (SPECIFIC slides only - targeted update):
```json
{"action": "call_subagent", "subagent": "storyline", "params": {"slide_ids": ["slide_05"], "instruction": "assign new image from research"}, "reasoning": "..."}
```

For theme update (with specific instruction):
```json
{"action": "call_subagent", "subagent": "theme", "params": {"instruction": "change text color to #ff0000"}, "reasoning": "..."}
```

For layout (with slide IDs to process):
```json
{"action": "call_subagent", "subagent": "layout", "params": {"slide_ids": ["slide_01", "slide_02"]}, "reasoning": "..."}
```

For export:
```json
{"action": "call_mcp", "params": {"tool": "export_mdx"}, "reasoning": "..."}
```

When done:
```json
{"action": "done", "reasoning": "All slides generated and exported"}
```

To wait for user input (e.g., need clarification):
```json
{"action": "wait_for_user", "reasoning": "Need user to clarify if PPTX should be template or source"}
```

## Rules
- **Create project FIRST** before any other action
- Copy files BEFORE running subagents that need them
- **Research is MANDATORY before storyline** (creates research.md)
- **Storyline FAILS if research.md does not exist** (enforced by system)
- Storyline reads ONLY research.md + constitution.md (not source files)
- Storyline runs ONCE and generates ALL slides (no batching)
- Layout runs in batches for parallel efficiency
- For updates: only run what's needed, then re-export
- Export uses MCP tool "export_mdx" (NOT subagent)
- Mark as done after successful export_mdx

## REMINDER: ALWAYS RETURN JSON
**Never respond with plain text.** Every response must be a valid JSON action:
- If ready to proceed → return action(s)
- If need info → {"action": "wait_for_user", "reasoning": "What you need to know"}
- If ambiguous but can make reasonable choice → proceed with that choice
'''

class OrchestratorSession:
    """LLM-driven orchestrator session for slide generation."""
    
    # Track if LLM has been warmed up (class-level, once per process)
    _llm_warmed_up: bool = False
    
    def __init__(
        self,
        llm: Any,  # LLM instance from cliv2.config.llm
        progress_callback: Optional[Callable] = None,
        verbose: bool = False,
    ):
        self.llm = llm
        self.progress_callback = progress_callback
        self.verbose = verbose
        self.messages: list[dict] = []
        self.state = SessionState()
        self.skill_cache: dict[str, Any] = {}
        self._pending_full_message: Optional[str] = None  # Full content when compacted
        
        # Track pending parallel tasks
        self.pending_layout_batches: list[list[str]] = []  # slide IDs waiting for layout
        self.slides_ready_for_layout: list[str] = []  # slides completed in storyline, not yet batched
        self.active_layout_tasks: list[asyncio.Task] = []  # running layout batches
        
        # Warmup LLM on first session (connection establishment is slow)
        if not OrchestratorSession._llm_warmed_up:
            self._warmup_llm()
    
    def _warmup_llm(self):
        """Warmup LLM with a simple call to establish connection."""
        import time
        logger.info("[init] Warming up LLM (first call is slower)...")
        start = time.time()
        try:
            self.llm.completion(messages=[
                {"role": "user", "content": "Say 'ready' in one word."}
            ])
            duration = time.time() - start
            logger.info(f"[init] LLM warmup complete ({duration:.1f}s)")
            OrchestratorSession._llm_warmed_up = True
        except Exception as e:
            logger.warning(f"[init] LLM warmup failed (non-fatal): {e}")
        
    def _notify(self, stage: str, status: str, message: str, data: dict = None):
        """Notify progress callback."""
        if self.progress_callback:
            from cliv2.core.models import StageResult
            self.progress_callback(StageResult(
                stage=stage,
                status=status,
                message=message,
                data=data or {},
            ))
        if self.verbose:
            logger.info(f"[{stage}] {status}: {message}")
    
    def _add_system_prompt(self):
        """Add system prompt to messages."""
        self.messages.append({
            "role": "system",
            "content": ORCHESTRATOR_SYSTEM_PROMPT,
        })
    
    # Threshold for compacting long user messages (chars)
    LONG_MESSAGE_THRESHOLD = 2000
    
    def _add_user_message(self, content: str):
        """Add user message to context.
        
        For long messages, we store a compact reference in history
        but pass the full content to the LLM for the current turn.
        """
        # Store compact version for history if message is long
        if len(content) > self.LONG_MESSAGE_THRESHOLD:
            # Extract key info for history (first 500 chars + summary)
            preview = content[:500].strip()
            if "\n" in preview:
                # Try to get the main instruction line
                first_line = preview.split("\n")[0]
                preview = first_line[:200] if len(first_line) > 200 else first_line
            
            # Store compact version
            compact_msg = f"[Task: {preview}...] (full content: {len(content)} chars)"
            self._pending_full_message = content  # Keep full for current LLM call
            self.messages.append({"role": "user", "content": compact_msg})
            logger.info(f"[history] Compacted long message ({len(content)} chars -> {len(compact_msg)} chars)")
        else:
            self._pending_full_message = None
            self.messages.append({"role": "user", "content": content})
    
    def _get_messages_for_llm(self) -> list[dict]:
        """Get messages for LLM call, expanding the last user message if needed."""
        if self._pending_full_message and self.messages:
            # Replace last compacted message with full content for this LLM call
            msgs = self.messages[:-1] + [{"role": "user", "content": self._pending_full_message}]
            return msgs
        return self.messages
    
    def _add_assistant_message(self, content: str):
        """Add assistant message to context."""
        self.messages.append({"role": "assistant", "content": content})
    
    # Threshold for compacting large results (chars)
    LARGE_RESULT_THRESHOLD = 3000
    
    def _add_result_to_context(self, action: str, result: dict):
        """Add subagent/MCP result to context, compacting if large."""
        result_str = json.dumps(result, indent=2, default=str)
        
        # Compact large results to essential info
        if len(result_str) > self.LARGE_RESULT_THRESHOLD:
            # Extract key fields for compact summary
            compact = {}
            for key in ['status', 'success', 'error', 'project_id', 'slide_ids', 
                        'completed_ids', 'theme_id', 'atoms_count', 'slides_count']:
                if key in result:
                    compact[key] = result[key]
            
            # Include first 500 chars of any other content
            if not compact:
                compact = {'summary': result_str[:500] + '...'}
            
            compact_str = json.dumps(compact, indent=2, default=str)
            logger.info(f"[history] Compacted result ({len(result_str)} -> {len(compact_str)} chars)")
            self.messages.append({
                "role": "user",
                "content": f"Result from {action} (compacted):\n```json\n{compact_str}\n```\n(Full result: {len(result_str)} chars)",
            })
        else:
            self.messages.append({
                "role": "user",
                "content": f"Result from {action}:\n```json\n{result_str}\n```",
            })
    
    def _build_state_context(self) -> str:
        """Build current state context for LLM.
        
        Orchestrator tracks session-level info AND reads content.json for project state.
        """
        # Format uploaded files
        files_info = []
        for f in self.state.uploaded_files:
            status = f"copied to {f.copied_to}" if f.copied_to else "not yet copied"
            purpose = f.purpose or "undecided"
            files_info.append(f"  - {f.name} ({f.type}) - purpose: {purpose}, {status}")
        files_str = "\n".join(files_info) if files_info else "  (none)"
        
        # Read project content state from content.json
        content_state = self._get_content_state()
        
        return f"""
Current Session:
- Project: {self.state.project_id or '(not created)'}
- Project Dir: {self.state.project_dir or '(none)'}
- Renderer: {self.state.renderer}

{content_state}
Uploaded Files (this session):
{files_str}
"""

    def _get_content_state(self) -> str:
        """Read content.json and summarize what exists in the project."""
        if not self.state.project_dir:
            return "Project Content: (no project yet)\n"
        
        content_path = Path(self.state.project_dir) / "content.json"
        if not content_path.exists():
            return "Project Content: (empty - no content.json)\n"
        
        try:
            import json
            with open(content_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
            
            parts = ["Project Content:"]
            
            # Check theme
            theme = content.get("theme")
            if theme:
                theme_name = theme.get("name", "unnamed")
                parts.append(f"  - Theme: {theme_name} ✓")
            else:
                parts.append("  - Theme: (none)")
            
            # Check slides
            slides = content.get("slides", [])
            active_slides = [s for s in slides if s.get("active", True)]
            if active_slides:
                parts.append(f"  - Slides: {len(active_slides)} slides ✓")
                # Show slide titles for context
                titles = [s.get("title", f"Slide {i+1}") for i, s in enumerate(active_slides[:5])]
                if len(active_slides) > 5:
                    titles.append(f"... and {len(active_slides) - 5} more")
                parts.append(f"    Titles: {', '.join(titles)}")
            else:
                parts.append("  - Slides: (none)")
            
            # Check atoms
            atoms = content.get("atoms", [])
            if atoms:
                parts.append(f"  - Atoms: {len(atoms)} extracted ✓")
            
            # Check story
            story = content.get("story")
            if story:
                parts.append(f"  - Story/Constitution: ✓")
            
            # Check research
            research = content.get("research")
            if research:
                parts.append(f"  - Research: ✓")
            
            return "\n".join(parts) + "\n"
            
        except Exception as e:
            logger.warning(f"Failed to read content.json: {e}")
            return f"Project Content: (error reading: {e})\n"
    
    async def _get_next_actions(self) -> list[OrchestratorAction]:
        """Ask LLM for next action(s) using structured output."""
        # Add state context
        state_msg = self._build_state_context()
        self._add_user_message(f"What should I do next?\n\n{state_msg}")
        
        # Call LLM with structured output (JSON mode)
        logger.debug(f"[orchestrator] Asking LLM for next action (structured output)...")
        llm_start = datetime.now()
        
        try:
            # Use LiteLLM directly for structured output support
            import litellm
            from cliv2.core import verbose_logger
            
            # Get model info from LLM config
            model = self.llm.config.model
            api_key = self.llm.config.api_key
            base_url = self.llm.config.base_url
            api_version = getattr(self.llm.config, 'api_version', None)
            
            # Handle SecretStr from Pydantic
            if hasattr(api_key, 'get_secret_value'):
                api_key = api_key.get_secret_value()
            
            # Build litellm kwargs - use _get_messages_for_llm() for full content on current turn
            messages = self._get_messages_for_llm()
            kwargs = {
                "model": model,
                "messages": messages,
                "response_format": {"type": "json_object"},
            }
            
            # Add Azure-specific params
            if base_url:
                kwargs["api_base"] = base_url
            if api_key:
                kwargs["api_key"] = api_key
            if api_version:
                kwargs["api_version"] = api_version
            
            # Verbose logging (full, untruncated)
            system_prompt = messages[0]["content"] if messages else ""
            user_prompt = "\n---\n".join(m["content"] for m in messages[1:] if m["role"] == "user")
            verbose_logger.log_llm_call(
                skill_name="orchestrator",
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            
            response = await litellm.acompletion(**kwargs)
            content = response.choices[0].message.content.strip()
            
            # Verbose logging of response
            verbose_logger.log_streaming_complete("orchestrator", content)
            
        except Exception as e:
            logger.warning(f"[orchestrator] Structured output failed ({e}), falling back to regular completion")
            # Fallback to regular completion
            response = self.llm.completion(messages=self._get_messages_for_llm())
            content = response.choices[0].message.content if hasattr(response, 'choices') else str(response)
            content = content.strip()
        
        llm_duration = (datetime.now() - llm_start).total_seconds()
        logger.debug(f"[orchestrator] LLM response ({llm_duration:.1f}s):\n{content[:500]}...")
        
        # Parse action(s) from response
        actions = self._parse_actions(content)
        
        # Clear pending full message after use
        self._pending_full_message = None
        
        # Add assistant response to context
        self._add_assistant_message(content)
        
        return actions
    
    def _parse_actions(self, content: str) -> list[OrchestratorAction]:
        """Parse action(s) from LLM response. Expects JSON from structured output."""
        logger.info(f"[orchestrator] Parsing LLM response ({len(content)} chars):\n{content[:1000]}{'...' if len(content) > 1000 else ''}")
        
        # With structured output, content should be pure JSON
        # Try parsing directly first
        try:
            data = json.loads(content)
            return self._data_to_actions(data)
        except json.JSONDecodeError:
            pass
        
        # Fallback: Try to extract JSON from code block (if LLM wrapped it)
        json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', content)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                return self._data_to_actions(data)
            except json.JSONDecodeError:
                pass
        
        # Fallback: Try to find raw JSON object
        raw_json_match = re.search(r'(\{[\s\S]*\})', content)
        if raw_json_match:
            try:
                data = json.loads(raw_json_match.group(1))
                return self._data_to_actions(data)
            except json.JSONDecodeError:
                pass
        
        # Last resort: check for clarification patterns
        clarification_patterns = [r'\?', r'(?i)if you want', r'(?i)tell me', r'(?i)otherwise']
        if any(re.search(p, content) for p in clarification_patterns):
            logger.info(f"[orchestrator] Response looks like clarification, converting to wait_for_user")
            return [OrchestratorAction(action=ACTION_WAIT_USER, reasoning=content[:500])]
        
        logger.warning(f"Could not parse action from LLM response: {content[:500]}")
        return [OrchestratorAction(action=ACTION_DONE, reasoning="Could not parse LLM response")]
    
    def _data_to_actions(self, data: dict) -> list[OrchestratorAction]:
        """Convert parsed JSON to list of actions."""
        # Check for batched actions
        if "actions" in data and isinstance(data["actions"], list):
            actions = []
            for item in data["actions"]:
                actions.append(OrchestratorAction(
                    action=item.get("action", ACTION_DONE),
                    subagent=item.get("subagent"),
                    params=item.get("params", {}),
                    reasoning=item.get("reasoning", ""),
                ))
            return actions
        
        # Single action
        return [OrchestratorAction(
            action=data.get("action", ACTION_DONE),
            subagent=data.get("subagent"),
            params=data.get("params", {}),
            reasoning=data.get("reasoning", ""),
        )]
    
    async def _execute_subagent(self, subagent_name: str, params: dict) -> dict:
        """Execute a subagent with given parameters."""
        
        # CRITICAL: Check research.md exists before storyline
        if subagent_name == "storyline" and self.state.project_dir:
            research_path = Path(self.state.project_dir) / "files" / "research.md"
            if not research_path.exists():
                error_msg = "research.md does not exist. Run research subagent first."
                logger.error(f"[storyline] {error_msg}")
                return {"error": error_msg, "requires": "research"}
        
        self._notify(subagent_name, "running", f"Executing {subagent_name}...")
        
        # Map subagent name to skill
        skill_map = {
            "research": "research-agent",
            "theme": "theme-generator",
            "storyline": "storyline-planner",
            "layout": "ant-paged-layout",
            "export": "ant-slides-export",
        }
        
        skill_name = skill_map.get(subagent_name)
        if not skill_name:
            return {"error": f"Unknown subagent: {subagent_name}"}
        
        # Get or create subagent
        if skill_name not in self.skill_cache:
            self.skill_cache[skill_name] = Subagent(skill_name, self.llm)
        
        subagent = self.skill_cache[skill_name]
        
        # Create handler - it will load its own context
        handler = self._get_handler_for_skill(subagent_name, params)
        
        # Convert slide_ids to slide_indices for layout and storyline
        target_indices = []
        if params.get("slide_ids"):
            # Look up actual index by slide ID (slides may be reordered)
            content_path = Path(self.state.project_dir) / "content.json" if self.state.project_dir else None
            slide_id_to_index = {}
            if content_path and content_path.exists():
                try:
                    import json
                    with open(content_path, 'r', encoding='utf-8') as f:
                        content = json.load(f)
                    for i, s in enumerate(content.get("slides", [])):
                        if isinstance(s, dict) and s.get("id"):
                            slide_id_to_index[s.get("id")] = i + 1  # 1-indexed
                except Exception:
                    pass
            
            for sid in params["slide_ids"]:
                if sid in slide_id_to_index:
                    target_indices.append(slide_id_to_index[sid])
        else:
            target_indices = params.get("slide_indices", [])
        
        # Handler loads its own context based on its input_spec
        context = handler.load_context(
            project_dir=self.state.project_dir or "",
            user_instruction=self.state.instruction,
            target_indices=target_indices,
            task_params=params,
        )
        
        # Execute - use streaming for storyline and layout
        start_time = datetime.now()
        
        if subagent_name == "storyline" and hasattr(handler, 'execute_streaming'):
            # Streaming storyline with progressive patch application
            def on_slide_complete(slide_id: str, slide_mdx: str):
                """Apply patch for each completed slide."""
                if self.state.project_dir:
                    from cliv2.tools.mcp_client import call_apply_patch
                    try:
                        call_apply_patch(
                            project_dir=self.state.project_dir,
                            target="slides",
                            data=slide_mdx,
                        )
                        logger.info(f"[storyline] Applied patch for {slide_id}")
                    except Exception as e:
                        logger.error(f"[storyline] Failed to apply patch for {slide_id}: {e}")
            
            result = await handler.execute_streaming(context, self.llm, logger, on_slide_complete)
            result["streaming_used"] = True
        elif subagent_name == "layout" and hasattr(handler, 'execute_streaming'):
            # Streaming layout with progressive patch application
            def on_slide_start(slide_id: str):
                """Mark slide as draft when it starts generating."""
                if self.state.project_dir:
                    import json
                    from pathlib import Path
                    content_path = Path(self.state.project_dir) / "content.json"
                    try:
                        content = json.loads(content_path.read_text(encoding="utf-8"))
                        for slide in content.get("slides", []):
                            if slide.get("id") == slide_id:
                                slide["state"] = "draft"
                                break
                        content_path.write_text(json.dumps(content, indent=2, ensure_ascii=False), encoding="utf-8")
                        logger.info(f"[layout] Marked {slide_id} as draft (generating...)")
                    except Exception as e:
                        logger.warning(f"[layout] Failed to mark {slide_id} as draft: {e}")
            
            def on_slide_complete(slide_id: str, jsx_content: str):
                """Apply patch for each completed slide.
                
                JSX validation happens in call_apply_patch -> _parse_mdx_slides.
                Issues are stored in the slide's 'issues' field automatically.
                """
                if self.state.project_dir:
                    from cliv2.tools.mcp_client import call_apply_patch
                    
                    # Format as MDX for single slide
                    mdx = f"---\nid: {slide_id}\n---\n{jsx_content}"
                    try:
                        call_apply_patch(
                            project_dir=self.state.project_dir,
                            target="slides",
                            data=mdx,
                        )
                        logger.info(f"[layout] Applied patch for {slide_id}")
                    except Exception as e:
                        logger.error(f"[layout] Failed to apply patch for {slide_id}: {e}")
            
            result = await handler.execute_streaming(context, self.llm, logger, on_slide_complete, on_slide_start)
            result["streaming_used"] = True
        else:
            result = await handler.execute(context, self.llm, logger)
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Save output to content.json (skip for streaming, already applied via callbacks)
        if result.get("output") and self.state.project_dir and not result.get("streaming"):
            from cliv2.tools.mcp_client import call_apply_patch
            
            target = handler.output_spec.target
            if target in ["slides", "theme"]:
                try:
                    patch_result = call_apply_patch(
                        project_dir=self.state.project_dir,
                        target=target,
                        data=result["output"],
                    )
                    logger.info(f"[{subagent_name}] Saved to content.json: {patch_result}")
                    result["saved"] = True
                except Exception as e:
                    logger.error(f"[{subagent_name}] Failed to save: {e}")
                    result["saved"] = False
        
        result["duration_ms"] = duration_ms
        self._notify(subagent_name, "completed", f"Completed in {duration_ms}ms", result)
        
        return result
    
    def _get_handler_for_skill(self, subagent_name: str, params: dict):
        """Get the appropriate handler for a skill."""
        # Note: constitution is NOT a subagent - it's extracted by orchestrator
        # and saved via ConstitutionHandler.save_output() directly
        if subagent_name == "storyline":
            from cliv2.skills.storyline_handler import StorylineHandler
            return StorylineHandler()  # No batching, generates all slides at once
        elif subagent_name == "layout":
            from cliv2.skills.layout_handler import LayoutHandler
            return LayoutHandler()
        elif subagent_name == "research":
            from cliv2.skills.research_handler import ResearchHandler
            return ResearchHandler()
        elif subagent_name == "theme":
            from cliv2.skills.theme_handler import ThemeHandler
            return ThemeHandler()
        elif subagent_name == "export":
            from cliv2.skills.export_handler import ExportHandler
            return ExportHandler()
        else:
            from cliv2.skills.base import SkillHandler
            return SkillHandler()  # Default handler
    
    async def _execute_mcp(self, params: dict) -> dict:
        """Execute an MCP tool."""
        tool = params.get("tool")
        
        if tool == "create_project":
            from cliv2.tools.mcp_client import call_create_project
            result = call_create_project(
                instruction=params.get("instruction", self.state.instruction),
            )
            
            if result.get("success"):
                self.state.project_dir = result.get("project_dir")
                self.state.project_id = result.get("project_id")
                self.state.project_created = True
                
                # Notify with project_id
                self._notify("mcp", "completed", f"Project created: {self.state.project_id}", {
                    "project_id": self.state.project_id,
                    "project_dir": self.state.project_dir,
                })
            
            return result
        
        elif tool == "write_constitution":
            # Write/update constitution.md via ConstitutionHandler
            if not self.state.project_dir:
                return {"error": "Project not created yet. Create project first."}
            
            content = params.get("content", "")
            if not content:
                return {"error": "No content provided for constitution"}
            
            from cliv2.skills.constitution_handler import ConstitutionHandler
            handler = ConstitutionHandler()
            result = handler.save_output(self.state.project_dir, content)
            
            if result.get("success"):
                self.state.constitution_done = True
                logger.info(f"[constitution] Saved to {self.state.project_dir}/constitution.md")
            
            return result
        
        elif tool == "copy_to_project":
            from cliv2.tools.mcp_client import call_copy_to_project
            file_path = params.get("file_path")
            dest_name = params.get("dest_name")
            purpose = params.get("purpose", "source")
            content = params.get("content")  # For writing user-provided text
            
            if not self.state.project_dir:
                return {"error": "Project not created yet. Create project first."}
            
            result = call_copy_to_project(
                project_dir=self.state.project_dir,
                file_path=file_path,
                dest_name=dest_name,
                purpose=purpose,
                content=content,
            )
            
            if result.get("success"):
                # Update the uploaded file record
                for f in self.state.uploaded_files:
                    if f.path == file_path:
                        f.purpose = purpose
                        f.copied_to = result.get("dest_path")
                        break
            
            return result
        
        elif tool == "export_mdx":
            from cliv2.tools.mcp_client import call_export_mdx
            result = call_export_mdx(
                project_dir=self.state.project_dir,
                renderer=self.state.renderer,
                start_server=True,
            )
            
            if result.get("success"):
                self.state.export_done = True
            
            return result
        
        else:
            return {"error": f"Unknown MCP tool: {tool}"}
    
    def _update_state_from_result(self, action: OrchestratorAction, result: dict):
        """Update session state based on result."""
        if action.subagent == "research":
            self.state.research_done = True
        
        elif action.subagent == "theme":
            self.state.theme_done = True
        
        elif action.subagent == "storyline":
            # Extract completed slide IDs
            completed_ids = result.get("completed_ids", [])
            is_complete = result.get("is_complete", True)
            
            logger.info(f"[storyline] Result: completed_ids={completed_ids}, is_complete={is_complete}")
            
            self.state.completed_slide_ids.extend(completed_ids)
            self.state.storyline_done = is_complete
            
            logger.info(f"[storyline] State updated: total_slides={len(self.state.completed_slide_ids)}, storyline_done={self.state.storyline_done}")
            
            # Queue layout batches for parallel execution (4 slides per batch)
            if completed_ids:
                batch_size = 4
                for i in range(0, len(completed_ids), batch_size):
                    batch = completed_ids[i:i + batch_size]
                    self.pending_layout_batches.append(batch)
                logger.info(f"[storyline] Created {len(self.pending_layout_batches)} layout batches")
        
        elif action.subagent == "layout":
            # Remove processed batch from pending
            slide_ids = action.params.get("slide_ids", [])
            if slide_ids in self.pending_layout_batches:
                self.pending_layout_batches.remove(slide_ids)
            
            # Check if all layouts done
            if not self.pending_layout_batches and self.state.storyline_done:
                self.state.layout_done = True
    
    async def _execute_parallel_layout_batches(self) -> dict:
        """Execute all pending layout batches in parallel.
        
        Returns:
            Combined result dict
        """
        if not self.pending_layout_batches:
            return {"error": "No pending layout batches"}
        
        batches = list(self.pending_layout_batches)  # Copy to avoid modification during iteration
        num_batches = len(batches)
        
        logger.info(f"[layout-parallel] Starting {num_batches} layout batches in parallel...")
        self._notify("layout", "running", f"Running {num_batches} layout batches in parallel...")
        
        start_time = datetime.now()
        
        # Create tasks for all batches
        async def execute_batch(batch_idx: int, slide_ids: list[str]):
            """Execute a single layout batch."""
            logger.info(f"[layout-parallel] Batch {batch_idx + 1}/{num_batches}: {slide_ids}")
            result = await self._execute_subagent("layout", {"slide_ids": slide_ids})
            return batch_idx, slide_ids, result
        
        # Run all batches in parallel
        tasks = [
            execute_batch(i, batch) 
            for i, batch in enumerate(batches)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Process results
        successful = 0
        failed = 0
        all_completed = []
        
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"[layout-parallel] Batch failed: {result}")
                failed += 1
            else:
                batch_idx, slide_ids, batch_result = result
                if batch_result.get("error"):
                    logger.error(f"[layout-parallel] Batch {batch_idx + 1} error: {batch_result['error']}")
                    failed += 1
                else:
                    successful += 1
                    all_completed.extend(batch_result.get("completed", []))
        
        # Clear pending batches
        self.pending_layout_batches.clear()
        self.state.layout_done = True
        
        logger.info(f"[layout-parallel] Completed: {successful}/{num_batches} batches, {len(all_completed)} slides in {duration_ms}ms")
        self._notify("layout", "completed", f"Parallel layout complete: {len(all_completed)} slides in {duration_ms}ms")
        
        return {
            "success": failed == 0,
            "batches_total": num_batches,
            "batches_successful": successful,
            "batches_failed": failed,
            "completed_slides": all_completed,
            "duration_ms": duration_ms,
            "parallel": True,
        }
    
    async def _execute_storyline_with_overlapped_layout(self, params: dict) -> dict:
        """Execute storyline with layout batches starting as slides become ready.
        
        This overlaps storyline generation with layout batches:
        1. Storyline streams and saves each slide to content.json
        2. As batches of 4 slides complete, layout batches start in parallel
        3. Layout batches run concurrently with continued storyline generation
        4. Final coordination when storyline completes
        
        Returns:
            Combined result dict
        """
        from cliv2.skills.storyline_handler import StorylineHandler
        from cliv2.skills.layout_handler import LayoutHandler
        from cliv2.tools.mcp_client import call_apply_patch
        
        start_time = datetime.now()
        batch_size = 4
        
        # Track state
        slides_completed = []  # slides with storyline done
        slides_layout_started = set()  # slides sent to layout
        layout_tasks = []  # active layout asyncio tasks
        layout_results = []  # results from completed layout batches
        
        # Create storyline handler - it loads its own context
        storyline_handler = StorylineHandler()
        storyline_context = storyline_handler.load_context(
            project_dir=self.state.project_dir or "",
            user_instruction=self.state.instruction,
            target_indices=[],
            task_params=params,
        )
        
        if not storyline_context.research:
            logger.warning("[storyline] research.md not found or empty - storyline may generate generic content!")
        else:
            logger.info(f"[storyline] Loaded research.md ({len(storyline_context.research)} chars)")
        
        # Helper to start a layout batch
        async def start_layout_batch(slide_ids: list[str], batch_num: int):
            """Start a layout batch for the given slides."""
            logger.info(f"[overlapped] Starting layout batch {batch_num}: {slide_ids}")
            self._notify("layout", "running", f"Layout batch {batch_num}: {slide_ids}")
            
            # Layout handler loads its own context (re-reads to get updated slides)
            layout_handler = LayoutHandler()
            layout_context = layout_handler.load_context(
                project_dir=self.state.project_dir or "",
                user_instruction=self.state.instruction,
                target_indices=[int(sid.replace("slide_", "")) for sid in slide_ids],
                task_params={"slide_ids": slide_ids},
            )
            
            # Define callback for layout streaming
            def on_layout_complete(slide_id: str, jsx_content: str):
                if self.state.project_dir:
                    mdx = f"---\nid: {slide_id}\n---\n{jsx_content}"
                    try:
                        call_apply_patch(
                            project_dir=self.state.project_dir,
                            target="slides",
                            data=mdx,
                        )
                        logger.info(f"[layout-{batch_num}] Applied patch for {slide_id}")
                    except Exception as e:
                        logger.error(f"[layout-{batch_num}] Failed to apply patch for {slide_id}: {e}")
            
            result = await layout_handler.execute_streaming(
                layout_context, self.llm, logger, on_layout_complete
            )
            result["batch_num"] = batch_num
            result["slide_ids"] = slide_ids
            return result
        
        # Storyline callback - track completed slides and trigger layout batches
        batch_counter = [0]  # Use list to allow mutation in closure
        
        def on_storyline_slide_complete(slide_id: str, slide_mdx: str):
            """Apply patch and potentially trigger layout batch."""
            nonlocal slides_completed
            
            # Apply storyline patch
            if self.state.project_dir:
                try:
                    call_apply_patch(
                        project_dir=self.state.project_dir,
                        target="slides",
                        data=slide_mdx,
                    )
                    logger.info(f"[storyline] Applied patch for {slide_id}")
                except Exception as e:
                    logger.error(f"[storyline] Failed to apply patch for {slide_id}: {e}")
                    return
            
            slides_completed.append(slide_id)
            
            # Check if we have enough slides for a new batch
            slides_not_in_layout = [s for s in slides_completed if s not in slides_layout_started]
            if len(slides_not_in_layout) >= batch_size:
                # Take next batch
                batch = slides_not_in_layout[:batch_size]
                for sid in batch:
                    slides_layout_started.add(sid)
                
                batch_counter[0] += 1
                batch_num = batch_counter[0]
                
                # Schedule layout batch (will run concurrently)
                task = asyncio.create_task(start_layout_batch(batch, batch_num))
                layout_tasks.append(task)
                logger.info(f"[overlapped] Triggered layout batch {batch_num} while storyline continues")
        
        # Execute storyline with streaming
        logger.info("[overlapped] Starting storyline with overlapped layout...")
        self._notify("storyline", "running", "Storyline + overlapped layout starting...")
        
        from cliv2.core.subagent import Subagent
        subagent = Subagent("storyline", self.llm)
        
        storyline_start = datetime.now()
        storyline_result = await storyline_handler.execute_streaming(
            storyline_context, self.llm, logger, on_storyline_slide_complete
        )
        storyline_duration = int((datetime.now() - storyline_start).total_seconds() * 1000)
        
        self._notify("storyline", "completed", f"Storyline complete in {storyline_duration}ms")
        logger.info(f"[overlapped] Storyline complete: {len(slides_completed)} slides in {storyline_duration}ms")
        
        # Handle remaining slides that didn't form a full batch
        slides_not_in_layout = [s for s in slides_completed if s not in slides_layout_started]
        if slides_not_in_layout:
            batch_counter[0] += 1
            batch_num = batch_counter[0]
            for sid in slides_not_in_layout:
                slides_layout_started.add(sid)
            task = asyncio.create_task(start_layout_batch(slides_not_in_layout, batch_num))
            layout_tasks.append(task)
            logger.info(f"[overlapped] Triggered final layout batch {batch_num} with {len(slides_not_in_layout)} slides")
        
        # Wait for all layout tasks to complete
        if layout_tasks:
            logger.info(f"[overlapped] Waiting for {len(layout_tasks)} layout batches to complete...")
            layout_results = await asyncio.gather(*layout_tasks, return_exceptions=True)
        
        total_duration = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Process results
        layout_completed = []
        layout_failed = 0
        for result in layout_results:
            if isinstance(result, Exception):
                logger.error(f"[overlapped] Layout batch failed: {result}")
                layout_failed += 1
            elif result.get("error"):
                logger.error(f"[overlapped] Layout batch error: {result['error']}")
                layout_failed += 1
            else:
                layout_completed.extend(result.get("completed", []))
        
        # Update state
        self.state.completed_slide_ids = slides_completed
        self.state.storyline_done = True
        self.state.layout_done = True
        
        logger.info(f"[overlapped] Complete: {len(slides_completed)} storyline, {len(layout_completed)} layout in {total_duration}ms")
        self._notify("layout", "completed", f"Overlapped complete: {len(layout_completed)} slides in {total_duration}ms")
        
        return {
            "success": layout_failed == 0,
            "storyline_slides": len(slides_completed),
            "layout_slides": len(layout_completed),
            "layout_batches": len(layout_tasks),
            "layout_failed": layout_failed,
            "storyline_duration_ms": storyline_duration,
            "total_duration_ms": total_duration,
            "overlapped": True,
            "completed_ids": slides_completed,
            "is_complete": storyline_result.get("is_complete", True),
        }

    async def chat(
        self,
        message: str,
        files: Optional[list[dict]] = None,
        **kwargs,
    ) -> dict:
        """Process a chat message with optional file uploads.
        
        This is the main conversational interface. Can be called multiple times
        to continue the conversation and update slides.
        
        Args:
            message: User message/instruction
            files: List of files [{"path": str, "name": str}, ...]
            **kwargs: Options (skip_search, renderer, etc.)
            
        Returns:
            Result dict with project info and status
        """
        # Update state from kwargs (only on first call or if explicitly set)
        if "project_dir" in kwargs and kwargs["project_dir"]:
            self.state.project_dir = kwargs["project_dir"]
            self.state.project_id = Path(kwargs["project_dir"]).name
            # No need to load state - _build_state_context reads from content.json
                
        if "renderer" in kwargs:
            self.state.renderer = kwargs["renderer"]
        
        # Handle skip_search: only append rule when value CHANGES
        if "skip_search" in kwargs:
            new_value = kwargs["skip_search"]
            if new_value != self.state.skip_search:
                # Value changed - append rule to update constitution.md
                if new_value:
                    message = f"{message}\n\n[RULE: NO WEB SEARCH] Do not perform web searches. Use only the provided source content."
                else:
                    message = f"{message}\n\n[RULE: DO WEB SEARCH] Perform web searches to find citations, statistics, and external data."
                self.state.skip_search = new_value
        
        # Track new files
        new_files = []
        if files:
            for f in files:
                file_path = f.get("path", "")
                file_name = f.get("name", Path(file_path).name if file_path else "unknown")
                file_type = Path(file_name).suffix.lower().lstrip(".")
                
                # Check if file already tracked
                existing = next((x for x in self.state.uploaded_files if x.path == file_path), None)
                if not existing:
                    uploaded = UploadedFile(
                        path=file_path,
                        name=file_name,
                        type=file_type,
                    )
                    self.state.uploaded_files.append(uploaded)
                    new_files.append(uploaded)
        
        # Add system prompt if first message
        if not self.messages:
            self._add_system_prompt()
        
        # Clear pending question if user is responding
        if self.state.pending_question:
            self.state.pending_question = None
        
        # Build user message with file info
        user_msg_parts = [message]
        if new_files:
            user_msg_parts.append("\nNew files uploaded:")
            for f in new_files:
                user_msg_parts.append(f"  - {f.name} ({f.type}): {f.path}")
        
        # Add current state
        user_msg_parts.append(f"\n{self._build_state_context()}")
        
        self._add_user_message("\n".join(user_msg_parts))
        self._notify("pipeline", "running", "Processing your request...")
        
        # Run orchestration loop
        return await self._run_orchestration_loop()
    
    async def _run_orchestration_loop(self, max_iterations: int = 50) -> dict:
        """Run the main orchestration loop.
        
        Args:
            max_iterations: Safety limit for iterations
            
        Returns:
            Result dict
        """
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            
            try:
                # Get next action(s) from LLM - may return multiple batched actions
                actions = await self._get_next_actions()
                
                for action_idx, action in enumerate(actions):
                    action_num = f"{iteration}.{action_idx+1}" if len(actions) > 1 else str(iteration)
                    logger.info(f"[orchestrator] Action {action_num}: {action.action} - {action.reasoning}")
                    
                    if action.action == ACTION_DONE:
                        self._notify("pipeline", "completed", "Generation complete!")
                        # Return immediately when done
                        return {
                            "project_dir": self.state.project_dir,
                            "project_id": self.state.project_id,
                            "completed_slides": self.state.completed_slide_ids,
                            "success": self.state.export_done,
                            "iterations": iteration,
                            "waiting_for_input": False,
                            "question": None,
                        }
                    
                    elif action.action == ACTION_WAIT_USER:
                        self._notify("pipeline", "waiting", action.reasoning or "Waiting for user input...")
                        # Store the question for the UI to display
                        self.state.pending_question = action.reasoning
                        # Return immediately when waiting
                        return {
                            "project_dir": self.state.project_dir,
                            "project_id": self.state.project_id,
                            "completed_slides": self.state.completed_slide_ids,
                            "success": self.state.export_done,
                            "iterations": iteration,
                            "waiting_for_input": True,
                            "question": action.reasoning,
                        }
                    
                    elif action.action == ACTION_CALL_SUBAGENT:
                        self._notify(action.subagent, "running", f"Calling {action.subagent}...")
                        
                        # Use overlapped storyline + layout execution
                        if action.subagent == "storyline":
                            result = await self._execute_storyline_with_overlapped_layout(action.params)
                            self._add_result_to_context("overlapped_storyline_layout", result)
                        else:
                            result = await self._execute_subagent(action.subagent, action.params)
                            self._add_result_to_context(f"subagent:{action.subagent}", result)
                            self._update_state_from_result(action, result)
                    
                    elif action.action == ACTION_CALL_MCP:
                        tool = action.params.get("tool", "unknown")
                        self._notify("mcp", "running", f"Calling MCP tool: {tool}...")
                        result = await self._execute_mcp(action.params)
                        self._add_result_to_context(f"mcp:{tool}", result)
                    
                    else:
                        logger.warning(f"Unknown action: {action.action}")
            
            except Exception as e:
                logger.error(f"Error in orchestration loop: {e}")
                self._add_user_message(f"Error occurred: {e}\nPlease decide how to proceed.")
        
        # Return final result
        return {
            "project_dir": self.state.project_dir,
            "project_id": self.state.project_id,
            "completed_slides": self.state.completed_slide_ids,
            "success": self.state.export_done,
            "iterations": iteration,
            "waiting_for_input": bool(getattr(self.state, 'pending_question', None)),
            "question": getattr(self.state, 'pending_question', None),
        }

    async def run(self, source_path: str = "", instruction: str = "", **kwargs) -> dict:
        """Run the orchestrator session (legacy interface).
        
        This is a compatibility wrapper around chat(). For new code, use chat() directly.
        
        Args:
            source_path: Path to source file (optional)
            instruction: User instruction
            **kwargs: Additional options (skip_search, renderer, etc.)
            
        Returns:
            Result dict with project info and status
        """
        # Build files list from source_path
        files = []
        if source_path:
            files.append({
                "path": source_path,
                "name": Path(source_path).name,
            })
        
        # Use chat() method
        return await self.chat(
            message=instruction or "Generate slides from the uploaded file.",
            files=files if files else None,
            **kwargs,
        )

    async def continue_with(self, user_message: str, files: Optional[list[dict]] = None) -> dict:
        """Continue the session with a new user message.
        
        Use this for follow-up instructions like "fix slide 3".
        
        Args:
            user_message: New user instruction
            files: Optional new files to upload
            
        Returns:
            Result dict
        """
        return await self.chat(message=user_message, files=files)


async def run_orchestrator_session(
    source_path: str = "",
    instruction: str = "",
    files: Optional[list[dict]] = None,
    llm: Optional[Any] = None,
    progress_callback: Optional[Callable] = None,
    verbose: bool = False,
    **kwargs,
) -> dict:
    """Convenience function to run a single orchestrator session.
    
    Args:
        source_path: Path to source file (legacy, use files instead)
        instruction: User instruction
        files: List of files [{"path": str, "name": str}, ...]
        llm: LLM wrapper (created if not provided)
        progress_callback: Optional progress callback
        verbose: Enable verbose logging
        **kwargs: Additional options
        
    Returns:
        Result dict
    """
    if llm is None:
        logger.info("[init] Creating LLM client...")
        init_start = datetime.now()
        from cliv2.config.llm import create_llm
        llm = create_llm()
        init_duration = (datetime.now() - init_start).total_seconds()
        logger.info(f"[init] LLM client ready ({init_duration:.1f}s)")
    
    session = OrchestratorSession(llm, progress_callback, verbose)
    
    # Build files list - support both legacy source_path and new files param
    all_files = files or []
    if source_path and not any(f.get("path") == source_path for f in all_files):
        all_files.append({
            "path": source_path,
            "name": Path(source_path).name,
        })
    
    return await session.chat(
        message=instruction or "Generate slides from the uploaded files.",
        files=all_files if all_files else None,
        **kwargs,
    )
