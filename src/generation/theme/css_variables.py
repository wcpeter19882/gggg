"""
CSS Variables documentation for theme compatibility.
Used in codegen prompts to ensure LLM uses consistent variables.
"""

THEME_CSS_VARIABLES_SECTION = """# Theming
Use CSS variables for styling.

Colors:
- `var(--theme-primary)`: Main brand color
- `var(--theme-secondary)`: Supplemental color
- `var(--theme-accent)`: Highlight color
- `var(--theme-text)`: Main text color
- `var(--theme-text-muted)`: Secondary text color
- `var(--theme-border)`: Border color
- `var(--theme-surface)`: Card/container background

Typography:
- `var(--theme-font-display)`: Headings font
- `var(--theme-font-body)`: Body text font
- `var(--theme-font-mono)`: Code/data font
- `var(--theme-size-display)`: Display text size
- `var(--theme-size-heading)`: Heading size
- `var(--theme-size-body)`: Body text size
- `var(--theme-size-caption)`: Caption text size
- `var(--theme-line-height)`: Global line height
- `var(--theme-letter-spacing)`: Global letter spacing

Spacing:
- `var(--theme-spacing-gap)`: Standard gap between elements
- `var(--theme-spacing-padding)`: Standard container padding
- `var(--theme-spacing-margin)`: Standard margin

Visuals:
- `var(--theme-radius)`: Border radius for cards/buttons
- `var(--theme-shadow)`: Box shadow for elevation
- `var(--theme-border-width)`: Border width
"""
