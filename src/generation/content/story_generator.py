"""Story generator - Plans narrative arc and creates draft slides.

Generates draft slides with:
- story: Narrative description
- atoms: List of atom IDs
- density: Information density
- visual_design: Visual approach

Layout and widgets are empty (filled by ContentTool).
"""
from __future__ import annotations

import json
import os
import re
from typing import List, Dict, Any, Optional

from src.generation.atom.collection import AtomCollection
from src.utils.llm_client import call_llm


# System prompt for SCQA story generation
SCQA_SYSTEM_PROMPT = """You are an elite Strategy Consultant specialized in high-stakes venture capital pitches and executive reviews."""


def _get_atom_content(atom) -> str:
    """Extract displayable content from any atom type."""
    # Try different field names based on atom type
    if hasattr(atom, 'text') and atom.text:
        return atom.text
    if hasattr(atom, 'quote') and atom.quote:
        return atom.quote
    if hasattr(atom, 'description') and atom.description:
        return atom.description
    if hasattr(atom, 'name') and atom.name:
        # BioAtom
        parts = [atom.name]
        if hasattr(atom, 'role') and atom.role:
            parts.append(atom.role)
        if hasattr(atom, 'affiliation') and atom.affiliation:
            parts.append(atom.affiliation)
        return " - ".join(parts)
    if hasattr(atom, 'value') and hasattr(atom, 'label'):
        # StatAtom
        return f"{atom.value} ({atom.label})"
    # Fallback to abstract
    if hasattr(atom, 'abstract') and atom.abstract:
        return atom.abstract
    return str(atom.id)


def _get_atom_type(atom) -> str:
    """Get the type name of an atom."""
    return type(atom).__name__


def _get_story_prompt(
    atoms: AtomCollection,
    user_instruction: str,
    slide_count: Optional[int],
    intent_guidance: str,
) -> str:
    """Build prompt for story generation."""
    # Create a compact atom summary for the prompt
    atom_summaries = []
    for atom in atoms.list_contexts():
        # Get content using helper function
        content = _get_atom_content(atom)
        content_preview = content[:200] if len(content) > 200 else content
        atom_summaries.append({
            "id": atom.id,
            "type": _get_atom_type(atom),
            "content": content_preview,
            "rank": atom.rank,
        })
    atoms_json = json.dumps(atom_summaries, indent=2)
    
    target_slides = slide_count or 10
    
    return f"""You are a STORYTELLER designing presentation narrative and visual approach.

# INPUT
Atoms:
```json
{atoms_json}
```
Instruction: {user_instruction or "Create a compelling presentation"}
Target: {target_slides} slides

# OUTPUT FORMAT
JSON array of slides: id, rank, state, story, atoms, density, visual_design, layout, widgets.

# STORY STRUCTURE (4-part framework)
- **HEADLINE**: Conclusion-first (e.g., "Revenue grew 20%", not "Revenue")
- **NARRATIVE**: Why it matters (speaker's voice)
- **EVIDENCE**: Supporting data/facts
- **TAKEAWAY**: Key implication

# DENSITY GUIDE
| Density | Focus | Elements | Use When |
|---------|-------|----------|----------|
| sparse | Single hero element | 1-2 blocks | Opening, impact moments, key stats |
| moderate | Balanced content | 3-4 blocks | Most body slides |
| dense | Detailed breakdown | 5+ blocks | Data-heavy, comparison slides |

# VISUAL_DESIGN (CRITICAL - content generator follows this)
Specify layout + content approach. Content generator MUST follow this.
Examples:
- "LayoutCover" (opening only)
- "LayoutSplit5050: left=narrative+list, right=BigNum+context"
- "LayoutDashboard: main=chart+metrics, sidebar=key-points"
- "LayoutStacked: text-focused with supporting callout"
- "LayoutSplit5050: left=diagram(process flow), right=explanation"

# SLIDE PACING
1. **SLIDE 1**: Opening. density=sparse, visual_design="LayoutCover"
2. **BODY SLIDES**: Vary density. Use "sparse" for impact, "moderate" for content, "dense" for data.
3. **FINAL SLIDE**: Closing. density=moderate, visual_design includes "SmartList+Callout"

# VISUAL SELECTION RULES
- Use diagram ONLY for process/flow with ≥4 connected steps
- Use chart for comparisons/trends with ≥3 data points
- Use BigNum/MetricGroup for key numbers
- Use SmartList/Text for narrative/recommendations
- Do NOT force visuals where text is clearer

Return ONLY the JSON array."""


def _attach_atoms_to_slides(
    slides: List[Dict],
    atoms: AtomCollection,
) -> List[Dict]:
    """Attach atoms to slides that have embedded content but no atoms.
    
    Uses LLM to intelligently match slide content to available atoms.
    
    Args:
        slides: Slides that may have content but no atoms
        atoms: AtomCollection to reference
        
    Returns:
        Slides with atoms attached where appropriate
    """
    # Filter slides that need atom attachment
    slides_needing_atoms = [
        s for s in slides 
        if not s.get("atoms") or len(s.get("atoms", [])) == 0
    ]
    
    if not slides_needing_atoms:
        return slides
    
    # Build atom summaries for LLM
    atom_summaries = []
    for atom in atoms.list_contexts():
        content = _get_atom_content(atom)
        content_preview = content[:200] if len(content) > 200 else content
        atom_summaries.append({
            "id": atom.id,
            "type": _get_atom_type(atom),
            "content": content_preview,
        })
    
    # Build slides summaries for LLM
    slide_summaries = []
    for slide in slides_needing_atoms:
        slide_summaries.append({
            "id": slide.get("id"),
            "story": slide.get("story", ""),
            "content": slide.get("content", {}),
        })
    
    # Create prompt for LLM
    prompt = f"""You are matching slide content to available atoms.

# AVAILABLE ATOMS
```json
{json.dumps(atom_summaries, indent=2)}
```

# SLIDES NEEDING ATOMS
```json
{json.dumps(slide_summaries, indent=2)}
```

# TASK
For each slide, identify which atoms best match its content. Consider:
- Semantic similarity between slide content and atom content
- Relevance of atom type to slide purpose
- Coverage of slide topics by atoms

# OUTPUT FORMAT
Return a JSON object mapping slide IDs to arrays of atom IDs:
```json
{{
  "slide_01": ["atom_1", "atom_3"],
  "slide_02": ["atom_2", "atom_5"],
  ...
}}
```

Return ONLY the JSON object."""
    
    deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')
    response = call_llm(
        system_prompt="You are an AI that matches presentation content to data atoms. Output only valid JSON.",
        user_prompt=prompt,
        deployment=deployment,
        temperature=0.3,
        max_tokens=4000,
    )
    
    # Parse LLM response
    try:
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            atom_mapping = json.loads(json_match.group())
        else:
            atom_mapping = json.loads(response)
        
        # Apply atom mappings to slides
        for slide in slides:
            slide_id = slide.get("id")
            if slide_id in atom_mapping:
                slide["atoms"] = atom_mapping[slide_id]
        
    except (json.JSONDecodeError, KeyError) as e:
        # Fallback: keep slides without atoms if LLM fails
        pass
    
    return slides


def _get_refine_prompt(
    existing_slides: List[Dict],
    atoms: AtomCollection,
    user_instruction: str,
    intent_guidance: str,
) -> str:
    """Build prompt for story refinement."""
    atoms_json = atoms.to_json(indent=2)
    slides_json = json.dumps(existing_slides, indent=2)
    
    return f"""You are refining an existing presentation story.

# CURRENT SLIDES
```json
{slides_json}
```

# AVAILABLE ATOMS
```json
{atoms_json}
```

# USER REQUEST
{user_instruction}

# GUIDANCE
{intent_guidance or "None"}

# TASK

Modify the story based on the user's request. Common operations:
- Merge slides: Combine story/atoms/content from multiple slides into one
- Split slide: Divide one slide's content into multiple
- Add slide: Insert new slide with atoms/content and story
- Remove slide: Delete slide (don't reassign its atoms/content elsewhere)
- Reorder: Change ranks to restructure flow

# IMPORTANT NOTES

- Slides have BOTH atoms (list of IDs) AND content (embedded structured data)
- Atoms and content are SYNCHRONIZED - they must reflect each other's changes:
  * If you change atoms: Extract new atom content into the content field to reflect the new atoms
  * If you change content: Update the atoms array to reference atoms that match the new content
  * Atoms provide the data source, content provides the narrative structure
- NEVER modify one without updating the other to maintain consistency
- Both fields are required and must stay aligned during refinement

# OUTPUT RULES

1. For slides you DON'T change: Keep exactly as-is (preserve atoms AND content)
2. For slides you CHANGE: Set state="draft" (they need new layout/widgets)
3. Return the COMPLETE slide list (not just changed ones)
4. Keep layout="" and widgets={{}} for all draft slides
5. **CRITICAL**: ALWAYS include BOTH "atoms" and "content" fields in output, even if unchanged

# OUTPUT FORMAT

Return ONLY the JSON array of all slides:
```json
[
  {{"id": "slide_01_hook", "rank": 1, "state": "active", ...}},  // unchanged
  {{"id": "slide_02_merged", "rank": 2, "state": "draft", ...}},  // changed
  ...
]
```"""


def generate_story(
    atoms: AtomCollection,
    user_instruction: str,
    slide_count: Optional[int] = None,
    intent_guidance: str = "",
) -> List[Dict[str, Any]]:
    """Generate draft slides with story arc.
    
    Args:
        atoms: AtomCollection with extracted content
        user_instruction: User's generation instructions
        slide_count: Target number of slides
        intent_guidance: Optional guidance from constitution
        
    Returns:
        List of draft slide dicts with story, atoms, visual_design populated
    """
    prompt = _get_story_prompt(atoms, user_instruction, slide_count, intent_guidance)
    
    deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')
    response = call_llm(
        system_prompt="You are a presentation storyteller. Output only valid JSON array.",
        user_prompt=prompt,
        deployment=deployment,
        temperature=0.7,
        max_tokens=16000,  # Need room for 10+ draft slides (increased for large documents)
    )
    
    # Parse JSON from response
    slides = _parse_json_array(response)
    
    # Validate and normalize
    for slide in slides:
        slide["state"] = "draft"
        slide.setdefault("layout", "")
        slide.setdefault("widgets", {})
        slide.setdefault("density", "moderate")
        slide.setdefault("visual_design", "hierarchical")
    
    return slides


def refine_story(
    existing_slides: List[Dict],
    atoms: AtomCollection,
    user_instruction: str,
    intent_guidance: str = "",
) -> List[Dict[str, Any]]:
    """Refine existing story based on user instruction.
    
    Args:
        existing_slides: Current slides to modify
        atoms: AtomCollection for reference
        user_instruction: What to change
        intent_guidance: Optional guidance
        
    Returns:
        Updated list of slides (mix of active and draft)
    """
    # Attach atoms to slides that have content but no atoms
    # This ensures slides generated from source can be refined
    slides_with_atoms = _attach_atoms_to_slides(existing_slides, atoms)
    
    prompt = _get_refine_prompt(slides_with_atoms, atoms, user_instruction, intent_guidance)
    
    deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')
    response = call_llm(
        system_prompt="You are a presentation storyteller. Output only valid JSON array.",
        user_prompt=prompt,
        deployment=deployment,
        temperature=0.7,
        max_tokens=16000,  # Increased for large documents
    )
    
    # Parse JSON from response
    slides = _parse_json_array(response)
    
    # Normalize
    for slide in slides:
        if slide.get("state") == "draft":
            slide.setdefault("layout", "")
            slide.setdefault("widgets", {})
    
    return slides


def _parse_json_array(response: str) -> List[Dict]:
    """Extract JSON array from LLM response."""
    # Try to find JSON array in response
    json_match = re.search(r'\[[\s\S]*\]', response)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    
    # Try direct parse
    try:
        return json.loads(response)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse story response as JSON: {e}")


def _get_scqa_prompt(
    source_content: str,
    user_instruction: str,
    slide_count: int,
    intent_guidance: str,
) -> str:
    """Build prompt for SCQA story generation from source.
    
    Args:
        source_content: Raw source content (truncated if needed)
        user_instruction: User's instruction
        slide_count: Target number of slides
        intent_guidance: Additional guidance from constitution
        
    Returns:
        User prompt for SCQA generation
    """
    return f"""**Role**: You are an elite Strategy Consultant specialized in high-stakes venture capital pitches and executive reviews. Your task is to transform the provided uploaded file into an executive storyline for a leadership review.

### Source Content:
```
{source_content}
```

### User Instruction:
{user_instruction or "Create a compelling executive presentation"}

### Additional Guidance:
{intent_guidance or "None"}

### I. Narrative Blueprint (strict)
1. Use the **SCQA** flow to structure the narrative to move the audience from agreement to anxiety, then to resolution.
   - **S (Situation): *Impact-first status quo*. Establish the shared "Status Quo" everyone agrees on, **starting from business outcomes**. 
   - **C (Complication): ** Identify the "Villain"—the market shift, pain point, or crisis that creates **Tension** and urgency. Explanation: Don't just list problems; frame them as an active loss of value/revenue that creates a **"crisis of inaction."**
   - **Q (Question): ** Frame the strategic question: How do we capture the opportunity while solving the pain?
   - **A (Answer): ** Present the product as the inevitable resolution.
2. **Answer-first SCQA**: Reduce preface and reveal the "core thing we are proposing" (i.e. "Answer") early, then justify it. Compress the SCQ content.
   - No "scene-setting" slides that restate what everyone knows without a decision implication.
   - Avoid multi-slide problem tours before naming the solution.
   - Avoid abstract vision language without a tangible "what we are building/changing" early.

#### Example: 10-slide structure (SCQA, *no over-index on "Q"*; 80% on Solution + Feasibility + Moat)
- Slide 1: Cover page includes title, subtitle (one-sentence conclusion/vision), presenter/team, date/context
- Slide 2-3: S + C (fast, minimal background, impact-first mandate for early slides). **Purpose:** move the room from *agreement → anxiety* fast
- Slides 4–8: A (Answer) = Solution + Moat + Proof. **Purpose:** make the resolution feel inevitable: *what we build, why we win, why it's buildable
- Slides 9–10: Commit (de-risk + decision + next steps, FAQ, closing vision). **Purpose:** convert skepticism into confidence and force a clean decision

[IMPORTANT] This narrative example is a **reference**, not a strict template. You must **adapt slide allocation and sequencing** based on the Input Document.
- You may **merge, split, reorder, or rename** slides where it improves clarity and pacing.
- Keep the **SCQA arc** and the **80/20 rule** intact, but avoid forcing content into a slot that doesn't fit.
- Prioritize **novel, non-redundant** slides; if two slides would say the same thing, merge them.
- If the uploaded file lacks evidence for a component (e.g., moat, scale signals), **de-emphasize** it and shift emphasis to what *is* supported.

### II. Content Rules (Hard Constraints)
1. **Vertical & Horizontal Logic (The Pyramid Upgrade)**:
   - *Horizontal*: If you read only the headlines of the deck in order, they must form a flawless, 30-second elevator pitch. If there is a "logic gap" between slide titles, the deck fails.
   - *Vertical*: Every headline must be a claim; every bullet below it must be the evidence.
2. **Cognitive Rhythm (Density Control)**: Vary the "Cognitive Load" to prevent audience fatigue. Some slides should be "Deep Dives" (dense evidence on technical workflow), while others must be "Impact Slides" (sparse, bold visuals/text to anchor emotional "aha" moments). Never put two Deep Dives back-to-back.
3. **Insight Density**: 
   - *Metric Prioritization*: You must extract and prioritize critical data (metric, datetime, number) in the uploaded file.
   - *The "So What" Conversion*: Replace descriptive facts with strategic inferences to drive decisions. Every bullet must pass the "So What?" test by converting context into quantified impact. Replace "table stakes" (e.g., "market is growing") with active outcomes (e.g., "growth reduces CAC by 15%"). Never present data without a conclusion.
4. **Feasibility over Vision**: Provide concrete artifacts (like design, data, prototype, etc.) to prove the solution is buildable, not just aspirational.
5. **Non-Redundancy**: No duplicated content across slides. Every slide must provide "new information gain."
6. **No Ghost Data**: 
   - Use only facts in the uploaded file. Do not hallucinate.
   - If critical data is missing, highlight it as a "Strategic Unknown" rather than inventing it.
   - If any "Strategic Unknowns" are identified, you must append a "Data Gap Summary" slide at the very end (after the closing page). If no data is missing, omit this slide.
7. **Subject-Matter Section Titles**: Section titles must describe the content (e.g., "Current User Friction"), not the narrative slot (e.g., "Villain").

### III. Headline Compression Rules (Hard Constraints)
1. **Billboard Headlines**: Every title must be a standalone strategic claim. If an executive reads only the titles, they should grasp the entire investment thesis without looking at the body (English: ≤ 9 words | Chinese: ≤ 15 characters).
   - *Bad*: "Market Analysis"
   - *Good*: "Rising acquisition costs are eroding our Q3 profit margins."
2. Quick "do/don't" rules for great headlines:
   - *Do*: (1) High-density claims. (1) One claim, one verb, one outcome. (2) Put details in subtitle/body.
   - *Don't*: Feature lists, architecture nouns, or "we will build…".
3. Executive Tone: Avoid flowery/dramatic language.
   - *Bad*: "Meeting value dies without artifacts." (Too dramatic)
   - *Good*: "Manual document creation delays execution by [X] days." (Professional/Measured)
   - *Good*: "AI converts spoken intent into tool-ready artifacts." (Clear/Actionable)

#### Good executive headline formulas for slide titles (Soft Guidance):
- Outcome → Mechanism (classic, punchy)
- Villain → Cost (creates urgency fast)
- Decision / Ask framing (forces leadership action)
- Before → After transformation (visual and memorable)
- Strategic positioning (why we win)
- Proof / Feasibility (build confidence)
- Value / ROI framing (exec-friendly)
- Principle / thesis statements (clean and authoritative)
- Risk → Mitigation (de-risking slide titles)

### IV. Linguistic & Tone (Hard Constraints)
1. **Strategic Punchline Usage ("Less but Sharper")**: Selectively add **punchlines** on key slides—such as the **conclusion, major turning points, and core data pages**—to **anchor the message, tighten the narrative, and reinforce the "WOW" factor**. 
[IMPORTANT] Follow the **"less but sharper"** principle and **control the frequency**; overusing punchlines can make the content feel hollow and slogan-like. Use **at most 3 total** across the deck.
2. **Semantic Compression & Information Density**: Avoid "fluff" and "wordiness." Transform weak sentences ("We want to make search faster") into high-density claims ("Optimizing discovery to reduce time-to-value").
3. **WIIFM Persona-Matching**: Tailor vocabulary and focus for the specific stakeholder. E.g., Focus ROI if the pitch is for a CFO; focus scalability if the pitch is for a CTO.
4. **Impact over Features**: Focuses on the Impact (Outcomes) rather than the Outputs. 
    - *Bad*: "we built X"
    - *Good*: "X achieves Y". This text feels more "targeted" to leaders.
5. **The Elevator Pitch Test**: Do the headlines connect smoothly (e.g., Slide 1 leads inevitably to Slide 2). Can the headlines be read sequentially to form a coherent 30-second pitch?

### V. Visual Hint (Hard Constraints): 
- Framework over Imagery: Do not describe "pictures." Describe logical frameworks (e.g., 2x2 matrix, Flywheel, Bridge chart).
- Mandatory for Deep Dives: For every "Deep Dive" slide, the visual_design must specify a professional consulting chart type (e.g., Waterfall, Sankey, Gantt, or Harvey Balls).
Specify layout + content approach. Content generator MUST follow this.
Examples:
- "LayoutCover" (opening only)
- "LayoutSplit5050: left=narrative+list, right=BigNum+context"
- "LayoutDashboard: main=chart+metrics, sidebar=key-points"
- "LayoutStacked: text-focused with supporting callout"
- "LayoutSplit5050: left=diagram(process flow), right=explanation"

### VI. VISUAL SELECTION RULES
- Use diagram ONLY for process/flow with ≥4 connected steps
- Use chart for comparisons/trends with ≥3 data points
- Use BigNum/MetricGroup for key numbers
- Use SmartList/Text for narrative/recommendations
- Do NOT force visuals where text is clearer

### VII. The Creative Edge (Soft Guidance): 
1. Use metaphors where appropriate to clarify complex concepts (e.g., comparing a platform to an "operating system for logistics" rather than just a "management tool"). 
2. Aim for a "Visionary yet Grounded" tone—the deck should feel like it was written by a partner who deeply understands the business, not a clerk summarizing a file.

### Output Format (strict)
You must output a JSON object strictly following this schema. Do not output markdown text outside the JSON code block.

After analyzing the uploaded file, first decide the main focus of the storyline. Use `presentation_meta` for your internal planning to design the SCQA structure. This section helps you organize your thinking but **will not be extracted** - only the `slides` array will be used.

Target slide count: {slide_count} 

Output the complete JSON with both `presentation_meta` (for planning) and `slides` (will be extracted):

{{
  "presentation_meta": {{
    "title": "string",
    "subtitle": "string (optional)",
    "audience": "string",
    "focus": "string (main focus of the presentation)",
    "total_slide": "int (actual total slide pages you decide)",
    "scqa_design": "string (Design the storyline: specify S/C/Q/A sections and map body slides to each)"
  }},
  "slides": [
    {{
      "id": "slide_01",
      "rank": 1,
      "state": "draft",
      "story": "cover: [title]",
      "density": "minimal",
      "visual_design": "[visual description]",
      "content": {{
        "headline": "string (the title of the presentation)",
        "subtitle": "string (optional, adds precision or scope)",
        "category": "cover",
        "presenters": [
          {{ "name": "string", "role": "string (optional)", "org": "string (optional)" }}
        ],
        "date": "YYYY-MM-DD (optional)"
      }}
    }},
    {{
      "id": "slide_02",
      "rank": 2,
      "state": "draft",
      "story": "Situation: [what this slide accomplishes]",
      "density": "minimal | moderate | dense",
      "visual_design": "[framework/chart type description]",
      "content": {{
        "headline": "string (active_headline, exec-readable, declarative)",
        "subtitle": "string (optional, adds precision or scope)",
        "category": "Situation | Complication | Question | Answer",
        "speaker_intent": "string (optional: what the audience should think/decide/feel)",
        "sections": [
          {{
            "title": "string",
            "bullets": [
              {{
                "text": "string"
              }}
            ]
          }}
        ]
      }}
    }},
    {{
      "id": "slide_N",
      "rank": "N (last slide)",
      "state": "draft",
      "story": "ending: [purpose]",
      "density": "minimal",
      "visual_design": "[visual description]",
      "content": {{
        "headline": "string (ending of the presentation, like 'Thank you'/'Decision needed'/'Next Step'/'Q&A' etc.)",
        "subtitle": "string (optional)",
        "category": "ending"
      }}
    }},
    {{
      "id": "slide_N+1",
      "rank": "N+1 (Include this slide ONLY if Strategic Unknowns exist. Omit otherwise.)",
      "state": "draft",
      "story": "data gap summary",
      "density": "minimal",
      "visual_design": "[visual description]",
      "content": {{
        "headline": "Data Gap Summary",
        "category": "data",
        "sections": [
          {{
            "title": "Critical Data Gaps",
            "bullets": [
              {{
                "text": "Identify specific missing data point (e.g., Year 3 CAGR) in slide [slide_id]"
              }}
            ]
          }}
        ]
      }}
    }}
  ]
}}

Return ONLY the JSON object, no explanation."""


def generate_story_from_source(
    source_content: str,
    user_instruction: str,
    slide_count: Optional[int] = None,
    intent_guidance: str = "",
) -> List[Dict[str, Any]]:
    """Generate story directly from source content using SCQA framework.
    
    Uses executive presentation structure (Situation, Complication, Question, Answer)
    instead of atom-based planning.
    
    Args:
        source_content: Raw source content (VTT, TXT, MD, etc.)
        user_instruction: User's instruction
        slide_count: Target number of slides (default: 10)
        intent_guidance: Additional guidance from constitution
        
    Returns:
        List of draft slides with embedded content
    """
    target_slides = slide_count or 10
    
    # Truncate source if too large (keep first 50k chars for prompt)
    source_preview = source_content[:50000] if len(source_content) > 50000 else source_content
    
    # Build prompt
    user_prompt = _get_scqa_prompt(
        source_content=source_preview,
        user_instruction=user_instruction,
        slide_count=target_slides,
        intent_guidance=intent_guidance,
    )
    
    system_prompt = SCQA_SYSTEM_PROMPT
    
    deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')
    response = call_llm(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        deployment=deployment,
        temperature=0.7,
        max_tokens=16000,
    )
    
    # Parse JSON response
    try:
        # Try to extract JSON object
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = json.loads(response)
        
        # Extract slides array
        slides = data.get('slides', [])
        if not slides:
            raise ValueError("No slides in response")
        
        # Validate and normalize slides
        for slide in slides:
            slide.setdefault("state", "draft")
            slide.setdefault("atoms", [])
            slide.setdefault("layout", "")
            slide.setdefault("widgets", {})
            slide.setdefault("density", "moderate")
            slide.setdefault("visual_design", "hierarchical")
            
            # Ensure rank is set
            if "rank" not in slide:
                # Extract from id if possible
                id_match = re.search(r'(\d+)', slide.get("id", ""))
                if id_match:
                    slide["rank"] = int(id_match.group(1))
                else:
                    slide["rank"] = 1
        
        return slides
        
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        raise ValueError(f"Failed to parse SCQA story response: {e}")
