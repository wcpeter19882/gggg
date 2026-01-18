#!/usr/bin/env python3
"""Validate slide layouts for whitespace and balance issues.

This script reads active slides from content.json, runs layout validation,
and saves issues back to content.json for refinement.

Usage:
    python scripts/validate_layouts.py --project DIR
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

# Add paths for imports
_skill_dir = Path(__file__).parent.parent
_lib_dir = _skill_dir.parent / "_lib"
_repo_root = _skill_dir.parent.parent.parent

sys.path.insert(0, str(_lib_dir))
sys.path.insert(0, str(_repo_root / "src" / "paged" / "layout" / "react"))

# Import layout validator
try:
    from layout_validator import (
        analyze_slide_whitespace,
        LayoutIssue,
        LayoutIssueType,
    )
    VALIDATOR_AVAILABLE = True
except ImportError:
    VALIDATOR_AVAILABLE = False


def issue_to_dict(issue: "LayoutIssue") -> Dict[str, Any]:
    """Convert LayoutIssue to serializable dict."""
    return {
        "issue_type": issue.issue_type.value,
        "severity": issue.severity,
        "slide_id": issue.slide_id,
        "location": issue.location,
        "description": issue.description,
        "suggestion": issue.suggestion,
        "affected_elements": issue.affected_elements,
    }


def validate_slides(content: Dict[str, Any]) -> Dict[str, Any]:
    """Validate all active slides in content.json.
    
    Args:
        content: Parsed content.json dict
        
    Returns:
        Validation result dict with issues
    """
    slides_data = content.get("slides", {})
    # Handle both direct list and nested {slides: [...]} structure
    if isinstance(slides_data, dict):
        slides = slides_data.get("slides", [])
    else:
        slides = slides_data
    
    # Filter to active slides with MDX
    active_slides = [
        s for s in slides 
        if s.get("state") == "active" and s.get("mdx")
    ]
    
    if not active_slides:
        return {
            "total_slides": 0,
            "slides_with_errors": 0,
            "slides_with_warnings": 0,
            "total_errors": 0,
            "total_warnings": 0,
            "status": "ok",
            "issues": [],
            "slide_summaries": [],
        }
    
    all_issues = []
    slide_summaries = []
    total_slides = len(active_slides)
    
    for idx, slide in enumerate(active_slides):
        slide_id = slide.get("id", f"slide_{idx+1:02d}")
        mdx = slide.get("mdx", "")
        
        # Determine if cover/closing
        is_first = (idx == 0)
        is_last = (idx == total_slides - 1)
        is_cover = "<LayoutCover" in mdx or is_first or is_last
        
        # Run validation
        if VALIDATOR_AVAILABLE:
            issues = analyze_slide_whitespace(mdx, slide_id, is_cover)
        else:
            issues = []
        
        # Convert issues to dicts
        issue_dicts = [issue_to_dict(i) for i in issues]
        all_issues.extend(issue_dicts)
        
        # Summarize slide
        error_count = sum(1 for i in issues if i.severity == "error")
        warning_count = sum(1 for i in issues if i.severity == "warning")
        
        slide_summaries.append({
            "slide_id": slide_id,
            "errors": error_count,
            "warnings": warning_count,
            "status": "error" if error_count > 0 else ("warning" if warning_count > 0 else "ok"),
        })
    
    # Calculate totals
    total_errors = sum(1 for i in all_issues if i["severity"] == "error")
    total_warnings = sum(1 for i in all_issues if i["severity"] == "warning")
    slides_with_errors = sum(1 for s in slide_summaries if s["status"] == "error")
    slides_with_warnings = sum(1 for s in slide_summaries if s["status"] == "warning")
    
    # Determine status
    if total_errors > 0:
        status = "needs_refinement"
    elif total_warnings > 0:
        status = "has_warnings"
    else:
        status = "ok"
    
    return {
        "total_slides": total_slides,
        "slides_with_errors": slides_with_errors,
        "slides_with_warnings": slides_with_warnings,
        "total_errors": total_errors,
        "total_warnings": total_warnings,
        "status": status,
        "issues": all_issues,
        "slide_summaries": slide_summaries,
        "validated_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate slide layouts for whitespace issues"
    )
    parser.add_argument("--project", "-p", required=True, help="Project directory")
    
    args = parser.parse_args()
    
    project_dir = Path(args.project)
    content_json_path = project_dir / "content.json"
    
    if not content_json_path.exists():
        print(json.dumps({"error": f"content.json not found at {content_json_path}"}))
        return 1
    
    # Read content.json
    content = json.loads(content_json_path.read_text(encoding="utf-8"))
    
    # Run validation
    result = validate_slides(content)
    
    # Save issues to content.json
    content["issues"] = result
    
    # Update metadata
    if "metadata" not in content:
        content["metadata"] = {}
    content["metadata"]["last_validated"] = result["validated_at"]
    
    # Write back
    content_json_path.write_text(
        json.dumps(content, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    
    # Output result
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
