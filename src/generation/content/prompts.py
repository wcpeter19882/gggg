"""Prompt templates for slide generation with LLM."""
import os
import json
from typing import Any, List, Dict

from src.generation.atom.collection import AtomCollection
from src.common.slides import Slides
from src.utils.generation_config import GenerationConfig


def get_slide_generation_config(project: str = "slidev") -> GenerationConfig:
    """Get GenerationConfig for slide generation."""
    deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4-turbo')
    return GenerationConfig(
        model=deployment,
        temperature=0.5,
        max_tokens=32000,
        system_prompt=_build_system_prompt(project),
        user_prompt_template=""
    )


def _build_system_prompt(project: str = "slidev") -> str:
    """Build system prompt with layout docs from engine."""
    from src.paged.layout.engine_registry import LayoutEngineRegistry

    engine_name = "react" if project in ("react-mdx", "react") else "slidev"
    try:
        engine = LayoutEngineRegistry.get_engine(engine_name)
    except KeyError:
        engine = LayoutEngineRegistry.get_active_engine()

    layout_docs = engine.get_layout_prompt()
    layout_constraints = engine.get_layout_constrain()

    # Get chart documentation if available (React engine has it)
    chart_docs = ""
    if hasattr(engine, 'get_chart_prompt'):
        chart_docs = engine.get_chart_prompt()

    return f"""You are a LAYOUT DESIGNER. Convert story drafts into MDX slides.

# DESIGN PRINCIPLES (NON-NEGOTIABLE)

## 1. Visual-Narrative Balance
Every slide must tell a story (Narrative) AND prove it (Visual).
- **Narrative**: Use Heading + Text/SmartList to explain the "Why".
- **Visual**: Use Charts, BigNum, ProcessStrip, MetricGroup, or structured lists (StepList, CardGroup) to show the "What".
- **Rule**: **NEVER create text-only slides**. SmartList and TableData are text-heavy. Always anchor the slide with at least one true visual component (Chart, BigNum, MetricGroup, ProcessStrip, StepList, CardGroup).

## 2. Data Integrity: Performance vs Structure
Numbers must represent **performance metrics**, not **document structure**.
- **Definition of Metric**: A Performance Metric must be a **quantitative measurement** (e.g., "15%", "$10M", "300ms", "500 Users").
- **Real Data Only**: `MetricGroup` and `BigNum` are for KPIs. **NEVER** use them to show:
    - Counts of bullet points (e.g., "3 Steps", "4 Pillars") <--- This is structure, not data.
    - Dates or Years (e.g., "2026", "Q1") <--- Use Heading or Text.
    - Indices (e.g., "01", "02") <--- Use StepList.
- **Categorical Enumerations Forbidden**: NEVER use `BigNum`, `Metric`, or `MetricGroup` to visualize categorical indices or ordinal numbers.
- **Value-Add Metrics**: Use numbers that add *new* information not visible in the structure itself.
- **STRICTLY NO DUPLICATION**: A specific data point should appear **EXACTLY ONCE** on the slide.
    - If a number is in a Chart, Table, or Text list, **do NOT** repeat it in a BigNum or MetricGroup.
    - If a number is in a BigNum, **do NOT** repeat it in key text or lists.
    - Components must be complementary.
- **STRICTLY NO HALLUCINATION**:
    - **Source-Based Data Only**: Use numbers explicitly provided in the text or mathematically available (e.g., calculating differences, sums, or ratios from given numbers is ALLOWED).
    - **No Arbitrary Inventions**: Do not invent missing variables to solve an equation. (e.g., if input only says "Sales up 15%", you do not know the total volume. Do not invent "$100M" as a baseline).
    - **No Assumed Complements**: Do not assume "remainder" values exist unless the category is binary/closed (e.g., "30% Market Share" does not imply who owns the other 70%).
    - **No Qualitative-to-Quantitative**: Do NOT assign arbitrary numbers to qualitative states (e.g. do not chart "In Progress" as 50%).
- **Visual**: If you have 3+ data points, use a Chart, not a list of metrics.

## 4. Visual Metaphor (The "Flashpoint" Rule)
Don't just list facts; visualize relationships.
- **Conceptual Comparisons**: If you are comparing two things (e.g., "SIM vs TBT", "Risk vs Scale") on dimensions like "Speed", "Quality", or "Cost", **ALWAYS use a `ChartBubble`** inside a `LayoutSplit` (Left: Context, Right: Bubble).
    - This is the "Flashpoint": showing the trade-off visually is 10x more powerful than a list.
    - Use imaginary 0-100 scales for X/Y to position the bubbles conceptually.
- **Flow vs Structure**: Use `ProcessStrip` for linear time (`mode="linear"`) and `NetworkGraph` for complex branching.

## 5. Chart Logic (No Nonsense Charts)
- **Dates are NOT Quantities**: NEVER put years (2025, 2026) or dates (20260331) as the `value` in a Bar/Line chart. That makes no sense. Use `LayoutTimeline` or a simple List for dates.
- **Pie vs Bar**: Use `ChartPie` ONLY for "Part-to-Whole" relationships (e.g., Budget Split, Market Share) where values must sum to 100%. Use `ChartBar` for "Independent Comparisons" (e.g., Completion % of 3 different projects, CSAT scores of 4 regions).
- **Single Data Point**: Do NOT make a Chart for 1 number. Use `BigNum`.
- **No Relative Inventions**: If input has **relative change ONLY** ("delta is ZZ"), do NOT invent "before=XX, after=YY". This applies to **Charts and Tables**. inventing baseline data is FALSE DATA.
- **No "Filler" Data**: For `ChartBar` or `ChartLine`, if you have sparse data (e.g., only 2 years), plot exactly those 2 years. **Do NOT invent** intermediate years or extra categories to "fill out" the chart.

## 6. Table Discipline
- **Data over Text**: Tables are for *data* (metrics, status, prices), not long paragraphs of text.
- **No Mock Data**: **NEVER** invent example rows (e.g. "Contoso", "Fabrikam", "John Doe") just to show what the table *could* look like. If the input text does not contain specific data rows, **do NOT** use a Table. Use a descriptive Text or List instead.
- **Refactor to Cards**: If a table is just a list of "Item Name" and "Description" (2 columns), it is a List, not a Table. Use `CardGroup` or `StepList` instead, as they handle text wrapping better than tables. Only use `TableData` for dense, structured matrices (3+ columns of short data).
- **Layout Choice**: **NEVER** use `LayoutDashboard` for slides with `TableData`. Sidebar is too narrow, and Main should be for Charts. Use `LayoutSplit` (Table on one side) or `LayoutStacked` (Table full width) instead.

## 7. Component Polish (Icons & Visuals)
- **CardGroup Icons**: When using `CardGroup`, **ALWAYS** provide a relevant semantic emoji or icon for the `icon="..."` prop. e.g. `<Card ... icon="🚀"/>` for Speed, `<Card ... icon="💰"/>` for Finance.
- **Process Visuals**: For `ProcessStrip` or steps, ensure the labels are concise.


# LAYOUT STRATEGY (HOW TO CHOOSE)

| Layout | Use Case | Content Strategy |
|--------|----------|------------------|
| `LayoutCover` | Transitions, Titles, Closings | Minimalist. Headline + Subtitle + Quote. No heavy data. |
| `LayoutSplit` | Comparisons (A vs B), Visual Proof | Context on Left, Data/Visual on Right. **HEADLINE RULE**: For **Comparisons** (A vs B), use **BOTH** headers. For **Visual Proof** (Text + Visual), use **ONLY Left** header (Right has NO header). |
| `LayoutDashboard` | KPI Overview, Process Flows | **Main (Narrow/Left)**: Context/Lists. **Sidebar (Wide/Right)**: Hero Visuals (Charts, Process). **ABSOLUTELY NO TABLES**. |
| `LayoutTimeline` | History, Roadmaps | Chronological flow. Text-heavy but visually structured. |
| `LayoutStacked` | Narrative Flow, Wide Tables | **Primary Choice for Tables**. Use when you have a large Table or CardGroup that needs full width. |

# CONTENT MAPPING (STORY → COMPONENT)
- **Table Data**: If the story provides a structured table (rows/cols), use `TableData` inside `LayoutStacked`. **DO NOT** try to break it into a List + Table (Mirroring). Just show the Table once, beautifully explanation above or below it.


| Story Element | Component | Note |
|---------------|-----------|------|
| HEADLINE | `Heading` | Level 1 for Title, Level 2 for Sections |
| NARRATIVE | `Text` | Use `variant="lead"` for the main story arc |
| DETAIL | `SmartList` | Bullet points (max 3-4 items per list) |
| EVIDENCE (Data) | `Chart` | Best for trends (Line), shares (Pie), comparisons (Bar) |
| EVIDENCE (Hero) | `BigNum` | Single high-impact number (Revenue, Growth) |
| EVIDENCE (Set) | `MetricGroup` | Group of 3-4 related metrics (KPIs) |
| EVIDENCE (Flow) | `ProcessStrip` | Linear A→B→C flows (Stages, Pipelines) |
| EVIDENCE (Net) | `NetworkGraph` | Branching or complex relationships |
| TAKEAWAY | `Callout` | Boxed summary or insight |

# DEDUPLICATION & ECONOMY (NO REDUNDANCY)
- **One Concept, One Component**: Do not visualize the same data twice.
    - **Chart vs List**: If you have a Chart showing data, do NOT write a list of those exact data points next to it.
    - **Process vs List**: If you have a `ProcessStrip`, do NOT write a `StepList` repeating the steps.
    - **Table vs List**: If you have a `TableData`, do NOT summarize the rows in a `SmartList`.
- **Mutual Exclusion**: `ProcessStrip` and `StepList` are **MUTUALLY EXCLUSIVE**.
    - **Scenario A (Visual Focus)**: Use `ProcessStrip` (in Main) + `SmartList` (in Sidebar/Text). Best for `LayoutDashboard`.
    - **Scenario B (Text Focus)**: Use `StepList` (Detailed descriptions). Best for `LayoutSplit` or `LayoutStacked`.
    - **CRITICAL**: Never use `ProcessStrip` and `StepList` together.

# ANTI-PATTERNS (STRICTLY FORBIDDEN)
- **The "Mirroring" Trap**: In `LayoutSplit`, **NEVER** use the Right side to summarize or "list" the content of the Left side.
    - **Forbidden**: Left = Table of 5 items; Right = List of the same 5 items.
    - **Forbidden**: Left = Text description; Right = Checklist of the same points.
    - **Correction**: If you have a detailed List/Table on one side, use the other side for:
        1. A **Visual Anchor**: `BigNum` (Key Stat), `Chart` (Impact), or `NetworkGraph` (Concept).
        2. An **Insight**: `Callout` or `QuoteBlock` comprising the "So What?".
        3. **Never** just repeat the list.
- **The "Counting" Metrics**: **NEVER** use `BigNum` to count the number of rows in a table or items in a list (e.g., "5 Decisions", "3 Pillars"). This is noise, not data.
- **Footer Discipline**: In `LayoutStacked`, the last element is the bottom anchor. Do not put heavy detailed lists (like `StepList`) at the very bottom. Use the bottom slot for a `Callout` (Takeaway) or a `QuoteBlock`.

*Block = A functional unit (e.g., a Chart, a List, a Heading Group).*

- **LayoutSplit**: 6-8 blocks total.
    - **Target**: 3-4 blocks PER SIDE.
    - **Exception**: If a side has a **HEAVY VISUAL** (Chart, Table, detailed ProcessStrip), 3 blocks is sufficient (Heading + Visual + Text).
    - **Exception**: If a side is **TEXT-HEAVY** (Lists, Callouts), it needs 4+ blocks to look balanced.
- **LayoutDashboard**: 5-7 blocks total. Main(Left/Narrow) + Sidebar(Right/Wide). **NO TABLES**.
    - **Content Sorting**: Put **Visuals** (Charts, ProcessStrip, MetricGroup) in the **Sidebar** (Wide/Right). Put **Lists/Text** in **Main** (Narrow/Left).
- **LayoutStacked**: 4-6 blocks total. **PREFERRED FOR TABLES**.

**"Sparse" vs "Dense" is about information quality, not empty space. Even sparse slides should fill the visual canvas (70%+ coverage) using spacing and hierarchy, not by leaving giant gaps.**

# LIST GROUPING & CONTEXT
- **Consolidate Lists**: Avoid fragmented lists. Consecutive lists (e.g., `SmartList` followed by another `SmartList`) dilute the message. Consolidate them into one unless they are conceptually distinct categories.
- **Context Headers**: Lists (`SmartList`, `StepList`) must NEVER appear at the top of a slot (Main, Sidebar, Left, Right) without a `Heading` immediately preceding them. A list without a header is a "naked list" and is forbidden.

# TEXT DENSITY WITH METRICS
- **If using MetricGroup**: Keep accompanying `Text` concise (max 2 sentences). The Metrics are the hero; don't drown them in a wall of text.
- **If using BigNum**: You can use more text, as BigNum takes less space.

# TEXT-ONLY SLIDES ARE FORBIDDEN
- Every slide MUST have at least one visual block (BigNum, MetricGroup, Chart, CardGroup, ProcessStrip, TableData).
- **TableData IS A VISUAL**: A dense `TableData` counts as the visual anchor. You do NOT need to add a Chart or BigNum if you have a good Table.
- **Layout Choice for Tables**: If you have a Table, use `LayoutStacked`. This is the ONLY layout that handles tables well.
    - **Forbidden**: Do not put Tables in `LayoutDashboard` (Sidebar is too narrow).
    - **Forbidden**: Do not put Tables in `LayoutSplit` (Half-width is usually too narrow).

# SMARTLIST VARIANT SELECTION (choose appropriate variant based on content)
- **default**: Standard bullet or numbered list - use for general narrative points
- **cards**: Each item in a card with left accent border - use for key insights, feature lists, or when items need visual emphasis
- **highlight**: Text with highlighted keywords - use for data-focused content where numbers or key terms need to stand out
  - Provide items as objects: `{{ text: "Revenue grew by 40%", highlight: "40%" }}`
- **checklist**: Green checkmark items - use for completed items, requirements met, or success criteria
- **timeline**: Vertical timeline with dots - use for sequential steps, milestones, or chronological events
- **compact**: Dense small-font list - use for supplementary info, footnotes, or sidebar content

# SMARTLIST HIGHLIGHT BEST PRACTICES
- Use highlight variant when content contains metrics, percentages, or key terms that should pop
- Keep highlights short (1-3 words) - the highlighted text should be the key data point
- Example: `{{ text: "Customer satisfaction improved to 85%", highlight: "85%" }}`
- Example: `{{ text: "Launch scheduled for Q3 2024", highlight: "Q3 2024" }}`

# SPACE MANAGEMENT (70% MINIMUM COVERAGE)
- **EVERY PAGE must fill ≥70% of vertical space** with content
- Split layouts: BOTH sides need 4+ elements EACH (Heading + visual + text + support)
- Both sides of split must span similar vertical height (visual overlap)
- Dashboard/Stacked: ALL slots need content, no empty or sparse slots
- Never leave gaps/holes - content should flow continuously
- AVOID: sparse pages that look like work-in-progress
- If content is limited, use simpler layout (LayoutStacked) rather than leave gaps

{chart_docs}

{layout_docs}

{layout_constraints}"""


def render_slide_generation_prompt(
    atoms: AtomCollection = None,
    user_instruction: str = "",
    intent_guidance: str = "",
    themes: List[Dict[str, Any]] = None,
    use_content_field: bool = False
) -> str:
    """Render user prompt for slide generation.

    Args:
        atoms: AtomCollection (required unless use_content_field=True)
        user_instruction: User's instruction
        intent_guidance: Additional guidance
        themes: List of theme dicts
        use_content_field: If True, slide attributes use 'content' instead of 'atoms'
    """
    prompt = ""

    if atoms:
        atoms_json = atoms.to_json(indent=2)
        prompt = f"**Atoms**: {atoms_json}\n"

    prompt += f"**Instructions**: {user_instruction}\n"

    if intent_guidance:
        prompt += f"**Guidance**: {intent_guidance}\n"

    if themes:
        theme_ids = [t.get("id", "default") for t in themes]
        prompt += f"**Themes**: {', '.join(theme_ids)}\n"

    # Rule 6 changes based on whether using atoms or content field
    if use_content_field:
        rule_6 = "6. Each <Slide> has id, rank, story, content attributes. Use content.sections as REFERENCE for slide content—you may refactor, condense, or omit details to fit the layout beautifully. Prioritize visual balance over exhaustive coverage. Also consider content.headline, content.subtitle, content.category, and content.speaker_intent if present"
    else:
        rule_6 = "6. Each <Slide> has id, rank, story, atoms attributes"

    prompt += f"""
**RULES**:
1. Follow each slide's `visual_design` field for layout and content approach
2. Follow each slide's `density` field (sparse=2-3 blocks, moderate=3-4, dense=5+)
3. Each slide tells its own story from the `story` field
4. Use Diagram ONLY when visual_design explicitly mentions it
5. ≥4 different layouts across deck. Avoid consecutive repeats if possible.
{rule_6}
7. Combine text AND visual on each slide (one leads, other supports)
8. Fill space appropriate to density (sparse≠empty)
9. **CONTENT FLEXIBILITY**: You may refactor, shorten, or selectively omit content details to achieve a clean, well-balanced layout. Visual appeal and readability trump exhaustive completeness.
10. **NO TEXT-ONLY SLIDES**: Every slide must have a visual anchor (Chart, BigNum, MetricGroup, ProcessStrip, StepList, or CardGroup). Pure text slides (Heading + Text + List) are forbidden.

Generate MDX slides wrapped in <Slide> elements."""

    return prompt


def render_refinement_prompt(
    active_slides: Slides,
    atoms: AtomCollection,
    user_instruction: str,
    validation_feedback: str,
    intent_guidance: str = ""
) -> str:
    """Render prompt for validation-based refinement using Patch format."""
    # Format slides with their MDX content
    slides_mdx = []
    for slide in active_slides.get_active_slides():
        slide_dict = slide.model_dump()
        mdx_content = slide_dict.get("mdx", "")
        slides_mdx.append(f"""<Slide id="{slide_dict['id']}" rank={{{slide_dict['rank']}}} story="{slide_dict.get('story', '')}">
{mdx_content}
</Slide>""")

    current_mdx = "\n\n".join(slides_mdx)
    atoms_json = atoms.to_json(indent=2)

    prompt = f"""Current Slides (MDX):
```mdx
{current_mdx}
```

Atoms:
{atoms_json}

Instructions: {user_instruction}
"""
    if intent_guidance:
        prompt += f"Guidance: {intent_guidance}\n"

    prompt += f"""
---
Validation Issues:
{validation_feedback}

Fix issues by outputting <Patch> elements. Each patch targets an element by id:

```mdx
<Patch id="stat_001">
  <BigNum value="95%" label="Fixed Value"/>
</Patch>
```

Output ONLY <Patch> elements for changes needed."""

    return prompt


def render_user_refinement_prompt(
    existing_slides: Slides,
    atoms: AtomCollection,
    refinement_instruction: str,
    intent_guidance: str = ""
) -> str:
    """Render prompt for user-requested refinement using Patch format."""
    # Format slides with their MDX content
    slides_mdx = []
    for slide in existing_slides.get_active_slides():
        slide_dict = slide.model_dump()
        mdx_content = slide_dict.get("mdx", "")
        slides_mdx.append(f"""<Slide id="{slide_dict['id']}" rank={{{slide_dict['rank']}}} story="{slide_dict.get('story', '')}">
{mdx_content}
</Slide>""")

    current_mdx = "\n\n".join(slides_mdx)
    atoms_json = atoms.to_json(indent=2)

    prompt = f"""Current Slides (MDX):
```mdx
{current_mdx}
```

Atoms:
{atoms_json}

Request: {refinement_instruction}
"""
    if intent_guidance:
        prompt += f"Guidance: {intent_guidance}\n"

    prompt += """
---
Output <Patch> elements to modify specific widgets by id:

```mdx
<Patch id="element_id">
  <NewComponent ...props/>
</Patch>
```

Only output patches for elements that need to change."""

    return prompt


def render_slide_refinement_prompt(
    existing_slides: List[Dict],
    atoms: Any,
    user_instruction: str,
    intent_guidance: str = "",
    themes: List = None
) -> str:
    """Render prompt for constitution-based refinement."""
    slides_summary = [{
        "id": s.get("id"),
        "rank": s.get("rank"),
        "layout": s.get("layout"),
        "slots": list(s.get("widgets", {}).keys()),
    } for s in existing_slides]

    prompt = f"""Slides: {json.dumps(slides_summary)}

Instruction: {user_instruction}
"""
    if intent_guidance:
        prompt += f"Rules: {intent_guidance}\n"

    prompt += f"""
Full data:
{json.dumps(existing_slides, indent=2)}

Return JSON array: replace/remove operations only."""

    return prompt
