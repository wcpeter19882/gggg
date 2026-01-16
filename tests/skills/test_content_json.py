"""Tests for content-manager content_json models."""
import pytest


class TestConstitution:
    """Tests for Constitution model."""
    
    def test_default_values(self):
        """Test default constitution values."""
        from content_json import Constitution
        
        const = Constitution()
        
        assert const.tone is None
        assert const.style_rules == []
        assert const.content_exclusions == []
        assert const.content_requirements == []
        assert const.target_slides is None
    
    def test_tone_validation(self):
        """Test tone literal validation."""
        from content_json import Constitution
        
        # Valid tones should work
        for tone in ["professional", "casual", "academic", "creative", 
                     "technical", "marketing", "minimal", "neutral"]:
            const = Constitution(tone=tone)
            assert const.tone == tone
    
    def test_with_all_fields(self):
        """Test constitution with all fields populated."""
        from content_json import Constitution
        
        const = Constitution(
            tone="professional",
            style_rules=["Rule 1", "Rule 2"],
            content_exclusions=["No jargon"],
            content_requirements=["Include metrics"],
            target_slides=15
        )
        
        assert const.tone == "professional"
        assert len(const.style_rules) == 2
        assert "No jargon" in const.content_exclusions
        assert const.target_slides == 15


class TestThemeModels:
    """Tests for Theme-related models."""
    
    def test_theme_colors_defaults(self):
        """Test ThemeColors default values."""
        from content_json import ThemeColors
        
        colors = ThemeColors(primary="#0078d4", accent="#ffc83d")
        
        assert colors.primary == "#0078d4"
        assert colors.accent == "#ffc83d"
        assert colors.secondary == "#666666"
        assert colors.background == "#ffffff"
        assert colors.text == "#1a1a1a"
    
    def test_theme_fonts_defaults(self):
        """Test ThemeFonts default values."""
        from content_json import ThemeFonts
        
        fonts = ThemeFonts()
        
        assert fonts.heading == "Inter"
        assert fonts.body == "Inter"
        assert fonts.mono == "JetBrains Mono"
    
    def test_theme_spacing_defaults(self):
        """Test ThemeSpacing default values."""
        from content_json import ThemeSpacing
        
        spacing = ThemeSpacing()
        
        assert spacing.page_margin == "48px"
        assert spacing.content_gap == "24px"
    
    def test_full_theme(self):
        """Test creating a full Theme object."""
        from content_json import Theme, ThemeColors, ThemeFonts, ThemeSpacing
        
        theme = Theme(
            id="custom_theme",
            name="Custom Theme",
            colors=ThemeColors(primary="#ff0000", accent="#00ff00")
        )
        
        assert theme.id == "custom_theme"
        assert theme.name == "Custom Theme"
        assert theme.colors.primary == "#ff0000"


class TestAtomModels:
    """Tests for Atom-related models."""
    
    def test_atom_metadata_defaults(self):
        """Test AtomMetadata default values."""
        from content_json import AtomMetadata
        
        meta = AtomMetadata()
        
        assert meta.confidence == 0.8
        assert meta.keywords == []
    
    def test_atom_metadata_validation(self):
        """Test AtomMetadata confidence bounds."""
        from content_json import AtomMetadata
        
        # Valid confidence
        meta = AtomMetadata(confidence=0.95)
        assert meta.confidence == 0.95
        
        # Boundary values
        meta_low = AtomMetadata(confidence=0.0)
        assert meta_low.confidence == 0.0
        
        meta_high = AtomMetadata(confidence=1.0)
        assert meta_high.confidence == 1.0
    
    def test_atom_types(self):
        """Test atom type literals."""
        from content_json import Atom, AtomMetadata
        
        valid_types = ["BIO", "FACT", "STAT", "QUOTE", "TENSION", "CONCEPT", "VISUAL"]
        
        for atom_type in valid_types:
            atom = Atom(
                id=f"{atom_type.lower()}_001",
                type=atom_type,
                content="Test content",
                metadata=AtomMetadata()
            )
            assert atom.type == atom_type
    
    def test_atom_collection(self):
        """Test AtomCollection model."""
        from content_json import AtomCollection, Atom, AtomMetadata
        
        atoms = [
            Atom(id="stat_001", type="STAT", content="Metric 1", metadata=AtomMetadata()),
            Atom(id="quote_001", type="QUOTE", content="Quote 1", metadata=AtomMetadata()),
        ]
        
        collection = AtomCollection(atoms=atoms, source_hash="abc123")
        
        assert len(collection.atoms) == 2
        assert collection.source_hash == "abc123"


class TestLayoutModels:
    """Tests for Layout-related models."""
    
    def test_slot_position(self):
        """Test SlotPosition model."""
        from content_json import SlotPosition
        
        pos = SlotPosition(x=0, y=0, width=100, height=50)
        
        assert pos.x == 0
        assert pos.width == 100
    
    def test_slot(self):
        """Test Slot model."""
        from content_json import Slot, SlotPosition
        
        slot = Slot(
            id="main",
            size="L",
            position=SlotPosition(x=0, y=0, width=100, height=100)
        )
        
        assert slot.id == "main"
        assert slot.size == "L"
    
    def test_layout_families(self):
        """Test Layout with different families."""
        from content_json import Layout
        
        for family in ["Bento", "Swiss", "Cinematic"]:
            # Use a variant that matches the family
            variant = "Standard" if family == "Bento" else "Poster" if family == "Swiss" else "Split_50_50"
            layout = Layout(family=family, variant=variant)
            assert layout.family == family


class TestContentJson:
    """Tests for main ContentJson model."""
    
    def test_minimal_content_json(self):
        """Test creating minimal ContentJson."""
        from content_json import ContentJson, Constitution, ContentMetadata
        
        content = ContentJson(
            project={
                "id": "test_123",
                "source_name": "test",
                "hash": "12345678",
                "directory": "/tmp/test",
                "created_at": "2026-01-12T00:00:00+00:00",
                "updated_at": "2026-01-12T00:00:00+00:00"
            },
            constitution=Constitution(),
            theme=None,
            atoms=None,
            slides=[],
            metadata=ContentMetadata()
        )
        
        # project is a Dict, not a typed model
        assert content.project["id"] == "test_123"
        assert content.slides == []
    
    def test_content_json_with_slides(self):
        """Test ContentJson with slides."""
        from content_json import ContentJson, Constitution, ContentMetadata, Slide
        
        slides = [
            Slide(
                id="slide_001",
                state="active",
                story="Test headline"
            )
        ]
        
        content = ContentJson(
            project={
                "id": "test_123",
                "source_name": "test",
                "hash": "12345678",
                "directory": "/tmp/test",
                "created_at": "2026-01-12T00:00:00+00:00",
                "updated_at": "2026-01-12T00:00:00+00:00"
            },
            constitution=Constitution(),
            theme=None,
            atoms=None,
            slides=slides,
            metadata=ContentMetadata()
        )
        
        assert len(content.slides) == 1
        assert content.slides[0].id == "slide_001"


class TestSlide:
    """Tests for Slide model."""
    
    def test_slide_states(self):
        """Test slide state values."""
        from content_json import Slide
        
        for state in ["draft", "active", "exported"]:
            slide = Slide(id="slide_001", state=state)
            assert slide.state == state
    
    def test_slide_density(self):
        """Test slide density values."""
        from content_json import Slide
        
        for density in ["sparse", "normal", "dense"]:
            slide = Slide(id="slide_001", state="active", density=density)
            assert slide.density == density
    
    def test_slide_with_atoms(self):
        """Test slide with atom references."""
        from content_json import Slide
        
        slide = Slide(
            id="slide_001",
            state="active",
            atoms=["stat_001", "quote_001"]
        )
        
        assert len(slide.atoms) == 2
        assert "stat_001" in slide.atoms
