---
name: theme-generator
description: |
  Load existing theme or generate custom theme for presentation.
  Supports: preset themes, custom generation, and PowerPoint template extraction.
  Use when: Selecting visual style, colors, fonts for slides.
  Triggers: "set theme", "use theme", "create theme", "style"
---

# Theme Generator

You are an expert visual designer specializing in presentation themes.

## PowerPoint Template Support

If a `.pptx` template file is provided, extract theme and generate layout patterns.

### Step 1: Check for Template

Look for `template.pptx` in the project files directory:
```
{project_dir}/files/template.pptx
```

Or check if constitution specifies a template path.

**If NO template.pptx exists**, skip to "Preset/Generation Workflow" section below.

### Step 2: Extract Raw Data from PowerPoint

If template exists, use the pptx-extractor MCP tool to get raw extraction data:

```
mcp_pptx-extractor_extract_pptx_theme({
  "pptx_path": "{project_dir}/files/template.pptx",
  "project_dir": "{project_dir}",
  "theme_name": "custom"
})
```

This returns:
- `colors` - Extracted color scheme (background, text, primary, secondary, accent)
- `fonts` - Font families (display, body)
- `typography` - Font sizes extracted from slide master (sizeDisplay, sizeHeading, sizeBody, sizeCaption)
- `layouts` - Array of layout placeholders with position percentages and background images
- `background` - Default background (color and optional image path)
- `aspect_ratio` - Slide aspect ratio

### Step 3: Generate Theme TypeScript AND Layout Patterns

Using the extracted data, generate BOTH outputs in a single LLM response:

**A. Theme TypeScript (`{theme_name}.ts`):**

Generate a TypeScript theme file following this **EXACT structure** (all fields required):

```typescript
import type { ThemeDefinition } from './types';

export const {theme_name}Theme: ThemeDefinition = {
  name: '{theme_name}',
  displayName: '{Theme Display Name}',
  isDark: false, // Use the extracted is_dark value from background
  // Background settings - USE EXTRACTED VALUES
  background: {
    color: '{extracted background.color}',  // e.g., '#000000' for dark themes
    image: '{extracted background.image}',  // e.g., 'images/cover_01_bg.png' (optional)
  },
  colors: {
    bg: '{extracted background.color}',  // Same as background.color
    surface: '{extracted surface or lt2}',  // For dark themes: use dk2
    primary: '{extracted accent1}',
    secondary: '{extracted accent2}',
    accent: '{extracted accent3}',
    text: '{extracted text}',  // For dark themes: lt1 (white). For light: dk1 (dark)
    textMuted: '{extracted muted}',  // For dark themes: lt2. For light: dk2
    border: '#e2e8f0',  // For dark themes: use '#374151'
    info: '#3b82f6',
    warning: '#f5a623',
    success: '#10b981',
    danger: '#ef4444',
  },
  typography: {
    // USE EXTRACTED FONT VALUES DIRECTLY - they already include fallbacks
    fontDisplay: '{extracted font_display}',  // e.g., "'Aptos Display', system-ui, sans-serif"
    fontBody: '{extracted font_body}',  // e.g., "'Aptos', system-ui, sans-serif"
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '{extracted size_display}',  // e.g., '59px' - from title style
    sizeHeading: '{extracted size_heading}',  // e.g., '47px'
    sizeBody: '{extracted size_body}',  // e.g., '37px' - from body style
    sizeCaption: '{extracted size_caption}',  // e.g., '27px'
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  spacing: {
    gap: '2rem',
    padding: '4rem',
    margin: '1rem',
  },
  visuals: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 12px rgba(0, 0, 0, 0.08)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
      none: 'none',
    },
    borderWidth: '1px',
  },
};

export default {theme_name}Theme;
```

**CRITICAL: Use the EXTRACTED values, not hardcoded defaults!**
- Font sizes come from `typography.size_*` fields
- Font families come from `typography.font_display` and `typography.font_body`
- Background color and image come from `background` field
- `isDark` comes from `background.is_dark`
- `average_color` from `background` tells you the dominant color of the background image

**Color Adaptation for Dark Themes (3-Step Methodology):**

When `isDark: true` or `background.average_color` is dark, follow this framework:

### Step 1: Analyze the Base (Luminance Check)

Identify your background context from `average_color`:
- **Deep Cool Purple** (e.g., `#3726ac`): Low luminance, high saturation
- **Dark Blue** (e.g., `#1a365d`): Low luminance, moderate saturation
- **Near Black** (e.g., `#1a1a2e`): Very low luminance

**Rule:** Foreground colors (primary, accent) MUST have **high luminance** (brightness > 60%) to be visible.

### Step 2: Select the Color Relationship

Choose how accent colors relate to the background using Color Theory:

| Strategy | Description | When to Use | Result |
|----------|-------------|-------------|--------|
| **Analogous** | Colors adjacent on wheel (Purple → Lavender/Blue) | Enterprise, professional, calm | Cohesive, integrated |
| **Complementary** | Colors opposite on wheel (Purple → Gold/Amber) | Premium, action-oriented | Bold, draws attention |
| **Achromatic** | White/Grey with transparency | System UI, minimal | Clean, functional |

**CRITICAL:** Avoid "Split-Complementary" combinations (e.g., neon Green on Purple) - causes visual vibration.

### Step 3: Adjust Saturation (Eliminate Visual Vibration)

**The Problem:** High saturation background + High saturation foreground = Visual Vibration (edges shimmer).

**The Fix:** If background is saturated, **desaturate the foreground**.

| Background Type | Foreground Strategy | Example |
|-----------------|---------------------|---------|
| Saturated Purple `#3726ac` | Desaturated lavender | `#B39DDB`, `#9575CD` |
| Saturated Blue `#1e40af` | Soft sky blue | `#93c5fd`, `#bfdbfe` |
| Dark with color | Muted complementary | Soft gold `#FFE082`, not bright yellow |

### Color Token Reference for Dark Themes

| Token | Strategy | Derivation Rule |
|-------|----------|-----------------|
| `primary` | Analogous | Same hue family as `average_color`, +40% luminance |
| `secondary` | Complementary | Opposite hue on color wheel, desaturated 20%, +30% luminance |
| `accent` | Analogous | Same hue family as `average_color`, +50% luminance (lightest) |
| `surface` | Lifted | Same hue as `average_color`, +15% luminance |
| `border` | Lifted | Same hue as `average_color`, +25% luminance |
| `textMuted` | Tinted neutral | Gray tinted toward `average_color` hue, 70% luminance |

### Semantic Colors for Dark Themes

Semantic colors are used for data visualization and status indicators (e.g., `info` for Statistic values).

**Derivation Principles:**

1. **Maintain semantic hue identity**
   - `info`: Blue family (cool, informational)
   - `success`: Green family (positive, growth)
   - `warning`: Amber/Orange family (caution, attention)
   - `danger`: Red family (critical, error)

2. **Luminance rule for dark backgrounds**
   - Target luminance: 65-75% (bright enough to pop, not white)
   - Equivalent to Tailwind -300 to -400 range
   - Test: Should be clearly visible on `average_color` but not harsh

3. **Saturation rule to avoid vibration**
   - If `average_color` saturation > 50%: Use 60-70% saturation for semantics
   - This prevents neon-on-saturated clashing

4. **Midpoint derivation (alternative method)**
   - Take the midpoint between `text` (white) and pure semantic hue
   - Shift slightly toward the lighter end (60% toward white)
   - Result: A tinted pastel that feels native to the palette

**Decision Flow:**
```
Is average_color saturated (S > 50%)?
├─ YES → Desaturate semantic colors to 60-70% S
└─ NO  → Use full saturation semantic colors

Is average_color dark (L < 30%)?
├─ YES → Push semantic luminance to 70-75%
└─ NO  → Standard 60-65% luminance is fine
```

**Contrast Requirement:** Each semantic color must have ≥4.5:1 contrast ratio against `average_color`.

### Shadows for Dark Themes

Use stronger opacity:
- `sm: '0 2px 4px rgba(0, 0, 0, 0.3)'`
- `md: '0 4px 12px rgba(0, 0, 0, 0.4)'`
- `lg: '0 8px 24px rgba(0, 0, 0, 0.5)'`

### Quick Decision Table

| Background Hue | Primary | Secondary | Accent |
|----------------|---------|-----------|--------|
| Purple `#3726ac` | `#9575CD` (lavender) | `#FFE082` (soft gold) | `#B39DDB` (light lavender) |
| Blue `#1e40af` | `#7dd3fc` (soft cyan) | `#fcd34d` (muted amber) | `#93c5fd` (sky blue) |
| Teal `#134e4a` | `#5eead4` (light teal) | `#fca5a5` (soft coral) | `#99f6e4` (pale teal) |
| Near Black | `#a5b4fc` (soft indigo) | `#fcd34d` (muted amber) | `#c4b5fd` (soft violet) |

**B. Layout Patterns (`{theme_name}_layout.md`):**

Generate a markdown file that maps the extracted PowerPoint layouts to our **predefined layout patterns**.

**CRITICAL: How Layout Mapping Works**

1. **Keep predefined patterns unchanged**: The rows (Category, Intent, Pattern, Layout, Constraints) come from OUR predefined patterns, NOT from PowerPoint
2. **Derive Structure from extracted slots**: Analyze the `left_pct`, `top_pct`, `width_pct`, `height_pct` of PowerPoint slots to compute Tailwind CSS for the Structure column
3. **Map PowerPoint layouts to patterns**: Match each PowerPoint layout to the most similar predefined pattern
4. **Include ALL predefined patterns**: Even if no PowerPoint layout matches, include the pattern with a derived structure

**Predefined Layout Patterns (these are the rows):**

**CRITICAL:** The Constraints column contains **design strategy rules** that are universal across all templates. When generating `template_layout.md`, you MUST preserve these constraints exactly. Only the Structure column should be derived from PowerPoint slots.

| Category | Intent | Pattern | Layout | Structure (default) | Constraints |
|----------|--------|---------|--------|---------------------|-------------|
| Symmetric | statement | cover | Cover | `flex flex-col justify-center h-full px-16` | Max 4 elements. No tags, no metadata. Title + subtitle + author/date only. |
| Symmetric | statement | section-break | Centered | `flex items-center justify-center h-full` | Max 2 elements. Title + optional subtitle. |
| Symmetric | statement | quote, callout | Billboard | `flex flex-col justify-center items-center h-full text-center px-16` | Use max-w-4xl to max-w-6xl. Single quote or statement. |
| Symmetric | hierarchy | pyramid, funnel | Centered | `flex items-center justify-center h-full` | Use Pyramid/Funnel component |
| Symmetric | comparison | side-by-side | Split 50/50 | `grid grid-cols-2 gap-6 h-full` | Max 2 per deck |
| Symmetric | structure | pillars-4, quadrant | Grid 2x2 | `grid grid-cols-2 grid-rows-2 gap-4` | Max 2 per deck |
| Symmetric | structure | pillars-3, kpi | Grid 3-col | `grid grid-cols-3 gap-4` | Max 3 per deck |
| Asymmetric | evidence, focal | 1 main + 1 support | Split 60/40 | `grid grid-cols-5` → `col-span-3` + `col-span-2` | Max 3 per deck |
| Asymmetric | focal | 1 main + 1 accent | Split 70/30 | `grid grid-cols-10` → `col-span-7` + `col-span-3` | Max 2 per deck |
| Asymmetric | focal | 1 accent + 1 main | Split 40/60 | `grid grid-cols-5` → `col-span-2` + `col-span-3` | Max 3 per deck |
| Asymmetric | evidence | 1 main + 2 accents | L-Shape | `grid grid-cols-3` → `col-span-2` + stacked | ≥1 required (10+ slides) |
| Asymmetric | structure, process | Header + 3 parts | T-Shape | Full-width row + `grid grid-cols-3` | ≥1 required |
| Compound | process, summary | flow | Stacked 2 | `flex flex-col gap-6` with 2 sections | ≥1 required (8+ slides) |
| Compound | hierarchy | layers | Stacked 3 | `flex flex-col gap-4` with 3 sections | — |
| Compound | comparison | cost-benefit | Grid 2+1 | `grid grid-cols-2` top + full-width bottom | — |
| Compound | summary | — | Grid 1+2 | Full-width top + `grid grid-cols-2` bottom | — |

**Structure Column Rules:**
- **Derive from PowerPoint slots**: Analyze slot positions to compute Tailwind CSS
- **Override defaults**: If PowerPoint has matching layout, use derived structure
- **Keep defaults**: If no PowerPoint match, use the default structure above

**How to Derive Structure from Extracted Slots:**

For each extracted PowerPoint layout, analyze the slot positions:

```
Example: Cover 01 has slots:
- Title at (8%, 30%) size 84% x 15% → centered title
- Body at (8%, 50%) size 84% x 30% → stacked below
- 3 cards at (8%, 80%), (38%, 80%), (68%, 80%) each 25% wide → 3-column grid
```

Convert to Tailwind:
```
`flex flex-col h-full px-16 gap-6` (main)
  + `grid grid-cols-3 gap-4` (for the 3 cards section)
```

**Slot Position → Tailwind Mapping:**

| Slot Configuration | Derived Tailwind Structure |
|--------------------|---------------------------|
| Single content centered | `flex flex-col justify-center h-full px-16` |
| Content stacked vertically | `flex flex-col gap-6 h-full px-16` |
| 2 slots side-by-side 50/50 | `grid grid-cols-2 gap-6 h-full` |
| 2 slots at ~60/40 ratio | `grid grid-cols-5` → `col-span-3` + `col-span-2` |
| 2 slots at ~70/30 ratio | `grid grid-cols-10` → `col-span-7` + `col-span-3` |
| 3 slots in row | `grid grid-cols-3 gap-4` |
| 4 slots in 2x2 grid | `grid grid-cols-2 grid-rows-2 gap-4` |
| Picture left + text right | `grid-cols-5` → `col-span-2` (img) + `col-span-3` (text) |

**Background Images:**

If a layout has a background image (indicated by `**Background: image** → images/filename.png`), add a `bg_image` column to the layout table:

```markdown
| ... | Structure | Best For | Background | Constraints |
| ... | `...` | Cover 01 | `images/cover_01_bg.png` | Max 4 elements |
```

For layouts with background images, the generated JSX should include the background as a full-slide `<img>` positioned absolutely:

```jsx
<div className="absolute inset-0">
  <img src="/images/cover_01_bg.png" className="w-full h-full object-cover" />
</div>
<div className="relative z-10 flex flex-col justify-center h-full px-16">
  {/* content here */}
</div>
```

**Output format for `{theme_name}_layout.md`:**

```markdown
# Layout Patterns (Override)

This file replaces section 1.1 in ant-paged-layout SKILL.md.

| Category | Intent | Pattern | Layout | Structure | Best For | Constraints |
|----------|--------|---------|--------|-----------|----------|-------------|
| **Symmetric** | statement | cover | Cover | `{derived from Cover 01 slots}` | Cover 01 | Max 4 elements |
| Symmetric | statement | section-break | Centered | `{derived from Section Page slots}` | L1 Section Page | — |
| Symmetric | comparison | side-by-side | Split 50/50 | `{derived from 2-column layout slots}` | Statement - 2 columns | Max 2 per deck |
| **Asymmetric** | evidence, focal | 1 main + 1 support | Split 60/40 | `{derived from Mockup layout slots}` | Mockup - narrow | Max 3 per deck |
| ... (include ALL predefined patterns) |
```

**Best For column**: Put the PowerPoint layout name that was mapped to this pattern.

### Step 4: Save Generated Files

Save both files to project directory:

1. Write `{theme_name}.ts` to `{project_dir}/{theme_name}.ts`
2. Write `{theme_name}_layout.md` to `{project_dir}/{theme_name}_layout.md`

### Step 5: Update content.json

```
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "theme",
  "data": {
    "id": "{theme_name}"
  }
})
```

**Note:** Only the theme ID is saved to content.json. The full theme definition is in the `{theme_name}.ts` file which the API loads dynamically.

---

## Preset/Generation Workflow (No Template)

## CRITICAL RULES (DO NOT VIOLATE)

**DO NOT:**
- Read .tsx, .ts, .js, .jsx, .py files from src/, static/, or any solution code
- Use file_search, grep_search, or semantic_search tools - all paths are deterministic
- Search for theme implementations or component code
- Read files outside the project directory except this SKILL file

**DO:**
- Use MCP tools (mcp_apply-patch_read_section, mcp_apply-patch_apply_patch) exclusively
- Select from preset themes listed in this SKILL file
- Trust the documentation here - it contains all theme options needed

## Project Directory Location

**Project directories are located at:**
- **Windows**: `%TEMP%/content-manager/{project_id}/`
- **Unix/Mac**: `/tmp/content-manager/{project_id}/`

Example: `%TEMP%/content-manager/golden_set_6c765a24/`

Your task is to select an existing theme or create cohesive, professional presentation themes based on user requirements.

---

## Workflow

### Input

Read constitution to check for tone/style preferences:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

**Apply constitution rules during theme selection:**
- If constitution has `theme` field → load that preset directly
- If tone is "professional" → prefer corp_modern, business_professional, slate_professional
- If tone is "creative" → consider duolingo, warm_sunset, handdrawn
- If tone is "technical" → prefer minimal_dark, cyber_neon
- Check style_rules for specific theme hints

### Output

For **preset themes**, just save the theme ID to content.json:
```
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "theme",
  "data": {
    "id": "businessLight"
  }
})
```

For **custom themes**, generate a TypeScript file and save the theme ID:

1. Write `{theme_name}.ts` to `{project_dir}/{theme_name}.ts` with full ThemeDefinition
2. Save theme ID to content.json:
```
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "theme",
  "data": {
    "id": "{theme_name}"
  }
})
```

**IMPORTANT**: The full theme definition lives in the `.ts` file, not in content.json. The API dynamically loads theme files from the project directory.

### Summary

After theme selection/generation, return:
```
Applied theme: corp_modern
- Primary: #0066CC (Corporate Blue)
- Background: #FFFFFF (Light)
- Text: #1A1A1A (Dark)
- Style: Professional, clean
- Typography: Inter font family
```

---

## Available Preset Themes

Available preset themes (supported by React renderer):

| Theme Name | Style | Best For |
|------------|-------|----------|
| `businessLight` | **DEFAULT** Professional light theme | Business presentations, executive briefings |
| `business` | Professional corporate style | Corporate presentations |
| `cyber` | Futuristic tech aesthetic | Tech demos, developer content |
| `minimal` | Clean, typography-focused | Reports, documentation |
| `academic` | Scholarly presentation | Research, educational content |
| `creative` | Bold artistic design | Creative presentations |
| `duolingo` | Playful, friendly style | Casual, educational |
| `dark` | Dark mode presentation | General dark mode |
| `teamsDark` | Microsoft Teams dark mode | Teams meetings |
| `teamsLight` | Microsoft Teams light mode | Teams meetings |

**Default theme is `businessLight`** - use this unless user specifies otherwise.

## Step 2: Theme Selection Logic (Preset-First)

**Priority Order:**

1. **Constitution specifies theme name** → Use that theme directly

2. **User mentions preset by name** (e.g., "use dark", "business theme") → Use that preset

3. **No theme specified** → Use `businessLight` as default

3. **Match style keywords to preset**:
   | Keyword | Recommended Preset |
   |---------|-------------------|
   | "dark", "dark mode" | `dark` |
   | "professional", "corporate", "business" | `business` |
   | "minimal", "clean", "simple" | `minimal` |
   | "tech", "cyber", "futuristic" | `cyber` |
   | "academic", "scholarly", "research" | `academic` |
   | "creative", "bold", "artistic" | `creative` |
   | "playful", "fun", "friendly" | `duolingo` |
   | "teams", "microsoft" | `teamsDark` or `teamsLight` |

4. **Custom generation keywords** → Generate new theme
   - "create theme", "generate theme", "new theme", "custom theme"
   - Specific color requests not matching presets

5. **Default** → Use `business`

---

## Theme Generation (Only When No Preset Matches)

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

## Complete Theme Schema (TypeScript file format)

Theme definitions are stored in `.ts` files in the project directory. The API dynamically loads these files.

**content.json only stores the theme ID:**
```json
{
  "theme": {
    "id": "template"
  }
}
```

**Full theme definition is in `{theme_name}.ts`:**

```typescript
import type { ThemeDefinition } from './types';

export const {theme_name}Theme: ThemeDefinition = {
  name: '{theme_name}',
  displayName: '{Theme Display Name}',
  isDark: false,
  background: {
    color: '#FFFFFF',
    image: 'images/cover_bg.png',  // Optional
  },
  colors: {
    // Core colors (REQUIRED)
    bg: '#FFFFFF',              // Page background
    surface: '#F5F5F5',         // Card/panel background (for bg-theme-surface)
    surfaceAlt: '#E8E8E8',      // Alternate surface
    primary: '#0066CC',         // Primary brand color
    secondary: '#004499',       // Secondary brand color
    accent: '#FF6B35',          // Accent color
    text: '#1A1A1A',            // Primary text color
    textMuted: '#6B7280',       // Secondary/muted text
    border: '#E2E8F0',          // Border color
    // Semantic colors (REQUIRED)
    info: '#3B82F6',
    success: '#10B981',
    warning: '#F5A623',
    danger: '#EF4444',
    // Accent palette (REQUIRED for visual variety)
    accent1: '#0066CC',
    accent2: '#FF6B35',
    accent3: '#10B981',
    accent4: '#06B6D4',
    accent5: '#8B5CF6',
    accent6: '#22C55E',
  },
  typography: {
    fontDisplay: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', ui-monospace, monospace",
    sizeDisplay: '72px',
    sizeHeading: '64px',
    sizeBody: '36px',
    sizeCaption: '32px',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  spacing: {
    gap: '2rem',
    padding: '4rem',
    margin: '1rem',
  },
  visuals: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 12px rgba(0, 0, 0, 0.08)',
      lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
      none: 'none',
    },
    borderWidth: '1px',
  },
};

export default {theme_name}Theme;
```

---

## Theme Examples

See `themes/*.ts` files in the React app for complete examples:
- `themes/businessLight.ts` - Light professional theme
- `themes/dark.ts` - Dark theme
- `themes/cyber.ts` - Futuristic tech theme
- `themes/template.ts` - PowerPoint-extracted template example

---

## Theme Customization

When modifying an existing theme:

1. **Start with the current theme as base**
2. **Apply the requested modifications**
3. **Ensure color harmony is maintained after changes**
4. **Keep the same structure** - only change values
5. **Generate a new unique ID** for the modified theme (e.g., `original_id + "_custom"`)

