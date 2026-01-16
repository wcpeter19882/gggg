"""Tests for atom skill models."""
import pytest
from pathlib import Path
import sys

# Add skill paths
REPO_ROOT = Path(__file__).parent.parent.parent
SKILLS_DIR = REPO_ROOT / ".claude" / "skills"
sys.path.insert(0, str(SKILLS_DIR / "_lib"))


def make_source_ref(source_id: str = "test_source", file_path: str = "test.md"):
    """Helper to create a valid SourceReference."""
    from source import SourceReference
    return SourceReference(
        source_id=source_id,
        file_path=file_path,
        offset=0,
        length=100
    )


class TestAtomBase:
    """Tests for base Atom class."""
    
    def test_atom_has_required_fields(self):
        """Test that Atom has all required fields."""
        from atom_models import Atom
        
        atom = Atom(
            id="test_001",
            rank=1,
            state="active",
            abstract="Test atom",
            source_ref=make_source_ref(),
            visual="chart"
        )
        
        assert atom.id == "test_001"
        assert atom.rank == 1
        assert atom.state == "active"
        assert atom.abstract == "Test atom"
        assert atom.visual == "chart"
    
    def test_atom_default_values(self):
        """Test Atom default values."""
        from atom_models import Atom
        
        atom = Atom(
            id="test_001",
            rank=1,
            state="active",
            source_ref=make_source_ref()
        )
        
        assert atom.abstract == ""
        assert atom.visual == "none"
        assert atom.metadata == {}


class TestBioAtom:
    """Tests for BioAtom class."""
    
    def test_bio_atom_fields(self):
        """Test BioAtom has identity fields."""
        from atom_models import BioAtom
        
        atom = BioAtom(
            id="bio_001",
            rank=1,
            state="active",
            source_ref=make_source_ref(),
            name="John Smith",
            role="Principal Engineer",
            credentials="15 years experience",
            affiliation="Google"
        )
        
        assert atom.name == "John Smith"
        assert atom.role == "Principal Engineer"
        assert atom.credentials == "15 years experience"
        assert atom.affiliation == "Google"
    
    def test_bio_atom_requires_name(self):
        """Test that BioAtom requires name field."""
        from atom_models import BioAtom
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            BioAtom(
                id="bio_001",
                rank=1,
                state="active",
                source_ref=make_source_ref()
                # Missing name field
            )


class TestFactAtom:
    """Tests for FactAtom class."""
    
    def test_fact_atom_fields(self):
        """Test FactAtom has fact-specific fields."""
        from atom_models import FactAtom
        
        atom = FactAtom(
            id="fact_001",
            rank=1,
            state="active",
            source_ref=make_source_ref(),
            text="The platform processes 1M requests daily",
            category="architecture"
        )
        
        assert atom.text == "The platform processes 1M requests daily"
        assert atom.category == "architecture"


class TestStatAtom:
    """Tests for StatAtom class."""
    
    def test_stat_atom_fields(self):
        """Test StatAtom has metric fields."""
        from atom_models import StatAtom
        
        atom = StatAtom(
            id="stat_001",
            rank=1,
            state="active",
            source_ref=make_source_ref(),
            value="136,000",
            label="MAU",
            context="Monthly active users"
        )
        
        assert atom.value == "136,000"
        assert atom.label == "MAU"
        assert atom.context == "Monthly active users"
    
    def test_stat_atom_requires_value_and_label(self):
        """Test StatAtom requires value and label fields."""
        from atom_models import StatAtom
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            StatAtom(
                id="stat_001",
                rank=1,
                state="active",
                source_ref=make_source_ref(),
                value="100"
                # Missing label
            )


class TestQuoteAtom:
    """Tests for QuoteAtom class."""
    
    def test_quote_atom_fields(self):
        """Test QuoteAtom has quote-specific fields."""
        from atom_models import QuoteAtom
        
        atom = QuoteAtom(
            id="quote_001",
            rank=1,
            state="active",
            source_ref=make_source_ref(),
            quote="This will transform how we work",
            attribution="CEO",
            context="Annual meeting keynote"
        )
        
        assert atom.quote == "This will transform how we work"
        assert atom.attribution == "CEO"
        assert atom.context == "Annual meeting keynote"


class TestTensionAtom:
    """Tests for TensionAtom class."""
    
    def test_tension_atom_fields(self):
        """Test TensionAtom has conflict-related fields."""
        from atom_models import TensionAtom
        
        atom = TensionAtom(
            id="tension_001",
            rank=1,
            state="active",
            source_ref=make_source_ref(),
            text="Performance vs Cost trade-off",
            tension_type="trade-off",
            resolution_hint="Optimize caching strategy"
        )
        
        assert atom.text == "Performance vs Cost trade-off"
        assert atom.tension_type == "trade-off"
        assert atom.resolution_hint == "Optimize caching strategy"


class TestConceptAtom:
    """Tests for ConceptAtom class."""
    
    def test_concept_atom_fields(self):
        """Test ConceptAtom has insight-related fields."""
        from atom_models import ConceptAtom
        
        atom = ConceptAtom(
            id="concept_001",
            rank=1,
            state="active",
            source_ref=make_source_ref(),
            text="Unified platform reduces complexity",
            concept_type="insight",
            supporting_facts=["fact_001", "fact_002"]
        )
        
        assert atom.text == "Unified platform reduces complexity"
        assert atom.concept_type == "insight"
        assert atom.supporting_facts == ["fact_001", "fact_002"]


class TestVisualAtom:
    """Tests for VisualAtom class."""
    
    def test_visual_atom_fields(self):
        """Test VisualAtom has visual instruction fields."""
        from atom_models import VisualAtom
        
        atom = VisualAtom(
            id="visual_001",
            rank=1,
            state="active",
            source_ref=make_source_ref(),
            description="Architecture diagram showing service layers",
            visual_category="diagram",
            related_atom="fact_001"
        )
        
        assert atom.description == "Architecture diagram showing service layers"
        assert atom.visual_category == "diagram"
        assert atom.related_atom == "fact_001"


class TestSourceReference:
    """Tests for SourceReference model."""
    
    def test_source_reference_fields(self):
        """Test SourceReference has location fields."""
        from source import SourceReference
        
        ref = SourceReference(
            source_id="doc_001",
            file_path="document.md",
            offset=100,
            length=50,
            line_number=10
        )
        
        assert ref.source_id == "doc_001"
        assert ref.file_path == "document.md"
        assert ref.offset == 100
        assert ref.length == 50
        assert ref.line_number == 10
    
    def test_source_reference_defaults(self):
        """Test SourceReference optional line_number."""
        from source import SourceReference
        
        ref = SourceReference(
            source_id="test",
            file_path="test.md",
            offset=0,
            length=10
        )
        
        assert ref.line_number is None
    
    def test_source_reference_validation(self):
        """Test SourceReference validation constraints."""
        from source import SourceReference
        from pydantic import ValidationError
        
        # offset must be >= 0
        with pytest.raises(ValidationError):
            SourceReference(
                source_id="test",
                file_path="test.md",
                offset=-1,
                length=10
            )
        
        # length must be > 0
        with pytest.raises(ValidationError):
            SourceReference(
                source_id="test",
                file_path="test.md",
                offset=0,
                length=0
            )


class TestAtomCollection:
    """Tests for atom collections."""
    
    def test_can_create_mixed_atom_collection(self):
        """Test creating a collection of different atom types."""
        from atom_models import StatAtom, QuoteAtom, ConceptAtom
        
        atoms = [
            StatAtom(
                id="stat_001",
                rank=1,
                state="active",
                source_ref=make_source_ref(),
                value="$2.5M",
                label="Revenue"
            ),
            QuoteAtom(
                id="quote_001",
                rank=2,
                state="active",
                source_ref=make_source_ref(),
                quote="Great progress",
                attribution="VP"
            ),
            ConceptAtom(
                id="concept_001",
                rank=3,
                state="active",
                source_ref=make_source_ref(),
                text="Key finding"
            )
        ]
        
        assert len(atoms) == 3
        assert atoms[0].id == "stat_001"
        assert atoms[1].quote == "Great progress"
        assert atoms[2].text == "Key finding"
