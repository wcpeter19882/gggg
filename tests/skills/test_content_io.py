"""Tests for content-manager content_io module."""
import json
import pytest
from pathlib import Path


class TestReadContentJson:
    """Tests for read_content_json function."""
    
    def test_reads_valid_content_json(self, sample_content_json):
        """Test reading a valid content.json file."""
        from content_io import read_content_json
        
        content = read_content_json(sample_content_json)
        
        assert content is not None
        # project is a Dict in ContentJson
        assert content.project["id"] == "test_project_abc12345"
        assert content.constitution.tone == "professional"
        assert len(content.slides) == 2
    
    def test_returns_none_for_missing_file(self, tmp_path):
        """Test that None is returned for missing file."""
        from content_io import read_content_json
        
        result = read_content_json(tmp_path / "nonexistent.json")
        
        assert result is None
    
    def test_returns_none_for_invalid_json(self, tmp_path):
        """Test that None is returned for invalid JSON."""
        from content_io import read_content_json
        
        invalid_file = tmp_path / "invalid.json"
        invalid_file.write_text("not valid json {{{")
        
        result = read_content_json(invalid_file)
        
        assert result is None


class TestReadContentJsonRaw:
    """Tests for read_content_json_raw function."""
    
    def test_reads_as_dict(self, sample_content_json):
        """Test reading content.json as raw dict."""
        from content_io import read_content_json_raw
        
        data = read_content_json_raw(sample_content_json)
        
        assert isinstance(data, dict)
        assert "project" in data
        assert "slides" in data
    
    def test_returns_none_for_missing(self, tmp_path):
        """Test None returned for missing file."""
        from content_io import read_content_json_raw
        
        result = read_content_json_raw(tmp_path / "missing.json")
        
        assert result is None


class TestWriteContentJson:
    """Tests for write_content_json function."""
    
    def test_writes_content_json(self, tmp_path):
        """Test writing content.json file."""
        from content_io import write_content_json, read_content_json
        from content_json import ContentJson, Constitution, ContentMetadata
        
        content = ContentJson(
            project={
                "id": "test_123",
                "source_name": "test",
                "hash": "12345678",
                "directory": str(tmp_path),
                "created_at": "2026-01-12T00:00:00+00:00",
                "updated_at": "2026-01-12T00:00:00+00:00"
            },
            constitution=Constitution(),
            theme=None,
            atoms=None,
            slides=[],
            metadata=ContentMetadata()
        )
        
        output_path = tmp_path / "content.json"
        write_content_json(output_path, content)
        
        assert output_path.exists()
        
        # Verify it can be read back
        read_back = read_content_json(output_path)
        assert read_back.project["id"] == "test_123"
    
    def test_creates_parent_directories(self, tmp_path):
        """Test that parent directories are created."""
        from content_io import write_content_json
        from content_json import ContentJson, Constitution, ContentMetadata
        
        content = ContentJson(
            project={
                "id": "test_123",
                "source_name": "test",
                "hash": "12345678",
                "directory": str(tmp_path),
                "created_at": "2026-01-12T00:00:00+00:00",
                "updated_at": "2026-01-12T00:00:00+00:00"
            },
            constitution=Constitution(),
            theme=None,
            atoms=None,
            slides=[],
            metadata=ContentMetadata()
        )
        
        nested_path = tmp_path / "nested" / "dir" / "content.json"
        write_content_json(nested_path, content)
        
        assert nested_path.exists()


class TestWriteContentJsonRaw:
    """Tests for write_content_json_raw function."""
    
    def test_writes_raw_dict(self, tmp_path):
        """Test writing raw dict to JSON."""
        from content_io import write_content_json_raw, read_content_json_raw
        
        data = {"test": "value", "number": 42}
        output_path = tmp_path / "test.json"
        
        write_content_json_raw(output_path, data)
        
        assert output_path.exists()
        read_back = read_content_json_raw(output_path)
        assert read_back["test"] == "value"
        assert read_back["number"] == 42


class TestInitializeContentJson:
    """Tests for initialize_content_json function."""
    
    def test_creates_initial_content(self):
        """Test creating initial content.json structure."""
        from content_io import initialize_content_json
        from project import create_project
        from content_json import Constitution
        
        project = create_project("test", "content")
        constitution = Constitution(tone="professional")
        
        content = initialize_content_json(project, constitution, "Test instruction")
        
        assert content.project["id"] == project.id
        assert content.constitution.tone == "professional"
        assert content.metadata.pipeline_stage == "initialized"
        assert content.metadata.last_instruction == "Test instruction"
        assert content.slides == []
    
    def test_default_constitution(self):
        """Test with default constitution."""
        from content_io import initialize_content_json
        from project import create_project
        
        project = create_project("test", "content")
        content = initialize_content_json(project)
        
        assert content.constitution is not None


class TestUpdatePipelineStage:
    """Tests for update_pipeline_stage function."""
    
    def test_updates_stage(self, sample_content_json):
        """Test updating pipeline stage."""
        from content_io import update_pipeline_stage, read_content_json_raw
        
        result = update_pipeline_stage(sample_content_json, "atoms")
        
        assert result is True
        data = read_content_json_raw(sample_content_json)
        assert data["metadata"]["pipeline_stage"] == "atoms"
    
    def test_returns_false_for_missing_file(self, tmp_path):
        """Test False returned for missing file."""
        from content_io import update_pipeline_stage
        
        result = update_pipeline_stage(tmp_path / "missing.json", "atoms")
        
        assert result is False


class TestGetPipelineStage:
    """Tests for get_pipeline_stage function."""
    
    def test_gets_stage(self, sample_content_json):
        """Test getting pipeline stage."""
        from content_io import get_pipeline_stage
        
        stage = get_pipeline_stage(sample_content_json)
        
        assert stage == "exported"
    
    def test_returns_none_for_missing(self, tmp_path):
        """Test None returned for missing file."""
        from content_io import get_pipeline_stage
        
        stage = get_pipeline_stage(tmp_path / "missing.json")
        
        assert stage is None
