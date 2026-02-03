"""Interface adapters for cliv2.

Each interface adapter translates interface-specific inputs to GenerationRequest
and formats GenerationResult for interface-specific output.

Available interfaces:
- cli: Command-line interface using Click
- gradio: (Future) Gradio Web UI
- mcp: (Future) MCP Server interface
"""
