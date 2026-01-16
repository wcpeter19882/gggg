---
name: paged-layout-content
description: |
  Transform draft slides into active slides with layouts and MDX content.
  Use when: Generating final slide layouts and widget content from draft slides.
  Triggers: "generate layout", "design slides", "apply layout", "create MDX"
---

# Paged Layout Content Generator

You are a LAYOUT DESIGNER. Convert story drafts into MDX slides.

## Your Task

Read draft slides and generate MDX content following the exact component syntax and rules below.

## Step 0: Read Constitution

**ALWAYS read constitution first** - it defines style and content rules.

Use the MCP tool:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "constitution"
})
```

**Apply constitution rules during layout generation:**
- If tone is "professional" → use formal language in Heading/Text
- If tone is "minimal" → prefer simpler layouts, fewer elements
- If style_rules mention specific formatting → apply to MDX
- If content_exclusions exist → don't include that content in MDX

## Step 1: Read Context

Use the MCP tool to read all needed sections:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "slides"
})
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "theme"
})
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "atoms"
})
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "issues"
})
```

Or read all at once:
```
mcp_apply-patch_read_section({
  project_dir: "{project_dir}",
  section: "all"
})
```

**If `issues` section has errors (from previous validation):**
- Read the `issues.issues` array for specific problems per slide
- Each issue has: `slide_id`, `issue_type`, `description`, `suggestion`
- Focus on fixing slides with `severity: "error"` first
- Apply the `suggestion` from each issue to fix the MDX

**Common fixes:**
| Issue Type | Fix |
|------------|-----|
| `sparse_content` | Add more elements (BigNum, SmartList, Callout) to reach 65%+ height |
| `unbalanced_columns` | Add content to shorter side to balance heights |
| `empty_slot` | Add content or switch to layout without that slot |
| `processstrip_too_wide` | Use StepList instead, or reduce items to 3 |
| `metric_value_too_long` | Shorten value to <10 chars, move text to label |

## Step 2: Generate MDX Content

### CORE PRINCIPLE

Follow the draft slide's `story` and `visual_design` fields exactly:
- `story` defines WHAT to say (HEADLINE, NARRATIVE, EVIDENCE, TAKEAWAY)
- `visual_design` defines HOW to show it (layout + content approach)
- `density` defines HOW MUCH (sparse=focused, moderate=balanced, dense=detailed)

### DENSITY → ELEMENTS

| Density | Meaning | Blocks | Coverage |
|---------|---------|--------|----------|
| sparse | Single focus, supporting context | 2-3 blocks (hero + support) | 40-60% |
| moderate | Balanced multi-element | 4-5 blocks | 60-80% |
| dense | Detailed breakdown | 5-7 blocks | 70-90% |

### CONTENT MAPPING

- HEADLINE → `<Heading>`
- NARRATIVE → `<Text variant="lead">` or `<SmartList>`
- EVIDENCE (numbers) → `<MetricGroup>`, `<BigNum>`, Charts
- EVIDENCE (branching graphs) → `<NetworkGraph>` with JSX children (Node, Edge, Group)
- EVIDENCE (linear flows) → `<ProcessStrip>` for A→B→C sequences
- TAKEAWAY → `<Callout>` or `<Text variant="caption">`

---

## LAYOUT REFERENCE

### LayoutCover
TRADITIONAL cover page: title + subtitle only. Clean, minimal, impactful.
- Best: opening title slide, closing "Thank You" slide, section dividers
- Components: Heading (level 1), Text (subtitle), optionally ONE of: QuoteBlock OR simple Callout
- **🚫 FORBIDDEN**: BigNum, MetricGroup, SmartList, Charts, Diagrams, CardGroup, ProcessStrip, StepList
- **MAX ELEMENTS**: 2-3 elements total (Heading + subtitle + optional quote/callout)

```jsx
<LayoutCover>
  <Heading level={1}>Main Title</Heading>
  <Text variant="lead">Subtitle here</Text>
</LayoutCover>
```

### LayoutSplit
Two-column layout. Use when pairing text with visual, or showing two related concepts.
- Best: metric + context, chart + explanation, before/after
- **Slots**: `<Left>`, `<Right>` (NOT Column!)
- **Ratios**: ratio="1:1", "2:1", "1:2", "3:1", "1:3"
- **HEADING RULE**: Use the SAME heading level on both sides

```jsx
<LayoutSplit ratio="2:1">
  <Left>
    <Heading level={2}>Left Content</Heading>
    <SmartList items={["Point 1", "Point 2", "Point 3"]} />
    <Callout intent="info">Supporting note</Callout>
  </Left>
  <Right>
    <BigNum value="95%" label="Success Rate" />
    <Text variant="caption">Source: Q4 Report</Text>
  </Right>
</LayoutSplit>
```

### LayoutStacked
Vertical flow layout. Use for text-heavy narrative or sequential content.
- Best: storytelling, explanations, step-by-step instructions
- Components: Heading, Text, SmartList, TableData, ProcessStrip, Callout

```jsx
<LayoutStacked>
  <Heading level={1}>Section Title</Heading>
  <Text variant="lead">Introduction paragraph</Text>
  <SmartList items={["Item 1", "Item 2", "Item 3"]} />
  <Callout intent="success">Key takeaway</Callout>
</LayoutStacked>
```

### LayoutDashboard
Data-dense KPI displays. Use for metrics overview, performance summary.
- **Slots**: `<Header>`, `<Main>`, `<Sidebar>`, `<Footer>`
- **Header slot**: Heading level={2} ONLY (no Text, no lead paragraph)
- **Main slot**: Text variant="lead" (first), MetricGroup, Charts, Tables, BigNum
- **Sidebar slot**: SmartList, Callout, compact text (supporting content)

```jsx
<LayoutDashboard>
  <Header><Heading level={2}>Performance Dashboard</Heading></Header>
  <Main>
    <Text variant="lead">Key metrics for Q4 2025</Text>
    <MetricGroup cols={3}>
      <Metric value="$1.2M" label="Revenue" delta="+12%" />
      <Metric value="89%" label="Margin" />
      <Metric value="4.2" label="Rating" />
    </MetricGroup>
  </Main>
  <Sidebar>
    <SmartList items={["On track for targets", "Q1 outlook positive"]} />
    <Callout intent="success">Record quarter</Callout>
  </Sidebar>
</LayoutDashboard>
```

### LayoutFullBleed
Visual impact with background. Use for hero moments, emotional beats.
- Best: key quotes, big numbers, section transitions
- Components: Heading, QuoteBlock, BigNum (overlay on image)

```jsx
<LayoutFullBleed>
  <Heading level={1}>The Big Question</Heading>
  <Text variant="display">How do we achieve 80% CSAT?</Text>
</LayoutFullBleed>
```

### LayoutGrid
Parallel items of equal importance. Use for features, team, products.
- **Cols**: cols={2}, cols={3}, cols={4}
- Components: CardGroup, MetricGroup, Heading

```jsx
<LayoutGrid cols={3}>
  <CardGroup>
    <Card title="Feature 1" description="Description" icon="🚀" />
    <Card title="Feature 2" description="Description" icon="⚡" />
    <Card title="Feature 3" description="Description" icon="🎯" />
  </CardGroup>
</LayoutGrid>
```

### LayoutTimeline
Chronological milestones with rich content per event.
- Best: company history, project milestones, annual roadmap
- **Slots**: `<LayoutTimeline.Item year="2024">`

```jsx
<LayoutTimeline>
  <LayoutTimeline.Item year="2024">
    <Heading level={3}>Product Launch</Heading>
    <Text>Released v1.0 to market</Text>
  </LayoutTimeline.Item>
  <LayoutTimeline.Item year="2025" highlighted={true}>
    <Heading level={3}>Series A</Heading>
    <Text>Raised $10M funding</Text>
  </LayoutTimeline.Item>
</LayoutTimeline>
```

---

## COMPONENT REFERENCE

### Typography (Atoms)

```jsx
<Heading level={1}>Display Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection</Heading>
<Text variant="lead">Lead paragraph</Text>
<Text variant="body">Body text</Text>
<Text variant="caption">Caption/source</Text>
<Text>We achieved <Highlight color="success">10x growth</Highlight> this quarter.</Text>
<Callout intent="info" title="Note">Important message</Callout>
<Callout intent="success" title="Win">Positive outcome</Callout>
<Callout intent="warning" title="Risk">Caution needed</Callout>
```

### Metrics (Blocks)

```jsx
<BigNum value="42%" label="Growth" trend="+5%" />
<MetricGroup cols={3}>
  <Metric value="$1M" label="Revenue" delta="+12%" />
  <Metric value="89%" label="Margin" />
  <Metric value="4.2" label="Rating" />
</MetricGroup>
<MetricStrip metrics={[{value: "100", label: "Users"}, {value: "50", label: "Sales"}]} />
```

### Lists & Content (Blocks)

```jsx
<SmartList items={["Item 1", "Item 2", "Item 3"]} />
<SmartList ordered={true} items={["First", "Second", "Third"]} />
<StepList items={[
  {label: "Step 1", description: "Do this first"},
  {label: "Step 2", description: "Then this"}
]} />
<ProcessStrip items={["Plan", "Build", "Test", "Deploy"]} />
<ProcessStrip items={[
  {label: "Collect", status: "done"},
  {label: "Process", status: "active"},
  {label: "Deploy", status: "pending"}
]} />
<QuoteBlock author="CEO">Stay focused on the customer.</QuoteBlock>
<CardGroup columns={3}>
  <Card title="Speed" description="10x faster" icon="🚀" />
</CardGroup>
<TableData headers={["Name", "Value"]} rows={[["A", "1"], ["B", "2"]]} />
```

### Charts (Blocks)

**⚠️ CRITICAL DATA FORMAT** - Using wrong properties causes EMPTY charts:

| Component | Required Format | Example |
|-----------|----------------|---------|
| ChartBar (simple) | `{label, value}` | `{label: "Q1", value: 50}` |
| ChartBar (clustered) | `{label, before, after}` | `{label: "Sales", before: 80, after: 120}` |
| ChartLine | `{label, value}` | `{label: "Jan", value: 100}` |
| ChartPie | `{label, value}` | `{label: "Segment", value: 30}` |
| ChartArea | `{label, value}` | `{label: "Jan", value: 100}` |
| ChartBubble | `{label, x, y, size}` | `{label: "Item", x: 10, y: 20, size: 50}` |
| ChartRadar | `{label, value}` | `{label: "Speed", value: 80}` |
| BarStats | `{label, value}` | `{label: "Region A", value: 85}` |

**⚠️ NEVER use arbitrary keys** like `revenue`, `signups` - components ignore unknown properties!

```jsx
<ChartBar data={[{label: "Q1", value: 100}, {label: "Q2", value: 150}]} />
<ChartBar data={[{label: "Accuracy", before: 65, after: 85}]} />
<ChartLine data={[{label: "Jan", value: 50}, {label: "Feb", value: 75}]} />
<ChartPie data={[{label: "A", value: 60}, {label: "B", value: 40}]} variant="donut" />
<ChartArea data={[{label: "Jan", value: 100}]} gradient={true} />
<BarStats data={[{label: "Team A", value: 95}]} sortDescending={true} />
```

### Diagrams (Blocks)

**⚠️⚠️⚠️ CRITICAL: NetworkGraph vs ProcessStrip DECISION**

**STEP 1: Count how many edges come OUT of each node:**
- If EVERY node has exactly 0 or 1 outgoing edge → USE ProcessStrip (it's linear!)
- If ANY node has 2+ outgoing edges → NetworkGraph is OK (it's branching)

**LINEAR (USE ProcessStrip, NOT NetworkGraph):**
- "Speaker → Capture → Translate → Playback" ← each node has 1 output = ProcessStrip!
- "Input → Process → Judge → Output" ← each node has 1 output = ProcessStrip!

**BRANCHING (NetworkGraph OK):**
- "Engine → Interpreter, Captions, Transcription" ← Engine has 3 outputs = NetworkGraph OK

```jsx
// For LINEAR sequences - USE THIS 90% of the time!
<ProcessStrip items={["Capture", "Translate", "Playback"]} />

// For BRANCHING only - when one node connects to multiple targets
<NetworkGraph direction="TB" size="medium">
  <Node id="api" label="API Gateway" />
  <Node id="auth" label="Auth Service" />
  <Node id="cache" label="Cache" />
  <Node id="db" label="Database" />
  <Edge source="api" target="auth" />
  <Edge source="api" target="cache" />
  <Edge source="auth" target="db" />
  <Edge source="cache" target="db" />
</NetworkGraph>
```

**NetworkGraph SIZE RULE (count your nodes!):**
- `size="compact"`: 2-3 nodes ONLY
- `size="medium"`: 4-5 nodes ONLY
- `size="tall"`: 6+ nodes (MUST use tall if ≥6 nodes!)

**In Split layouts**: ALWAYS use `direction="TB"` (vertical) - horizontal diagrams look cramped

---

## LAYOUT CONSTRAINTS

### Layout-Widget Compatibility

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
| Callout | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| ProcessStrip | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| StepList | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

### ProcessStrip Width Rule (CRITICAL - WILL CAUSE OVERFLOW!)

| Layout Context | Max ProcessStrip Items |
|----------------|------------------------|
| 1:1 split (Left or Right) | **3 items MAX** |
| 1:2 split small side | **2 items MAX** |
| 2:1 split large side | 4 items OK |
| LayoutStacked (full width) | 5+ items OK |
| LayoutDashboard Main | 4 items OK |

**IF YOU HAVE 4+ STEPS IN A 1:1 SPLIT → USE StepList INSTEAD**

### Slide Variety (CRITICAL)

**Never use the same layout + component pattern on consecutive slides.**
- If slide N uses LayoutSplit with NetworkGraph+SmartList, slide N+1 MUST use different layout OR different components
- **Good**: Split→Dashboard→Split(different ratio)→Grid→Stacked
- **Bad**: Split(2:1)+Diagram→Split(2:1)+Diagram→Split(2:1)+Diagram

### No Redundant Content (CRITICAL)

- NEVER show the same data twice on a slide in different formats
- If Left has MetricGroup with "71% → 80%", Right should NOT have BigNum with same numbers
- BAD: MetricGroup(71%, 80%) + BigNum(80%) ← REDUNDANT
- GOOD: MetricGroup(71%, 80%) + SmartList(key actions) ← COMPLEMENTARY

### Split Layout Requirements

Split layouts need SUBSTANTIAL content on BOTH sides:
- **Each side must have 4+ elements** (Heading + 2-3 content blocks + supporting text)
- **Both sides must have similar vertical height**

---

## Step 3: Save Active Slides

**CRITICAL**: Store generated MDX content in the `"mdx"` field (NOT `"widgets"`).

Each slide should have:
- `"state": "active"` (changed from "draft")
- `"layout": "LayoutName"` (e.g., "LayoutSplit", "LayoutDashboard")
- `"mdx": "<LayoutSplit>...</LayoutSplit>"` (the full MDX content)

**Use the `apply_patch` MCP tool** (from `apply-patch` server):

```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "slides",
  "data": {slides_json_with_mdx}
})
```

**If constitution.verbose=true**, include `patch_file`:
```json
mcp_apply-patch_apply_patch({
  "project_dir": "{project_dir}",
  "target": "slides",
  "data": {slides_json_with_mdx},
  "patch_file": "{project_dir}/patches/slides_active.json"
})
```

## Example Output

After layout generation, return:
```
Generated MDX for 10 slides:
- 1 LayoutCover (title)
- 2 LayoutDashboard (metrics)
- 4 LayoutSplit (comparisons)
- 2 LayoutStacked (content)
- 1 LayoutFullBleed (call to action)
```


