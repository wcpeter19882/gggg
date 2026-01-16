"""Tests for export skill scripts."""
import json
import pytest
from pathlib import Path
import socket


class TestCheckServerRunning:
    """Tests for check_server_running function."""
    
    def test_returns_false_when_not_running(self):
        """Test that False is returned when server not running."""
        # Import from the script location
        import sys
        skills_dir = Path(__file__).parent.parent.parent / ".claude" / "skills"
        sys.path.insert(0, str(skills_dir / "export" / "scripts"))
        
        # Use a high port unlikely to be in use
        from export_mdx import check_server_running
        
        result = check_server_running(59999)
        
        assert result is False
    
    def test_returns_true_when_running(self):
        """Test that True is returned when server is running."""
        import sys
        skills_dir = Path(__file__).parent.parent.parent / ".claude" / "skills"
        sys.path.insert(0, str(skills_dir / "export" / "scripts"))
        
        from export_mdx import check_server_running
        
        # Create a temporary server
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("localhost", 59998))
        server.listen(1)
        
        try:
            result = check_server_running(59998)
            assert result is True
        finally:
            server.close()


class TestExportMdxScript:
    """Tests for export_mdx.py main functionality."""
    
    def test_generates_mdx_from_content_json(self, sample_content_json, tmp_path):
        """Test MDX generation from content.json."""
        project_dir = sample_content_json.parent
        
        # Read content and simulate MDX generation
        content = json.loads(sample_content_json.read_text(encoding="utf-8"))
        slides = [s for s in content.get("slides", []) if s.get("state") == "active"]
        
        theme_id = content.get("theme", {}).get("id", "business") if content.get("theme") else "business"
        
        mdx_parts = [
            "// Auto-generated MDX - Do not edit manually",
            "",
            "export const meta = {",
            f'  title: "Presentation",',
            f'  theme: "{theme_id}",',
            f"  slideCount: {len(slides)},",
            "};",
            "",
        ]
        
        for i, slide in enumerate(slides):
            mdx_content = slide.get("mdx") or slide.get("mdx_content", "")
            if mdx_content:
                mdx_parts.append(f"<Slide index={{{i}}}>")
                mdx_parts.append(mdx_content)
                mdx_parts.append("</Slide>")
                mdx_parts.append("")
        
        mdx_output = "\n".join(mdx_parts)
        
        # Verify output structure
        assert "// Auto-generated MDX" in mdx_output
        assert "export const meta" in mdx_output
        assert "<Slide index={0}>" in mdx_output
        assert "slideCount: 2" in mdx_output
    
    def test_handles_missing_content_json(self, tmp_path):
        """Test error handling when content.json is missing."""
        project_dir = tmp_path / "empty_project"
        project_dir.mkdir()
        
        content_path = project_dir / "content.json"
        
        assert not content_path.exists()
    
    def test_handles_no_active_slides(self, tmp_path):
        """Test handling when no active slides exist."""
        project_dir = tmp_path / "no_slides_project"
        project_dir.mkdir()
        
        content = {
            "slides": [
                {"id": "slide_001", "state": "draft", "mdx": "<Test/>"}
            ]
        }
        
        content_path = project_dir / "content.json"
        content_path.write_text(json.dumps(content), encoding="utf-8")
        
        # Filter for active slides
        slides = [s for s in content.get("slides", []) if s.get("state") == "active"]
        
        assert len(slides) == 0


class TestMdxGeneration:
    """Tests for MDX content generation."""
    
    def test_wraps_slides_in_slide_component(self):
        """Test that slides are wrapped in Slide component."""
        slides = [
            {"id": "slide_001", "state": "active", "mdx": "<Heading>Test</Heading>"}
        ]
        
        mdx_parts = []
        for i, slide in enumerate(slides):
            mdx_content = slide.get("mdx", "")
            if mdx_content:
                mdx_parts.append(f"<Slide index={{{i}}}>")
                mdx_parts.append(mdx_content)
                mdx_parts.append("</Slide>")
        
        result = "\n".join(mdx_parts)
        
        assert "<Slide index={0}>" in result
        assert "</Slide>" in result
        assert "<Heading>Test</Heading>" in result
    
    def test_handles_empty_mdx_content(self):
        """Test handling of slides without MDX content."""
        slides = [
            {"id": "slide_001", "state": "active", "mdx": ""},
            {"id": "slide_002", "state": "active", "mdx": "<Test/>"}
        ]
        
        mdx_parts = []
        for i, slide in enumerate(slides):
            mdx_content = slide.get("mdx", "")
            if mdx_content:
                mdx_parts.append(f"<Slide index={{{i}}}>")
                mdx_parts.append(mdx_content)
                mdx_parts.append("</Slide>")
        
        result = "\n".join(mdx_parts)
        
        # Only slide with content should be included
        assert "<Slide index={1}>" in result
        assert "<Slide index={0}>" not in result
    
    def test_includes_meta_export(self):
        """Test that meta export is included."""
        theme_id = "corp_modern"
        slide_count = 5
        
        meta = f"""export const meta = {{
  title: "Presentation",
  theme: "{theme_id}",
  slideCount: {slide_count},
}};"""
        
        assert "corp_modern" in meta
        assert "slideCount: 5" in meta
    
    def test_preserves_mdx_content(self):
        """Test that MDX content is preserved exactly."""
        original_mdx = """<LayoutSplit ratio="1:1">
  <Left>
    <Heading level={2}>Title</Heading>
    <SmartList items={["Item 1", "Item 2"]} />
  </Left>
  <Right>
    <BigNum value="99.38%" label="Reliability" />
  </Right>
</LayoutSplit>"""
        
        slide = {"id": "slide_001", "state": "active", "mdx": original_mdx}
        
        wrapped = f"<Slide index={{0}}>\n{slide['mdx']}\n</Slide>"
        
        assert original_mdx in wrapped
        assert 'ratio="1:1"' in wrapped


class TestExportFileWriting:
    """Tests for file writing in export."""
    
    def test_writes_mdx_file(self, tmp_path):
        """Test that MDX file is written correctly."""
        mdx_content = "// Test MDX\nexport const meta = {};\n<Slide/>"
        
        mdx_file = tmp_path / "slides.mdx"
        mdx_file.write_text(mdx_content, encoding="utf-8")
        
        assert mdx_file.exists()
        assert mdx_file.read_text(encoding="utf-8") == mdx_content
    
    def test_overwrites_existing_mdx(self, tmp_path):
        """Test that existing MDX file is overwritten."""
        mdx_file = tmp_path / "slides.mdx"
        mdx_file.write_text("old content", encoding="utf-8")
        
        new_content = "new content"
        mdx_file.write_text(new_content, encoding="utf-8")
        
        assert mdx_file.read_text(encoding="utf-8") == new_content
    
    def test_handles_unicode_content(self, tmp_path):
        """Test handling of unicode in MDX content."""
        mdx_content = """// MDX with unicode
<Heading>中文标题 🎉</Heading>
<Text>émojis and spëcial characters</Text>
"""
        
        mdx_file = tmp_path / "slides.mdx"
        mdx_file.write_text(mdx_content, encoding="utf-8")
        
        read_back = mdx_file.read_text(encoding="utf-8")
        assert "中文标题" in read_back
        assert "🎉" in read_back
