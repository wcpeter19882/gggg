"""Constitution handler - save utility (no LLM).

Constitution is extracted by the Orchestrator and saved by this handler.
This is a DirectTool pattern - pure I/O, no LLM calls.

Constitution is FREE-FORM MARKDOWN that defines global rules for the presentation.
Common fields (but not required):
- Tone/style
- Target audience  
- Slide count
- Content requirements
- Content exclusions

The orchestrator extracts constitution from user instruction as part of its
normal LLM call, then uses this handler to persist it.
"""
import json
from pathlib import Path
from typing import Any


class ConstitutionHandler:
    """Constitution save handler - no LLM, just persistence.
    
    Constitution is free-form markdown text, not structured JSON.
    
    Usage:
        handler = ConstitutionHandler()
        result = handler.save_output(project_dir, constitution_markdown)
    """
    
    def save_output(self, project_dir: str, constitution: Any) -> dict:
        """Save constitution markdown to constitution.md and content.json.
        
        Args:
            project_dir: Project directory path
            constitution: Constitution as markdown string
            
        Returns:
            Result dict with success status
        """
        # Ensure it's a string
        if isinstance(constitution, dict):
            # Legacy support: convert dict to markdown
            constitution = self._dict_to_markdown(constitution)
        elif not isinstance(constitution, str):
            constitution = str(constitution) if constitution else ""
        
        constitution = constitution.strip()
        
        # Save to constitution.md (primary)
        constitution_md_path = Path(project_dir) / "constitution.md"
        constitution_md_path.write_text(constitution, encoding="utf-8")
        
        # Also store in content.json as string for easy access
        content_json_path = Path(project_dir) / "content.json"
        if content_json_path.exists():
            content = json.loads(content_json_path.read_text(encoding="utf-8"))
        else:
            content = {}
        
        content["constitution"] = constitution  # Store as string, not dict
        content_json_path.write_text(json.dumps(content, indent=2), encoding="utf-8")
        
        return {
            "success": True,
            "target": "constitution",
            "length": len(constitution),
        }
    
    def _dict_to_markdown(self, data: dict) -> str:
        """Convert legacy dict format to markdown (backwards compatibility)."""
        lines = ["# Constitution", ""]
        
        if data.get("tone"):
            lines.append(f"**Tone:** {data['tone']}")
        
        if data.get("target_slides"):
            lines.append(f"**Target Slides:** {data['target_slides']}")
        
        if data.get("audience"):
            lines.append(f"**Audience:** {data['audience']}")
        
        if data.get("density"):
            lines.append(f"**Density:** {data['density']}")
        
        lines.append("")
        
        if data.get("style_rules"):
            lines.append("## Style Rules")
            for rule in data["style_rules"]:
                lines.append(f"- {rule}")
            lines.append("")
        
        if data.get("content_requirements"):
            lines.append("## Must Include")
            for req in data["content_requirements"]:
                lines.append(f"- {req}")
            lines.append("")
        
        if data.get("content_exclusions"):
            lines.append("## Must NOT Include")
            for exc in data["content_exclusions"]:
                lines.append(f"- {exc}")
            lines.append("")
        
        return "\n".join(lines)
