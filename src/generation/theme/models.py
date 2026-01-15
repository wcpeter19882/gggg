"""Theme models corresponding to React ThemeDefinition interface.

This model aligns 1:1 with the TypeScript definitions in src/paged/render/react/utils/types.ts.
"""
from typing import Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field


class ThemeColors(BaseModel):
    """Theme color palette."""
    bg: str = Field(..., description="Main background color")
    surface: str = Field(..., description="Surface/Card background color")
    primary: str = Field(..., description="Primary brand color (buttons, links)")
    secondary: str = Field(..., description="Secondary info color")
    accent: str = Field(..., description="Accent/Highlight color")
    text: str = Field(..., description="Main text color")
    textMuted: str = Field(..., description="Muted/Secondary text color")
    border: str = Field(..., description="Border color")
    
    # Intent colors
    info: str = Field(default="#3b82f6", description="Info state color")
    warning: str = Field(default="#f59e0b", description="Warning state color")
    success: str = Field(default="#22c55e", description="Success state color")
    danger: str = Field(default="#ef4444", description="Error/Danger state color")


class ThemeTypography(BaseModel):
    """Theme typography settings."""
    fontDisplay: str = Field(default="Inter, sans-serif", description="Font for hero/display text")
    fontBody: str = Field(default="Inter, sans-serif", description="Font for body text")
    fontMono: str = Field(default="monospace", description="Monospace font")
    
    sizeDisplay: str = Field(default="3rem", description="Display font size")
    sizeHeading: str = Field(default="2rem", description="Heading font size")
    sizeBody: str = Field(default="1rem", description="Body font size")
    sizeCaption: str = Field(default="0.875rem", description="Caption font size")
    
    lineHeight: str = Field(default="1.5", description="Base line height")
    letterSpacing: str = Field(default="normal", description="Base letter spacing")


class ThemeSpacing(BaseModel):
    """Theme spacing settings."""
    gap: str = Field(default="1rem", description="Default gap")
    padding: str = Field(default="1.5rem", description="Default padding")
    margin: str = Field(default="1rem", description="Default margin")
    
    # Optional overrides
    sm: Optional[str] = None
    md: Optional[str] = None
    lg: Optional[str] = None
    xl: Optional[str] = None


class ThemeRadius(BaseModel):
    """Border radius values."""
    sm: str = "0.125rem"
    md: str = "0.375rem"
    lg: str = "0.5rem"
    xl: str = "0.75rem"
    full: str = "9999px"


class ThemeShadow(BaseModel):
    """Box shadow values."""
    sm: str = "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    md: str = "0 4px 6px -1px rgb(0 0 0 / 0.1)"
    lg: str = "0 10px 15px -3px rgb(0 0 0 / 0.1)"
    none: str = "none"


class ThemeVisuals(BaseModel):
    """Visual style settings."""
    radius: Union[str, ThemeRadius] = Field(
        default_factory=ThemeRadius,
        description="Border radius settings"
    )
    shadow: Union[str, ThemeShadow] = Field(
        default_factory=ThemeShadow, 
        description="Box shadow settings"
    )
    borderWidth: str = Field(default="1px", description="Default border width")
    borderStyle: Optional[str] = Field(default="solid", description="Default border style")


class Theme(BaseModel):
    """Complete theme definition matching Frontend ThemeDefinition."""
    
    name: str = Field(..., description="Internal theme ID (kebab-case)")
    displayName: str = Field(..., description="Human readable name")
    
    colors: ThemeColors
    typography: ThemeTypography
    spacing: ThemeSpacing
    visuals: ThemeVisuals
    
    # Component overrides can be a loose dict for now as they are complex
    components: Optional[Dict[str, Any]] = Field(default={})

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        d = self.model_dump()
        d['id'] = self.name  # Backward compatibility
        return d
    
    @property
    def id(self) -> str:
        """Backward compatibility for id access."""
        return self.name
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Theme":
        """Create Theme from dictionary."""
        return cls(**data)
    
    def is_dark(self) -> bool:
        """Check if this is a dark theme based on background color."""
        bg = self.colors.bg.lower()
        if bg.startswith("#"):
            try:
                # Basic hex brightness calculation
                r = int(bg[1:3], 16)
                g = int(bg[3:5], 16)
                b = int(bg[5:7], 16)
                # (R*299 + G*587 + B*114) / 1000
                brightness = (r * 299 + g * 587 + b * 114) / 1000
                return brightness < 128
            except (ValueError, IndexError):
                pass
        return False

# TypeScript Interface Reference for LLM
THEME_SCHEMA_REFERENCE = """
export interface ThemeDefinition {
  name: string;
  displayName: string;
  colors: {
    bg: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
    info: string;
    warning: string;
    success: string;
    danger: string;
  };
  typography: {
    fontDisplay: string;
    fontBody: string;
    fontMono: string;
    sizeDisplay: string;
    sizeHeading: string;
    sizeBody: string;
    sizeCaption: string;
    lineHeight: string;
    letterSpacing: string;
  };
  spacing: {
    gap: string;
    padding: string;
    margin: string;
  };
  visuals: {
    radius: { sm: string; md: string; lg: string; xl: string; full: string };
    shadow: { sm: string; md: string; lg: string; none: string };
    borderWidth: string;
    borderStyle?: string;
  };
}
"""
