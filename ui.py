"""Gradio UI to run the UCE pipeline in 7 explicit steps.

Steps:
  1) planner
  2) constitution
  3) atoms
  4) theme
  5) story
  6) content
  7) export

Requirements covered:
  1) Each step has a button to execute.
  2) If step involves LLM: show predefined prompts after Initialize and show LLM response after execution.
  3) If step does not involve LLM: show result only.
  4) Export: show produced files + a button to preview the MDX PPT (React renderer link).

Run:
  ./.venv/bin/python ui.py
"""

from __future__ import annotations

import io
import json
import os
import re
import shutil
import html as _html
import socket
import subprocess
import threading
import time
from urllib.parse import quote
from contextlib import redirect_stderr, redirect_stdout
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import gradio as gr

from src.generation.state import PipelineState
from src.generation.todo.executor import TodoExecutor
from src.generation.todo.models import TodoType
from src.generation.todo.planner import plan
from src.generation.theme.prompts import get_theme_creation_config


_COMPONENT_FILE_INDEX: Optional[Dict[str, Path]] = None


def _build_component_file_index() -> Dict[str, Path]:
    """Best-effort mapping of ComponentName -> .tsx file path."""
    repo_root = Path(__file__).resolve().parent
    roots = [
        repo_root / "src" / "paged" / "render" / "react" / "library",
        repo_root / "src" / "paged" / "render" / "react" / "components",
        repo_root / "src" / "paged" / "render" / "react",
    ]

    candidates: Dict[str, List[Path]] = {}
    for root in roots:
        if not root.exists():
            continue
        for p in root.rglob("*.tsx"):
            candidates.setdefault(p.stem, []).append(p)

    out: Dict[str, Path] = {}
    for name, paths in candidates.items():
        # Prefer shortest path; this tends to pick library components over tests.
        out[name] = sorted(paths, key=lambda p: (len(str(p)), str(p)))[0]
    return out


def _get_component_file_index() -> Dict[str, Path]:
    global _COMPONENT_FILE_INDEX
    if _COMPONENT_FILE_INDEX is None:
        _COMPONENT_FILE_INDEX = _build_component_file_index()
    return _COMPONENT_FILE_INDEX


def _get_component_source_html(component_name: str) -> str:
    name = (component_name or "").strip()
    if not name:
        return "<h3>Missing component name</h3>"

    idx = _get_component_file_index()
    path = idx.get(name)
    if not path or not path.exists():
        return f"<h3>Component not found: {_html.escape(name)}</h3>"

    try:
        rel = path.resolve().relative_to(Path(__file__).resolve().parent)
        rel_str = str(rel)
    except Exception:
        rel_str = str(path)

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        return f"<h3>Failed to read: {_html.escape(rel_str)}</h3><pre>{_html.escape(str(e))}</pre>"

    return (
        "<html><head><meta charset='utf-8'/>"
        "<title>" + _html.escape(name) + "</title>"
        "<style>body{font-family:ui-sans-serif,system-ui,-apple-system; padding:16px;}"
        "pre{white-space:pre; overflow:auto; background:#111827; color:#e5e7eb; padding:12px; border-radius:8px;}"
        "code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; font-size:12px;}"
        "</style></head><body>"
        "<h2>" + _html.escape(name) + "</h2>"
        "<div style='opacity:0.8;margin-bottom:12px'>" + _html.escape(rel_str) + "</div>"
        "<pre><code>" + _html.escape(content) + "</code></pre>"
        "</body></html>"
    )


def _get_component_preview_html(component_name: str, run_id: Optional[str] = None) -> str:
    """Generate HTML page that renders a React component preview via the Next.js dev server."""
    name = (component_name or "").strip()
    if not name:
        return "<h3>Missing component name</h3>"

    idx = _get_component_file_index()
    path = idx.get(name)
    if not path or not path.exists():
        return f"<h3>Component not found: {_html.escape(name)}</h3><p>Make sure the codegen step has completed and saved the component.</p>"

    try:
        rel = path.resolve().relative_to(Path(__file__).resolve().parent)
        rel_str = str(rel)
    except Exception:
        rel_str = str(path)

    # Read the component source for display
    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        content = f"(failed to read: {e})"

    # URL-encode parameters
    name_encoded = quote(name)
    
    # Construct iframe src
    iframe_src = f"http://127.0.0.1:3000/preview/component?name={name_encoded}"
    if run_id:
        iframe_src += f"&path={quote(run_id)}"

    # Generate an HTML page with:
    # 1. An iframe pointing to the React dev server's component preview route
    # 2. The component source code below for reference
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Preview: {_html.escape(name)}</title>
    <style>
        body {{
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 16px;
            background: #0f172a;
            color: #e5e7eb;
        }}
        h2 {{
            margin-top: 0;
            color: #f9fafb;
        }}
        .path {{
            opacity: 0.6;
            margin-bottom: 16px;
            font-size: 14px;
        }}
        .preview-container {{
            border: 1px solid #374151;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 24px;
            background: #ffffff;
        }}
        .preview-header {{
            background: #1f2937;
            padding: 8px 12px;
            font-size: 13px;
            color: #9ca3af;
            border-bottom: 1px solid #374151;
        }}
        .preview-frame {{
            width: 100%;
            height: 400px;
            border: none;
            background: #ffffff;
        }}
        .error-message {{
            padding: 24px;
            text-align: center;
            color: #f87171;
        }}
        .source-section {{
            margin-top: 24px;
        }}
        .source-header {{
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #9ca3af;
        }}
        pre {{
            white-space: pre;
            overflow: auto;
            background: #111827;
            color: #e5e7eb;
            padding: 12px;
            border-radius: 8px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            max-height: 400px;
        }}
        .btn {{
            display: inline-block;
            padding: 6px 16px;
            margin-right: 8px;
            border: 1px solid #374151;
            border-radius: 4px;
            background: #374151;
            color: #e5e7eb;
            font-size: 13px;
            cursor: pointer;
            text-decoration: none;
        }}
        .btn:hover {{
            background: #4b5563;
        }}
    </style>
</head>
<body>
    <h2>🔍 Component Preview: {_html.escape(name)}</h2>
    <div class="path">{_html.escape(rel_str)}</div>
    
    <div class="preview-container">
        <div class="preview-header">
            Live Preview (via React Dev Server at port 3000)
        </div>
        <iframe 
            id="preview-frame"
            class="preview-frame" 
            src="{iframe_src}"
            onerror="handleFrameError()"
        ></iframe>
    </div>
    
    <div style="margin-bottom: 16px;">
        <a class="btn" href="{iframe_src}" target="_blank">Open in New Tab</a>
        <a class="btn" href="/component?name={name_encoded}" target="_blank">View Source</a>
    </div>
    
    <div class="source-section">
        <div class="source-header">Component Source</div>
        <pre><code>{_html.escape(content)}</code></pre>
    </div>
    
    <script>
        // Check if the preview iframe loaded correctly
        const frame = document.getElementById('preview-frame');
        frame.addEventListener('error', function() {{
            frame.style.display = 'none';
            const container = frame.parentElement;
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = 'Failed to load preview. Make sure the React dev server is running on port 3000.<br><br>' +
                '<a class="btn" href="{iframe_src}" target="_blank">Try Opening Directly</a>';
            container.appendChild(errorDiv);
        }});
        
        // Timeout fallback - if no content after 5s, show message
        setTimeout(function() {{
            try {{
                // Can't access cross-origin content, but we can check if src loaded
                if (frame.contentWindow.location.href === 'about:blank') {{
                    throw new Error('blank');
                }}
            }} catch(e) {{
                // Expected for cross-origin, that's fine
            }}
        }}, 5000);
    </script>
</body>
</html>"""


UI_CSS = """
/* Force prompt/code panes to stay compact and scroll */
.code-fixed .ace_editor { height: 220px !important; }
.code-fixed { max-height: 240px; overflow: auto; }

/* Dark background for selected file path field */
.path-dark input,
.path-dark textarea {
    background: #111827 !important;
    color: #f9fafb !important;
}

/* (Source file section uses standard Gradio layout; only input is darkened) */

/* Tiny timer inline next to Run button */
#planner_timer,
#atoms_timer,
#theme_timer,
#story_timer,
#content_timer {
    font-size: 12px;
    opacity: 0.65;
    padding-top: 6px;
    white-space: nowrap;
}

#planner_timer > div,
#atoms_timer > div,
#theme_timer > div,
#story_timer > div,
#content_timer > div {
    margin: 0 !important;
    padding: 0 !important;
}
"""


Session = Dict[str, object]


@dataclass
class OutputFiles:
    state_json: Optional[Path]
    slides_mdx: Optional[Path]
    pptx_files: List[Path]
    html_files: List[Path]


def _theme_change_summary(before: PipelineState, after: PipelineState) -> str:
    before_active = getattr(before, "active_theme", None)
    after_active = getattr(after, "active_theme", None)
    before_count = len(getattr(before, "themes", None) or {})
    after_count = len(getattr(after, "themes", None) or {})

    lines: List[str] = []
    if before_active != after_active:
        lines.append(f"active_theme: {before_active or '(none)'} → {after_active or '(none)'}")
    else:
        lines.append(f"active_theme: {after_active or '(none)'}")

    if before_count != after_count:
        lines.append(f"themes: {before_count} → {after_count}")

    if after_active and (getattr(after, "themes", None) or {}).get(after_active):
        t = after.themes.get(after_active) or {}
        name = (t.get("name") or "").strip()
        desc = (t.get("description") or "").strip()
        if name:
            lines.append(f"name: {name}")
        if desc:
            lines.append(f"description: {desc}")

    return "\n".join([l for l in lines if l.strip()]).strip() or "(no theme changes detected)"


def _theme_summary_from_state(state: PipelineState) -> str:
    active = getattr(state, "active_theme", None)
    themes = getattr(state, "themes", None) or {}
    lines: List[str] = [f"active_theme: {active or '(none)'}", f"themes: {len(themes)}"]
    if active and themes.get(active):
        t = themes.get(active) or {}
        name = (t.get("name") or "").strip()
        desc = (t.get("description") or "").strip()
        if name:
            lines.append(f"name: {name}")
        if desc:
            lines.append(f"description: {desc}")
    return "\n".join(lines).strip()


def _read_all_trace(trace_path: Path) -> List[dict]:
    if not trace_path.exists():
        return []
    records: List[dict] = []
    try:
        for line in trace_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except Exception:
                continue
    except Exception:
        return []
    return records


def export_progress(
    session: Session,
    planner_sys: str,
    planner_user: str,
    atoms_sys: str,
    atoms_user: str,
    theme_sys: str,
    theme_user: str,
    story_sys: str,
    story_user: str,
    content_sys: str,
    content_user: str,
    codegen_sys: str,
    codegen_user: str,
) -> Tuple[Session, object, str]:
    """Export current progress to a JSON file and return it for download."""
    session = _ensure_session(session)
    if not session.get("output_dir"):
        return session, gr.update(value=None, visible=False), ""

    output_dir, state_path, trace_path = _session_paths(session)
    if not state_path.exists():
        return session, gr.update(value=None, visible=False), ""

    try:
        state_json = json.loads(state_path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        return session, gr.update(value=None, visible=False), ""

    payload = {
        "version": 1,
        "exported_at": datetime.now().isoformat(),
        "session": {
            "output_dir": str(output_dir),
            "instruction": str(session.get("instruction", "")),
            "use_cache": bool(session.get("use_cache", True)),
            "project": str(state_json.get("project") or ""),
            "active_theme": str(state_json.get("active_theme_id") or state_json.get("active_theme") or ""),
        },
        "state": state_json,
        "prompts": {
            "planner": {"system": planner_sys or "", "user": planner_user or ""},
            "atoms": {"system": atoms_sys or "", "user": atoms_user or ""},
            "theme": {"system": theme_sys or "", "user": theme_user or ""},
            "story": {"system": story_sys or "", "user": story_user or ""},
            "content": {"system": content_sys or "", "user": content_user or ""},
            "codegen": {"system": codegen_sys or "", "user": codegen_user or ""},
        },
        "llm_trace": _read_all_trace(trace_path),
    }

    out_path = output_dir / f"UCE Pipeline_progress_{_now_id()}.json"
    try:
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:  # noqa: BLE001
        return session, gr.update(value=None, visible=False), ""

    # Note: browsers generally require a user click to download.
    return session, gr.update(value=str(out_path), visible=True), _now_id()


def import_progress(progress_file):
    """Import a progress JSON file and restore session + UI fields.
    
    Supports two formats:
    1. Progress JSON (exported by export_progress): contains state, session, prompts, llm_trace
    2. State JSON (state.json directly): contains slides, atoms, themes, etc.
    """
    def _empty(msg: str):
        empty_session: Session = {}
        return (
            empty_session,
            "",  # source_name
            "",  # instruction_text
            "",  # output_name
            "react-mdx",  # project
            "business",  # active_theme
            True,  # use_cache
            "",  # planner sys
            "",  # planner user
            "",  # atoms sys
            "",  # atoms user
            "",  # theme sys
            "",  # theme user
            "",  # story sys
            "",  # story user
            "",  # content sys
            "",  # content user
            "",  # codegen sys
            "",  # codegen user
            "",  # constitution_result
            "",  # planner_sent
            "",  # planner_resp
            "",  # atoms_sent
            "",  # atoms_resp
            [],  # atoms_table
            gr.update(value="", visible=False),  # theme_result
            gr.update(value="", visible=True),  # theme_sent
            gr.update(value="", visible=True),  # theme_resp
            "",  # story_sent
            "",  # story_resp
            "",  # story_slides_display
            "",  # content_sent
            "",  # content_resp
        )
    if progress_file is None:
        return _empty("")

    path = Path(getattr(progress_file, "name", "") or str(progress_file))
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        return _empty("")

    # Detect format: Progress JSON has "state" key, State JSON has "slides" or "atoms" keys
    is_state_json = "slides" in payload or "atoms" in payload or "source" in payload
    
    if is_state_json:
        # Direct state.json format - wrap it in progress format
        state_json = payload
        # Try to infer output_dir from source path or generate a unique name
        source_info = payload.get("source", {})
        source_file_path = source_info.get("path", "") if isinstance(source_info, dict) else ""
        if source_file_path:
            # Use a directory name based on source file
            source_name = Path(source_file_path).stem
            out_dir = Path(f"output/{source_name}_imported_{_now_id()}")
        else:
            # Generate a unique output directory
            out_dir = Path(f"output/imported_{_now_id()}")
        sess = {
            "output_dir": str(out_dir),
            "instruction": "",
            "use_cache": True,
            "project": payload.get("project", "react-mdx"),
            "active_theme": payload.get("active_theme_id", "business"),
        }
        # No prompts or trace in state.json
        prompts = {}
        llm_trace = []
    else:
        # Progress JSON format (original)
        state_json = payload.get("state") or {}
        sess = payload.get("session") or {}
        prompts = payload.get("prompts") or {}
        llm_trace = payload.get("llm_trace") or []
    out_dir = Path(str(sess.get("output_dir") or state_json.get("output_dir") or "output/imported"))
    out_dir.mkdir(parents=True, exist_ok=True)

    state_path = out_dir / "state.json"
    try:
        state_path.write_text(json.dumps(state_json, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:  # noqa: BLE001
        return _empty("")

    trace_path = out_dir / "llm_trace.jsonl"
    if isinstance(llm_trace, list) and llm_trace:
        try:
            trace_path.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in llm_trace) + "\n", encoding="utf-8")
        except Exception:
            pass

    instruction = str(sess.get("instruction") or "")
    use_cache = bool(sess.get("use_cache", True))
    project = str(sess.get("project") or state_json.get("project") or "react-mdx")
    
    # Validate active_theme against available dropdown choices
    VALID_THEME_CHOICES = {"base", "business", "cyber", "minimal", "academic", "creative", "duolingo", "dark"}
    raw_theme = str(sess.get("active_theme") or state_json.get("active_theme_id") or state_json.get("active_theme") or "")
    active_theme = raw_theme if raw_theme in VALID_THEME_CHOICES else None

    # Restore prompts from imported file
    def _p(step: str, k: str) -> str:
        v = (prompts.get(step) or {}).get(k)
        return str(v or "")

    planner_sys = _p("planner", "system")
    planner_user = _p("planner", "user")
    atoms_sys = _p("atoms", "system")
    atoms_user = _p("atoms", "user")
    theme_sys = _p("theme", "system")
    theme_user = _p("theme", "user")
    story_sys = _p("story", "system")
    story_user = _p("story", "user")
    content_sys = _p("content", "system")
    content_user = _p("content", "user")
    codegen_sys = _p("codegen", "system")
    codegen_user = _p("codegen", "user")

    # Restore step outputs from state/trace
    state = PipelineState.load(state_path)
    source_path = ""
    try:
        if state.source and getattr(state.source, "path", None):
            source_path = str(state.source.path)
    except Exception:
        source_path = ""

    all_records = _read_all_trace(trace_path)
    def _sr(step: str) -> List[dict]:
        return _filter_records_for_step(all_records, step)

    planner_sent = _format_llm_sent(_sr("planner"))
    planner_resp = _format_llm_response(_sr("planner"))
    atoms_sent = _format_llm_sent(_sr("atoms"))
    atoms_resp = _format_llm_response(_sr("atoms"))
    atoms_table = _parse_atoms_table(atoms_resp)
    theme_sent = _format_llm_sent(_sr("theme"))
    theme_resp = _format_llm_response(_sr("theme"))
    story_sent = _format_llm_sent(_sr("story"))
    story_resp = _format_llm_response(_sr("story"))
    content_sent = _format_llm_sent(_sr("content"))
    content_resp = _format_llm_response(_sr("content"))

    theme_used_llm = bool((theme_sent or "").strip() or (theme_resp or "").strip())
    theme_result_update = gr.update(value="", visible=False)
    theme_sent_update = gr.update(value=theme_sent, visible=True)
    theme_resp_update = gr.update(value=theme_resp, visible=True)
    if not theme_used_llm:
        theme_result_update = gr.update(value=_theme_summary_from_state(state), visible=True)
        theme_sent_update = gr.update(value="", visible=False)
        theme_resp_update = gr.update(value="", visible=False)

    session: Session = {
        "output_dir": str(out_dir),
        "instruction": instruction,
        "use_cache": bool(use_cache),
        "trace_pos": 0,
    }

    # Render slides table from state.json (canonical source of truth)
    story_slides_display = _render_slides_from_state(session)

    return (
        session,
        source_path,
        instruction,
        str(out_dir.name),
        project,
        active_theme,
        bool(use_cache),
        planner_sys,
        planner_user,
        atoms_sys,
        atoms_user,
        theme_sys,
        theme_user,
        story_sys,
        story_user,
        content_sys,
        content_user,
        codegen_sys,
        codegen_user,
        _constitution_text(state),
        planner_sent,
        planner_resp,
        atoms_sent,
        atoms_resp,
        atoms_table,
        theme_result_update,
        theme_sent_update,
        theme_resp_update,
        story_sent,
        story_resp,
        story_slides_display,
        content_sent,
        content_resp,
    )

def _now_id() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _ensure_session(session: Optional[Session]) -> Session:
    return session or {}


def _session_paths(session: Session) -> Tuple[Path, Path, Path]:
    output_dir = Path(str(session["output_dir"]))
    state_path = output_dir / "state.json"
    trace_path = output_dir / "llm_trace.jsonl"
    return output_dir, state_path, trace_path


def _read_instruction_file(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def _collect_outputs(output_dir: Path) -> OutputFiles:
    state_json = output_dir / "state.json"
    slides_mdx = output_dir / "slides.mdx"
    pptx_files = sorted(output_dir.glob("**/*.pptx"))
    html_files = sorted(output_dir.glob("**/*.html"))
    return OutputFiles(
        state_json=state_json if state_json.exists() else None,
        slides_mdx=slides_mdx if slides_mdx.exists() else None,
        pptx_files=pptx_files,
        html_files=html_files,
    )


def _as_downloadable_files(files: OutputFiles) -> List[str]:
    result = []
    if files.state_json:
        result.append(str(files.state_json))
    if files.slides_mdx:
        result.append(str(files.slides_mdx))
    result.extend(str(p) for p in files.pptx_files)
    result.extend(str(p) for p in files.html_files)
    return result


def _read_mdx_preview(output_dir: Path, max_chars: int = 12000) -> str:
    mdx = output_dir / "slides.mdx"
    if not mdx.exists():
        return "(no slides.mdx)"
    text = mdx.read_text(encoding="utf-8")
    if len(text) > max_chars:
        return text[:max_chars] + "\n\n... (truncated)"
    return text


def _read_new_trace(trace_path: Path, from_pos: int) -> Tuple[int, List[dict]]:
    if not trace_path.exists():
        return from_pos, []
    try:
        with trace_path.open("r", encoding="utf-8") as f:
            f.seek(from_pos)
            chunk = f.read()
            new_pos = f.tell()
        records: List[dict] = []
        for line in chunk.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except Exception:
                continue
        return new_pos, records
    except Exception:
        return from_pos, []


def _filter_records_for_step(records: List[dict], step: str) -> List[dict]:
    """Filter records to only those matching the given step name."""
    return [r for r in records if r.get("step") == step]


def _format_llm_sent(records: List[dict]) -> str:
    if not records:
        return ""
    parts = []
    for r in records:
        sys_p = r.get("system_prompt", "")
        user_p = r.get("user_prompt", "")
        if sys_p or user_p:
            parts.append(f"# System\n{sys_p}\n\n# User\n{user_p}".strip())
    return "\n\n---\n\n".join(filter(str.strip, parts))


def _format_llm_response(records: List[dict]) -> str:
    if not records:
        return ""
    parts = [str(r["response"]).strip() for r in records if r.get("response")]
    return "\n\n---\n\n".join(parts)


def _format_codegen_concurrent_sent(records: List[dict]) -> str:
    """Format concurrent codegen calls - each component in its own box."""
    if not records:
        return ""
    
    # Group by component_id
    by_component: Dict[str, List[dict]] = {}
    for r in records:
        comp_id = r.get("component_id", "default")
        if comp_id not in by_component:
            by_component[comp_id] = []
        by_component[comp_id].append(r)
    
    # Format each component's calls
    html_parts: List[str] = []
    
    # Style for the boxes
    box_style = (
        "border: 1px solid #374151; "
        "border-radius: 8px; "
        "padding: 12px; "
        "margin-bottom: 12px; "
        "background-color: #1f2937; "
        "color: #e5e7eb; "
        "font-family: monospace; "
        "white-space: pre-wrap;"
    )
    
    header_style = "font-weight: bold; color: #60a5fa; margin-bottom: 8px; border-bottom: 1px solid #374151; padding-bottom: 4px;"
    
    for comp_id in sorted(by_component.keys()):
        comp_records = by_component[comp_id]
        if not comp_records:
            continue
        
        # Get the latest sent record for this component
        sent_record = None
        for r in reversed(comp_records):
            if r.get("event") == "sent":
                sent_record = r
                break
        
        if sent_record:
            sys_p = sent_record.get("system_prompt", "")
            user_p = sent_record.get("user_prompt", "")
            
            content_html = ""
            if comp_id != "default":
                content_html += f"<div style='{header_style}'>{_html.escape(comp_id)}</div>"
            
            if sys_p:
                content_html += f"<div style='color: #9ca3af; margin-bottom: 4px;'># System</div>"
                content_html += f"<div>{_html.escape(sys_p)}</div>"
            
            if user_p:
                if sys_p:
                    content_html += "<br/>"
                content_html += f"<div style='color: #9ca3af; margin-bottom: 4px;'># User</div>"
                content_html += f"<div>{_html.escape(user_p)}</div>"
            
            html_parts.append(f"<div style='{box_style}'>{content_html}</div>")
    
    return "\n".join(html_parts) if html_parts else ""


def _format_codegen_concurrent_resp(records: List[dict]) -> str:
    """Format concurrent codegen responses - each component in its own box."""
    if not records:
        return ""
    
    # Group by component_id
    by_component: Dict[str, List[dict]] = {}
    for r in records:
        comp_id = r.get("component_id", "default")
        if comp_id not in by_component:
            by_component[comp_id] = []
        by_component[comp_id].append(r)
    
    # Format each component's responses
    html_parts: List[str] = []
    
    # Style for the boxes (same as sent)
    box_style = (
        "border: 1px solid #374151; "
        "border-radius: 8px; "
        "padding: 12px; "
        "margin-bottom: 12px; "
        "background-color: #1f2937; "
        "color: #e5e7eb; "
        "font-family: monospace; "
        "white-space: pre-wrap;"
    )
    
    header_style = "font-weight: bold; color: #34d399; margin-bottom: 8px; border-bottom: 1px solid #374151; padding-bottom: 4px;"
    
    # Use formatted "Trace" log if available for general errors
    
    for comp_id in sorted(by_component.keys()):
        comp_records = by_component[comp_id]
        if not comp_records:
            continue
        
        # Get the latest response for this component
        resp_record = None
        for r in reversed(comp_records):
            if r.get("event") == "response":
                resp_record = r
                break
        
        if resp_record:
            resp_text = resp_record.get("response", "")
            
            content_html = ""
            if comp_id != "default":
                content_html += f"<div style='{header_style}'>{_html.escape(comp_id)}</div>"
            
            content_html += f"<div>{_html.escape(resp_text)}</div>"
            
            html_parts.append(f"<div style='{box_style}'>{content_html}</div>")
            
    return "\n".join(html_parts) if html_parts else ""


def _format_codegen_all_calls_html(records: List[dict]) -> str:
    """Format all codegen calls as HTML with editable textareas and regenerate buttons."""
    if not records:
        return ""
    
    # Group by component_id
    by_component: Dict[str, List[dict]] = {}
    for r in records:
        comp_id = r.get("component_id", "default")
        if comp_id not in by_component:
            by_component[comp_id] = []
        by_component[comp_id].append(r)
    
    if not by_component:
        return ""
    
    # Styling
    label_style = (
        "font-family: var(--font, ui-sans-serif, system-ui); "
        "font-size: 14px; "
        "font-weight: 500; "
        "color: var(--block-label-text-color, #9ca3af); "
        "margin-bottom: 6px;"
    )
    
    textarea_style = (
        "width: 100%; "
        "min-height: 150px; "
        "border: 1px solid var(--border-color-primary, #374151); "
        "border-radius: 8px; "
        "padding: 12px; "
        "background-color: var(--background-fill-primary, #1f2937); "
        "color: var(--body-text-color, #e5e7eb); "
        "font-family: var(--font-mono, ui-monospace, monospace); "
        "font-size: 13px; "
        "resize: vertical;"
    )
    
    button_style = (
        "padding: 6px 12px; "
        "margin-top: 8px; "
        "border: 1px solid var(--border-color-primary, #374151); "
        "border-radius: 4px; "
        "background-color: var(--button-primary-background-fill, #2563eb); "
        "color: var(--button-primary-text-color, #ffffff); "
        "font-family: var(--font, ui-sans-serif, system-ui); "
        "font-size: 13px; "
        "cursor: pointer; "
        "transition: background-color 0.2s;"
    )
    
    html_parts: List[str] = []
    comp_ids = sorted(by_component.keys())
    
    for idx, comp_id in enumerate(comp_ids):
        comp_records = by_component[comp_id]
        
        # Get the latest sent record for this component
        sent_record = None
        for r in reversed(comp_records):
            if r.get("event") == "sent":
                sent_record = r
                break
        
        if not sent_record:
            continue
        
        sys_p = sent_record.get("system_prompt", "")
        user_p = sent_record.get("user_prompt", "")
        
        # Build content for display and editing
        content_parts: List[str] = []
        if sys_p:
            content_parts.append(f"# System\n{sys_p}")
        if user_p:
            content_parts.append(f"# User\n{user_p}")
        
        content = "\n\n".join(content_parts)
        
        # Label with component name
        label = f"call (component {idx + 1}: {_html.escape(comp_id)})"
        
        # Use a unique ID for the textarea
        textarea_id = f"codegen_call_{comp_id.replace('-', '_')}"
        status_id = f"codegen_status_{comp_id.replace('-', '_')}"
        
        html_parts.append(f"""
<div style='margin-bottom: 16px;'>
    <div style='{label_style}'>{label}</div>
    <textarea id="{textarea_id}" style="{textarea_style}">{_html.escape(content)}</textarea>
    <button style="{button_style}" 
            onclick="regenerateComponent('{comp_id}', '{textarea_id}', '{status_id}')"
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563eb'">
        🔄 Regenerate
    </button>
    <span id="{status_id}" style="margin-left: 10px; color: #9ca3af; font-size: 12px;"></span>
</div>
        """)
    
    # Add JavaScript for regeneration
    script = """
<script>
function regenerateComponent(compId, textareaId, statusId) {
    const textarea = document.getElementById(textareaId);
    const status = document.getElementById(statusId);
    const content = textarea.value;
    
    status.textContent = '⏳ Generating...';
    status.style.color = '#60a5fa';
    
    // Parse system and user prompts
    let systemPrompt = '';
    let userPrompt = '';
    
    const parts = content.split(/\n\n+/);
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.startsWith('# System')) {
            systemPrompt = part.substring(8).trim();
        } else if (part.startsWith('# User')) {
            userPrompt = part.substring(6).trim();
        }
    }
    
    // Call backend API
    fetch('/regenerate-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            component_id: compId,
            system_prompt: systemPrompt,
            user_prompt: userPrompt
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            status.textContent = '✓ Generated! Refresh to see preview.';
            status.style.color = '#34d399';
        } else {
            status.textContent = '✗ Error: ' + (data.error || 'Unknown error');
            status.style.color = '#f87171';
        }
    })
    .catch(error => {
        status.textContent = '✗ Request failed: ' + error;
        status.style.color = '#f87171';
    });
}
</script>
    """
    
    return ("\n".join(html_parts) + script) if html_parts else ""


def _get_codegen_call_data(component_id: str, session: Session) -> Optional[Dict[str, Any]]:
    """Extract codegen call data for a specific component from trace."""
    trace_file = session.get("trace_file")
    if not trace_file or not os.path.exists(trace_file):
        return None
    
    try:
        with open(trace_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    if (record.get("step") == "codegen" and 
                        record.get("component_id") == component_id and
                        record.get("event") == "sent"):
                        return record
                except json.JSONDecodeError:
                    continue
    except Exception:
        pass
    
    return None


def regenerate_single_component(
    component_id: str,
    system_prompt: str,
    user_prompt: str,
    session: Session
) -> Dict[str, Any]:
    """Regenerate a single component with custom prompts."""
    try:
        if not session.get("output_dir"):
            return {"success": False, "error": "No active session"}
        
        output_dir, state_path, _ = _session_paths(session)
        state = PipelineState.load(state_path)
        
        # Import codegen tool
        from src.tools.codegen import CodegenTool
        from src.utils.llm_client import call_llm
        
        tool = CodegenTool(verbose=True)
        
        # Get deployment
        deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')
        
        # Call LLM
        response = call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            deployment=deployment,
            temperature=0.3,
            max_tokens=4000,
            response_format="json",
            component_id=component_id,
        )
        
        # Parse response
        data = json.loads(response)
        
        # Handle different response formats
        comp_data = data
        if "component" in data and isinstance(data["component"], dict):
            comp_data = data["component"]
        elif "components" in data and isinstance(data["components"], list):
            comp_data = data["components"][0] if data["components"] else {}
        elif "code" in data:
            comp_data = data
        else:
            comp_data = {}
        
        if not comp_data:
            return {"success": False, "error": "Empty component data in LLM response"}
        
        # Validate and fix code
        from src.tools.codegen import _validate_and_fix_component_code
        
        raw_code = comp_data.get("code", "")
        raw_props = comp_data.get("props_interface", "")
        comp_name = comp_data.get("name", component_id)
        
        fixed_code, fixed_props, fixes = _validate_and_fix_component_code(
            raw_code, raw_props, comp_name
        )
        
        # Update state
        if not hasattr(state, 'generated_components'):
            state.generated_components = {}
        
        state.generated_components[component_id] = {
            "name": comp_name,
            "props_interface": fixed_props,
            "code": fixed_code,
            "mdx_usage": data.get("mdx_replacement", f"<{comp_name} />")
        }
        
        # Save state
        state.save(state_path)
        
        return {
            "success": True,
            "component_name": comp_name,
            "fixes": fixes
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


def _format_codegen_all_responses_html(records: List[dict], run_id: Optional[str] = None) -> str:
    """Format all codegen responses as HTML with textbox-styled containers for each component."""
    if not records:
        return ""
    
    # Group by component_id
    by_component: Dict[str, List[dict]] = {}
    for r in records:
        comp_id = r.get("component_id", "default")
        if comp_id not in by_component:
            by_component[comp_id] = []
        by_component[comp_id].append(r)
    
    if not by_component:
        return ""
    
    # Textbox-like styling
    container_style = (
        "border: 1px solid var(--border-color-primary, #374151); "
        "border-radius: 8px; "
        "padding: 12px; "
        "margin-bottom: 8px; "
        "background-color: var(--background-fill-primary, #1f2937); "
        "color: var(--body-text-color, #e5e7eb); "
        "font-family: var(--font-mono, ui-monospace, monospace); "
        "font-size: 14px; "
        "white-space: pre-wrap; "
        "overflow-y: auto; "
        "max-height: 200px;"
    )
    
    label_style = (
        "font-family: var(--font, ui-sans-serif, system-ui); "
        "font-size: 14px; "
        "font-weight: 500; "
        "color: var(--block-label-text-color, #9ca3af); "
        "margin-bottom: 6px;"
    )
    
    button_style = (
        "padding: 4px 12px; "
        "margin-right: 8px; "
        "border: 1px solid var(--border-color-primary, #374151); "
        "border-radius: 4px; "
        "background-color: var(--button-secondary-background-fill, #374151); "
        "color: var(--button-secondary-text-color, #e5e7eb); "
        "font-family: var(--font, ui-sans-serif, system-ui); "
        "font-size: 13px; "
        "cursor: pointer; "
        "transition: background-color 0.2s;"
    )
    
    html_parts: List[str] = []
    comp_ids = sorted(by_component.keys())
    
    for idx, comp_id in enumerate(comp_ids):
        comp_records = by_component[comp_id]
        
        # Get the latest response for this component
        resp_record = None
        for r in reversed(comp_records):
            if r.get("event") == "response":
                resp_record = r
                break
        
        if not resp_record:
            continue
        
        resp_text = resp_record.get("response", "")
        content = _html.escape(resp_text)
        
        # Label with component name
        label = f"response (component {idx + 1}: {_html.escape(comp_id)})"
        
        # URL-encode component name for the preview link
        comp_name_encoded = quote(comp_id)
        
        # Prepare params for Next.js preview
        # Strip output/ prefix from run_id if present to match path convention
        clean_run_id = run_id
        if clean_run_id and clean_run_id.startswith("output/"):
            clean_run_id = clean_run_id[len("output/"):]
            
        # Build query params for direct Next.js access
        # Uses 'path' instead of 'run_id' and points to port 3000
        preview_query = f"name={comp_name_encoded}"
        if clean_run_id:
            preview_query += f"&path={quote(clean_run_id)}"
        
        # Preview button - opens component preview in new tab (Direct Next.js Link)
        preview_button = (
            f"<button style='{button_style}' "
            f"onclick=\"window.open('http://localhost:3000/preview/component?{preview_query}', '_blank')\" "
            f"onmouseover=\"this.style.backgroundColor='#4b5563'\" "
            f"onmouseout=\"this.style.backgroundColor='var(--button-secondary-background-fill, #374151)'\">Preview</button>"
        )
        
        # View Source button - opens component source viewer
        source_button = (
            f"<button style='{button_style}' "
            f"onclick=\"window.open('/component?name={comp_name_encoded}', '_blank')\" "
            f"onmouseover=\"this.style.backgroundColor='#4b5563'\" "
            f"onmouseout=\"this.style.backgroundColor='var(--button-secondary-background-fill, #374151)'\">View Source</button>"
        )
        
        html_parts.append(
            f"<div style='margin-bottom: 16px;'>"
            f"<div style='{label_style}'>{label}</div>"
            f"<div style='{container_style}'>{content}</div>"
            f"<div style='margin-top: 8px;'>{preview_button}{source_button}</div>"
            f"</div>"
        )
    
    return "\n".join(html_parts) if html_parts else ""


def _find_todo(state: PipelineState, todo_type: TodoType):
    if not state.todos:
        return None
    # TodoQueue stores todos in .todos
    todos = getattr(state.todos, "todos", None)
    if todos is None and isinstance(state.todos, list):
        todos = state.todos
    if not todos:
        return None

    for t in todos:
        if getattr(t, "type", None) == todo_type:
            return t
    return None


def _constitution_text(state: PipelineState) -> str:
    c = state.get_constitution()
    if not c:
        return "(no constitution)"
    lines: List[str] = []
    tone = getattr(c, "tone", None)
    if tone:
        lines.append(f"tone: {tone}")
    tgt = getattr(c, "slide_count_target", None)
    if tgt:
        lines.append(f"slide_count_target: {tgt}")
    rules = getattr(c, "style_rules", None) or []
    if rules:
        lines.append("style_rules:")
        lines.extend([f"- {r}" for r in rules])
    excl = getattr(c, "content_exclusions", None) or []
    if excl:
        lines.append("content_exclusions:")
        lines.extend([f"- {r}" for r in excl])
    req = getattr(c, "content_requirements", None) or []
    if req:
        lines.append("content_requirements:")
        lines.extend([f"- {r}" for r in req])
    return "\n".join(lines).strip() or "(empty constitution)"


def _with_llm_env(session: Session, step: str, override_system: Optional[str], override_user: Optional[str]):
    output_dir, _, trace_path = _session_paths(session)
    _ = output_dir

    old_trace = os.environ.get("LLM_TRACE_FILE")
    old_step = os.environ.get("LLM_TRACE_STEP")
    old_os = os.environ.get("LLM_OVERRIDE_SYSTEM_PROMPT")
    old_ou = os.environ.get("LLM_OVERRIDE_USER_PROMPT")

    os.environ["LLM_TRACE_FILE"] = str(trace_path)
    os.environ["LLM_TRACE_STEP"] = step

    override_system = (override_system or "").strip()
    override_user = (override_user or "").strip()

    if override_system:
        os.environ["LLM_OVERRIDE_SYSTEM_PROMPT"] = override_system
    else:
        os.environ.pop("LLM_OVERRIDE_SYSTEM_PROMPT", None)

    if override_user:
        os.environ["LLM_OVERRIDE_USER_PROMPT"] = override_user
    else:
        os.environ.pop("LLM_OVERRIDE_USER_PROMPT", None)

    return old_trace, old_step, old_os, old_ou


def _restore_llm_env(old_vals) -> None:
    old_trace, old_step, old_os, old_ou = old_vals

    if old_trace is None:
        os.environ.pop("LLM_TRACE_FILE", None)
    else:
        os.environ["LLM_TRACE_FILE"] = old_trace

    if old_step is None:
        os.environ.pop("LLM_TRACE_STEP", None)
    else:
        os.environ["LLM_TRACE_STEP"] = old_step

    if old_os is None:
        os.environ.pop("LLM_OVERRIDE_SYSTEM_PROMPT", None)
    else:
        os.environ["LLM_OVERRIDE_SYSTEM_PROMPT"] = old_os

    if old_ou is None:
        os.environ.pop("LLM_OVERRIDE_USER_PROMPT", None)
    else:
        os.environ["LLM_OVERRIDE_USER_PROMPT"] = old_ou


def build_default_prompts(session: Session, step: str) -> Tuple[str, str, str]:
    """Return (note, system_prompt, user_prompt) for a step."""
    output_dir, state_path, _ = _session_paths(session)
    _ = output_dir
    if not state_path.exists():
        return "[note] state.json missing (Initialize first)", "", ""

    state = PipelineState.load(state_path)
    instruction = str(session.get("instruction", ""))

    if step == "planner":
        from src.generation.todo.planner import build_planner_prompt

        sys_p, user_p = build_planner_prompt(state, instruction)
        return "", sys_p, user_p

    if step == "atoms":
        from src.generation.atom.prompts import get_atom_extraction_config, render_atom_extraction_prompt
        from src.common.source import Source

        if not state.source:
            return "[note] No source in state.", "", ""
        source_path = Path(state.source.path)
        content = source_path.read_text(encoding="utf-8")

        guidance = ""
        c = state.get_constitution()
        if c and getattr(c, "style_rules", None):
            guidance = "\n".join(c.style_rules)
        if instruction:
            guidance = (guidance + "\n\nUser instruction: " + instruction).strip()

        src = Source(
            source_id=state.source.content_hash,
            name=source_path.name,
            file_path=str(source_path.absolute()),
            content_type=state.source.content_type if state.source.content_type in ["text/plain", "text/vtt"] else "text/plain",
            content=content,
        )

        cfg = get_atom_extraction_config()
        user_prompt = render_atom_extraction_prompt(src, guidance)
        return "", cfg.system_prompt, user_prompt

    if step == "theme":
        from src.generation.theme.prompts import get_theme_creation_config, render_theme_creation_prompt

        cfg = get_theme_creation_config()
        # Generate prompt for validation/logging but don't force it into UI
        # to avoid overwriting user's manual edits.
        _ = render_theme_creation_prompt(
            user_instruction=instruction or "Create a professional theme",
            base_theme_source=None,
            new_theme_name="custom_theme_preview"
        )
        return "", cfg.system_prompt, None


    if step == "story":
        use_source = True
        
        from src.generation.content import story_generator
        from src.generation.content.story_generator import SCQA_SYSTEM_PROMPT
        
        slide_count = None
        c = state.get_constitution()
        if c:
            slide_count = getattr(c, "slide_count_target", None)
            
        intent_guidance = ""
        if c and getattr(c, "style_rules", None):
            intent_guidance = "\n".join(c.style_rules)

        if use_source:
            source_path = Path(state.source.path)
            # Preview only first 50k chars
            content = source_path.read_text(encoding="utf-8")[:50000]
            prompt = story_generator._get_scqa_prompt(content, instruction, slide_count or 10, intent_guidance)
            return "", SCQA_SYSTEM_PROMPT, prompt
        else:
            atoms = state.get_atoms()
            if not atoms:
                return "[note] Run atoms first (or provide source file).", "", ""
            prompt = story_generator._get_story_prompt(atoms, instruction, slide_count, intent_guidance)
            return "", "You are a presentation storyteller. Output only valid JSON array.", prompt

    if step == "content":
        if not state.slides:
            return "[note] Run story first.", "", ""
            
        from src.generation.content.prompts import get_slide_generation_config, render_slide_generation_prompt

        cfg = get_slide_generation_config(project=str(state.project or "react-mdx"))
        
        # Build draft slides summary (matches layout_generator.py logic)
        drafts_summary = []
        for slide in state.slides:
            slide_summary = {
                "id": slide.get("id"),
                "rank": slide.get("rank"),
                "story": slide.get("story", ""),
                "density": slide.get("density", "moderate"),
                "visual_design": slide.get("visual_design", ""),
            }
            if slide.get("content"):
                slide_summary["content"] = slide.get("content")
            if slide.get("atoms"):
                slide_summary["atoms"] = slide.get("atoms")
            drafts_summary.append(slide_summary)
        
        # Check if slides have embedded content (source-based flow)
        has_content = any(s.get("content") for s in state.slides)
        has_atoms = any(s.get("atoms") for s in state.slides)
        atoms = state.get_atoms()
        
        # Build user prompt matching layout_generator.py structure
        user_prompt = f"""# DRAFT SLIDES
```json
{json.dumps(drafts_summary, indent=2)}
```

"""
        
        if has_atoms and atoms:
            # Include atom collection for reference
            user_prompt += render_slide_generation_prompt(
                atoms=atoms,
                user_instruction=instruction or "Generate presentation slides based on the draft slides above.",
                intent_guidance="",
                themes=None
            )
        elif has_content:
            # Content-only slides (no atoms available)
            user_prompt += render_slide_generation_prompt(
                atoms=None,
                user_instruction=instruction or "Generate presentation slides based on the draft slides above.",
                intent_guidance="",
                themes=None,
                use_content_field=True
            )
        else:
            user_prompt += f"""Generate MDX slides based on the draft slides above.

Instructions: {instruction or 'Create compelling presentation slides.'}
"""
        
        # Add note if both atoms and content present
        if has_atoms and has_content:
            user_prompt += """\n\n**IMPORTANT**: Some slides have BOTH atoms and content fields.
- Use atoms for widget population where available
- Use embedded content as additional context and validation
- Ensure consistency between atoms and content when both are present
"""

        return "", cfg.system_prompt, user_prompt

    if step == "codegen":
        from src.tools.codegen import CodegenTool
        tool = CodegenTool()
        return "[note] Codegen generates React code for <InventComponent> tags. Run after content step.", tool.system_prompt, ""

    return "", "", ""


def init_session(
    source_file,
    instruction_text: str,
    output_name: str,
    project: str,
    active_theme: str,
    use_cache: bool,
) -> Tuple[
    Session,
    str,
    str,
    str,
    str,
    str,
    str,
    str,
    str,
    str,
    str,
    str,
    str,
]:
    """Create output folder, state.json, trace file, and compute default prompts."""
    if isinstance(source_file, list):
        source_file = source_file[0] if source_file else None

    if source_file is None:
        empty_session: Session = {}
        empty = ""
        return (
            empty_session,
            empty,
            empty,
            empty,
            empty,
            empty,
            empty,
            empty,
            empty,
            empty,
            empty,
            empty,
            empty,
        )

    output_name = (output_name or "ui_run").strip() or "ui_run"
    output_dir = Path("output") / output_name
    output_dir.mkdir(parents=True, exist_ok=True)

    sources_dir = output_dir / "sources"
    sources_dir.mkdir(parents=True, exist_ok=True)
    src_path = Path(source_file.name)
    copied_source = sources_dir / src_path.name
    shutil.copy(src_path, copied_source)

    instruction = (instruction_text or "").strip()
    instruction = instruction.strip() or "Generate slides."

    state = PipelineState()

    state.set_source(copied_source)
    state.project = project
    state.active_theme = active_theme
    state.save(output_dir / "state.json")

    trace_path = output_dir / "llm_trace.jsonl"
    try:
        trace_path.write_text("", encoding="utf-8")
    except Exception:
        pass

    session: Session = {
        "output_dir": str(output_dir),
        "instruction": instruction,
        "use_cache": bool(use_cache),
        "trace_pos": 0,
    }

    defp = {}
    for step in ["planner", "atoms", "theme", "story", "content", "codegen"]:
        note, sys_p, user_p = build_default_prompts(session, step)
        defp[step] = (note, sys_p, user_p)

    return (
        session,
        defp["planner"][1],
        defp["planner"][2],
        defp["atoms"][1],
        defp["atoms"][2],
        defp["theme"][1],
        defp["theme"][2],
        defp["story"][1],
        defp["story"][2],
        defp["content"][1],
        defp["content"][2],
        defp["codegen"][1],
        defp["codegen"][2],
    )


def _update_trace(session: Session) -> Tuple[Session, List[dict]]:
    output_dir, _, trace_path = _session_paths(session)
    _ = output_dir
    pos = int(session.get("trace_pos", 0) or 0)
    new_pos, records = _read_new_trace(trace_path, pos)
    session["trace_pos"] = new_pos
    return session, records


def run_step_constitution(session: Session) -> Tuple[Session, str]:
    session = _ensure_session(session)
    if not session.get("output_dir"):
        return session, "[error] Initialize first."

    output_dir, state_path, _ = _session_paths(session)
    state = PipelineState.load(state_path)
    instruction = str(session.get("instruction", ""))

    todo = _find_todo(state, TodoType.CONSTITUTION)
    if todo is None:
        return session, "[constitution] todo missing (run planner first)\n\n" + _constitution_text(state)

    executor = TodoExecutor(
        verbose=True,
        use_cache=bool(session.get("use_cache", True)),
        output_dir=output_dir,
        state_path=state_path,
    )

    buf = io.StringIO()
    with redirect_stdout(buf), redirect_stderr(buf):
        executor.execute_todo(todo, state, instruction)
        state.save(state_path)

    _ = buf.getvalue().strip() or "[constitution] ok"
    return session, _constitution_text(state)


def _refresh_predefined_prompt(session: Session, step: str) -> Tuple[str, str]:
    """Return (system_prompt, user_prompt) for a step based on current state.json.

    Notes are intentionally dropped (we removed note UI boxes).
    """
    try:
        _, sys_p, user_p = build_default_prompts(session, step)
        return sys_p, user_p
    except Exception:
        return "", ""


def refresh_prompt_planner(session: Session) -> Tuple[str, str, str, str]:
    """Refresh planner prompts to built-in defaults."""
    sys, user = _refresh_predefined_prompt(session, "planner")
    return sys, user, "", ""


def refresh_prompt_atoms(session: Session) -> Tuple[str, str, str, str]:
    """Refresh atoms prompts to built-in defaults."""
    sys, user = _refresh_predefined_prompt(session, "atoms")
    return sys, user, "", ""


def refresh_prompt_theme(session: Session) -> Tuple[str, str, str, str]:
    """Refresh theme prompts to built-in defaults."""
    sys, user = _refresh_predefined_prompt(session, "theme")
    return sys, user, "", ""


def refresh_prompt_story(session: Session) -> Tuple[str, str, str, str]:
    """Refresh story prompts to built-in defaults."""
    sys, user = _refresh_predefined_prompt(session, "story")
    return sys, user, "", ""


def refresh_prompt_content(session: Session) -> Tuple[str, str, str, str]:
    """Refresh content prompts to built-in defaults."""
    sys, user = _refresh_predefined_prompt(session, "content")
    return sys, user, "", ""


def refresh_prompt_codegen(session: Session) -> Tuple[str, str, str, str]:
    """Refresh codegen prompts to built-in defaults."""
    sys, user = _refresh_predefined_prompt(session, "codegen")
    return sys, user, "", ""


def _stream_llm_trace_updates(
    session: Session,
    step: str,
    trace_path: Path,
    from_pos: int,
    records: List[dict],
    last_sent: str,
    last_resp: str,
) -> Tuple[int, str, str, bool]:
    """Read new trace records and return (new_pos, sent, resp, changed)."""
    new_pos, new_records = _read_new_trace(trace_path, from_pos)
    if new_records:
        records.extend(new_records)
    step_records = _filter_records_for_step(records, step)
    sent = _format_llm_sent(step_records)
    resp = _format_llm_response(step_records)
    changed = (sent != last_sent) or (resp != last_resp)
    return new_pos, sent, resp, changed


def run_step_planner_stream_with_overrides(
    session: Session,
    override_system: Optional[str],
    override_user: Optional[str],
):
    """Stream planner updates; optionally override prompts from the UI."""
    session = _ensure_session(session)
    if not session.get("output_dir"):
        yield session, "", ""
        return

    output_dir, state_path, trace_path = _session_paths(session)
    _ = output_dir
    instruction = str(session.get("instruction", ""))

    # Keep env set for the duration of the worker.
    old_env = _with_llm_env(session, "planner", override_system, override_user)
    result: dict = {"done": False, "log": "", "exc": None}

    def _worker():
        try:
            state = PipelineState.load(state_path)
            buf = io.StringIO()
            with redirect_stdout(buf), redirect_stderr(buf):
                state.todos = plan(state, instruction)
                state.save(state_path)
            result["log"] = buf.getvalue().strip() or "[planner] ok"
        except Exception as e:  # noqa: BLE001
            result["exc"] = e
        finally:
            result["done"] = True

    t = threading.Thread(target=_worker, daemon=True)
    t.start()

    pos = int(session.get("trace_pos", 0) or 0)
    records: List[dict] = []
    sent = ""
    resp = ""

    # Initial state
    yield session, sent, resp

    try:
        while not result["done"]:
            pos, sent2, resp2, changed = _stream_llm_trace_updates(session, "planner", trace_path, pos, records, sent, resp)
            if changed:
                sent, resp = sent2, resp2
            # Yield every tick so UI (and timer) keeps updating.
            yield session, sent, resp
            time.sleep(0.2)

        # Final read
        pos, sent2, resp2, changed = _stream_llm_trace_updates(session, "planner", trace_path, pos, records, sent, resp)
        if changed:
            sent, resp = sent2, resp2

        session["trace_pos"] = pos

        yield session, sent, resp
    finally:
        _restore_llm_env(old_env)


def run_step_todo_llm_stream_with_overrides(
    session: Session,
    step: str,
    todo_type: TodoType,
    override_system: Optional[str],
    override_user: Optional[str],
):
    """Stream todo LLM step updates; optionally override prompts from the UI."""
    session = _ensure_session(session)
    if not session.get("output_dir"):
        yield session, "", ""
        return

    output_dir, state_path, trace_path = _session_paths(session)
    state = PipelineState.load(state_path)
    instruction = str(session.get("instruction", ""))

    todo = _find_todo(state, todo_type)
    if todo is None:
        print("Shiyi debug: run_step_todo_llm_stream_with_overrides todo is none")
        yield session, "", ""
        return

    executor = TodoExecutor(
        verbose=True,
        use_cache=bool(session.get("use_cache", True)),
        output_dir=output_dir,
        state_path=state_path,
    )

    old_env = _with_llm_env(session, step, override_system, override_user)
    result: dict = {"done": False, "log": "", "exc": None}

    def _worker():
        try:
            print(f"[UI] Starting execution for step: {step} (todo: {todo_type})")
            # buf = io.StringIO()
            # with redirect_stdout(buf), redirect_stderr(buf):
            executor.execute_todo(todo, state, instruction)
            state.save(state_path)
            result["log"] = f"[{step}] ok"
            print(f"[UI] Execution finished for step: {step}")
        except Exception as e:  # noqa: BLE001
            print(f"[UI] Execution failed for step: {step}: {e}")
            result["exc"] = e
        finally:
            result["done"] = True

    t = threading.Thread(target=_worker, daemon=True)
    t.start()

    pos = int(session.get("trace_pos", 0) or 0)
    records: List[dict] = []
    sent = ""
    resp = ""
    yield session, sent, resp

    try:
        while not result["done"]:
            pos, sent2, resp2, changed = _stream_llm_trace_updates(session, step, trace_path, pos, records, sent, resp)
            if changed:
                sent, resp = sent2, resp2
            # Yield every tick so UI (and timer) keeps updating.
            yield session, sent, resp
            time.sleep(0.2)

        pos, sent2, resp2, changed = _stream_llm_trace_updates(session, step, trace_path, pos, records, sent, resp)
        if changed:
            sent, resp = sent2, resp2

        session["trace_pos"] = pos

        # If we have a tool log but no LLM response (or short one), show the log.
        # This is critical for tools that exit early or don't use LLM.
        tool_log = result.get("log", "").strip()
        if tool_log and (not resp or len(resp) < 50):
            if resp:
                resp = f"{resp}\n\n--- Tool Output ---\n{tool_log}"
            else:
                resp = tool_log

        yield session, sent, resp
    finally:
        _restore_llm_env(old_env)


def run_step_atoms_and_refresh_stream(session: Session, override_system: Optional[str], override_user: Optional[str]):
    for session, sent, resp in run_step_todo_llm_stream_with_overrides(
        session, "atoms", TodoType.ATOMS, override_system, override_user
    ):
        table = _parse_atoms_table(resp)
        # While running, keep downstream prompts blank.
        yield session, sent, resp, table, "", "", "", ""

    story_sys, story_user = _refresh_predefined_prompt(session, "story")
    content_sys, content_user = _refresh_predefined_prompt(session, "content")
    table = _parse_atoms_table(resp)
    yield session, sent, resp, table, story_sys, story_user, content_sys, content_user



def _get_atoms_map(session: Session) -> Dict[str, str]:
    try:
        _, state_path, _ = _session_paths(session)
        if not state_path.exists():
            return {}
        state = PipelineState.load(state_path)
        
        # state.atoms is a dict returned by AtomCollection.to_dict()
        # structure: { "contexts": [ {id:..., abstract:...}, ... ], ... }
        atoms_data = getattr(state, "atoms", {}) or {}
        contexts = atoms_data.get("contexts", [])
        
        result = {}
        for item in contexts:
            if isinstance(item, dict):
                atom_id = str(item.get("id", ""))
                if atom_id:
                    result[atom_id] = str(item.get("abstract", ""))
        
        return result
    except Exception:
        return {}


def _get_generated_components(session: Session) -> Dict[str, Dict[str, Any]]:
    """Get generated components from state."""
    try:
        _, state_path, _ = _session_paths(session)
        if not state_path.exists():
            return {}
        state = PipelineState.load(state_path)
        return getattr(state, "generated_components", {}) or {}
    except Exception:
        return {}


def _extract_content_layouts_and_components(content_mdx: str) -> Dict[str, Dict[str, object]]:
    """Best-effort parsing of Content step response to extract per-slide layout + component tags.

    The Content step returns MDX/JSX-like markup (not strict XML), so we use regex.
    Returns: { slide_id: {"layout": str, "components": List[str], "invented_components": List[Dict]} }
    """
    text = (content_mdx or "").strip()
    if not text:
        return {}

    # Strip markdown code fences if present (```mdx ... ``` or ```jsx ... ```)
    # The response may contain MULTIPLE fenced blocks separated by ---, so extract ALL of them
    fence_pattern = r'```(?:mdx|jsx|xml|html)?\s*\n([\s\S]*?)\n```'
    fence_matches = re.findall(fence_pattern, text, flags=re.IGNORECASE)
    if fence_matches:
        # Combine all fence block contents
        text = "\n".join(m.strip() for m in fence_matches)

    slide_blocks = re.findall(r"<Slide\b([^>]*)>(.*?)</Slide>", text, flags=re.DOTALL | re.IGNORECASE)
    if not slide_blocks:
        return {}

    out: Dict[str, Dict[str, object]] = {}
    comp_count = 0

    for slide_attrs, slide_body in slide_blocks:
        # Slide id
        m_id = re.search(r"\bid\s*=\s*\"([^\"]+)\"", slide_attrs)
        slide_id = (m_id.group(1) if m_id else "").strip()
        if not slide_id:
            continue

        # Layout tag (first Layout* component inside Slide)
        m_layout = re.search(r"<(Layout[A-Za-z0-9_\.]*)\b", slide_body)
        layout_name = (m_layout.group(1) if m_layout else "").strip()

        # Extract InventComponent tags with their IDs and intents
        # Use a more robust pattern that handles nested braces in data={{...}}
        invented_components: List[Dict[str, str]] = []
        invent_pattern = r'<InventComponent\s+([\s\S]*?)(?:/>|>\s*</InventComponent>)'
        for match in re.finditer(invent_pattern, slide_body):
            attrs_str = match.group(1)
            comp_info: Dict[str, str] = {}
            
            # Extract id (optional)
            id_match = re.search(r'id\s*=\s*["\']([^"\']+)["\']', attrs_str)
            comp_info["id"] = id_match.group(1) if id_match else f"invented_{slide_id}_{comp_count}"
            
            # Extract name (optional)
            name_match = re.search(r'name\s*=\s*["\']([^"\']+)["\']', attrs_str)
            if name_match:
                comp_info["name"] = name_match.group(1)
            else:
                 clean_sid = re.sub(r'[^a-zA-Z0-9]', '', slide_id) or "Slide"
                 comp_info["name"] = f"Invented{clean_sid.capitalize()}{comp_count}"

            # Extract intent
            intent_match = re.search(r'intent\s*=\s*["\']([^"\']+)["\']', attrs_str)
            if intent_match:
                comp_info["intent"] = intent_match.group(1)
            
            invented_components.append(comp_info)
            comp_count += 1

        # Components: collect JSX tag names (capitalized). Deduplicate while preserving order.
        # Exclude InventComponent from regular components list
        tags = re.findall(r"<([A-Z][A-Za-z0-9_]*)\b", slide_body)
        components: List[str] = []
        seen = set()
        for t in tags:
            if t == "Slide":
                continue
            if t.startswith("Layout"):
                continue
            if t == "InventComponent":
                continue
            if t not in seen:
                seen.add(t)
                components.append(t)

        out[slide_id] = {
            "layout": layout_name,
            "components": components,
            "invented_components": invented_components,
        }

    return out


def _render_slides_from_state(session: Session) -> str:
    """Render slides table directly from state.json slides array.
    
    This is the canonical source of truth for slides - reads from state.slides
    instead of parsing LLM response boxes.
    """
    try:
        _, state_path, _ = _session_paths(session)
        if not state_path.exists():
            return "<div style='color:gray;font-style:italic'>Waiting for state.json...</div>"
        
        state = PipelineState.load(state_path)
        slides = state.slides or []
        
        if not slides:
            return "<div style='color:gray;font-style:italic'>No slides in state yet...</div>"
        
        atoms_map = _get_atoms_map(session)
        generated_components = state.generated_components or {}
        
        # Extract run_id from output_dir
        output_dir = session.get("output_dir", "")
        run_id = Path(output_dir).name if output_dir else ""
        
        return _render_slides_list_html(slides, atoms_map, generated_components, run_id=run_id)
    except Exception as e:
        return f"<div style='color:red'>Error loading slides from state: {str(e)}</div>"


def _render_slides_list_html(
    slides: List[Dict[str, Any]],
    atoms_map: Dict[str, str],
    generated_components: Dict[str, Dict[str, Any]],
    content_mdx: Optional[str] = None,
    run_id: str = "",
) -> str:
    """Core renderer for slides list. Used by both state-based and legacy JSON-based rendering."""
    try:
        content_info = _extract_content_layouts_and_components(content_mdx or "") if content_mdx else {}

        # Build set of names for generated components (for fast lookup)
        gen_names = set()
        for gc in generated_components.values():
            if isinstance(gc, dict) and "name" in gc:
                gen_names.add(gc["name"])

        html = """
        <style>
        .slide-table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px; }
        .slide-table th { text-align: left; background: #333; color: #fff; padding: 8px; border: 1px solid #555; }
        .slide-table td { vertical-align: top; padding: 8px; border: 1px solid #444; color: #ccc; }
        .atom-tag { cursor: pointer; color: #60a5fa; text-decoration: underline; margin-right: 6px; display: inline-block; }
        .component-link { color: #60a5fa; text-decoration: underline; display: inline-block; }
        .invented-pending { color: #f59e0b; font-style: italic; display: inline-block; }
        .invented-generated { color: #10b981; text-decoration: underline; cursor: pointer; display: inline-block; }
        .atom-abstract { margin-top: 4px; padding: 6px; background: #1f2937; border-radius: 4px; color: #d1d5db; font-size: 0.9em; border-left: 3px solid #60a5fa; }
        details > summary { list-style: none; cursor: pointer; }
        details > summary::-webkit-details-marker { display: none; }
        .content-cell { font-family: monospace; font-size: 11px; white-space: pre-wrap; color: #e5e7eb; background: #1f2937; padding: 4px; border-radius: 2px; }
        .content-header { font-weight: bold; color: #60a5fa; margin-bottom: 4px; }
        .content-section { margin-top: 6px; padding: 4px 0 4px 8px; border-left: 2px solid #374151; }
        .content-section-title { font-weight: bold; color: #9ca3af; font-size: 11px; margin-bottom: 2px; }
        .content-bullet { color: #d1d5db; font-size: 11px; margin-left: 8px; padding: 1px 0; }
        .content-expand-btn { color: #9ca3af; font-size: 10px; cursor: pointer; user-select: none; }
        .content-expand-btn:hover { color: #60a5fa; }
        </style>
        <table class="slide-table">
        <thead>
            <tr>
            <th style="width:5%">Rank</th>
            <th style="width:20%">Story</th>
            <th style="width:30%">Content</th>
            <th style="width:10%">Density</th>
            <th style="width:15%">Visual Design</th>
            <th style="width:10%">Layouts</th>
            <th style="width:10%">Components</th>
            </tr>
        </thead>
        <tbody>
        """
        
        comp_count = 0
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            
            slide_id = str(slide.get("id", "") or "").strip()
            rank = str(slide.get("rank", ""))

            # Handle both string and dict story fields
            story = slide.get("story", "")
            
            density = _html.escape(str(slide.get("density", "")))
            visual_design = _html.escape(str(slide.get("visual_design", "")))
            
            # Extract embedded content for display
            content_display = ""
            raw_content = slide.get("content")
            if raw_content:
                if isinstance(raw_content, str):
                   content_display = f"<div class='content-cell'>{_html.escape(raw_content)}</div>"
                elif isinstance(raw_content, dict):
                    # Build full content display with collapsible sections
                    content_parts = []
                    
                    # Header info (always visible)
                    header_parts = []
                    if "headline" in raw_content:
                        header_parts.append(f"<div class='content-header'>{_html.escape(str(raw_content['headline']))}</div>")
                    if "subtitle" in raw_content:
                        header_parts.append(f"<div style='color:#9ca3af;font-size:11px;font-style:italic;margin-bottom:4px;'>{_html.escape(str(raw_content['subtitle']))}</div>")
                    if "category" in raw_content:
                        header_parts.append(f"<div style='color:#6b7280;font-size:10px;margin-bottom:4px;'>Category: {_html.escape(str(raw_content['category']))}</div>")
                    if "speaker_intent" in raw_content:
                        header_parts.append(f"<div style='color:#6b7280;font-size:10px;margin-bottom:4px;'>Intent: {_html.escape(str(raw_content['speaker_intent']))}</div>")
                    
                    if header_parts:
                        content_parts.append("".join(header_parts))
                    
                    # Sections (collapsible)
                    sections = raw_content.get("sections", [])
                    if isinstance(sections, list) and sections:
                        sections_html = ""
                        for sec in sections:
                            if not isinstance(sec, dict):
                                continue
                            sec_title = sec.get("title", "")
                            bullets = sec.get("bullets", [])
                            
                            sections_html += f"<div class='content-section'>"
                            if sec_title:
                                sections_html += f"<div class='content-section-title'>{_html.escape(str(sec_title))}</div>"
                            
                            if isinstance(bullets, list):
                                for bullet in bullets:
                                    if isinstance(bullet, dict):
                                        text = bullet.get("text", "")
                                    else:
                                        text = str(bullet)
                                    if text:
                                        sections_html += f"<div class='content-bullet'>• {_html.escape(str(text))}</div>"
                            sections_html += "</div>"
                        
                        # Wrap sections in collapsible details
                        content_parts.append(
                            f"<details style='margin-top:4px;'>"
                            f"<summary class='content-expand-btn'>▶ {len(sections)} section(s) - click to expand</summary>"
                            f"<div style='margin-top:4px;'>{sections_html}</div>"
                            f"</details>"
                        )
                    elif "bullets" in raw_content:  # Backwards compat
                        bullets = raw_content["bullets"]
                        if isinstance(bullets, list) and bullets:
                            bullets_html = ""
                            for bullet in bullets:
                                if isinstance(bullet, dict):
                                    text = bullet.get("text", "")
                                else:
                                    text = str(bullet)
                                if text:
                                    bullets_html += f"<div class='content-bullet'>• {_html.escape(str(text))}</div>"
                            
                            content_parts.append(
                                f"<details style='margin-top:4px;'>"
                                f"<summary class='content-expand-btn'>▶ {len(bullets)} bullet(s) - click to expand</summary>"
                                f"<div style='margin-top:4px;'>{bullets_html}</div>"
                                f"</details>"
                            )
                    
                    content_display = f"<div class='content-cell'>{''.join(content_parts)}</div>"
            
            # If atoms exist, show them too (legacy/refinement)
            atoms_list = slide.get("atoms", [])
            if atoms_list and isinstance(atoms_list, list):
                if content_display:
                    content_display += "<div style='margin-top:4px;border-top:1px solid #444;padding-top:4px'><strong>Atoms:</strong></div>"
                
                for atom_id in atoms_list:
                    aid = str(atom_id).strip()
                    if not aid:
                        continue
                     
                    # Find abstract in atoms_map
                    abstract = atoms_map.get(aid, "")
                    extra_details = ""
                    if abstract:
                         extra_details = f"<div class='atom-abstract'>{_html.escape(abstract)}</div>"

                    atom_html = f"""
                    <details style="display:inline-block; margin-right:4px;">
                      <summary class="atom-tag">{_html.escape(aid)}</summary>
                      {extra_details}
                    </details>
                    """
                    content_display += atom_html

            
            # Extract layout from slide's MDX field (primary source)
            # OR fall back to content_info from legacy content_mdx parameter
            layouts_value = ""
            slide_mdx = slide.get("mdx", "")
            
            # Primary: Extract from slide's mdx field
            if slide_mdx:
                # Extract layout tag
                m_layout = re.search(r"<(Layout[A-Za-z0-9_\.]*)\b", slide_mdx)
                if m_layout:
                    layouts_value = m_layout.group(1)
            
            # Fallback: Try content_info if mdx extraction didn't work
            if not layouts_value and content_info:
                content_row = content_info.get(slide_id) if slide_id else None
                
                # Try normalized ID match
                if content_row is None and slide_id:
                    try:
                        def _get_id_num(s):
                            m = re.search(r"(\d+)$", str(s))
                            return int(m.group(1)) if m else None
                        
                        s_num = _get_id_num(slide_id)
                        if s_num is not None:
                            for cid, crow in content_info.items():
                                if _get_id_num(cid) == s_num:
                                    content_row = crow
                                    break
                    except Exception:
                        pass
                
                if isinstance(content_row, dict):
                    layouts_value = str(content_row.get("layout", "") or "")
            
            layout_html = ""
            if layouts_value:
                l_name = layouts_value.strip()
                href = f"/component?name={quote(l_name)}"
                layout_html = (
                    f"<a class='component-link' href='{href}' target='_blank'>"
                    f"{_html.escape(l_name)}"
                    f"</a>"
                )
            else:
                 layout_html = "<span style='opacity:0.3'>-</span>"

            # Parse components for this slide
            comps_display_list = []
            
            # Use slide_mdx if available, otherwise try fallback mapping (not implemented fully for components)
            if slide_mdx:
                # 1. Check for InventComponent (pending or generated)
                for m in re.finditer(r'<InventComponent\s+([\s\S]*?)(?:/>|>\s*</InventComponent>)', slide_mdx):
                    attrs = m.group(1)
                    
                    # Logic to determine component name, matching codegen.py auto-generation
                    c_name = ""
                    name_m = re.search(r'name\s*=\s*["\']([^"\']+)["\']', attrs)
                    if name_m:
                        c_name = name_m.group(1).strip()
                    else:
                        # Auto-generate name based on slide ID and global index
                        # Must match codegen.py: Invented{SlideID}{Index}
                        clean_sid = re.sub(r'[^a-zA-Z0-9]', '', slide_id) or "Slide"
                        # We need a global index of components.
                        # Since we don't have the global context easily here without a separate pass,
                        # we'll approximate or we need to pass a context object.
                        # EDIT: We added `comp_count` outside the loop.
                        c_name = f"Invented{clean_sid.capitalize()}{comp_count}"
                    
                    comp_count += 1

                    if c_name in gen_names:
                         # Generated -> Link to preview
                         href = f"/component-preview?name={quote(c_name)}&run_id={quote(run_id)}"
                         comps_display_list.append(f"<a class='invented-generated' href='{href}' target='_blank'>{_html.escape(c_name)}</a>")
                    else:
                         # Pending -> Gray
                         comps_display_list.append(f"<span class='invented-pending'>{_html.escape(c_name)}</span>")

                # 2. Check for regular Component tags
                # Exclude Layout, Slide, InventComponent
                reg_tags = re.findall(r"<([A-Z][A-Za-z0-9_]*)\b", slide_mdx)
                seen_tags = set()
                for t in reg_tags:
                    if t in ["Slide", "InventComponent"] or t.startswith("Layout"):
                        continue
                    if t in seen_tags:
                        continue
                    seen_tags.add(t)
                    
                    if t in gen_names:
                         # Generated -> Link to preview
                         href = f"/component-preview?name={quote(t)}&run_id={quote(run_id)}"
                         comps_display_list.append(f"<a class='invented-generated' href='{href}' target='_blank'>{_html.escape(t)}</a>")
                    else:
                         # Predefined -> Link to source code
                         href = f"/component?name={quote(t)}"
                         comps_display_list.append(f"<a class='component-link' href='{href}' target='_blank'>{_html.escape(t)}</a>")

            # Display components as a vertical list
            if comps_display_list:
                comps_html = "<br>".join(comps_display_list)
            else:
                comps_html = "<span style='opacity:0.3'>-</span>"

            html += f"""
            <tr>
                <td>{rank}</td>
                <td>{story}</td>
                <td>{content_display}</td>
                <td>{density}</td>
                <td>{visual_design}</td>
                <td>{layout_html}</td>
                <td>{comps_html}</td>
            </tr>
            """

        html += "</tbody></table>"
        return html
    except Exception as e:
        return f"<div style='color:red'>Error parsing slides: {str(e)}</div>"


def run_step_story_and_refresh_stream(session: Session, override_system: Optional[str], override_user: Optional[str]):
    for session, sent, resp in run_step_todo_llm_stream_with_overrides(
        session, "story", TodoType.STORY, override_system, override_user
    ):
        # Render slides from state.json (canonical source)
        table_html = _render_slides_from_state(session)
        yield session, sent, resp, table_html, "", ""

    content_sys, content_user = _refresh_predefined_prompt(session, "content")
    table_html = _render_slides_from_state(session)
    yield session, sent, resp, table_html, content_sys, content_user


def run_step_theme_stream(session: Session, override_system: Optional[str], override_user: Optional[str]):
    """Theme can be LLM or non-LLM; if no LLM, show what changed instead."""
    session = _ensure_session(session)
    if not session.get("output_dir"):
        yield session, gr.update(value="[error] Initialize first.", visible=True), gr.update(value="", visible=False), gr.update(value="", visible=False), gr.update()
        return

    _, state_path, _ = _session_paths(session)
    if not state_path.exists():
        yield session, gr.update(value="[error] state.json missing (Initialize first)", visible=True), gr.update(value="", visible=False), gr.update(value="", visible=False), gr.update()
        return

    before = PipelineState.load(state_path)

    last_sent = ""
    last_resp = ""
    for session, sent, resp in run_step_todo_llm_stream_with_overrides(
        session, "theme", TodoType.THEME, override_system, override_user
    ):
        last_sent, last_resp = sent, resp
        # During execution, prefer showing LLM panes (they may remain empty).
        yield (
            session,
            gr.update(value="", visible=False),
            gr.update(value=sent, visible=True),
            gr.update(value=resp, visible=True),
            gr.update(),
        )

    after = PipelineState.load(state_path)
    summary = _theme_change_summary(before, after)
    used_llm = bool((last_sent or "").strip() or (last_resp or "").strip())
    
    # Don't update active_theme dropdown with generated theme IDs (leave it separate)
    # The dropdown has a fixed list of choices and will error on custom IDs

    
    if used_llm:
        yield (
            session,
            gr.update(value="", visible=False),
            gr.update(value=last_sent, visible=True),
            gr.update(value=last_resp, visible=True),
            gr.update(),  # Don't update dropdown
        )
    else:
        yield (
            session,
            gr.update(value=summary, visible=True),
            gr.update(value="", visible=False),
            gr.update(value="", visible=False),
            gr.update(),  # Don't update dropdown
        )


def run_step_content_stream(session: Session, override_system: Optional[str], override_user: Optional[str]):
    """Streaming wrapper for content step (Gradio can't stream from a lambda)."""
    # Render slides from state.json which is the canonical source of truth
    for session, sent, resp in run_step_todo_llm_stream_with_overrides(
        session,
        "content",
        TodoType.CONTENT,
        override_system,
        override_user,
    ):
        # Render slides from state.json (canonical source)
        slides_html = _render_slides_from_state(session)
        yield session, sent, resp, slides_html


def run_step_planner_stream_with_overrides_timed(
    session: Session,
    override_system: Optional[str],
    override_user: Optional[str],
):
    t0 = time.perf_counter()
    for session, sent, resp in run_step_planner_stream_with_overrides(session, override_system, override_user):
        elapsed = f"{(time.perf_counter() - t0):.2f}s"
        yield session, sent, resp, elapsed



def _parse_atoms_table(json_text: str) -> List[List[str]]:
    try:
        data = json.loads(json_text)
        if isinstance(data, dict):
            data = data.get("atoms", []) or []
        if not isinstance(data, list):
            return []

        rows = []
        for atom in data:
            if not isinstance(atom, dict):
                continue
            
            # Determine subtype based on type
            atom_type = str(atom.get("type", "")).upper()
            subtype = ""
            if atom_type == "TENSION":
                subtype = atom.get("tension_type", "")
            elif atom_type == "CONCEPT":
                subtype = atom.get("concept_type", "")
            elif atom_type == "FACT":
                subtype = atom.get("category", "")
            
            rows.append([
                str(atom.get("id", "")),
                str(subtype),
                str(atom.get("visual", "")),
                str(atom.get("abstract", "")),
            ])
        return rows
    except Exception:
        return []


def run_step_atoms_and_refresh_stream_timed(session: Session, override_system: Optional[str], override_user: Optional[str]):
    t0 = time.perf_counter()
    for session, sent, resp, table, story_sys, story_user, content_sys, content_user in run_step_atoms_and_refresh_stream(
        session, override_system, override_user
    ):
        elapsed = f"{(time.perf_counter() - t0):.2f}s"
        yield session, sent, resp, table, story_sys, story_user, content_sys, content_user, elapsed


def run_step_story_and_refresh_stream_timed(session: Session, override_system: Optional[str], override_user: Optional[str]):
    t0 = time.perf_counter()
    for session, sent, resp, table, content_sys, content_user in run_step_story_and_refresh_stream(session, override_system, override_user):
        elapsed = f"{(time.perf_counter() - t0):.2f}s"
        yield session, sent, resp, table, content_sys, content_user, elapsed


def run_step_theme_stream_timed(session: Session, override_system: Optional[str], override_user: Optional[str]):
    t0 = time.perf_counter()
    for session, theme_result, sent, resp, _ in run_step_theme_stream(session, override_system, override_user):
        elapsed = f"{(time.perf_counter() - t0):.2f}s"
        yield session, theme_result, sent, resp, elapsed, gr.update()  # Don't update dropdown


def run_step_content_stream_timed(session: Session, override_system: Optional[str], override_user: Optional[str]):
    t0 = time.perf_counter()
    for session, sent, resp, story_slides in run_step_content_stream(session, override_system, override_user):
        elapsed = f"{(time.perf_counter() - t0):.2f}s"
        yield session, sent, resp, story_slides, elapsed


def run_step_codegen_stream(session: Session, override_system: Optional[str], override_user: Optional[str]):
    """Stream codegen step updates with support for concurrent component generation."""
    session = _ensure_session(session)
    if not session.get("output_dir"):
        yield session, "", ""
        return

    output_dir, state_path, trace_path = _session_paths(session)
    state = PipelineState.load(state_path)
    instruction = str(session.get("instruction", ""))

    todo = _find_todo(state, TodoType.CODEGEN)
    if todo is None:
        yield session, "", ""
        return

    executor = TodoExecutor(
        verbose=True,
        use_cache=bool(session.get("use_cache", True)),
        output_dir=output_dir,
        state_path=state_path,
    )

    old_env = _with_llm_env(session, "codegen", override_system, override_user)
    result: dict = {"done": False, "log": "", "exc": None}

    def _worker():
        try:
            executor.execute_todo(todo, state, instruction)
            state.save(state_path)
            result["log"] = "[codegen] ok"
        except Exception as e:  # noqa: BLE001
            result["exc"] = e
        finally:
            result["done"] = True

    t = threading.Thread(target=_worker, daemon=True)
    t.start()

    pos = int(session.get("trace_pos", 0) or 0)
    records: List[dict] = []
    calls_html = ""
    resp_html = ""
    yield session, calls_html, resp_html

    try:
        while not result["done"]:
            # Read new trace records
            new_pos, new_records = _read_new_trace(trace_path, pos)
            if new_records:
                records.extend(new_records)
                pos = new_pos
            
            # Filter for codegen step
            step_records = _filter_records_for_step(records, "codegen")
            
            # Use dynamic HTML formatting for all components
            new_calls_html = _format_codegen_all_calls_html(step_records)
            new_resp_html = _format_codegen_all_responses_html(step_records, run_id=session.get("output_dir"))
            
            if new_calls_html != calls_html or new_resp_html != resp_html:
                calls_html, resp_html = new_calls_html, new_resp_html
            
            yield session, calls_html, resp_html
            time.sleep(0.2)

        # Final read
        new_pos, new_records = _read_new_trace(trace_path, pos)
        if new_records:
            records.extend(new_records)
            pos = new_pos
        
        step_records = _filter_records_for_step(records, "codegen")
        calls_html = _format_codegen_all_calls_html(step_records)
        resp_html = _format_codegen_all_responses_html(step_records, run_id=session.get("output_dir"))

        session["trace_pos"] = pos

        # Show tool log if no responses
        tool_log = result.get("log", "").strip()
        if tool_log and (not resp_html or len(resp_html) < 50):
            log_html = f"<div style='padding: 12px; color: #9ca3af;'>{_html.escape(tool_log)}</div>"
            if resp_html:
                resp_html = f"{resp_html}\n{log_html}"
            else:
                resp_html = log_html

        yield session, calls_html, resp_html
    finally:
        _restore_llm_env(old_env)


def run_step_codegen_stream_timed(session: Session, override_system: Optional[str], override_user: Optional[str]):
    t0 = time.perf_counter()
    for session, calls_html, resp_html in run_step_codegen_stream(session, override_system, override_user):
        elapsed = f"{(time.perf_counter() - t0):.2f}s"
        yield session, calls_html, resp_html, elapsed


def run_step_export(session: Session, active_theme_val: str = None) -> Tuple[Session, List[str], str, str]:
    session = _ensure_session(session)
    if not session.get("output_dir"):
        return session, [], "[error] Initialize first.", ""

    output_dir, state_path, _ = _session_paths(session)
    state = PipelineState.load(state_path)
    instruction = str(session.get("instruction", ""))

    # Update theme from UI only if user explicitly selected a value
    # When dropdown is None/unselected, preserve existing theme (generated or default)
    if active_theme_val is not None and active_theme_val != "":
        # User explicitly selected a dropdown theme - it is the active theme
        state.active_theme = active_theme_val
        session["active_theme"] = active_theme_val
        
        # Update all slides to use the dropdown theme
        for slide in (state.slides or []):
            if "parameters" not in slide:
                slide["parameters"] = {}
            slide["parameters"]["theme"] = active_theme_val
        
        state.save(state_path)

    todo = _find_todo(state, TodoType.EXPORT)
    if todo is None:
        return session, _as_downloadable_files(_collect_outputs(output_dir)), "[export] todo missing (run planner first)", ""

    executor = TodoExecutor(
        verbose=True,
        use_cache=bool(session.get("use_cache", True)),
        output_dir=output_dir,
        state_path=state_path,
    )

    buf = io.StringIO()
    with redirect_stdout(buf), redirect_stderr(buf):
        executor.execute_todo(todo, state, instruction)
        state.save(state_path)

    log = buf.getvalue().strip() or "[export] ok"
    files = _collect_outputs(output_dir)
    downloads = _as_downloadable_files(files)
    preview = "\n\n".join([log, "\n--- slides.mdx preview ---\n", _read_mdx_preview(output_dir)]).strip()
    
    # Auto-generate the preview iframe
    preview_html = ""
    if state.slides:
        ok, err = _ensure_react_preview_server()
        if ok:
            # Add timestamp to bust cache and force iframe refresh
            import time
            cache_bust = int(time.time() * 1000)
            url = f"http://127.0.0.1:3000/{output_dir.name}?t={cache_bust}"
            preview_html = (
                "<div style='margin-bottom:8px; display: flex; align-items: center; gap: 12px;'>"
                "<strong>Preview (React MDX renderer)</strong> "
                f"<a href=\"{_html.escape(url, quote=True)}\" target=\"_blank\" "
                "style=\"display: inline-block; padding: 6px 12px; background-color: #2563eb; color: white; "
                "text-decoration: none; border-radius: 6px; font-size: 0.9em; font-weight: 500;\">"
                "Open Slides in New Tab ↗</a>"
                "</div>"
                "<iframe "
                "style='width:100%;height:85vh;min-height:900px;border:1px solid #ddd;overflow:hidden;border-radius:8px;' "
                f"src=\"{_html.escape(url, quote=True)}\"></iframe>"
            )
        else:
            preview_html = f"<div>Preview failed: {_html.escape(err)}</div>"
    
    return session, downloads, preview, preview_html


_REACT_PREVIEW_PROC: Optional[subprocess.Popen] = None
_REACT_PREVIEW_LOCK = threading.Lock()


def _is_port_open(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=0.3):
            return True
    except Exception:
        return False


def _ensure_react_preview_server() -> Tuple[bool, str]:
    """Ensure Next dev server is running for the React MDX preview."""
    host = "127.0.0.1"
    port = 3000
    if _is_port_open(host, port):
        return True, ""

    react_dir = Path(__file__).parent / "src" / "paged" / "render" / "react"
    # ui.py lives at repo root, so build absolute path from cwd
    react_dir = Path.cwd() / "src" / "paged" / "render" / "react"
    if not react_dir.exists():
        return False, "React preview app not found at src/paged/render/react"

    with _REACT_PREVIEW_LOCK:
        global _REACT_PREVIEW_PROC
        if _is_port_open(host, port):
            return True, ""

        # If we already started a process and it died, clear it.
        if _REACT_PREVIEW_PROC is not None and _REACT_PREVIEW_PROC.poll() is not None:
            _REACT_PREVIEW_PROC = None

        if _REACT_PREVIEW_PROC is None:
            npm = "npm.cmd" if Path("C:/Windows").exists() else "npm"
            env = os.environ.copy()
            env["PORT"] = str(port)
            env["HOSTNAME"] = host
            try:
                _REACT_PREVIEW_PROC = subprocess.Popen(
                    [npm, "run", "dev", "--", "-p", str(port), "-H", host],
                    cwd=str(react_dir),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    env=env,
                )
            except Exception as e:  # noqa: BLE001
                _REACT_PREVIEW_PROC = None
                return False, f"Failed to start React preview server: {e}"

    # Wait briefly for server to come up
    t0 = time.time()
    while time.time() - t0 < 12:
        if _is_port_open(host, port):
            return True, ""
        time.sleep(0.25)

    return False, "React preview server did not start (check Node/npm deps)"


def get_export_preview(session: Session) -> Tuple[Session, str]:
    """Single Preview button: render slides in browser via React viewer."""
    session = _ensure_session(session)
    if not session.get("output_dir"):
        return session, "<div>Initialize first.</div>"

    output_dir, state_path, _ = _session_paths(session)
    if not state_path.exists():
        return session, "<div>state.json missing (run Initialize).</div>"

    state = PipelineState.load(state_path)
    if not (state.slides or []):
        return session, "<div>No slides in state (run story/content first).</div>"

    ok, err = _ensure_react_preview_server()
    if not ok:
        return session, f"<div>Preview failed: {_html.escape(err)}</div>"

    # Add timestamp to bust cache and force iframe refresh
    import time
    cache_bust = int(time.time() * 1000)
    url = f"http://127.0.0.1:3000/{output_dir.name}?t={cache_bust}"
    iframe = (
        "<div style='margin-bottom:8px; display: flex; align-items: center; gap: 12px;'>"
        "<strong>Preview (React MDX renderer)</strong> "
        f"<a href=\"{_html.escape(url, quote=True)}\" target=\"_blank\" "
        "style=\"display: inline-block; padding: 6px 12px; background-color: #2563eb; color: white; "
        "text-decoration: none; border-radius: 6px; font-size: 0.9em; font-weight: 500;\">"
        "Open Slides in New Tab ↗</a>"
        "</div>"
        "<iframe "
        "style='width:100%;height:85vh;min-height:900px;border:1px solid #ddd;overflow:hidden;border-radius:8px;' "
        f"src=\"{_html.escape(url, quote=True)}\"></iframe>"
    )
    return session, iframe


def build_ui() -> gr.Blocks:
    with gr.Blocks(title="UCE Pipeline UI") as demo:
        gr.HTML(f"<style>{UI_CSS}</style>")
        gr.Markdown("# UCE Pipeline UI\nInitialize a session, then run each step.")

        session_state = gr.State({})

        source_state = gr.State(None)

        with gr.Row():
            import_progress_upload = gr.UploadButton(
                "Import progress",
                file_count="single",
                variant="secondary",
                scale=1,
            )
            export_progress_btn = gr.Button("Export progress", scale=0, min_width=160)
            export_progress_download = gr.DownloadButton(
                "Download progress.json",
                value=None,
                visible=False,
                elem_id="export_progress_download",
                scale=0,
                min_width=220,
            )
            export_progress_done = gr.Textbox(
                label="",
                value="",
                visible=False,
                elem_id="export_progress_done",
            )

        with gr.Row():
            source_name = gr.Textbox(
                label="Source file",
                lines=1,
                max_lines=1,
                interactive=False,
                elem_classes=["path-dark"],
                scale=1,
            )
            source_upload = gr.UploadButton(
                "Upload",
                file_count="single",
                variant="secondary",
                size="lg",
                scale=0,
                min_width=120,
            )

        def _on_source_uploaded(f):
            if f is None:
                return None, ""
            name = getattr(f, "name", "")
            return f, name or ""

        source_upload.upload(
            fn=_on_source_uploaded,
            inputs=[source_upload],
            outputs=[source_state, source_name],
        )

        with gr.Row():
            instruction_text = gr.Textbox(
                label="User instruction (optional)",
                lines=1,
                max_lines=1,
                elem_classes=["path-dark"],
            )

        with gr.Row():
            output_name = gr.Textbox(label="Output name (under output/)", value=f"ui_run_{_now_id()}")
            project = gr.Dropdown(label="Project", choices=["react-mdx", "slidev"], value="react-mdx")
            active_theme = gr.Dropdown(
                label="Active Theme (preset) - leave unselected to use generated theme",
                choices=["base", "business", "cyber", "minimal", "academic", "creative", "duolingo", "dark"],
                value=None,
            )
            use_cache = gr.Checkbox(label="Use cache", value=False)

        init_btn = gr.Button("Initialize")

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 0) planner")
            with gr.Column(scale=1, min_width=50):
                planner_refresh = gr.Button("🔄", elem_classes=["refresh-btn"])
            with gr.Column(scale=1, min_width=50):
                planner_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                planner_timer = gr.HTML(value="", elem_id="planner_timer")

        with gr.Row():
            with gr.Column(scale=10):
                with gr.Accordion("Prompts", open=False):
                    planner_default_sys = gr.Code(
                        label="system prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
                    planner_default_user = gr.Code(
                        label="user prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
        with gr.Row():
            with gr.Column():
                planner_sent = gr.Textbox(label="call", lines=8, max_lines=8)
            with gr.Column():
                planner_resp = gr.Textbox(label="response", lines=8, max_lines=8)

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 1) constitution")
            with gr.Column(scale=1, min_width=50):
                # Placeholder for refresh alignment
                pass
            with gr.Column(scale=1, min_width=50):
                constitution_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                # Placeholder for timer alignment
                pass
        constitution_result = gr.Textbox(label="constitution result", lines=8, max_lines=8)

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 2) atoms")
            with gr.Column(scale=1, min_width=50):
                atoms_refresh = gr.Button("🔄", elem_classes=["refresh-btn"])
            with gr.Column(scale=1, min_width=50):
                atoms_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                atoms_timer = gr.HTML(value="", elem_id="atoms_timer")

        with gr.Row():
            with gr.Column(scale=10):
                with gr.Accordion("Prompts", open=False):
                    atoms_default_sys = gr.Code(
                        label="system prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
                    atoms_default_user = gr.Code(
                        label="user prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
        with gr.Row():
            with gr.Column():
                atoms_sent = gr.Textbox(label="call", lines=8, max_lines=8)
            with gr.Column():
                atoms_resp = gr.Textbox(label="response", lines=8, max_lines=8)
        
        atoms_table = gr.Dataframe(
            headers=["ID", "Subtype", "Visual", "Abstract"],
            label="Atoms",
            wrap=True,
        )

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 3) theme")
            with gr.Column(scale=1, min_width=50):
                theme_refresh = gr.Button("🔄", elem_classes=["refresh-btn"])
            with gr.Column(scale=1, min_width=50):
                theme_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                theme_timer = gr.HTML(value="", elem_id="theme_timer")

        with gr.Row():
            with gr.Column(scale=10):
                with gr.Accordion("Prompts", open=False):
                    theme_default_sys = gr.Code(
                        label="system prompt",
                        value=get_theme_creation_config().system_prompt,
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
                    theme_default_user = gr.Code(
                        label="user prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
        theme_result = gr.Textbox(label="theme result (no LLM)", lines=6, max_lines=6, visible=False)
        with gr.Row():
            with gr.Column():
                theme_sent = gr.Textbox(label="call", lines=8, max_lines=8, visible=True)
            with gr.Column():
                theme_resp = gr.Textbox(label="response", lines=8, max_lines=8, visible=True)

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 4) story")
            with gr.Column(scale=1, min_width=50):
                story_refresh = gr.Button("🔄", elem_classes=["refresh-btn"])
            with gr.Column(scale=1, min_width=50):
                story_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                story_timer = gr.HTML(value="", elem_id="story_timer")

        with gr.Row():
            with gr.Column(scale=10):
                with gr.Accordion("Prompts", open=False):
                    story_default_sys = gr.Code(
                        label="system prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
                    story_default_user = gr.Code(
                        label="user prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
        with gr.Row():
            with gr.Column():
                story_sent = gr.Textbox(label="call", lines=8, max_lines=8)
            with gr.Column():
                story_resp = gr.Textbox(label="response", lines=8, max_lines=8)

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 5) content")
            with gr.Column(scale=1, min_width=50):
                content_refresh = gr.Button("🔄", elem_classes=["refresh-btn"])
            with gr.Column(scale=1, min_width=50):
                content_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                content_timer = gr.HTML(value="", elem_id="content_timer")

        with gr.Row():
            with gr.Column(scale=10):
                with gr.Accordion("Prompts", open=False):
                    content_default_sys = gr.Code(
                        label="system prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
                    content_default_user = gr.Code(
                        label="user prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
        with gr.Row():
            with gr.Column():
                content_sent = gr.Textbox(label="call", lines=8, max_lines=8)
            with gr.Column():
                content_resp = gr.Textbox(label="response", lines=8, max_lines=8)

        gr.Markdown("### Slides")
        story_slides_display = gr.HTML(label="Slides")

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 6) codegen")
            with gr.Column(scale=1, min_width=50):
                codegen_refresh = gr.Button("🔄", elem_classes=["refresh-btn"])
            with gr.Column(scale=1, min_width=50):
                codegen_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                codegen_timer = gr.HTML(value="", elem_id="codegen_timer")

        with gr.Row():
            with gr.Column(scale=10):
                with gr.Accordion("Prompts", open=False):
                    codegen_default_sys = gr.Code(
                        label="system prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
                    codegen_default_user = gr.Code(
                        label="user prompt",
                        language="markdown",
                        lines=8,
                        max_lines=8,
                        elem_classes=["code-fixed"],
                        interactive=True,
                    )
        with gr.Row():
            with gr.Column():
                gr.Markdown("**Calls**")
                codegen_calls_html = gr.HTML(value="", label="calls")
            with gr.Column():
                gr.Markdown("**Responses**")
                codegen_resp_html = gr.HTML(value="", label="responses")

        with gr.Row():
            with gr.Column(scale=9):
                 gr.Markdown("## 7) export")
            with gr.Column(scale=1, min_width=50):
                pass
            with gr.Column(scale=1, min_width=50):
                export_run = gr.Button("Run")
            with gr.Column(scale=1, min_width=60):
                pass

        export_preview_btn = gr.Button("Preview")
        export_preview_link = gr.HTML(label="preview")
        output_files = gr.Files(label="produced files")
        export_preview = gr.Code(
            label="export preview",
            language="markdown",
            lines=10,
            max_lines=10,
            elem_classes=["code-fixed"],
        )

        init_btn.click(
            fn=init_session,
            inputs=[source_state, instruction_text, output_name, project, active_theme, use_cache],
            outputs=[
                session_state,
                planner_default_sys,
                planner_default_user,
                atoms_default_sys,
                atoms_default_user,
                theme_default_sys,
                theme_default_user,
                story_default_sys,
                story_default_user,
                content_default_sys,
                content_default_user,
                codegen_default_sys,
                codegen_default_user,
            ],
        )

        export_progress_btn.click(
            fn=export_progress,
            inputs=[
                session_state,
                planner_default_sys,
                planner_default_user,
                atoms_default_sys,
                atoms_default_user,
                theme_default_sys,
                theme_default_user,
                story_default_sys,
                story_default_user,
                content_default_sys,
                content_default_user,
                codegen_default_sys,
                codegen_default_user,
            ],
            outputs=[session_state, export_progress_download, export_progress_done],
        )

        export_progress_done.change(
            fn=None,
            inputs=None,
            outputs=None,
            js="""
() => {
    const tryClick = () => {
        const root = document.getElementById('export_progress_download');
        if (!root) return false;
        const el = root.querySelector('a, button, input[type="button"], input[type="submit"]');
        if (el && typeof el.click === 'function') {
            el.click();
            return true;
        }
        return false;
    };

    // Wait a bit for Gradio to render the download target.
    let tries = 0;
    const timer = setInterval(() => {
        tries += 1;
        let ok = false;
        try { ok = tryClick(); } catch (e) { ok = false; }
        if (ok || tries >= 50) clearInterval(timer);
    }, 100);
}
""",
        )

        def _on_import_uploaded(f):
            return import_progress(f)

        import_progress_upload.upload(
            fn=_on_import_uploaded,
            inputs=[import_progress_upload],
            outputs=[
                session_state,
                source_name,
                instruction_text,
                output_name,
                project,
                active_theme,
                use_cache,
                planner_default_sys,
                planner_default_user,
                atoms_default_sys,
                atoms_default_user,
                theme_default_sys,
                theme_default_user,
                story_default_sys,
                story_default_user,
                content_default_sys,
                content_default_user,
                codegen_default_sys,
                codegen_default_user,
                constitution_result,
                planner_sent,
                planner_resp,
                atoms_sent,
                atoms_resp,
                atoms_table,
                theme_result,
                theme_sent,
                theme_resp,
                story_sent,
                story_resp,
                story_slides_display,
                content_sent,
                content_resp,
            ],
        )

        planner_run.click(
            fn=run_step_planner_stream_with_overrides_timed,
            inputs=[session_state, planner_default_sys, planner_default_user],
            outputs=[session_state, planner_sent, planner_resp, planner_timer],
        )

        constitution_run.click(
            fn=run_step_constitution,
            inputs=[session_state],
            outputs=[session_state, constitution_result],
        )

        atoms_run.click(
            fn=run_step_atoms_and_refresh_stream_timed,
            inputs=[session_state, atoms_default_sys, atoms_default_user],
            outputs=[
                session_state,
                atoms_sent,
                atoms_resp,
                atoms_table,
                story_default_sys,
                story_default_user,
                content_default_sys,
                content_default_user,
                atoms_timer,
            ],
        )

        theme_run.click(
            fn=run_step_theme_stream_timed,
            inputs=[session_state, theme_default_sys, theme_default_user],
            outputs=[session_state, theme_result, theme_sent, theme_resp, theme_timer, active_theme],
        )

        story_run.click(
            fn=run_step_story_and_refresh_stream_timed,
            inputs=[session_state, story_default_sys, story_default_user],
            outputs=[
                session_state,
                story_sent,
                story_resp,
                story_slides_display,
                content_default_sys,
                content_default_user,
                story_timer,
            ],
        )

        content_run.click(
            fn=run_step_content_stream_timed,
            inputs=[session_state, content_default_sys, content_default_user],
            outputs=[session_state, content_sent, content_resp, story_slides_display, content_timer],
        )

        codegen_run.click(
            fn=run_step_codegen_stream_timed,
            inputs=[session_state, codegen_default_sys, codegen_default_user],
            outputs=[session_state, codegen_calls_html, codegen_resp_html, codegen_timer],
        )

        export_run.click(
            fn=run_step_export,
            inputs=[session_state, active_theme],
            outputs=[session_state, output_files, export_preview, export_preview_link],
        )

        export_preview_btn.click(
            fn=get_export_preview,
            inputs=[session_state],
            outputs=[session_state, export_preview_link],
        )

        # Refresh prompt buttons - re-populate with built-in defaults
        planner_refresh.click(
            fn=refresh_prompt_planner,
            inputs=[session_state],
            outputs=[planner_default_sys, planner_default_user, planner_sent, planner_resp],
        )

        atoms_refresh.click(
            fn=refresh_prompt_atoms,
            inputs=[session_state],
            outputs=[atoms_default_sys, atoms_default_user, atoms_sent, atoms_resp],
        )

        theme_refresh.click(
            fn=refresh_prompt_theme,
            inputs=[session_state],
            outputs=[theme_default_sys, theme_default_user, theme_sent, theme_resp],
        )

        story_refresh.click(
            fn=refresh_prompt_story,
            inputs=[session_state],
            outputs=[story_default_sys, story_default_user, story_sent, story_resp],
        )

        content_refresh.click(
            fn=refresh_prompt_content,
            inputs=[session_state],
            outputs=[content_default_sys, content_default_user, content_sent, content_resp],
        )

        codegen_refresh.click(
            fn=refresh_prompt_codegen,
            inputs=[session_state],
            outputs=[codegen_default_sys, codegen_default_user, codegen_calls_html, codegen_resp_html],
        )

    return demo


if __name__ == "__main__":
    from fastapi import FastAPI, Request
    from fastapi.responses import HTMLResponse, JSONResponse
    import uvicorn
    import signal
    import sys

    # Force exit on Ctrl+C without waiting for connections to close
    def _force_exit(signum, frame):
        print("\nShutting down...")
        sys.exit(0)

    signal.signal(signal.SIGINT, _force_exit)
    signal.signal(signal.SIGTERM, _force_exit)

    demo = build_ui()
    app = FastAPI()

    @app.get("/component", response_class=HTMLResponse)
    def component_viewer(name: str = ""):
        return HTMLResponse(_get_component_source_html(name))

    @app.get("/component-preview", response_class=HTMLResponse)
    def component_preview(name: str = "", run_id: Optional[str] = None):
        return HTMLResponse(_get_component_preview_html(name, run_id))
    
    @app.post("/regenerate-component")
    async def regenerate_component_endpoint(request: Request):
        """API endpoint to regenerate a single component."""
        try:
            body = await request.json()
            component_id = body.get("component_id", "")
            system_prompt = body.get("system_prompt", "")
            user_prompt = body.get("user_prompt", "")
            
            # Get current session from global state (simplified)
            # In production, you'd want proper session management
            # For now, we'll use a global session variable or file-based approach
            
            # Try to find the most recent session
            output_dirs = sorted(
                [d for d in Path("output").glob("*") if d.is_dir()],
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            if not output_dirs:
                return JSONResponse({"success": False, "error": "No output directory found"})
            
            output_dir = output_dirs[0]
            state_path = output_dir / "state.json"
            trace_file = output_dir / "llm_trace.jsonl"
            
            session = {
                "output_dir": str(output_dir),
                "trace_file": str(trace_file) if trace_file.exists() else None
            }
            
            result = regenerate_single_component(
                component_id, system_prompt, user_prompt, session
            )
            
            return JSONResponse(result)
        except Exception as e:
            import traceback
            return JSONResponse({
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            })

    app = gr.mount_gradio_app(app, demo, path="/")
    uvicorn.run(app, host="127.0.0.1", port=7860)
