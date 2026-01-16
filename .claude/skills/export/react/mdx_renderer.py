"""React MDX Renderer for generating semantic MDX from state.json.

This module implements the ReactMDXRenderer class that converts presentation
state (state.json) into MDX content using only L1-L3 semantic components.

Architecture:
- Input: state.json (same format as other renderers)
- Output: MDX files with React component JSX
- Components: Only L1 Layouts, L2 Blocks, L3 Atoms (no raw HTML/CSS)
- Rendering: TSX components in src/paged/render/react/components handle actual rendering

Example MDX Output:
    <LayoutSplit ratio="2:1">
      <Left>
        <Heading level={2}>Title</Heading>
        <SmartList items={["Item 1", "Item 2"]} />
      </Left>
      <Right>
        <ChartBar data={[{label: "Q1", value: 100}]} />
      </Right>
    </LayoutSplit>
"""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional


class ReactMDXRenderer:
    """Renderer for transforming slide state to React MDX format.
    
    Converts slide JSON (state.json) to MDX files containing only
    semantic React components (no raw HTML or CSS).
    
    The renderer enforces L0 rules by only generating L1-L3 components:
    - L1: Layouts (LayoutCover, LayoutSplit, LayoutGrid, etc.)
    - L2: Blocks (SmartList, ChartBar, MetricGroup, etc.)
    - L3: Atoms (Heading, Text, Callout)
    """
    
    # Widget type to component mapping
    WIDGET_TYPE_MAP = {
        # Typography (L3 Atoms)
        "Type.Display": "Heading",
        "Type.Heading": "Heading",
        "Type.Subheading": "Heading",
        "Type.Body": "Text",
        "Type.Caption": "Text",
        "Type.Code": "Text",
        
        # Lists (L2 Blocks)
        "Type.List": "SmartList",
        "Type.BulletList": "SmartList",
        "Type.NumberedList": "SmartList",
        
        # Charts (L2 Blocks)
        "Type.Chart": "ChartBar",
        "Type.BarChart": "ChartBar",
        "Type.LineChart": "ChartLine",
        "Type.PieChart": "ChartPie",
        
        # Data (L2 Blocks)
        "Type.Metric": "MetricGroup",
        "Type.MetricGroup": "MetricGroup",
        "Type.MetricStrip": "MetricStrip",
        "Type.MetricCard": "MetricCard",
        "Type.MetricBadges": "MetricBadges",
        "Type.Table": "TableData",
        "Data.BigNum": "BigNum",
        "Data.MetricStrip": "MetricStrip",
        "Data.MetricCard": "MetricCard",
        "Data.MetricBadges": "MetricBadges",
        "Data.Chart": "ChartBar",
        
        # Content (L2 Blocks)
        "Type.Quote": "QuoteBlock",
        "Type.Image": "ImageBlock",
        "Type.Card": "CardGroup",
        
        # Callouts (L3 Atoms)
        "Type.Callout": "Callout",
        "Type.Alert": "Callout",
    }
    
    # Layout type to component mapping
    LAYOUT_TYPE_MAP = {
        "cover": "LayoutCover",
        "title": "LayoutCover",
        "split": "LayoutSplit",
        "two-col": "LayoutSplit",
        "two-cols": "LayoutSplit",
        "stacked": "LayoutStacked",
        "single-col": "LayoutStacked",
        "vstack": "LayoutStacked",
        "grid": "LayoutGrid",
        "multi-col": "LayoutGrid",
        "fullbleed": "LayoutFullBleed",
        "full-bleed": "LayoutFullBleed",
        "image": "LayoutFullBleed",
        "timeline": "LayoutTimeline",
        "dashboard": "LayoutDashboard",
        "default": "LayoutSplit",
    }
    
    # Heading level mapping
    HEADING_LEVEL_MAP = {
        "Type.Display": 1,
        "Type.Heading": 2,
        "Type.Subheading": 3,
    }
    
    # Text variant mapping
    TEXT_VARIANT_MAP = {
        "Type.Body": "default",
        "Type.Caption": "caption",
        "Type.Code": "code",
    }
    
    def __init__(self, output_dir: Optional[Path] = None, theme: str = "business"):
        """Initialize renderer.
        
        Args:
            output_dir: Output directory for MDX files.
            theme: Theme name to use (business, cyber, minimal, etc.)
        """
        self.output_dir = Path(output_dir) if output_dir else Path("output")
        self.theme = theme
        self.indent_level = 0
        
    def _indent(self) -> str:
        """Get current indentation string."""
        return "  " * self.indent_level
    
    def _strip_atom_ids(self, text: str) -> str:
        """Remove atom_id references from text content (safety net).
        
        NOTE: The LLM is instructed NOT to generate atom_ids in content.
        This function serves as a safety net in case the LLM still
        includes them. See prompts.py and layout_engine.py for the
        NO ATOM IDs instructions.
        
        Strips patterns like (atom_001), (stat_003), (fact_012), etc.
        
        Args:
            text: Text that may contain atom_id references
            
        Returns:
            Clean text with atom_ids removed
        """
        # Remove patterns like (atom_001), (stat_003), (fact_012), etc.
        # Also handles multiple IDs like (stat_001, stat_002)
        text = re.sub(r'\s*\([a-z_]+_\d+(?:,\s*[a-z_]+_\d+)*\)', '', text)
        # Remove patterns like [atom_001] or [stat_003]
        text = re.sub(r'\s*\[[a-z_]+_\d+(?:,\s*[a-z_]+_\d+)*\]', '', text)
        # Remove standalone atom_ids at end of text
        text = re.sub(r'\s+[a-z_]+_\d+\s*$', '', text)
        # Clean up double spaces
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def _json_value(self, value: Any) -> str:
        """Convert Python value to JSX prop value.
        
        Args:
            value: Python value (str, int, list, dict, etc.)
            
        Returns:
            JSX-formatted prop value
        """
        if isinstance(value, str):
            return f'"{value}"'
        elif isinstance(value, bool):
            return "{true}" if value else "{false}"
        elif isinstance(value, (int, float)):
            return f"{{{value}}}"
        elif isinstance(value, list):
            return f"{{{json.dumps(value)}}}"
        elif isinstance(value, dict):
            return f"{{{json.dumps(value)}}}"
        else:
            return f'"{value}"'
    
    def _auto_bold_metrics(self, text: str) -> str:
        """Auto-bold metrics and key terms in text if not already bolded.
        
        Finds:
        - Percentages: 99%, 12.3%, +40%
        - Numbers with k/M/B: 136k, 1.8M, 2B
        - Multipliers: 10x, 2×
        - Arrows with numbers: 19.5% → 12.3%
        
        Returns:
            Text with metrics wrapped in **bold**
        """
        # Skip if text already has bold markers
        if '**' in text:
            return text
        
        result = text
        
        # Pattern for metrics that should be bolded
        # Match: percentages, numbers with k/M/B, multipliers, version numbers
        metric_patterns = [
            r'(\d+\.?\d*%)',            # percentages: 99%, 12.3%
            r'(\d+\.?\d*[kKmMbB]\+?)',  # with suffix: 136k, 1.8M+
            r'(\d+\.?\d*×)',             # multipliers: 1.2×
            r'(\d+x\b)',                 # multipliers: 10x
            r'(>\s*\d+%)',               # greater than: >80%
            r'(~\d+%\+?)',               # approx: ~99%+
        ]
        
        for pattern in metric_patterns:
            # Only bold if not already part of a bold marker
            result = re.sub(
                rf'(?<!\*\*)({pattern[1:-1]})(?!\*\*)',
                r'**\1**',
                result
            )
        
        # Clean up any double-bold
        result = re.sub(r'\*\*\*\*+', '**', result)
        
        return result
    
    def _render_widget(self, widget: Dict[str, Any]) -> str:
        """Render a single widget to MDX.
        
        Args:
            widget: Widget dictionary with type and parameters
            
        Returns:
            MDX string for the widget
        """
        widget_type = widget.get("type", "")
        params = widget.get("parameters", {})
        
        # Map widget type to component
        component = self.WIDGET_TYPE_MAP.get(widget_type, "Text")
        
        # Handle different component types
        if component == "Heading":
            level = self.HEADING_LEVEL_MAP.get(widget_type, 2)
            text = self._strip_atom_ids(params.get("text", ""))
            # Skip empty headings
            if not text or not text.strip():
                return ""
            return f'{self._indent()}<Heading level={{{level}}}>{text}</Heading>'
        
        elif component == "Text":
            variant = self.TEXT_VARIANT_MAP.get(widget_type, "default")
            text = self._strip_atom_ids(params.get("text", ""))
            # Skip empty text
            if not text or not text.strip():
                return ""
            # Auto-bold metrics in text
            text = self._auto_bold_metrics(text)
            if variant == "default":
                return f'{self._indent()}<Text>{text}</Text>'
            return f'{self._indent()}<Text variant="{variant}">{text}</Text>'
        
        elif component == "SmartList":
            # Strip atom_ids from each list item and auto-bold metrics
            items = [self._auto_bold_metrics(self._strip_atom_ids(item)) for item in params.get("items", [])]
            # Skip empty lists
            if not items:
                return ""
            ordered = widget_type == "Type.NumberedList"
            items_json = json.dumps(items)
            
            # Build props list
            props = [f'items={{{items_json}}}']
            if ordered:
                props.append('ordered={true}')
            
            # Add integrated slots if present (also strip atom_ids)
            title = self._strip_atom_ids(params.get("title", ""))
            subtitle = self._strip_atom_ids(params.get("subtitle", ""))
            callout = params.get("callout")
            footer = params.get("footer", "")
            
            if title:
                props.append(f'title="{title}"')
            if subtitle:
                props.append(f'subtitle="{subtitle}"')
            if callout:
                props.append(f'callout={{{json.dumps(callout)}}}')
            if footer:
                props.append(f'footer="{footer}"')
            
            return f'{self._indent()}<SmartList {" ".join(props)} />'
        
        elif component == "ChartBar":
            data = params.get("data", [])
            
            # Skip empty charts - return placeholder or nothing
            if not data:
                return ""  # Don't render empty charts
            
            data_json = json.dumps(data)
            
            # Build props list
            props = [f'data={{{data_json}}}']
            
            # Add integrated slots if present
            title = params.get("title", "")
            subtitle = params.get("subtitle", "")
            callout = params.get("callout")
            
            if title:
                props.append(f'title="{title}"')
            if subtitle:
                props.append(f'subtitle="{subtitle}"')
            if callout:
                props.append(f'callout={{{json.dumps(callout)}}}')
            
            return f'{self._indent()}<ChartBar {" ".join(props)} />'
        
        elif component == "ChartLine":
            data = params.get("data", [])
            
            # Skip empty charts
            if not data:
                return ""
            
            data_json = json.dumps(data)
            
            # Build props list
            props = [f'data={{{data_json}}}']
            
            # Add integrated slots if present
            title = params.get("title", "")
            subtitle = params.get("subtitle", "")
            callout = params.get("callout")
            
            if title:
                props.append(f'title="{title}"')
            if subtitle:
                props.append(f'subtitle="{subtitle}"')
            if callout:
                props.append(f'callout={{{json.dumps(callout)}}}')
            
            return f'{self._indent()}<ChartLine {" ".join(props)} />'
        
        elif component == "ChartPie":
            data = params.get("data", [])
            
            # Skip empty charts
            if not data:
                return ""
            
            data_json = json.dumps(data)
            
            # Build props list
            props = [f'data={{{data_json}}}']
            
            # Add integrated slots if present
            title = params.get("title", "")
            subtitle = params.get("subtitle", "")
            callout = params.get("callout")
            
            if title:
                props.append(f'title="{title}"')
            if subtitle:
                props.append(f'subtitle="{subtitle}"')
            if callout:
                props.append(f'callout={{{json.dumps(callout)}}}')
            
            return f'{self._indent()}<ChartPie {" ".join(props)} />'
        
        elif component == "MetricGroup":
            metrics = params.get("metrics", [])
            cols = params.get("cols", 2)
            metrics_json = json.dumps(metrics)
            
            # Build props list
            props = [f'metrics={{{metrics_json}}}', f'cols={{{cols}}}']
            
            # Add integrated slots if present
            title = params.get("title", "")
            subtitle = params.get("subtitle", "")
            callout = params.get("callout")
            summary = params.get("summary", "")
            
            if title:
                props.append(f'title="{title}"')
            if subtitle:
                props.append(f'subtitle="{subtitle}"')
            if callout:
                props.append(f'callout={{{json.dumps(callout)}}}')
            if summary:
                props.append(f'summary="{summary}"')
            
            return f'{self._indent()}<MetricGroup {" ".join(props)} />'
        
        elif component == "BigNum":
            # Single big number/metric display - strip atom_ids from labels
            value = params.get("value", "")
            label = self._strip_atom_ids(params.get("label", ""))
            sublabel = self._strip_atom_ids(params.get("sublabel", ""))
            
            # Build props list
            props = [f'value="{value}"']
            if label:
                props.append(f'label="{label}"')
            if sublabel:
                props.append(f'sublabel="{sublabel}"')
            
            return f'{self._indent()}<BigNum {" ".join(props)} />'
        
        elif component == "MetricStrip":
            # Inline horizontal metric strip - strip atom_ids from labels
            metrics = params.get("metrics", [])
            # Clean each metric's label
            for m in metrics:
                if "label" in m:
                    m["label"] = self._strip_atom_ids(m["label"])
            title = self._strip_atom_ids(params.get("title", ""))
            metrics_json = json.dumps(metrics)
            
            props = [f'metrics={{{metrics_json}}}']
            if title:
                props.append(f'title="{title}"')
            
            return f'{self._indent()}<MetricStrip {" ".join(props)} />'
        
        elif component == "MetricCard":
            # Segmented summary card - strip atom_ids
            metrics = params.get("metrics", [])
            for m in metrics:
                if "label" in m:
                    m["label"] = self._strip_atom_ids(m["label"])
            title = self._strip_atom_ids(params.get("title", ""))
            layout = params.get("layout", "vertical")
            metrics_json = json.dumps(metrics)
            
            props = [f'metrics={{{metrics_json}}}', f'layout="{layout}"']
            if title:
                props.append(f'title="{title}"')
            
            return f'{self._indent()}<MetricCard {" ".join(props)} />'
        
        elif component == "MetricBadges":
            # Badge array - compact metric indicators
            badges = params.get("badges", params.get("metrics", []))
            badges_json = json.dumps(badges)
            
            return f'{self._indent()}<MetricBadges badges={{{badges_json}}} />'
        
        elif component == "TableData":
            headers = params.get("headers", [])
            rows = params.get("rows", [])
            headers_json = json.dumps(headers)
            rows_json = json.dumps(rows)
            
            # Build props list
            props = [f'headers={{{headers_json}}}', f'rows={{{rows_json}}}']
            
            # Add integrated slots if present
            title = params.get("title", "")
            subtitle = params.get("subtitle", "")
            callout = params.get("callout")
            footer = params.get("footer", "")
            
            if title:
                props.append(f'title="{title}"')
            if subtitle:
                props.append(f'subtitle="{subtitle}"')
            if callout:
                props.append(f'callout={{{json.dumps(callout)}}}')
            if footer:
                props.append(f'footer="{footer}"')
            
            return f'{self._indent()}<TableData {" ".join(props)} />'
        
        elif component == "QuoteBlock":
            text = params.get("text", "")
            author = params.get("author", "")
            source = params.get("source", "")
            if author and source:
                return f'{self._indent()}<QuoteBlock author="{author}" source="{source}">{text}</QuoteBlock>'
            elif author:
                return f'{self._indent()}<QuoteBlock author="{author}">{text}</QuoteBlock>'
            return f'{self._indent()}<QuoteBlock>{text}</QuoteBlock>'
        
        elif component == "ImageBlock":
            src = params.get("src", "")
            alt = params.get("alt", "")
            caption = params.get("caption", "")
            if caption:
                return f'{self._indent()}<ImageBlock src="{src}" alt="{alt}" caption="{caption}" />'
            return f'{self._indent()}<ImageBlock src="{src}" alt="{alt}" />'
        
        elif component == "CardGroup":
            title = params.get("title", "")
            description = params.get("description", "")
            icon = params.get("icon", "")
            return f'{self._indent()}<Card title="{title}" description="{description}" icon="{icon}" />'
        
        elif component == "Callout":
            intent = params.get("intent", "info")
            title = params.get("title", "")
            text = params.get("text", "")
            if title:
                return f'{self._indent()}<Callout intent="{intent}" title="{title}">{text}</Callout>'
            return f'{self._indent()}<Callout intent="{intent}">{text}</Callout>'
        
        # Default: render as Text
        text = params.get("text", str(params))
        return f'{self._indent()}<Text>{text}</Text>'
    
    def _render_slot_widgets(self, widgets: List[Dict[str, Any]]) -> str:
        """Render multiple widgets for a slot.
        
        Args:
            widgets: List of widget dictionaries
            
        Returns:
            MDX string for all widgets
        """
        if not widgets:
            return ""
        
        # Group co-occurring widgets for integration
        grouped = self._group_cooccurring_widgets(widgets)
        
        lines = []
        for widget in grouped:
            lines.append(self._render_widget(widget))
        return "\n".join(lines)
    
    def _group_cooccurring_widgets(self, widgets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Group co-occurring widgets into integrated blocks.
        
        Detects patterns like:
        - Heading/Subheading followed by List/Metrics/Table -> integrates as title/subtitle slots
        - Callout following a List/Metrics/Table -> integrates as callout slot
        - Body text followed by List -> integrates as subtitle slot
        
        Args:
            widgets: List of widget dictionaries
            
        Returns:
            List of widgets with co-occurring ones merged into integrated blocks
        """
        if len(widgets) <= 1:
            return widgets
        
        # Block types that support integrated slots
        BLOCK_TYPES = {"Type.List", "Type.BulletList", "Type.NumberedList", 
                       "Type.MetricGroup", "Type.Metric", "Type.Table",
                       "Type.Chart", "Type.BarChart", "Type.LineChart", "Type.PieChart"}
        
        # Header types that can become title/subtitle slots
        HEADER_TYPES = {"Type.Heading", "Type.Subheading", "Type.Display"}
        
        # Find block widgets and their associated headers/callouts
        result = []
        i = 0
        while i < len(widgets):
            widget = widgets[i]
            widget_type = widget.get("type", "")
            
            # Check if this is a header followed by block
            if widget_type in HEADER_TYPES and i + 1 < len(widgets):
                next_widget = widgets[i + 1]
                next_type = next_widget.get("type", "")
                
                if next_type in BLOCK_TYPES:
                    # Merge header into block's title/subtitle slot
                    integrated_widget = dict(next_widget)
                    integrated_params = dict(integrated_widget.get("parameters", {}))
                    
                    header_text = widget.get("parameters", {}).get("text", "")
                    
                    if widget_type == "Type.Heading" or widget_type == "Type.Display":
                        # Use as title if no title exists
                        if not integrated_params.get("title"):
                            integrated_params["title"] = header_text
                    elif widget_type == "Type.Subheading":
                        # Use as subtitle
                        if not integrated_params.get("subtitle"):
                            integrated_params["subtitle"] = header_text
                    
                    integrated_widget["parameters"] = integrated_params
                    
                    # Check if there's a callout after the block
                    if i + 2 < len(widgets):
                        after_widget = widgets[i + 2]
                        if after_widget.get("type") in {"Type.Callout", "Type.Alert"}:
                            callout_params = after_widget.get("parameters", {})
                            integrated_params["callout"] = {
                                "intent": callout_params.get("intent", "info"),
                                "title": callout_params.get("title", ""),
                                "text": callout_params.get("text", "")
                            }
                            integrated_widget["parameters"] = integrated_params
                            i += 1  # Skip the callout widget
                    
                    result.append(integrated_widget)
                    i += 2  # Skip both header and block
                    continue
            
            # Check if this is a block followed by callout
            if widget_type in BLOCK_TYPES:
                integrated_widget = dict(widget)
                integrated_params = dict(integrated_widget.get("parameters", {}))
                
                if i + 1 < len(widgets):
                    next_widget = widgets[i + 1]
                    if next_widget.get("type") in {"Type.Callout", "Type.Alert"}:
                        callout_params = next_widget.get("parameters", {})
                        if not integrated_params.get("callout"):
                            integrated_params["callout"] = {
                                "intent": callout_params.get("intent", "info"),
                                "title": callout_params.get("title", ""),
                                "text": callout_params.get("text", "")
                            }
                            integrated_widget["parameters"] = integrated_params
                        result.append(integrated_widget)
                        i += 2  # Skip both block and callout
                        continue
                
                result.append(integrated_widget)
                i += 1
                continue
            
            # Check if this is a body text followed by list
            if widget_type == "Type.Body" and i + 1 < len(widgets):
                next_widget = widgets[i + 1]
                next_type = next_widget.get("type", "")
                
                if next_type in {"Type.List", "Type.BulletList", "Type.NumberedList"}:
                    # Merge body text as subtitle
                    integrated_widget = dict(next_widget)
                    integrated_params = dict(integrated_widget.get("parameters", {}))
                    
                    body_text = widget.get("parameters", {}).get("text", "")
                    if body_text and not integrated_params.get("subtitle"):
                        integrated_params["subtitle"] = body_text
                    
                    integrated_widget["parameters"] = integrated_params
                    result.append(integrated_widget)
                    i += 2  # Skip both body and list
                    continue
            
            # No grouping applicable, keep widget as-is
            result.append(widget)
            i += 1
        
        return result
    
    def render_slide(self, slide: Dict[str, Any]) -> str:
        """Render a single slide to MDX.
        
        If the slide has an 'mdx' field, return it directly (LLM-generated MDX).
        Otherwise, convert widgets to MDX (legacy fallback).
        
        Args:
            slide: Slide dictionary with layout and widgets, or mdx field
            
        Returns:
            MDX string for the slide
        """
        # Direct MDX passthrough if available (new LLM output format)
        if slide.get("mdx"):
            return slide["mdx"]
        
        # Legacy widget-to-MDX conversion (fallback for old state.json format)
        layout = slide.get("layout", "default")
        widgets = slide.get("widgets", {})
        theme = slide.get("theme", self.theme)
        
        # Map layout to component
        layout_component = self.LAYOUT_TYPE_MAP.get(layout, "LayoutSplit")
        
        lines = []
        
        # Render based on layout type
        if layout_component == "LayoutCover":
            lines.append(f'<LayoutCover theme="{theme}">')
            self.indent_level += 1
            
            # Title and subtitle
            if "title" in widgets:
                lines.append(self._render_widget(widgets["title"]))
            if "subtitle" in widgets:
                lines.append(self._render_widget(widgets["subtitle"]))
            
            self.indent_level -= 1
            lines.append('</LayoutCover>')
        
        elif layout_component == "LayoutSplit":
            ratio = slide.get("ratio", "1:1")
            lines.append(f'<LayoutSplit ratio="{ratio}" theme="{theme}">')
            self.indent_level += 1
            
            # Group widgets by left/right prefix or explicit slot
            left_widgets = []
            right_widgets = []
            
            for slot_name, widget in widgets.items():
                widget_list = widget if isinstance(widget, list) else [widget]
                # Check if slot starts with left/right prefix or is explicitly named
                if slot_name == "left" or slot_name.startswith("left_"):
                    left_widgets.extend(widget_list)
                elif slot_name == "right" or slot_name.startswith("right_"):
                    right_widgets.extend(widget_list)
                elif slot_name in ("title", "heading"):
                    left_widgets.insert(0, widget)  # Title goes first on left
                elif slot_name in ("subtitle", "content", "body"):
                    left_widgets.extend(widget_list)
                elif slot_name in ("visual", "image", "chart", "data"):
                    right_widgets.extend(widget_list)
                else:
                    # Default: alternate between left and right
                    if len(left_widgets) <= len(right_widgets):
                        left_widgets.extend(widget_list)
                    else:
                        right_widgets.extend(widget_list)
            
            # Left slot
            lines.append(f'{self._indent()}<Left>')
            self.indent_level += 1
            if left_widgets:
                lines.append(self._render_slot_widgets(left_widgets))
            self.indent_level -= 1
            lines.append(f'{self._indent()}</Left>')
            
            # Right slot
            lines.append(f'{self._indent()}<Right>')
            self.indent_level += 1
            if right_widgets:
                lines.append(self._render_slot_widgets(right_widgets))
            self.indent_level -= 1
            lines.append(f'{self._indent()}</Right>')
            
            self.indent_level -= 1
            lines.append('</LayoutSplit>')
        
        elif layout_component == "LayoutGrid":
            cols = slide.get("cols", 3)
            
            # Grid columns - support both "columns" array and "col1_xxx", "col2_xxx" style slots
            columns = widgets.get("columns", [])
            
            if not columns:
                # Try to gather from col1_title, col1_chart, col2_xxx, card1, card2 etc.
                col_dict = {}
                non_col_widgets = []  # Widgets that don't follow colX_ pattern
                
                for slot_name, widget in widgets.items():
                    # Match col1_xxx, col2_xxx (extract column number from prefix)
                    match = re.match(r'col(\d+)[_]?\w*', slot_name)
                    if not match:
                        # Try card1, card2 pattern
                        match = re.match(r'card(\d+)', slot_name)
                    if match:
                        col_idx = int(match.group(1)) - 1  # 0-based index
                        widget_list = widget if isinstance(widget, list) else [widget]
                        if col_idx not in col_dict:
                            col_dict[col_idx] = []
                        col_dict[col_idx].extend(widget_list)
                    else:
                        # Collect non-column widgets
                        widget_list = widget if isinstance(widget, list) else [widget]
                        non_col_widgets.extend(widget_list)
                
                # Convert dict to list, filling gaps with empty
                if col_dict:
                    max_idx = max(col_dict.keys())
                    columns = [col_dict.get(i, []) for i in range(max_idx + 1)]
                elif non_col_widgets:
                    # FALLBACK: No column-based widgets found, render as stacked layout instead
                    lines.append(f'<LayoutStacked theme="{theme}">')
                    self.indent_level += 1
                    
                    # Render all widgets in order: title, subtitle, then others
                    slot_order = ["title", "subtitle", "body", "content", "data", "chart", "callout", "footer"]
                    rendered = set()
                    for slot in slot_order:
                        if slot in widgets:
                            w = widgets[slot]
                            widget_list = w if isinstance(w, list) else [w]
                            for wgt in widget_list:
                                lines.append(self._render_widget(wgt))
                            rendered.add(slot)
                    # Render remaining
                    for slot_name, w in widgets.items():
                        if slot_name not in rendered:
                            widget_list = w if isinstance(w, list) else [w]
                            for wgt in widget_list:
                                lines.append(self._render_widget(wgt))
                    
                    self.indent_level -= 1
                    lines.append('</LayoutStacked>')
                    return '\n'.join(lines)
            
            lines.append(f'<LayoutGrid cols={{{cols}}} theme="{theme}">')
            self.indent_level += 1
            
            for i, col_widgets in enumerate(columns):
                lines.append(f'{self._indent()}<Col>')
                self.indent_level += 1
                if isinstance(col_widgets, list):
                    lines.append(self._render_slot_widgets(col_widgets))
                else:
                    lines.append(self._render_widget(col_widgets))
                self.indent_level -= 1
                lines.append(f'{self._indent()}</Col>')
            
            self.indent_level -= 1
            lines.append('</LayoutGrid>')
        
        elif layout_component == "LayoutFullBleed":
            lines.append(f'<LayoutFullBleed theme="{theme}">')
            self.indent_level += 1
            
            # FullBleed typically has background image and overlay content
            # Look for image widget or background property
            image_src = slide.get("background", "")
            
            for slot_name, widget in widgets.items():
                widget_list = widget if isinstance(widget, list) else [widget]
                for w in widget_list:
                    if w.get("type") == "Type.Image" or w.get("type") == "image":
                        # Use image as background
                        params = w.get("params", {})
                        if not image_src:
                            image_src = params.get("src", "")
                    else:
                        # Render other widgets as overlay content
                        lines.append(self._render_widget(w))
            
            # Add background image if found
            if image_src:
                lines.insert(-len(widgets) if widgets else 1, f'{self._indent()}<ImageBlock src="{image_src}" fill />')
            
            self.indent_level -= 1
            lines.append('</LayoutFullBleed>')
        
        elif layout_component == "LayoutTimeline":
            lines.append(f'<LayoutTimeline theme="{theme}">')
            self.indent_level += 1
            
            # Timeline expects items/events array or item_1, step1, event_1 style slots
            items = widgets.get("items", widgets.get("events", []))
            
            if not items:
                # Try item_1, step1, event1... style slots (skip title)
                item_dict = {}
                for slot_name, widget in widgets.items():
                    if slot_name == "title":
                        continue  # Skip title, render it separately
                    # Match item1, step1, event1, phase1 patterns
                    match = re.match(r'(?:item|step|event|phase)[_]?(\d+)', slot_name)
                    if match:
                        item_idx = int(match.group(1)) - 1
                        widget_list = widget if isinstance(widget, list) else [widget]
                        if item_idx not in item_dict:
                            item_dict[item_idx] = []
                        item_dict[item_idx].extend(widget_list)
                
                if item_dict:
                    max_idx = max(item_dict.keys())
                    items = [item_dict.get(i, []) for i in range(max_idx + 1)]
            
            # Render title first if exists
            if "title" in widgets:
                lines.append(self._render_widget(widgets["title"]))
            
            for i, item_widgets in enumerate(items):
                lines.append(f'{self._indent()}<Item>')
                self.indent_level += 1
                if isinstance(item_widgets, list):
                    lines.append(self._render_slot_widgets(item_widgets))
                else:
                    lines.append(self._render_widget(item_widgets))
                self.indent_level -= 1
                lines.append(f'{self._indent()}</Item>')
            
            self.indent_level -= 1
            lines.append('</LayoutTimeline>')
        
        elif layout_component == "LayoutDashboard":
            lines.append(f'<LayoutDashboard theme="{theme}">')
            self.indent_level += 1
            
            # Dashboard can have header slot and panels
            if "header" in widgets:
                lines.append(f'{self._indent()}<Header>')
                self.indent_level += 1
                header = widgets["header"] if isinstance(widgets["header"], list) else [widgets["header"]]
                lines.append(self._render_slot_widgets(header))
                self.indent_level -= 1
                lines.append(f'{self._indent()}</Header>')
            
            # Gather panel slots: panel_1, panel_2... or panels array
            panels = widgets.get("panels", [])
            
            if not panels:
                panel_dict = {}
                for slot_name, widget in widgets.items():
                    if slot_name == "header":
                        continue
                    match = re.match(r'panel[_]?(\d+)', slot_name)
                    if match:
                        panel_idx = int(match.group(1)) - 1
                        widget_list = widget if isinstance(widget, list) else [widget]
                        if panel_idx not in panel_dict:
                            panel_dict[panel_idx] = []
                        panel_dict[panel_idx].extend(widget_list)
                    elif slot_name not in ("items", "events"):
                        # Treat as a panel
                        widget_list = widget if isinstance(widget, list) else [widget]
                        next_idx = len(panel_dict)
                        panel_dict[next_idx] = widget_list
                
                if panel_dict:
                    max_idx = max(panel_dict.keys())
                    panels = [panel_dict.get(i, []) for i in range(max_idx + 1)]
            
            for i, panel_widgets in enumerate(panels):
                lines.append(f'{self._indent()}<Main>')
                self.indent_level += 1
                if isinstance(panel_widgets, list):
                    lines.append(self._render_slot_widgets(panel_widgets))
                else:
                    lines.append(self._render_widget(panel_widgets))
                self.indent_level -= 1
                lines.append(f'{self._indent()}</Main>')
            
            self.indent_level -= 1
            lines.append('</LayoutDashboard>')
        
        elif layout_component == "LayoutStacked":
            # Single-column layout for dense text content
            align = slide.get("align", "left")
            lines.append(f'<LayoutStacked align="{align}" theme="{theme}">')
            self.indent_level += 1
            
            # Collect all widgets and render them in order
            # Sort by slot name to maintain logical order (title, body_1, body_2, list, callout)
            sorted_slots = sorted(widgets.keys(), key=lambda x: (
                0 if x == "title" else
                1 if x.startswith("body") else
                2 if x == "content" else
                3 if x == "list" else
                4 if x.startswith("section") else
                5 if x == "callout" else
                6
            ))
            
            for slot_name in sorted_slots:
                widget = widgets[slot_name]
                widget_list = widget if isinstance(widget, list) else [widget]
                for w in widget_list:
                    lines.append(self._render_widget(w))
            
            self.indent_level -= 1
            lines.append('</LayoutStacked>')
        
        else:
            # Default: render all widgets in a simple container
            lines.append(f'<LayoutSplit ratio="1:1" theme="{theme}">')
            self.indent_level += 1
            
            lines.append(f'{self._indent()}<Left>')
            self.indent_level += 1
            for slot_name, widget in widgets.items():
                if isinstance(widget, list):
                    lines.append(self._render_slot_widgets(widget))
                else:
                    lines.append(self._render_widget(widget))
            self.indent_level -= 1
            lines.append(f'{self._indent()}</Left>')
            
            lines.append(f'{self._indent()}<Right />')
            
            self.indent_level -= 1
            lines.append('</LayoutSplit>')
        
        return "\n".join(lines)
    
    def render_state(self, state: Dict[str, Any]) -> str:
        """Render complete presentation state to MDX.
        
        Args:
            state: Complete state.json content
            
        Returns:
            Complete MDX content for all slides
        """
        slides = state.get("slides", [])
        presentation = state.get("presentation", {})
        
        # MDX header with imports
        header_lines = [
            "// Auto-generated MDX - Do not edit manually",
            "// Generated by ReactMDXRenderer",
            "",
            "export const meta = {",
            f'  title: "{presentation.get("title", "Presentation")}",',
            f'  theme: "{presentation.get("theme", self.theme)}",',
            f'  slideCount: {len(slides)},',
            "};",
            "",
        ]
        
        # Render each slide
        slide_sections = []
        for i, slide in enumerate(slides):
            slide_mdx = self.render_slide(slide)
            slide_sections.append(f"{{/* Slide {i + 1} */}}")
            slide_sections.append(slide_mdx)
            slide_sections.append("")
        
        return "\n".join(header_lines + slide_sections)
    
    def render_to_file(self, state: Dict[str, Any], filename: str = "slides.mdx") -> Path:
        """Render state to MDX file.
        
        Args:
            state: Complete state.json content
            filename: Output filename (default: slides.mdx)
            
        Returns:
            Path to generated MDX file
        """
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        mdx_content = self.render_state(state)
        output_path = self.output_dir / filename
        
        output_path.write_text(mdx_content, encoding="utf-8")
        
        return output_path
    
    def render_from_file(self, state_path: Path, output_filename: str = "slides.mdx") -> Path:
        """Render from state.json file to MDX file.
        
        Args:
            state_path: Path to state.json file
            output_filename: Output filename (default: slides.mdx)
            
        Returns:
            Path to generated MDX file
        """
        with open(state_path, "r", encoding="utf-8") as f:
            state = json.load(f)
        
        return self.render_to_file(state, output_filename)


# Convenience function
def render_mdx(state: Dict[str, Any], output_dir: Optional[Path] = None, theme: str = "business") -> str:
    """Render state to MDX string.
    
    Args:
        state: Complete state.json content
        output_dir: Optional output directory
        theme: Theme name
        
    Returns:
        MDX content string
    """
    renderer = ReactMDXRenderer(output_dir=output_dir, theme=theme)
    return renderer.render_state(state)


# =============================================================================
# MDX Validation (L0 Rule Enforcement)
# =============================================================================

# Forbidden HTML elements (L0)
FORBIDDEN_ELEMENTS = [
    'div', 'span', 'section', 'article', 'aside', 'header', 'footer',
    'nav', 'main', 'figure', 'figcaption', 'table', 'tr', 'td', 'th',
    'thead', 'tbody', 'ul', 'ol', 'li', 'a', 'img', 'button', 'input',
    'form', 'label', 'br', 'hr',
]

# Forbidden attributes (L0)
FORBIDDEN_ATTRIBUTES = [
    'className', 'class', 'style', 'dangerouslySetInnerHTML',
    'onClick', 'onMouseOver', 'onMouseOut', 'onFocus', 'onBlur', 'id',
]

# Suggestions for forbidden elements
ELEMENT_SUGGESTIONS = {
    'div': 'Use LayoutCover, LayoutSplit, or LayoutGrid for layouts',
    'span': 'Use Text component with variant prop',
    'section': 'Use LayoutCover, LayoutSplit, or LayoutGrid',
    'ul': 'Use SmartList component',
    'ol': 'Use SmartList with ordered={true}',
    'li': 'Use SmartList with items prop',
    'table': 'Use TableData component',
    'img': 'Use ImageBlock component',
    'a': 'Links should be in Text or use CardGroup with link prop',
}

# Suggestions for forbidden attributes
ATTRIBUTE_SUGGESTIONS = {
    'className': 'Styling is handled by theme. Use variant, intent, or size props instead',
    'class': 'Styling is handled by theme. Use variant, intent, or size props instead',
    'style': 'Inline styles are forbidden. Use theme and vibe props instead',
    'dangerouslySetInnerHTML': 'Raw HTML is forbidden. Use semantic components',
    'onClick': 'Event handlers are internal only. Use semantic components',
    'id': 'IDs are internal only. Use data props if needed',
}


class ValidationError:
    """Represents a single MDX validation error."""
    
    def __init__(self, error_type: str, message: str, line: int = 0, column: int = 0, suggestion: str = ""):
        self.type = error_type
        self.message = message
        self.line = line
        self.column = column
        self.suggestion = suggestion
    
    def __repr__(self) -> str:
        location = f" at line {self.line}" if self.line else ""
        return f"{self.message}{location}"


class ValidationResult:
    """Result of MDX validation."""
    
    def __init__(self, valid: bool, errors: List[ValidationError] = None):
        self.valid = valid
        self.errors = errors or []
    
    def __repr__(self) -> str:
        if self.valid:
            return "✓ MDX is valid - no L0 violations found"
        return f"✗ MDX validation failed with {len(self.errors)} error(s)"


def get_line_number(content: str, index: int) -> int:
    """Get line number from character index."""
    return content[:index].count('\n') + 1


def get_column_number(content: str, index: int) -> int:
    """Get column number from character index."""
    last_newline = content.rfind('\n', 0, index)
    return index - last_newline if last_newline >= 0 else index + 1


def validate_mdx(content: str) -> ValidationResult:
    """Validate MDX content for L0 violations.
    
    Checks for forbidden HTML elements and attributes that should not
    appear in AI-generated MDX content.
    
    Args:
        content: MDX content string to validate
        
    Returns:
        ValidationResult with errors if any violations found
    """
    errors: List[ValidationError] = []
    
    # Check for forbidden elements
    for element in FORBIDDEN_ELEMENTS:
        pattern = re.compile(rf'<{element}(?:\s|>|/)', re.IGNORECASE)
        for match in pattern.finditer(content):
            suggestion = ELEMENT_SUGGESTIONS.get(element, f'Use a semantic L1-L3 component instead of <{element}>')
            errors.append(ValidationError(
                error_type='element',
                message=f'L0 violation: <{element}> is forbidden',
                line=get_line_number(content, match.start()),
                column=get_column_number(content, match.start()),
                suggestion=suggestion,
            ))
    
    # Check for forbidden attributes
    for attribute in FORBIDDEN_ATTRIBUTES:
        pattern = re.compile(rf'\s{attribute}\s*=', re.IGNORECASE)
        for match in pattern.finditer(content):
            suggestion = ATTRIBUTE_SUGGESTIONS.get(attribute, f'The {attribute} attribute is not allowed in Agent-generated MDX')
            errors.append(ValidationError(
                error_type='attribute',
                message=f'L0 violation: {attribute} attribute is forbidden',
                line=get_line_number(content, match.start()),
                column=get_column_number(content, match.start()),
                suggestion=suggestion,
            ))
    
    return ValidationResult(valid=len(errors) == 0, errors=errors)


def format_validation_errors(result: ValidationResult) -> str:
    """Format validation errors for display.
    
    Args:
        result: ValidationResult to format
        
    Returns:
        Formatted error string with line numbers and suggestions
    """
    if result.valid:
        return "✓ MDX is valid - no L0 violations found"
    
    header = f"✗ MDX validation failed with {len(result.errors)} error(s):\n"
    
    error_lines = []
    for idx, error in enumerate(result.errors, 1):
        location = f" at line {error.line}" if error.line else ""
        error_lines.append(f"\n{idx}. {error.message}{location}\n   Suggestion: {error.suggestion}")
    
    return header + ''.join(error_lines)


def assert_valid_mdx(content: str) -> None:
    """Validate MDX and raise if invalid.
    
    Args:
        content: MDX content string to validate
        
    Raises:
        ValueError: If validation fails, with detailed error messages
    """
    result = validate_mdx(content)
    
    if not result.valid:
        raise ValueError(format_validation_errors(result))
