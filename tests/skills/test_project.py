"""Tests for content-manager project module."""
import pytest
from datetime import datetime


class TestGenerateProjectId:
    """Tests for generate_project_id function."""
    
    def test_basic_generation(self):
        """Test basic project ID generation."""
        from project import generate_project_id
        
        project_id = generate_project_id("my_document", "Hello World")
        
        # Should be source_name + underscore + 8 hex chars
        assert "_" in project_id
        parts = project_id.rsplit("_", 1)
        assert len(parts) == 2
        assert parts[0] == "my_document"
        assert len(parts[1]) == 8
        # Hash should be hex
        int(parts[1], 16)  # Should not raise
    
    def test_sanitizes_special_characters(self):
        """Test that special characters are sanitized."""
        from project import generate_project_id
        
        project_id = generate_project_id("My Document (v2)", "content")
        
        # Special chars should become underscores
        assert "(" not in project_id
        assert ")" not in project_id
        assert " " not in project_id
        assert project_id.startswith("my_document_v2_")
    
    def test_lowercase_conversion(self):
        """Test that source name is lowercased."""
        from project import generate_project_id
        
        project_id = generate_project_id("MyDocument", "content")
        
        assert project_id.startswith("mydocument_")
    
    def test_deterministic_hash(self):
        """Test that same content produces same hash."""
        from project import generate_project_id
        
        id1 = generate_project_id("doc", "same content")
        id2 = generate_project_id("doc", "same content")
        
        assert id1 == id2
    
    def test_different_content_different_hash(self):
        """Test that different content produces different hash."""
        from project import generate_project_id
        
        id1 = generate_project_id("doc", "content A")
        id2 = generate_project_id("doc", "content B")
        
        assert id1 != id2
    
    def test_removes_multiple_underscores(self):
        """Test that multiple consecutive underscores are collapsed."""
        from project import generate_project_id
        
        project_id = generate_project_id("my___document", "content")
        
        assert "___" not in project_id


class TestCreateProject:
    """Tests for create_project function."""
    
    def test_creates_project_instance(self):
        """Test that create_project returns a Project instance."""
        from project import create_project, Project
        
        project = create_project("test_doc", "test content")
        
        assert isinstance(project, Project)
        assert project.source_name == "test_doc"
        assert len(project.hash) == 8
    
    def test_project_has_required_fields(self):
        """Test that Project has all required fields."""
        from project import create_project
        
        project = create_project("test", "content")
        
        assert project.id
        assert project.source_name
        assert project.hash
        assert project.directory
        assert project.created_at
        assert project.updated_at
    
    def test_computed_paths(self):
        """Test computed path properties."""
        from project import create_project
        
        project = create_project("test", "content")
        
        assert project.files_dir.endswith("files")
        assert project.patches_dir.endswith("patches")
        assert project.output_dir.endswith("output")
        assert project.content_json_path.endswith("content.json")


class TestMetadata:
    """Tests for Metadata model."""
    
    def test_default_values(self):
        """Test default metadata values."""
        from project import Metadata
        
        meta = Metadata()
        
        assert meta.version == 1
        assert meta.pipeline_stage == "initialized"
        assert meta.last_instruction == ""
    
    def test_custom_values(self):
        """Test custom metadata values."""
        from project import Metadata
        
        meta = Metadata(
            version=2,
            pipeline_stage="exported",
            last_instruction="Create slides"
        )
        
        assert meta.version == 2
        assert meta.pipeline_stage == "exported"
        assert meta.last_instruction == "Create slides"


class TestProjectTouchUpdated:
    """Tests for Project.touch_updated method."""
    
    def test_updates_timestamp(self):
        """Test that touch_updated updates the timestamp."""
        from project import create_project
        import time
        
        project = create_project("test", "content")
        original_updated = project.updated_at
        
        time.sleep(0.01)  # Small delay
        project.touch_updated()
        
        assert project.updated_at != original_updated
