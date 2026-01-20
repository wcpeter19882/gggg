"""Tests for content-manager project_utils module."""
import pytest
from pathlib import Path


class TestGenerateProjectId:
    """Tests for generate_project_id function from project_utils."""
    
    def test_re_exports_from_project(self):
        """Test that generate_project_id is re-exported."""
        from project_utils import generate_project_id
        
        # Should work the same as the project module version
        project_id = generate_project_id("test", "content")
        assert "_" in project_id


class TestCreateProjectDirectory:
    """Tests for create_project_directory function."""
    
    def test_creates_directory_structure(self, tmp_path):
        """Test that full directory structure is created."""
        from project_utils import create_project_directory
        from project import Project
        
        project_dir = tmp_path / "test_project"
        project = Project(
            id="test_123",
            source_name="test",
            hash="12345678",
            directory=str(project_dir),
        )
        
        create_project_directory(project, force=True)
        
        assert project_dir.exists()
        assert (project_dir / "files").exists()
        assert (project_dir / "patches").exists()
        assert (project_dir / "output").exists()
    
    def test_raises_if_exists_without_force(self, tmp_path):
        """Test that FileExistsError is raised if dir exists."""
        from project_utils import create_project_directory
        from project import Project
        
        project_dir = tmp_path / "existing_project"
        project_dir.mkdir()
        
        project = Project(
            id="test_123",
            source_name="test",
            hash="12345678",
            directory=str(project_dir),
        )
        
        with pytest.raises(FileExistsError):
            create_project_directory(project, force=False)
    
    def test_overwrites_with_force(self, tmp_path):
        """Test that directory is overwritten with force=True."""
        from project_utils import create_project_directory
        from project import Project
        
        project_dir = tmp_path / "existing_project"
        project_dir.mkdir()
        (project_dir / "old_file.txt").write_text("old content")
        
        project = Project(
            id="test_123",
            source_name="test",
            hash="12345678",
            directory=str(project_dir),
        )
        
        create_project_directory(project, force=True)
        
        assert project_dir.exists()
        assert not (project_dir / "old_file.txt").exists()


class TestCopySourceToProject:
    """Tests for copy_source_to_project function."""
    
    def test_copies_source_file(self, tmp_path):
        """Test copying source file to project."""
        from project_utils import copy_source_to_project, create_project_directory
        from project import Project
        
        # Create source file
        source_file = tmp_path / "source.md"
        source_file.write_text("# Test Content")
        
        # Create project
        project_dir = tmp_path / "project"
        project = Project(
            id="test_123",
            source_name="test",
            hash="12345678",
            directory=str(project_dir),
        )
        create_project_directory(project, force=True)
        
        # Copy source
        copy_source_to_project(project, source_file, "source.md")
        
        copied_file = Path(project.files_dir) / "source.md"
        assert copied_file.exists()
        assert copied_file.read_text() == "# Test Content"
    
    def test_preserves_content(self, tmp_path):
        """Test that content is preserved during copy."""
        from project_utils import copy_source_to_project, create_project_directory
        from project import Project
        
        content = """# Complex Content
        
Special characters: émojis 🎉 and unicode: 中文
"""
        source_file = tmp_path / "source.md"
        source_file.write_text(content, encoding="utf-8")
        
        project_dir = tmp_path / "project"
        project = Project(
            id="test_123",
            source_name="test",
            hash="12345678",
            directory=str(project_dir),
        )
        create_project_directory(project, force=True)
        
        copy_source_to_project(project, source_file, "source.md")
        
        copied_file = Path(project.files_dir) / "source.md"
        assert copied_file.read_text(encoding="utf-8") == content


class TestProjectExists:
    """Tests for project_exists function."""
    
    def test_returns_false_for_nonexistent(self, tmp_path):
        """Test that False is returned for nonexistent project."""
        from project_utils import project_exists
        
        result = project_exists("nonexistent_project", base_dir=str(tmp_path))
        
        assert result is False
    
    def test_returns_true_for_existing(self, tmp_path):
        """Test that True is returned for existing project."""
        from project_utils import project_exists
        
        # Create project directory
        (tmp_path / "existing_project").mkdir()
        
        result = project_exists("existing_project", base_dir=str(tmp_path))
        
        assert result is True


class TestGetProjectPath:
    """Tests for get_project_path function."""
    
    def test_returns_correct_path(self, tmp_path):
        """Test that correct path is returned."""
        from project_utils import get_project_path
        
        path = get_project_path("my_project", base_dir=str(tmp_path))
        
        assert path == tmp_path / "my_project"


class TestListProjects:
    """Tests for list_projects function."""
    
    def test_lists_projects(self, tmp_path):
        """Test listing projects."""
        from project_utils import list_projects
        
        # Create some project directories
        (tmp_path / "project_a").mkdir()
        (tmp_path / "project_b").mkdir()
        (tmp_path / "not_a_project.txt").write_text("file")
        
        projects = list_projects(base_dir=str(tmp_path))
        
        assert "project_a" in projects
        assert "project_b" in projects
        assert "not_a_project.txt" not in projects
    
    def test_empty_list_for_no_projects(self, tmp_path):
        """Test empty list when no projects exist."""
        from project_utils import list_projects
        
        projects = list_projects(base_dir=str(tmp_path))
        
        assert projects == []
