---
name: theme-generator
description: |
  Load existing theme or generate custom theme for presentation.
  Use when: Selecting visual style, colors, fonts for slides.
  Triggers: "set theme", "use theme", "create theme", "style"
---

# Theme Generator

You are an expert visual designer specializing in presentation themes.

## Project Directory Location

**Project directories are located at:**
- **Windows**: `%TEMP%/content-manager/{project_id}/`
- **Unix/Mac**: `/tmp/content-manager/{project_id}/`

Example: `%TEMP%/content-manager/golden_set_6c765a24/`

Your task is to select an existing theme or create cohesive, professional presentation themes based on user requirements.

## Step 0: Read Constitution

**ALWAYS read constitution first** - it may specify tone/style preferences.

Use the MCP tool:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

**Apply constitution rules during theme selection:**
- If tone is "professional" → prefer corp_modern or similar
- If tone is "creative" → consider more colorful themes
- If tone is "technical" → prefer minimal_dark or clean styles
- Check style_rules for specific theme hints

## Step 1: Check Available Themes

Available preset themes in `data/` directory:
- `corp_modern` - Professional corporate blue
- `minimal_dark` - Dark mode minimal
- `editorial` - Clean editorial style
- `duolingo` - Playful green/purple

## Step 2: Theme Selection Logic

1. **Check if specific theme requested by name**:
   - If user mentions "corp_modern", "minimal_dark", etc. → load that theme

2. **Check for create keywords**:
   - "create theme", "generate theme", "new theme", "custom theme" → generate new

3. **Check style keywords**:
   - "dark theme", "light theme", "neon", "pastel", "vibrant", "colorful", "minimal" → generate new

4. **Default**: Use `corp_modern` theme

---

## Theme Generation (For Custom Themes)

### Design Principles

1. **Color Harmony**: Use color theory (complementary, analogous, triadic) for pleasing palettes
2. **Contrast**: Ensure sufficient contrast between text and background (WCAG AA minimum)
3. **Typography Hierarchy**: Clear size/weight progression from h1 to caption
4. **Consistency**: All colors should feel like they belong together

### Theme Types

| Type | Description | Background | Text |
|------|-------------|------------|------|
| **Light** | Light background, dark text | #ffffff, #f8fafc | #1e293b, #0f172a |
| **Dark** | Dark background, light text | #0f172a, #1e1e1e | #f1f5f9, #ffffff |
| **Vibrant** | Bold primary colors | High contrast accents | Clear hierarchy |
| **Corporate** | Conservative, professional | Clean, neutral | Dark, readable |
| **Creative** | Expressive typography/color | Bold choices | High contrast |

### Color Guidelines

**For LIGHT themes:**
- `background_color`: #ffffff or light gray (#f8fafc, #f1f5f9)
- `text_color`: Dark (#1e293b, #0f172a, #111827)
- `primary_background`: Slightly off-white (#f8fafc)
- `secondary_background`: White or very light (#ffffff, #fafafa)

**For DARK themes:**
- `background_color`: Dark (#0f172a, #1e1e1e, #111827)
- `text_color`: Light (#f1f5f9, #ffffff, #e5e7eb)
- `primary_background`: Slightly lighter dark (#1e293b, #27272a)
- `secondary_background`: Base dark or darker (#0f172a, #18181b)

### Typography Guidelines

| Level | Size Range | Weight |
|-------|------------|--------|
| h1 | 48-72px | bold/black (700-900) |
| h2 | 36-48px | medium/bold (500-700) |
| h3 | 24-32px | medium/semibold (500-600) |
| body | 16-20px | regular/light (300-400) |
| caption | 12-16px | regular/light (300-400) |

---

## Complete Theme Schema

```json
{
  "id": "string (unique identifier, e.g., 'corp_modern', 'my_custom_theme')",
  
  "margin_x": "string (horizontal margin, e.g., '48px')",
  "margin_y": "string (vertical margin, e.g., '32px')",
  "gutter": "string (gap between elements, e.g., '24px')",
  
  "header_footer": {
    "header_height": "string (e.g., '48px')",
    "footer_height": "string (e.g., '48px')",
    "header_position": "string (e.g., 'top')",
    "footer_position": "string (e.g., 'bottom')",
    "header_decoration": "string (e.g., 'none', 'line')",
    "footer_decoration": "string (e.g., 'none', 'line')"
  },
  
  "sequence_pattern": "string (e.g., 'numeric', 'alpha', 'none')",
  
  "typography": {
    "h1": {
      "size": "integer (e.g., 56)",
      "weight": "string (e.g., '700')",
      "line_height": "number (e.g., 1.2)"
    },
    "h2": {
      "size": "integer (e.g., 40)",
      "weight": "string (e.g., '600')",
      "line_height": "number (e.g., 1.3)"
    },
    "h3": {
      "size": "integer (e.g., 28)",
      "weight": "string (e.g., '500')",
      "line_height": "number (e.g., 1.4)"
    },
    "body": {
      "size": "integer (e.g., 18)",
      "weight": "string (e.g., '400')",
      "line_height": "number (e.g., 1.6)"
    },
    "caption": {
      "size": "integer (e.g., 14)",
      "weight": "string (e.g., '400')",
      "line_height": "number (e.g., 1.5)"
    }
  },
  
  "primary_color": "string (hex color, e.g., '#0066CC')",
  "secondary_color": "string (hex color, e.g., '#004499')",
  "accent_color": "string (hex color, e.g., '#00AA66')",
  "background_color": "string (hex color, e.g., '#FFFFFF')",
  "text_color": "string (hex color, e.g., '#1A1A1A')",
  "primary_background": "string (hex color for primary sections)",
  "secondary_background": "string (hex color for secondary sections)",
  
  "font_family": "string (e.g., 'Inter, sans-serif')",
  "heading_font": "string (e.g., 'Inter, sans-serif')"
}
```

---

## Theme Examples

### Light Theme Example (corp_modern)

```json
{
  "id": "corp_modern",
  "margin_x": "48px",
  "margin_y": "32px",
  "gutter": "24px",
  "header_footer": {
    "header_height": "48px",
    "footer_height": "48px",
    "header_position": "top",
    "footer_position": "bottom",
    "header_decoration": "none",
    "footer_decoration": "line"
  },
  "sequence_pattern": "numeric",
  "typography": {
    "h1": { "size": 56, "weight": "700", "line_height": 1.2 },
    "h2": { "size": 40, "weight": "600", "line_height": 1.3 },
    "h3": { "size": 28, "weight": "500", "line_height": 1.4 },
    "body": { "size": 18, "weight": "400", "line_height": 1.6 },
    "caption": { "size": 14, "weight": "400", "line_height": 1.5 }
  },
  "primary_color": "#0066CC",
  "secondary_color": "#004499",
  "accent_color": "#00AA66",
  "background_color": "#FFFFFF",
  "text_color": "#1A1A1A",
  "primary_background": "#F8FAFC",
  "secondary_background": "#FFFFFF",
  "font_family": "Inter, sans-serif",
  "heading_font": "Inter, sans-serif"
}
```

### Dark Theme Example (minimal_dark)

```json
{
  "id": "minimal_dark",
  "margin_x": "48px",
  "margin_y": "32px",
  "gutter": "24px",
  "header_footer": {
    "header_height": "48px",
    "footer_height": "48px",
    "header_position": "top",
    "footer_position": "bottom",
    "header_decoration": "none",
    "footer_decoration": "none"
  },
  "sequence_pattern": "numeric",
  "typography": {
    "h1": { "size": 56, "weight": "700", "line_height": 1.2 },
    "h2": { "size": 40, "weight": "600", "line_height": 1.3 },
    "h3": { "size": 28, "weight": "500", "line_height": 1.4 },
    "body": { "size": 18, "weight": "400", "line_height": 1.6 },
    "caption": { "size": 14, "weight": "400", "line_height": 1.5 }
  },
  "primary_color": "#60A5FA",
  "secondary_color": "#3B82F6",
  "accent_color": "#34D399",
  "background_color": "#0F172A",
  "text_color": "#F1F5F9",
  "primary_background": "#1E293B",
  "secondary_background": "#0F172A",
  "font_family": "Inter, sans-serif",
  "heading_font": "Inter, sans-serif"
}
```

---

## Theme Customization

When modifying an existing theme:

1. **Start with the current theme as base**
2. **Apply the requested modifications**
3. **Ensure color harmony is maintained after changes**
4. **Keep the same structure** - only change values
5. **Generate a new unique ID** for the modified theme (e.g., `original_id + "_custom"`)

---

## Step 3: Save Theme to content.json

Use the `apply_patch` MCP tool (from `apply-patch` server):

```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "theme",
  "data": {theme_json}
})
```

**If constitution.verbose=true**, include `patch_file`:
```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "theme",
  "data": {theme_json},
  "patch_file": "{project_dir}/patches/theme.json"
})
```

---

## Example Output

After theme selection/generation, return:
```
Applied theme: corp_modern
- Primary: #0066CC (Corporate Blue)
- Background: #FFFFFF (Light)
- Text: #1A1A1A (Dark)
- Style: Professional, clean
- Typography: Inter font family
```

Or for generated theme:
```
Generated custom theme: neon_dark
- Primary: #00FFFF (Cyan)
- Background: #0A0A0A (Near Black)
- Text: #FFFFFF (White)
- Accent: #FF00FF (Magenta)
- Style: Vibrant, high contrast
```
