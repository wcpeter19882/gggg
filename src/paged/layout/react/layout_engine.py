"""React MDX layout engine - prompt components for LLM content generation."""


class ReactLayoutEngine:
    """Layout engine for React MDX presentations with semantic components."""

    @classmethod
    def get_chart_prompt(cls) -> str:
        """Provide chart component documentation for LLM prompts.

        This is the SINGLE SOURCE OF TRUTH for all chart-related documentation.
        Other modules should reference this instead of duplicating chart info.
        """
        return """# CHART DOCUMENTATION

## CHART DECISION RULES

1. **Related data** (time-series, percentages, comparisons) → USE standard charts
2. **Options differing across dimensions ("A vs B" comparison)** OR **3D data** (x, y, size) → USE ChartBubble
4. **Unrelated metrics** → USE BigNum/MetricGroup, NOT charts
5. **Custom charts** → ONLY when user explicitly requests (e.g., "use rose chart")

**🚫 NO DATA HALLUCINATION (CRITICAL)**:
- **Source-Based Data Only**: Use numbers explicitly provided in the text or mathematically available (e.g., calculating differences, sums, or ratios from given numbers is ALLOWED).
- **No Arbitrary Inventions**: Do not invent missing variables to solve an equation. (e.g., if input only says "Sales up 15%", you do not know the total volume. Do not invent "$100M" as a baseline).
- **No Assumed Complements**: Do not assume "remainder" values exist unless the category is binary/closed (e.g., "30% Market Share" does not imply who owns the other 70%).
- **Fallback Rule**: If you lack the necessary data points for a specific Chart or Table, use a **Text**, **BigNum**, or **List** component instead. Never make up data just to use a Chart or Table (like `TableData`).
- **No Qualitative-to-Quantitative**: Do NOT assign arbitrary numbers to qualitative states.
    - "In Progress" != 50%. "Complete" != 100%. "Priority" != 80%.
    - If the text says "Project A is finishing", do NOT chart it as 90%. Use a List or Status Indicator instead.
- **ChartBar/Line Strictness**: For `ChartBar` and `ChartLine`, **NEVER** invent "filler" data points to make the chart look full or smooth.
    - If input has data for 2023 and 2025, plot ONLY 2023 and 2025. Do NOT invent 2024.
    - If input has **relative change ONLY** ("delta is ZZ"), do NOT invent "before=XX, after=YY". This is FALSE DATA.
    - If input has data for "Item A", do NOT invent "Item B" just to have a comparison.

**Examples:**
- ✅ "Q1: $100K, Q2: $150K, Q3: $200K" → ChartBar/ChartLine (related time-series)
- ✅ "Market share: A 45%, B 30%, C 25%" → ChartPie (related percentages)
- ✅ "Option A suits high-X/high-Y, Option B suits low-X/low-Y" → ChartBubble (dimensional difference)
- ❌ "Revenue: $1.2M, Users: 50K, Growth: 25%" → MetricGroup (unrelated metrics)
- ❌ "99.38% reliability" → BigNum (single metric)

## CHART TYPE SELECTION

| Data Pattern | Component |
|--------------|-----------|
| Categorical comparison | `<ChartBar/>` |
| Before/after | `<ChartBar data={[{label, before, after}]}/>` |
| Trends over time | `<ChartLine/>` |
| Time-series/cumulative | `<ChartArea gradient={true}/>` |
| Proportions (~100%) | `<ChartPie variant="donut"/>` |
| Rankings | `<BarStats sortDescending={true}/>` |
| Multivariate (4+ attrs) | `<ChartRadar/>` |
| Cyclical/periodic | `<ChartPolar/>` |
| Options across 2 dimensions / 3D data | `<ChartBubble/>` |

## BUBBLE CHART (ChartBubble)

**Two use cases:**

### 1. Compare options across 2 dimensions (Strategic Positioning Map)
When options behave differently across 2 dimensions:
- Option A excels in one direction, Option B excels in the opposite
- Position bubbles in opposite corners to show they serve different needs
- **Use relative values (0-100)** for x/y - NOT real data numbers
- **Include description** to explain what each option is best for

**Examples:**
- Tool A (high volume, low complexity) vs Tool B (low volume, high complexity)
- Mode A (structured, precise) vs Mode B (flexible, interactive)

```jsx
<ChartBubble
  title="Option Positioning"
  xLabel="Dimension X"
  yLabel="Dimension Y"
  data={[
    {label: "Option A", description: "Best for X scenarios", x: 25, y: 30, size: 50},
    {label: "Option B", description: "Best for Y scenarios", x: 80, y: 75, size: 50}
  ]}
/>
```

**Positioning map rules:**
- x/y values are relative positions (0-100 scale), NOT real measurements
- Bubbles auto-size to fit labels comfortably (don't set extreme size values)
- Add `description` field to explain each option's strength (displayed inside bubble)
- Axis labels describe the dimension conceptually, not numeric values

### 2. Visualize 3-dimensional data
When you have real numeric data with 3 dimensions (x, y, size):

**Examples:**
- Products by Price (x) vs Quality (y) vs Sales Volume (size)
- Countries by GDP (x) vs Population (y) vs Growth Rate (size)

```jsx
<ChartBubble
  title="Product Analysis"
  xLabel="Price"
  yLabel="Quality Score"
  data={[
    {label: "Product A", x: 150, y: 85, size: 1200},
    {label: "Product B", x: 80, y: 60, size: 3500}
  ]}
/>
```

**Rules:** For positioning maps use relative values (0-100); for real data use actual values

## CUSTOM CHARTS (ChartCustom)

**⚠️ ONLY use when user explicitly requests a specific chart type** (e.g., "use rose chart", "show as waffle").
Otherwise, always use standard charts above.

| Type | Best For |
|------|----------|
| `pictogram` | Making data tangible with icons |
| `waffle` | Percentages out of 100 |
| `rose` | Cyclical data with magnitude |
| `funnel` | Conversion rates, pipelines |
| `gauge` | Single value progress |
| `radial` | Progress/completion bars |
| `treemap` | Hierarchical proportions |

## DATA FORMAT

| Component | Format | Example |
|-----------|--------|---------|
| ChartBar/Line/Area/Pie/Polar/Radar/BarStats | `{label, value}` | `{label: "Q1", value: 50}` |
| ChartBar (clustered) | `{label, before, after}` | `{label: "Sales", before: 80, after: 120}` |
| ChartBubble | `{label, x, y, size, description?}` | `{label: "Option A", description: "Best for X", x: 80, y: 75, size: 50}` |
| ChartCustom | `{label, value}` | `{label: "Item", value: 50}` |

**⚠️ NEVER use arbitrary keys** like `revenue`, `sales` - components ignore unknown properties!"""

    @classmethod
    def get_layout_prompt(cls) -> str:
        """Provide React MDX layout reference for LLM prompts."""
        return """# VISUAL DESIGN INSTRUCTIONS

You are designing slides as MDX markup. Match layout to the visual_design intent.

## GLOBAL LAYOUT RULES
1. **NO NESTING**: **NEVER** nest a Layout component (e.g., `LayoutDashboard`, `LayoutSplit`, `LayoutStacked`) inside another Layout component. Layouts are top-level containers only.
2. **ONE LAYOUT PER SLIDE**: Each slide must have exactly one Layout component wrapping its content.

## LAYOUT DECISIONS

**LayoutCover** — TRADITIONAL cover page: title + subtitle only. Clean, minimal, impactful.
- Best: opening title slide, closing "Thank You" slide, section dividers
- Components: Heading (level 1), Text (subtitle), optionally ONE of: QuoteBlock
- **🚫 FORBIDDEN on LayoutCover**: BigNum, MetricGroup, SmartList, Charts, Diagrams, CardGroup, ProcessStrip, StepList
- **MAX ELEMENTS**: 2-3 elements total (Heading + subtitle + optional quote/callout)
- Cover pages should feel SPACIOUS and IMPACTFUL, not cramped with data

**LayoutSplit** — Use when pairing text with visual, or showing two related concepts.
- Best: metric + context, chart + explanation, before/after, **ChartBubble comparisons** (Left: Context, Right: Bubble)
- **REQUIRED STRUCTURE**:
  ```jsx
  <LayoutSplit ratio="1:1">
    <Header>
      <Heading level={2}>MAIN SLIDE TITLE</Heading>
      <Text variant="lead">Optional subtitle text</Text>
    </Header>
    <Left>
       {/* Content for left column */}
    </Left>
    <Right>
       {/* Content for right column */}
    </Right>
  </LayoutSplit>
  ```
- **SLOTS**:
  - `<Header>`: **MANDATORY**. Must contain the global slide title. Spans full width.
  - `<Left>` / `<Right>`: Column content.
  - Ratio options: 1:1, 2:1, 1:2, 3:1, 1:3
- **HEADING RULE (Columns)**: If you use *sub-headings* inside Left/Right columns, use `level={3}`. 
- **NO LEAD TEXT AFTER SLOT HEADLINE**: Do NOT put `<Text variant="lead">` immediately after a column/slot `<Heading level={3}>`. Use standard text or a list instead. `variant="lead"` is ONLY for the main slide introduction (under `<Header>`).
- **CRITICAL**: Do NOT put the main slide title inside `<Left>` or `<Right>`. It MUST go in `<Header>`.
- **HEADLINE PRESENCE**:
  - **Comparisons (A vs B)**: Use level={3} sub-headers in BOTH columns (e.g., "Problem" vs "Solution").
  - **Visual Proof**: Use sub-header in Left column only. Right side has visual only.
- **MIRROR VARIANT**: Use `mirrorLeft={true}` when:
  - The left and right sides represent a **direct comparison** (e.g., "Problem vs Solution", "Before vs After", "Old vs New", "Option A vs Option B").
  - This variant aligns the Left content to the right (towards the center) and Right content to the left (towards the center), creating a symmetric "mirror" effect.
  - **Best with ratio="1:1"**, but works with others if content is balanced.
- **DIAGRAM RULE for Split Layouts**:
  - NetworkGraph in ANY split layout should use `direction="TB"` (vertical/top-to-bottom) to maximize height
  - Split columns are narrow → horizontal diagrams look cramped and short
  - Prefer vertical flow diagrams that fill the column height, not width
- **CONTENT PLANNING BY RATIO**:
  - **1:1**: Equal content on both sides (4-5 elements each)
  - **2:1**: Larger side (2) gets main content (5-6 elements); smaller side (1) gets 2-3 supporting elements
  - **1:2**: Smaller side (1) gets 2-3 elements; larger side (2) gets main content (5-6 elements)
  - **3:1 / 1:3**: Large side dominates (6+ elements); small side is accent only (1-2 elements: Heading or BigNum)
- **RULE**: Match content density to column width. Never cram the small column with as much as the large column.

**LayoutStacked** — Use for text-heavy narrative or sequential content.
- Best: storytelling, explanations, step-by-step instructions
- Components: Heading, Text, SmartList, TableData

**LayoutFullBleed** — Use for visual impact with background image.
- Best: hero moments, emotional beats, section transitions
- Components: Heading, QuoteBlock, BigNum (overlay on image)
- **🚫 FORBIDDEN on LayoutFullBleed**: TableData, SmartList, MetricGroup, Charts, CardGroup
- FullBleed is for IMPACT, not data - use Split/Dashboard for data-heavy content

**LayoutDashboard** — Use for data-dense KPI displays.
- Best: metrics overview, performance summary, status report, **Process Flows**
- Slots: Header, Main, Sidebar, Footer
- **Header slot**: Heading level={2} ONLY (no Text, no lead paragraph)
- **Main slot (Left, 1/3 width)**: Narrow context column. Best for Vertical Lists (SmartList, StepList), Key Takeaways (Callout), or Summary Text.
- **Sidebar slot (Right, 2/3 width)**: Wide visual column. Best for Hero Charts, ProcessStrips, MetricGroups.
- **CRITICAL**: Put visual anchors (Charts/Process) in **Sidebar** (Wide). Put text/lists in **Main** (Narrow).
- **SYNC MODES** (prop: `nosync`, boolean, default: `false`):
  - **sync mode (`nosync={false}`, default)**: Main and Sidebar content is row-aligned (top-aligned). Use for text/metrics matching.
  - **nosync mode (`nosync={true}`)**: Main and Sidebar are vertically center-aligned. **Use `nosync={true}` when Sidebar contains a visual (Chart, Diagram, ProcessStrip)**.

**LayoutTimeline** — Use for chronological milestones with rich content per event.
- Best: company history, project milestones, annual roadmap with details
- Use when each milestone needs: title + description (rich content)
- Creates horizontal timeline with alternating nodes above/below center line
- **REQUIRED PROPS**: `headline` (string). `subtitle` is optional.
- Slots: LayoutTimeline.Item (with year prop) × 3-6 items
- Components inside Item: Heading level={3}, Text (keep brief)
- **HIGHLIGHT RULE**: You may mark the single MOST IMPORTANT milestone as `highlighted={true}` on that `LayoutTimeline.Item`.
  - Use at most ONE highlighted item per timeline. E.g., the north star, the biggest milestone, the most critical turning point, etc.
- **TEXT VARIANT RULE**: `Text`'s `variant` is optional.
  - Use plain `<Text>...</Text>` for the main body (concise, accurate).
  - Only use `<Text variant="caption">...</Text>` when you truly need a short caption/source note underneath the main text (e.g., emphasizing milestone).
- PREFER over ProcessStrip when milestones need detailed explanations

## CHART EXCLUSIVITY (CRITICAL)

**⚠️ ONE CHART PER SLIDE** — Never place 2 charts on the same slide.
- Each slide gets exactly ONE Chart OR none
- Pair the chart with text elements (Heading, Text, SmartList)
- If you need multiple data views, split them across separate slides

## CHART PLACEMENT PATTERNS

**Use LayoutSplit to pair a chart with explanatory content. Choose side based on content flow:**

| Pattern | When to Use | Layout |
|---------|-------------|--------|
| **Chart-Left** | Data DRIVES the narrative (evidence-first, then explain) | `<Left>Chart</Left><Right>SmartList+Text</Right>` |
| **Chart-Right** | Context FRAMES the data (explain setup, then show proof) | `<Left>Heading+SmartList</Left><Right>Chart</Right>` |

**Placement Guidelines:**

### Chart-Left (Data-First Pattern)
Use when the data is the PRIMARY message:
- Performance metrics and KPIs being showcased
- Trend reveals, comparison results, before/after demonstrations

### Chart-Right (Context-First Pattern)
Use when context is needed to INTERPRET the data:
- Complex metrics requiring explanation
- Building toward a reveal/conclusion

## COMPONENT REFERENCE

**⚠️ CONTENT MINIMUM PER SLIDE** (non-negotiable):
- Every slide must have **at least 1 visual block**: BigNum, MetricGroup, Chart, Diagram, CardGroup, TableData, QuoteBlock
- "Visual block" = anything that isn't just Heading/Text/SmartList
- Text-only slides with just Heading + SmartList look INCOMPLETE

**⚠️ VISUAL CONSISTENCY RULE**: Same or analogous concepts on ONE slide MUST use the SAME component type.
- BAD: Left side uses BigNum for "Revenue", Right side uses Text for "Profit" → visual mismatch confuses readers
- GOOD: Both use BigNum, or both use Metric inside MetricGroup
- This applies to: metrics, lists, process steps, cards - keep parallel concepts visually parallel

**🚫 NO REDUNDANCY / DUPLICATION (CRITICAL)**:
- **NEVER show the same data point twice** on the same slide.
- **Visuals must be COMPLEMENTARY, not repetitive.**
- **BAD**: A Table showing "Error reduction: 37%" AND a BigNum showing "37% Error reduction". (Duplicated info).
- **GOOD**: A Table showing detailed breakdown (metrics A, B, C) and a BigNum showing the *aggregate* result that is NOT in the table.
- Use distinct components for distinct data.

**Metrics**: BigNum (hero stat with trend), MetricGroup (3-4 KPIs), MetricStrip (inline row)
**Content**: SmartList (bullet points), CardGroup (feature cards), QuoteBlock, TableData
**Text**: Heading (level 1-3), Text (lead/body/caption), Highlight (inline emphasis)

**⭐ PROCESSSTRIP - USE THIS FOR WORKFLOWS/FLOWS** (most common visual element!):
- **ProcessStrip**: Horizontal phases - USE FOR: any A→B→C→D flow, turn sequences, pipelines, stages
- **StepList**: Vertical numbered steps - USE FOR: setup guides, how-to, onboarding flows
- **LayoutTimeline**: Rich chronological milestones - USE FOR: company history with details

**🚫🚫🚫 PROCESSSTRIP WIDTH RULE (CRITICAL - WILL CAUSE OVERFLOW!):**
| Layout Context | Max ProcessStrip Items |
|----------------|------------------------|
| 1:1 split (Left or Right) | **3 items MAX** |
| 1:2 split small side | **2 items MAX** |
| 2:1 split large side | 4 items OK |
| LayoutStacked (full width) | 5+ items OK |
| LayoutDashboard Main | 4 items OK |

**IF YOU HAVE 4+ STEPS IN A 1:1 SPLIT → USE StepList INSTEAD (vertical, fits narrow columns)**

**⚠️⚠️⚠️ STOP! Before using NetworkGraph, ask: "Does ANY node branch to 2+ outputs?"**
- If NO → USE ProcessStrip (linear sequence) - this is 90% of cases!
- If YES → NetworkGraph is OK (true branching graph)
- "Speaker → Capture → Translate → Playback" = ProcessStrip (each step leads to ONE next)
- "Engine → [Interpreter, Captions, Transcription]" = NetworkGraph (Engine branches to 3)

**INLINE HIGHLIGHT**:
Use `<Highlight>` to emphasize key words within text:
```
<Text>We achieved <Highlight color="success">10x growth</Highlight> this quarter.</Text>
<Text>Key metric: <Highlight color="primary" bold>$1.2M revenue</Highlight></Text>
```
Colors: default, primary, success, warning, info, accent

**CHARTS (for numeric data)** - See Chart Documentation section for full details.
- ChartBar: comparison, before/after (use `before`/`after` keys for clustered bars)
- ChartLine: trends over time
- ChartPie: proportions/percentages (use variant="donut" for doughnut style)
- ChartArea: cumulative trends, time-series with volume
- ChartBubble: 3D relationships (x, y, size dimensions)
- ChartRadar: multivariate comparison (4+ attributes per item)
- ChartPolar: cyclical/periodic data
- BarStats: rankings, sorted comparisons
- ChartCustom: novel visualizations (rose, waffle, pictogram, gauge, funnel, treemap, radial)

- **RULE**: 3+ data points → use Chart, not multiple Metrics

## MDX OUTPUT FORMAT

Each slide wrapped in `<Slide>` with metadata:

```mdx
<Slide id="slide_01" rank={1} story="HOOK" atoms={["stat_001"]}>
<LayoutCover theme="dark">
  <Heading level={1}>The Future of AI</Heading>
  <BigNum id="stat_001" value="10B" label="Parameters"/>
</LayoutCover>
</Slide>

<Slide id="slide_02" rank={2} story="TENSION" atoms={["fact_001"]}>
<LayoutSplit ratio="2:1">
  <Left>
    <Heading level={2}>The Challenge</Heading>
    <SmartList id="list_001" items={["Scale", "Cost", "Complexity"]}/>
  </Left>
  <Right>
    <ChartBar id="chart_001" data={[{name: "2023", value: 100}, {name: "2024", value: 250}]}/>
  </Right>
</LayoutSplit>
</Slide>

<Slide id="slide_03" rank={3} story="JOURNEY" atoms={[]}>
<LayoutDashboard>
  <Header><Heading level={2}>Performance</Heading></Header>
  <Main>
    <BigNum id="stat_001" value="$1.2M" label="Revenue" trend="+12%"/>
    <Text variant="lead">Record-breaking quarter</Text>
  </Main>
  <Sidebar>
    <MetricGroup id="metrics_001">
      <Metric value="89%" label="Margin"/>
      <Metric value="4.2" label="Rating"/>
      <Metric value="25%" label="Growth"/>
    </MetricGroup>
    <SmartList id="list_001" items={["Sales up 25%", "New markets opened"]}/>
  </Sidebar>
</LayoutDashboard>
</Slide>
```

## COMPONENT SYNTAX

```mdx
// Text with inline highlights
<Heading level={1}>Display Title</Heading>
<Text variant="lead">We achieved <Highlight color="success">10x growth</Highlight> this quarter.</Text>
<Text>Key metric: <Highlight color="primary" bold>$1.2M</Highlight> in revenue.</Text>

// Metrics (must have id for patching)
<BigNum id="stat_001" value="42%" label="Growth" trend="+5%"/>
<MetricGroup id="metrics_001" cols={3}>
  <Metric value="$1M" label="Revenue"/>
</MetricGroup>

// Content (must have id)
<SmartList id="list_001" items={["Item 1", "Item 2"]} ordered={false}/>
// CardGroup: Grid of information cards. ALWAYS include a semantic 'icon' (e.g., 🚀, 💡, 💰, ⚠️) for visual impact.
<CardGroup id="cards_001" columns={3}>
  <Card title="Speed" description="10x faster" icon="🚀"/>
</CardGroup>
<QuoteBlock id="quote_001" author="CEO">Stay focused.</QuoteBlock>

// ⭐⭐⭐ SEQUENCES - USE THESE OFTEN for any step-by-step content! ⭐⭐⭐
// These are VISUAL BLOCKS that make pages look professional and full!

// ProcessStrip: horizontal phases (PREFER THIS for workflows, pipelines, stages)
// ⚠️ WIDTH RULE: Max 3 items in 1:1 split or smaller. 4+ items need full width or 2:1 large side.
<ProcessStrip id="process_001" items={["Plan", "Build", "Test"]}/>  // 3 items OK in split
// ProcessStrip with status (use in full-width layouts for 4+ items):
<ProcessStrip id="process_002" items={[{label: "Collect", status: "done"}, {label: "Process", status: "active"}, {label: "Validate", status: "pending"}, {label: "Deploy", status: "pending"}]}/>
// USE ProcessStrip for: turn sequences, data pipelines, workflow stages, any A→B→C→D flow

// StepList: vertical numbered steps (BETTER for narrow columns - handles 4+ items well)
<StepList id="steps_001" items={["Collect data", "Process", "Validate", "Deploy"]}/>
// StepList with descriptions:
<StepList id="steps_002" items={[{label: "Plan", description: "Define scope"}, {label: "Build", description: "Implement"}]}/>

// LayoutTimeline: for chronological milestones with rich content (full page layout)
// Use when you need richer content per milestone (heading + text + callout per item)
// ALWAYS provide `headline`; `subtitle` is optional.
<LayoutTimeline headline="Roadmap" subtitle="Key milestones ahead (optional)">
  <LayoutTimeline.Item year="2020">
    <Heading level={3}>Product Launch</Heading>
    <Text>Released v1.0 to market</Text>
    <Text variant="caption">Reach 1M users</Text>  <!-- optional caption highlight the milestone -->
  </LayoutTimeline.Item>
  <LayoutTimeline.Item year="2022">
    <Heading level={3}>Series A</Heading>
    <Text variant="caption">Raised $10M funding</Text>  <!-- optional caption highlight the milestone -->
  </LayoutTimeline.Item>
  <LayoutTimeline.Item year="2024"  highlighted={true}>  <!-- highlighted the most important milestone -->
    <Heading level={3}>Global Expansion</Heading>
    <Text>Launched in 50 countries</Text>
    <Text variant="caption">Opened offices in 10 new cities</Text>  <!-- optional caption highlight the milestone -->
  </LayoutTimeline.Item>
</LayoutTimeline>
// NOTE: ProcessStrip is better for simple year labels; LayoutTimeline is better for detailed milestone stories

// Charts (must have id) - See Chart Documentation for full syntax
// Standard charts:
<ChartBar id="chart_001" title="Revenue" data={[{label: "Q1", value: 100}, {label: "Q2", value: 150}]}/>
<ChartBar id="chart_002" title="Improvements" data={[{label: "Accuracy", before: 65, after: 75}]}/>
<ChartLine id="chart_003" title="Growth" data={[{label: "Jan", value: 50}]}/>
<ChartPie id="chart_004" title="Share" data={[{label: "A", value: 60}]}/>
<ChartArea id="chart_005" title="Trend" data={[{label: "Jan", value: 100}]} gradient={true}/>
<BarStats id="chart_006" title="Rankings" data={[{label: "A", value: 95}]} sortDescending={true}/>
// For custom/novel visualizations: <ChartCustom type="rose|waffle|pictogram|gauge|funnel|treemap|radial" .../>

// Tables
<TableData id="table_001" headers={["Name", "Value"]} rows={[["A", "1"]]}/>

// ⚠️⚠️⚠️ CRITICAL: NetworkGraph vs ProcessStrip DECISION ⚠️⚠️⚠️
// STEP 1: Count how many edges come OUT of each node:
//   - If EVERY node has exactly 0 or 1 outgoing edge → USE ProcessStrip (it's linear!)
//   - If ANY node has 2+ outgoing edges → NetworkGraph is OK (it's branching)
//
// EXAMPLES OF LINEAR (USE ProcessStrip, NOT NetworkGraph):
//   "Speaker → Capture → Translate → Playback" ← each node has 1 output = ProcessStrip!
//   "Input → Process → Judge → Output" ← each node has 1 output = ProcessStrip!
//   "Today → Jan 2026 → Future" ← each node has 1 output = ProcessStrip!
//
// EXAMPLES OF BRANCHING (NetworkGraph OK):
//   "Engine → Interpreter, Captions, Transcription" ← Engine has 3 outputs = NetworkGraph OK
//   "API → Auth AND Cache; both → DB" ← API has 2 outputs = NetworkGraph OK
//
// ⚠️ In Split layouts: ALWAYS use direction="TB" (vertical) - horizontal diagrams look cramped
// ⚠️ SIZE PROP (REQUIRED - count your nodes!):
//   - size="compact": 2-3 nodes ONLY
//   - size="medium": 4-5 nodes ONLY
//   - size="tall": 6+ nodes (MUST use tall if ≥6 nodes!)
// RULE: Count <Node> elements, then pick size. 7 nodes = tall. 4 nodes = medium. 3 nodes = compact.
// Example valid use: API Gateway connects to BOTH Auth AND Cache (branching)
<NetworkGraph id="diagram_001" type="network" direction="TB" size="medium" title="System Architecture">
  <Node id="api" label="API Gateway" className="api" />
  <Node id="auth" label="Auth Service" className="process" />
  <Node id="db" label="Database" className="database" />
  <Node id="cache" label="Cache" className="process" />
  <Edge source="api" target="auth" />
  <Edge source="api" target="cache" />
  <Edge source="auth" target="db" />
  <Edge source="cache" target="db" />
</NetworkGraph>

// For hierarchy/org charts with 6+ nodes - MUST use size="tall":
<NetworkGraph id="diagram_002" type="network" direction="TB" size="tall" title="Org Structure">
  <Group id="frontend" label="Frontend">
    <Node id="web" label="Web App" className="api" />
    <Node id="mobile" label="Mobile App" className="api" />
  </Group>
  <Node id="gateway" label="API Gateway" className="process" />
  <Node id="db" label="Database" className="database" />
  <Edge source="web" target="gateway" />
  <Edge source="mobile" target="gateway" />
  <Edge source="gateway" target="db" />
</NetworkGraph>

## TEXT LIMITS
Display: 6 words | Heading: 8 | Body: 25 | List item: 10 words"""

    @classmethod
    def get_layout_constrain(cls) -> str:
        """Provide compact layout constraints."""
        return """# LAYOUT CONSTRAINTS

## LAYOUT-WIDGET COMPATIBILITY
| Widget | cover | split | stacked | grid | fullbleed | dashboard | timeline |
|--------|-------|-------|---------|------|-----------|-----------|----------|
| Heading | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Text | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| SmartList | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| BigNum | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| MetricGroup | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Charts | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| NetworkGraph | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| QuoteBlock | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| CardGroup | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| TableData | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| StepList | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| ProcessStrip | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Highlight | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## SLIDE VARIETY (CRITICAL)
**Never use the same layout + component pattern on consecutive slides.**
- If slide N uses LayoutSplit with NetworkGraph+SmartList, slide N+1 MUST use a different layout OR different component types
- Repeating the same visual pattern makes the deck feel monotonous and template-like
- **Good**: Split→Dashboard→Split(different ratio)→Grid→Stacked
- **Bad**: Split(2:1)+Diagram→Split(2:1)+Diagram→Split(2:1)+Diagram
- Vary: layout type, split ratio, primary visual block (Chart vs Diagram vs MetricGroup vs CardGroup)

## SPLIT LAYOUT REQUIREMENTS (CRITICAL)
Split layouts (LayoutSplit) need SUBSTANTIAL content on BOTH sides:
- **Each side must have 4+ elements** (Heading + 2-3 content blocks + supporting text)
- **Both sides must have similar vertical height** so they visually overlap (not a sparse 2x3 grid)
- **Bad example**: Left has Heading+SmartList (2 items), Right has Heading+SmartList → looks like unfinished grid
- **Good example**: Left has Heading+Diagram+Text, Right has BigNum+MetricGroup+SmartList+Text

ERROR pattern to avoid: "2x3 grid with empty slots" - when split layout has only 2-3 small items per side,
the page looks like a 6-cell grid where half the cells are empty. This makes the slide look unfinished.

### SPLIT LAYOUT REQUIRED STRUCTURE (ALL ELEMENTS REQUIRED):
```
<LayoutSplit ratio="1:1">
  <Left>
    <Heading level={2}>Title Here</Heading>           <!-- Required -->
    <BigNum id="..." value="..." label="..."/>        <!-- Visual block required -->
    <SmartList id="..." items={[...3-4 items...]}/>  <!-- Text block required -->
  </Left>
  <Right>
    <Heading level={3}>Subtitle Here</Heading>        <!-- Required -->
    <MetricGroup id="..." cols={3}>...</MetricGroup>  <!-- Visual block required -->
    <Text variant="body">Explanation text...</Text>   <!-- Text block required -->
    <Text variant="caption">Source note...</Text>     <!-- Supporting block required -->
  </Right>
</LayoutSplit>
```

If you don't have enough content for 4+ elements per side, use LayoutStacked instead.

## DENSITY GUIDE
| Position | Density | Layout Choices |
|----------|---------|----------------|
| Slide 1 (Opening) | MINIMAL | cover (title + subtitle ONLY, no data) |
| Slide 2 | MODERATE | split, stacked (intro content) |
| Slide 3-8 | DENSE | dashboard, split, timeline, grid (main content) |
| Slide 9 | MODERATE | split, stacked (summary/next steps) |
| Final (Closing) | MINIMAL | cover ("Thank You" or CTA, no data) |

## PAGE COVERAGE REQUIREMENTS (CRITICAL)
**Every page must feel FULL - empty/sparse pages look unfinished and unprofessional**
**Target: Fill 70-85% of visible area with meaningful content**

| Layout | Min Elements | Typical Content Mix |
|--------|--------------|---------------------|
| LayoutCover | 2-3 | Heading + Text(subtitle) + optional QuoteBlock — KEEP IT MINIMAL! |
| LayoutStacked | 6-8 | Heading + Text + MetricGroup + SmartList + supporting text |
| LayoutDashboard | 8-10 | Header: Heading. Main(1/3): BigNum + Text. Sidebar(2/3): MetricGroup + Chart + SmartList |
| LayoutTimeline | 5-6 | 5-6 timeline items with Heading + Text each |
| LayoutSplit | 10-12 | Each side: Heading + 2 visuals(BigNum+Chart or Metric+List) + Text |
| LayoutGrid | 6-8 | Heading + Text + CardGroup(4 cards) + MetricGroup |

**CONTENT RICHNESS RULES** (follow strictly!):
- **Every slide needs at least TWO visual blocks**: BigNum + Chart, or MetricGroup + SmartList, etc.
- **Text-only slides look empty** - always pair text with visuals
- **EXCEPTION: Cover slides ARE "just title + subtitle"** - keep them clean and impactful, NO data
- **Dashboard sidebar is the main content area** - fill with MetricGroup, Charts, SmartList
- **Split layouts need BOTH sides full** - 5+ elements per side minimum
- **When in doubt, ADD more content** - sparse pages look unprofessional
- **Use ProcessStrip/StepList for workflows** - they add visual interest without complexity

**ERROR patterns to avoid:**
- Page with only Heading + SmartList (looks incomplete)
- Dashboard with empty Main or Sidebar slots
- Stacked with only 2-3 small elements (gaps visible)
- Cover with only title (add subtitle, quote, or metric)
- Split with one side nearly empty

## RULES
- ≥4 different layouts per deck
- Never same layout twice in a row
- Numbers → BigNum/MetricGroup (not in text)
- ≥3 slides with data components
- Lists max 4 items, body max 25 words
- Keep parallel concepts visually parallel
- Split layouts: BOTH sides need visual blocks, not just text
- **NO GAPS**: content should fill the page, not leave holes
- **NO INFORMATION REDUNDANCY**: All components on a slide must be complementary; do NOT repeat the same fact/claim in multiple places (even paraphrased).
  - If a number is in MetricGroup/BigNum/Chart/Table, do NOT repeat the same number in Text/SmartList/Card descriptions.
  - If CardGroup lists capabilities, SmartList must NOT re-list those capabilities; use SmartList for actions/implications/risks.
  - Avoid 1-to-1 mapping duplicates like: Card("9 languages") + Metric("9 preview languages"). Prefer: Card(qualitative progress) + Metric(quantitative KPI).
  - Example BAD: MetricGroup(71%, 80%) + BigNum(80%)
  - Example GOOD: MetricGroup(71%, 80%) + Callout(main takeaway)
- **NEVER NEST LAYOUTS**: LayoutDashboard, LayoutGrid, LayoutTimeline, LayoutCover, LayoutFullBleed are TOP-LEVEL ONLY. Never place inside <Left>, <Right>, <Main>, <Sidebar>, or any slot. Only components (Heading, BigNum, SmartList, etc.) go inside slots.
- **NO DUPLICATE PROCESS VISUALS**: Never use both ProcessStrip AND StepList on same slide - they serve same purpose. Pick ONE."""

    @classmethod
    def calculate(cls, slides, theme, style):
        """Not implemented - React engine is render-only."""
        raise NotImplementedError(
            "React engine does not use calculate() - use ReactMDXRenderer directly"
        )
