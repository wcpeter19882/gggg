"""Tests for content-manager constitution module."""
import pytest


class TestParseIntentSimple:
    """Tests for parse_intent_simple function."""
    
    def test_detects_professional_tone(self):
        """Test detection of professional tone."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("Create a professional presentation")
        
        assert result["tone"] == "professional"
    
    def test_detects_casual_tone(self):
        """Test detection of casual tone."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("Make it casual and friendly")
        
        assert result["tone"] == "casual"
    
    def test_detects_technical_tone(self):
        """Test detection of technical tone."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("Technical presentation for developers")
        
        assert result["tone"] == "technical"
    
    def test_detects_slide_count(self):
        """Test detection of slide count."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("Create 10 slides")
        
        assert result["slide_count"] == 10
    
    def test_detects_slide_count_variants(self):
        """Test various slide count patterns."""
        from constitution import parse_intent_simple
        
        assert parse_intent_simple("target 15 slides")["slide_count"] == 15
        assert parse_intent_simple("maximum 8 slides")["slide_count"] == 8
        assert parse_intent_simple("5 page presentation")["slide_count"] == 5
    
    def test_detects_sparse_density(self):
        """Test detection of sparse density."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("Keep it minimal with sparse content")
        
        assert result["density"] == "sparse"
    
    def test_detects_dense_density(self):
        """Test detection of dense density."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("Make it detailed and packed with info")
        
        assert result["density"] == "dense"
    
    def test_default_density_is_normal(self):
        """Test that default density is normal."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("Create a presentation")
        
        assert result["density"] == "normal"
    
    def test_detects_create_action(self):
        """Test detection of create vs refinement."""
        from constitution import parse_intent_simple
        
        create_result = parse_intent_simple("Create a new presentation")
        assert create_result["is_create"] is True
        
        refine_result = parse_intent_simple("Refine the slides")
        assert refine_result["is_create"] is False
    
    def test_case_insensitive(self):
        """Test that detection is case insensitive."""
        from constitution import parse_intent_simple
        
        result = parse_intent_simple("PROFESSIONAL presentation with 10 SLIDES")
        
        assert result["tone"] == "professional"
        assert result["slide_count"] == 10


class TestDetectAudience:
    """Tests for detect_audience function."""
    
    def test_detects_executive_audience(self):
        """Test detection of executive audience."""
        from constitution import detect_audience
        
        assert detect_audience("Executive presentation") == "executive"
        assert detect_audience("For the C-suite") == "executive"
        assert detect_audience("Board meeting") == "executive"
        assert detect_audience("VP leadership review") == "executive"
    
    def test_detects_technical_audience(self):
        """Test detection of technical audience."""
        from constitution import detect_audience
        
        assert detect_audience("Developer conference talk") == "technical"
        assert detect_audience("Engineering team meeting") == "technical"
        assert detect_audience("Architecture review") == "technical"
    
    def test_detects_sales_audience(self):
        """Test detection of sales audience."""
        from constitution import detect_audience
        
        assert detect_audience("Customer presentation") == "sales"
        assert detect_audience("Sales pitch") == "sales"
        assert detect_audience("Client meeting") == "sales"
    
    def test_detects_general_audience(self):
        """Test detection of general audience."""
        from constitution import detect_audience
        
        assert detect_audience("Team meeting") == "general"
        assert detect_audience("All-hands presentation") == "general"
    
    def test_returns_none_for_unknown(self):
        """Test that None is returned for unknown audience."""
        from constitution import detect_audience
        
        assert detect_audience("Random text") is None


class TestExtractConstitution:
    """Tests for extract_constitution function."""
    
    def test_extracts_tone(self):
        """Test that constitution extracts tone."""
        from constitution import extract_constitution
        
        const = extract_constitution("Create a professional presentation")
        
        assert const.tone == "professional"
    
    def test_extracts_target_slides(self):
        """Test that constitution extracts target slides."""
        from constitution import extract_constitution
        
        const = extract_constitution("Create 10 slides")
        
        assert const.target_slides == 10
    
    def test_adds_executive_style_rules(self):
        """Test that executive audience adds appropriate style rules."""
        from constitution import extract_constitution
        
        const = extract_constitution("Executive presentation")
        
        # Should have executive-specific rules
        assert any("executive" in rule.lower() or "roi" in rule.lower() or "business" in rule.lower() 
                   for rule in const.style_rules)
    
    def test_returns_constitution_object(self):
        """Test that function returns Constitution instance."""
        from constitution import extract_constitution
        from content_json import Constitution
        
        const = extract_constitution("Test")
        
        assert isinstance(const, Constitution)
    
    def test_handles_empty_instruction(self):
        """Test handling of empty instruction."""
        from constitution import extract_constitution
        
        const = extract_constitution("")
        
        assert const.tone is None or const.tone == "neutral"


class TestConstitutionToMarkdown:
    """Tests for constitution_to_markdown function."""
    
    def test_generates_markdown(self):
        """Test that markdown is generated."""
        from constitution import constitution_to_markdown
        from content_json import Constitution
        
        const = Constitution(
            tone="professional",
            style_rules=["Rule 1", "Rule 2"],
            target_slides=10
        )
        
        md = constitution_to_markdown(const)
        
        assert "# Constitution" in md or "professional" in md
        assert isinstance(md, str)
    
    def test_includes_tone(self):
        """Test that tone is included in markdown."""
        from constitution import constitution_to_markdown
        from content_json import Constitution
        
        const = Constitution(tone="casual")
        md = constitution_to_markdown(const)
        
        assert "casual" in md.lower()
    
    def test_includes_style_rules(self):
        """Test that style rules are included."""
        from constitution import constitution_to_markdown
        from content_json import Constitution
        
        const = Constitution(style_rules=["Keep it simple", "Use visuals"])
        md = constitution_to_markdown(const)
        
        assert "Keep it simple" in md or "simple" in md.lower()
