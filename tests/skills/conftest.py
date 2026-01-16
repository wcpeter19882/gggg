"""Pytest configuration for skills tests."""
import sys
from pathlib import Path

import pytest

# Add skills directories to path
REPO_ROOT = Path(__file__).parent.parent.parent
SKILLS_DIR = REPO_ROOT / ".claude" / "skills"

sys.path.insert(0, str(SKILLS_DIR / "content-manager"))
sys.path.insert(0, str(SKILLS_DIR / "atom"))
sys.path.insert(0, str(SKILLS_DIR / "export"))
sys.path.insert(0, str(SKILLS_DIR / "_lib"))


@pytest.fixture
def temp_project_dir(tmp_path):
    """Create a temporary project directory structure."""
    project_dir = tmp_path / "test_project_abc12345"
    project_dir.mkdir()
    (project_dir / "files").mkdir()
    (project_dir / "patches").mkdir()
    (project_dir / "output").mkdir()
    return project_dir


@pytest.fixture
def sample_source_content():
    """Sample markdown source content for testing."""
    return """# Executive Summary

We are building a new platform with significant business impact.

## Key Metrics

- MAU: 136,000 (+1.9%)
- Revenue: $2.5M quarterly
- Customer satisfaction: 85%

## Customer Pain Points

1. Accuracy on technical terms is poor
2. Latency affects user experience
3. Integration complexity

## Vision

Unified platform delivering 99%+ reliability.

> "This will transform how we work" — CEO
"""


@pytest.fixture
def sample_content_json(temp_project_dir, sample_source_content):
    """Create a sample content.json file."""
    import json
    
    content = {
        "project": {
            "id": "test_project_abc12345",
            "source_name": "test_project",
            "hash": "abc12345",
            "directory": str(temp_project_dir),
            "created_at": "2026-01-12T00:00:00+00:00",
            "updated_at": "2026-01-12T00:00:00+00:00"
        },
        "constitution": {
            "tone": "professional",
            "style_rules": ["Start with title slide"],
            "content_exclusions": [],
            "content_requirements": [],
            "target_slides": 10
        },
        "theme": {
            "id": "corp_modern",
            "name": "Corporate Modern",
            "colors": {
                "primary": "#0078d4",
                "secondary": "#666666",
                "accent": "#ffc83d",
                "background": "#ffffff",
                "text": "#1a1a1a"
            },
            "fonts": {
                "heading": "Inter",
                "body": "Inter",
                "mono": "JetBrains Mono"
            },
            "spacing": {
                "page_margin": "48px",
                "content_gap": "24px"
            }
        },
        "atoms": {
            "atoms": [
                {
                    "id": "stat_001",
                    "type": "STAT",
                    "content": "MAU: 136,000 (+1.9%)",
                    "source_ref": "",
                    "metadata": {"confidence": 0.9, "keywords": []}
                },
                {
                    "id": "quote_001",
                    "type": "QUOTE",
                    "content": "This will transform how we work",
                    "source_ref": "",
                    "metadata": {"confidence": 0.95, "keywords": []}
                }
            ],
            "source_hash": "test_hash_12345"
        },
        "slides": [
            {
                "id": "slide_001",
                "state": "active",
                "story": "HEADLINE: Test Presentation",
                "atoms": [],
                "density": "sparse",
                "visual_design": "LayoutCover",
                "mdx": "<LayoutCover><Heading level={1}>Test</Heading></LayoutCover>"
            },
            {
                "id": "slide_002",
                "state": "active",
                "story": "HEADLINE: Key Metrics",
                "atoms": ["stat_001"],
                "density": "normal",
                "visual_design": "LayoutDashboard",
                "mdx": "<LayoutDashboard><Heading level={2}>Metrics</Heading></LayoutDashboard>"
            }
        ],
        "metadata": {
            "version": 1,
            "pipeline_stage": "exported",
            "last_instruction": "Create executive presentation"
        }
    }
    
    content_path = temp_project_dir / "content.json"
    content_path.write_text(json.dumps(content, indent=2), encoding="utf-8")
    
    # Also write source file
    source_path = temp_project_dir / "files" / "source.md"
    source_path.write_text(sample_source_content, encoding="utf-8")
    
    return content_path
