"""
JSX Validator and Repairer

Rule-based JSX validation and auto-repair for common LLM generation errors.
No LLM involved - pure regex/parsing based.

Usage:
    from cliv2.tools.jsx_validator import JSXValidator, get_default_config
    
    # Use default config
    validator = JSXValidator()
    result = validator.validate_and_repair(jsx_content)
    
    # Use custom config
    config = get_default_config()
    config['fix_unclosed_inline_tags'] = False  # Disable specific rule
    validator = JSXValidator(config)
    
Config file location: cliv2/config/jsx_validator.json (optional)
"""

import re
import json
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path


# =============================================================================
# DEFAULT CONFIG
# =============================================================================

DEFAULT_CONFIG = {
    # Repair rules (each can be enabled/disabled)
    'fix_extra_closing_tags': True,      # Remove orphan </strong>, </em>, etc.
    'fix_unclosed_inline_tags': True,    # Add missing </span>, </strong>, etc.
    'fix_unescaped_ampersands': True,    # Escape & to &amp; in text
    'fix_unescaped_less_than': True,     # Escape < to &lt; in text
    'fix_className_quotes': True,         # Fix broken className quotes
    
    # Behavior
    'report_only': False,                 # If True, don't repair, just report
}

# Config file path (relative to cliv2/)
CONFIG_FILE = Path(__file__).parent.parent / 'config' / 'jsx_validator.json'


def get_default_config() -> dict:
    """Get a copy of the default config."""
    return DEFAULT_CONFIG.copy()


def load_config() -> dict:
    """Load config from file, falling back to defaults."""
    config = DEFAULT_CONFIG.copy()
    
    if CONFIG_FILE.exists():
        try:
            file_config = json.loads(CONFIG_FILE.read_text(encoding='utf-8'))
            config.update(file_config)
        except (json.JSONDecodeError, IOError):
            pass  # Use defaults on error
    
    return config
from pathlib import Path


@dataclass
class RepairAction:
    """Describes a single repair action taken."""
    rule: str
    description: str
    line: Optional[int] = None
    original: str = ""
    replacement: str = ""
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage."""
        return {
            "rule": self.rule,
            "description": self.description,
            "line": self.line,
            "type": "repaired",
        }


@dataclass
class ValidationResult:
    """Result of JSX validation and repair."""
    original_content: str
    repaired_content: str
    repairs: list[RepairAction] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    
    @property
    def had_errors(self) -> bool:
        return len(self.repairs) > 0 or len(self.errors) > 0
    
    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0
    
    @property
    def has_unresolved(self) -> bool:
        return len(self.errors) > 0
    
    def get_issues(self) -> list[dict]:
        """Get all issues (repaired + unresolved) as dicts for storage."""
        issues = []
        
        # Add repaired issues
        for r in self.repairs:
            issues.append({
                "rule": r.rule,
                "description": r.description,
                "line": r.line,
                "status": "repaired",
            })
        
        # Add unresolved errors
        for e in self.errors:
            issues.append({
                "rule": "validation_error",
                "description": e,
                "status": "unresolved",
            })
        
        return issues
    
    def get_unresolved_issues(self) -> list[dict]:
        """Get only unresolved issues for storage."""
        return [
            {"rule": "validation_error", "description": e, "status": "unresolved"}
            for e in self.errors
        ]
    
    def summary(self) -> str:
        """Human-readable summary of repairs."""
        if not self.had_errors:
            return "✅ JSX is valid, no repairs needed"
        
        lines = [f"🔧 Made {len(self.repairs)} repairs:"]
        for r in self.repairs:
            loc = f" (line {r.line})" if r.line else ""
            lines.append(f"  - [{r.rule}]{loc}: {r.description}")
        
        if self.errors:
            lines.append(f"\n⚠️ {len(self.errors)} unresolved errors:")
            for e in self.errors:
                lines.append(f"  - {e}")
        
        return "\n".join(lines)


# =============================================================================
# REPAIR RULES
# =============================================================================

class JSXValidator:
    """
    Rule-based JSX validator and repairer.
    
    Config is loaded from:
    1. Passed config dict (highest priority)
    2. cliv2/config/jsx_validator.json (if exists)
    3. DEFAULT_CONFIG (fallback)
    """
    
    # Self-closing tags in JSX/HTML
    VOID_ELEMENTS = {
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    }
    
    # Common inline tags that should be balanced
    INLINE_TAGS = {'strong', 'em', 'b', 'i', 'u', 's', 'code', 'span', 'a'}
    
    def __init__(self, config: Optional[dict] = None):
        """
        Initialize validator with optional config override.
        
        Args:
            config: Optional config dict to override defaults.
                    If None, loads from file or uses DEFAULT_CONFIG.
        """
        # Load base config from file (or defaults)
        base_config = load_config()
        
        # Override with passed config
        if config:
            base_config.update(config)
        
        self.config = base_config
    
    def _get_config(self, key: str) -> bool:
        return self.config.get(key, DEFAULT_CONFIG.get(key, True))
    
    def validate_and_repair(self, content: str) -> ValidationResult:
        """
        Validate and repair JSX content.
        
        Returns ValidationResult with repaired content and list of repairs.
        """
        result = ValidationResult(
            original_content=content,
            repaired_content=content,
            repairs=[],
            errors=[]
        )
        
        # Apply rules in order
        if self._get_config('fix_extra_closing_tags'):
            self._fix_extra_closing_tags(result)
        
        if self._get_config('fix_unclosed_inline_tags'):
            self._fix_unclosed_inline_tags(result)
        
        if self._get_config('fix_unescaped_ampersands'):
            self._fix_unescaped_ampersands(result)
        
        if self._get_config('fix_unescaped_less_than'):
            self._fix_unescaped_less_than(result)
        
        if self._get_config('fix_className_quotes'):
            self._fix_className_quotes(result)
        
        # Final validation pass
        self._validate_tag_balance(result)
        
        return result
    
    # -------------------------------------------------------------------------
    # Rule: Extra Closing Tags
    # -------------------------------------------------------------------------
    # Pattern: </tag> appearing after text where tag was already closed
    # Example: <strong>text</strong> more text.</strong>  <- extra </strong>
    
    def _fix_extra_closing_tags(self, result: ValidationResult) -> None:
        """Fix extra closing tags that don't have matching openers."""
        content = result.repaired_content
        
        for tag in self.INLINE_TAGS:
            # Pattern: </tag> that appears after tag was already closed on same line
            # This catches: <strong>X</strong> Y</strong>
            pattern = rf'(<{tag}[^>]*>.*?</{tag}>)([^<]*?)(</{tag}>)'
            
            def replacer(m):
                return m.group(1) + m.group(2)  # Remove the extra closing tag
            
            new_content, count = re.subn(pattern, replacer, content, flags=re.DOTALL)
            
            if count > 0:
                result.repairs.append(RepairAction(
                    rule="extra_closing_tag",
                    description=f"Removed {count} extra </{tag}> tag(s)",
                    original=f"</{tag}>",
                    replacement=""
                ))
                content = new_content
        
        # Detect truly orphan closing tags using stack-based tracking
        # This properly handles multi-line JSX
        for tag in self.INLINE_TAGS:
            # Build list of all tag positions
            opener_pattern = rf'<{tag}(?:\s[^>]*)?>'
            closer_pattern = rf'</{tag}>'
            
            # Find all openers and closers with positions
            openers = [(m.start(), 'open') for m in re.finditer(opener_pattern, content)]
            closers = [(m.start(), m.end(), 'close') for m in re.finditer(closer_pattern, content)]
            
            # Merge and sort by position
            events = []
            for pos, typ in openers:
                events.append((pos, None, typ))
            for start, end, typ in closers:
                events.append((start, end, typ))
            events.sort(key=lambda x: x[0])
            
            # Track stack and find orphan closers
            stack = 0
            orphan_positions = []  # (start, end) of orphan </tag>
            
            for event in events:
                if event[2] == 'open':
                    stack += 1
                else:  # close
                    if stack > 0:
                        stack -= 1
                    else:
                        # Orphan closer - no matching opener
                        orphan_positions.append((event[0], event[1]))
            
            # Remove orphan closers (in reverse order to preserve positions)
            if orphan_positions:
                chars = list(content)
                for start, end in reversed(orphan_positions):
                    del chars[start:end]
                content = ''.join(chars)
                
                result.repairs.append(RepairAction(
                    rule="orphan_closing_tag",
                    description=f"Removed {len(orphan_positions)} orphan </{tag}> tag(s)",
                    original=f"</{tag}>",
                    replacement=""
                ))
        
        result.repaired_content = content
    
    # -------------------------------------------------------------------------
    # Rule: Unclosed Inline Tags
    # -------------------------------------------------------------------------
    # Pattern: <tag> without matching </tag>
    # Example: <strong>text (missing </strong>)
    
    def _fix_unclosed_inline_tags(self, result: ValidationResult) -> None:
        """Fix unclosed inline tags using stack-based tracking."""
        if not self._get_config('fix_unclosed_inline_tags'):
            return
        
        content = result.repaired_content
        total_repairs = 0
        
        # Process each inline tag type
        for tag in self.INLINE_TAGS:
            opener_pattern = rf'<{tag}(?:\s[^>]*)?>'
            closer_pattern = rf'</{tag}>'
            
            # Count openers and closers
            openers = list(re.finditer(opener_pattern, content))
            closers = list(re.finditer(closer_pattern, content))
            
            # If more openers than closers, add closers at end of content
            missing = len(openers) - len(closers)
            if missing > 0:
                # Add closing tags at the end (before final whitespace)
                content = content.rstrip() + (f'</{tag}>' * missing) + '\n'
                total_repairs += missing
        
        if total_repairs > 0:
            result.repairs.append(RepairAction(
                rule="unclosed_inline_tag",
                description=f"Added {total_repairs} missing closing tag(s) at end",
                original="",
                replacement=""
            ))
        
        result.repaired_content = content
    
    # -------------------------------------------------------------------------
    # Rule: Unescaped Ampersands
    # -------------------------------------------------------------------------
    # Pattern: & not followed by valid entity or escaped
    # Example: "Tom & Jerry" should be "Tom &amp; Jerry" in JSX
    
    def _fix_unescaped_ampersands(self, result: ValidationResult) -> None:
        """Fix unescaped & characters in JSX text content."""
        content = result.repaired_content
        
        # Pattern: & not followed by word;  (which would be an entity)
        # But be careful not to double-escape &amp;
        pattern = r'&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)'
        
        # Only fix & that appear in text content, not in attributes or JSX expressions
        # This is a simplified version - full fix would need proper parsing
        
        # Skip if inside {}, quotes, or tag attributes
        # For now, just track counts for reporting
        matches = re.findall(pattern, content)
        if matches:
            # Report but don't auto-fix (risky without proper parsing)
            result.errors.append(
                f"Found {len(matches)} potentially unescaped '&' characters - manual review recommended"
            )
    
    # -------------------------------------------------------------------------
    # Rule: Unescaped Less Than
    # -------------------------------------------------------------------------
    # Pattern: < in text that's not a tag
    # Example: "if x < y" should be "if x &lt; y"
    
    def _fix_unescaped_less_than(self, result: ValidationResult) -> None:
        """Fix unescaped < characters in JSX text content."""
        content = result.repaired_content
        
        # Pattern: < followed by space or digit (not a tag)
        pattern = r'<(?=\s|\d)'
        
        new_content, count = re.subn(pattern, '&lt;', content)
        
        if count > 0:
            result.repairs.append(RepairAction(
                rule="unescaped_less_than",
                description=f"Escaped {count} '<' character(s) to '&lt;'",
                original="<",
                replacement="&lt;"
            ))
            result.repaired_content = new_content
    
    # -------------------------------------------------------------------------
    # Rule: className Quote Issues
    # -------------------------------------------------------------------------
    # Pattern: className with nested quotes
    # Example: className="flex "gap-4"" (broken)
    
    def _fix_className_quotes(self, result: ValidationResult) -> None:
        """Fix className attribute quote issues."""
        content = result.repaired_content
        
        # Pattern: className="" with internal unescaped quotes
        # This is rare but can happen
        pass  # Skip for now
        
        result.repaired_content = content
    
    # -------------------------------------------------------------------------
    # Validation: Tag Balance
    # -------------------------------------------------------------------------
    
    def _validate_tag_balance(self, result: ValidationResult) -> None:
        """Validate that all tags are balanced after repairs."""
        content = result.repaired_content
        
        # Extract all tags
        tag_pattern = r'<(/?)(\w+)([^>]*?)(/?)>'
        
        # Only validate lowercase HTML tags, not JSX components
        # JSX components have complex nesting patterns that require a real parser
        html_stack = []
        
        for m in re.finditer(tag_pattern, content):
            is_closing = m.group(1) == '/'
            tag_name = m.group(2)
            is_self_closing = m.group(4) == '/'
            
            # Skip JSX components (capitalized) - they need a real parser
            if tag_name[0].isupper():
                continue
            
            tag_lower = tag_name.lower()
            
            # Skip void elements and self-closing
            if tag_lower in self.VOID_ELEMENTS or is_self_closing:
                continue
            
            # Skip inline tags - they are already repaired by _fix_unclosed_inline_tags
            if tag_lower in self.INLINE_TAGS:
                continue
            
            if is_closing:
                if html_stack and html_stack[-1] == tag_lower:
                    html_stack.pop()
                elif html_stack:
                    result.errors.append(
                        f"Mismatched closing tag </{tag_lower}>, expected </{html_stack[-1]}>"
                    )
            else:
                html_stack.append(tag_lower)
        
        # Report unclosed block-level tags (truly unfixable without more context)
        # Inline tags are NOT reported here - they were already fixed
        if html_stack:
            # Filter out inline tags (shouldn't be here but just in case)
            block_unclosed = [t for t in html_stack if t not in self.INLINE_TAGS]
            if block_unclosed:
                result.errors.append(f"Unclosed block tags: {', '.join(block_unclosed)}")


# =============================================================================
# BATCH PROCESSING
# =============================================================================

def validate_jsx_file(file_path: Path, config: Optional[dict] = None) -> ValidationResult:
    """Validate and repair a single JSX file."""
    content = file_path.read_text(encoding='utf-8')
    validator = JSXValidator(config)
    return validator.validate_and_repair(content)


def validate_jsx_files(
    file_paths: list[Path],
    config: Optional[dict] = None,
    write_repairs: bool = True
) -> dict[Path, ValidationResult]:
    """
    Validate and repair multiple JSX files.
    
    Args:
        file_paths: List of paths to JSX files
        config: Validator configuration
        write_repairs: If True, write repaired content back to files
    
    Returns:
        Dictionary mapping file paths to their validation results
    """
    results = {}
    
    for path in file_paths:
        try:
            result = validate_jsx_file(path, config)
            results[path] = result
            
            if result.had_errors and write_repairs:
                path.write_text(result.repaired_content, encoding='utf-8')
                print(f"✅ Repaired: {path}")
                print(result.summary())
            elif result.had_errors:
                print(f"⚠️ Issues found: {path}")
                print(result.summary())
            else:
                print(f"✓ Valid: {path}")
                
        except Exception as e:
            print(f"❌ Error processing {path}: {e}")
            results[path] = ValidationResult(
                original_content="",
                repaired_content="",
                errors=[str(e)]
            )
    
    return results


def validate_project_slides(
    project_dir: Path,
    config: Optional[dict] = None,
    write_repairs: bool = True
) -> dict[Path, ValidationResult]:
    """
    Validate all slide JSX files in a project directory.
    
    Looks for:
        - output/slides.jsx
        - output/*.jsx
    """
    output_dir = project_dir / 'output'
    
    if not output_dir.exists():
        print(f"No output directory found: {output_dir}")
        return {}
    
    jsx_files = list(output_dir.glob('*.jsx'))
    
    if not jsx_files:
        print(f"No JSX files found in: {output_dir}")
        return {}
    
    print(f"Validating {len(jsx_files)} JSX file(s) in {project_dir.name}...")
    return validate_jsx_files(jsx_files, config, write_repairs)


# =============================================================================
# CLI
# =============================================================================

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='JSX Validator and Repairer')
    parser.add_argument('paths', nargs='+', help='JSX files or project directories to validate')
    parser.add_argument('--no-write', action='store_true', help='Report only, do not write repairs')
    parser.add_argument('--config', type=str, help='JSON config file')
    
    args = parser.parse_args()
    
    config = None
    if args.config:
        import json
        config = json.loads(Path(args.config).read_text())
    
    for path_str in args.paths:
        path = Path(path_str)
        
        if path.is_dir():
            validate_project_slides(path, config, write_repairs=not args.no_write)
        elif path.is_file():
            result = validate_jsx_file(path, config)
            print(result.summary())
            
            if result.had_errors and not args.no_write:
                path.write_text(result.repaired_content, encoding='utf-8')
                print(f"✅ Repaired: {path}")
        else:
            print(f"❌ Path not found: {path}")
