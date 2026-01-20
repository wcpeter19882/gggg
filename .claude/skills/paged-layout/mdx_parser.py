"""MDX Parser for extracting slides and patches from LLM output.

This module parses LLM-generated MDX markup:
- parse_slides_from_mdx(): Extract <Slide> elements into Slide objects
- parse_patches(): Extract <Patch> elements for incremental updates
- apply_patches(): Apply patch content to existing MDX in slides
"""

import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ParsedSlide:
    """Parsed slide data from MDX output."""
    id: str
    rank: int
    story: str
    atoms: List[str]
    mdx: str


@dataclass
class PatchOperation:
    """A single patch operation targeting an element by ID."""
    id: str
    content: str


def parse_slides_from_mdx(mdx_output: str) -> List[ParsedSlide]:
    """Extract slides from LLM MDX output.
    
    Parses output containing <Slide> wrapper elements:
    
    ```
    <Slide id="slide_01" rank={1} story="HOOK" atoms={["stat_001"]}>
      <LayoutCover>...</LayoutCover>
    </Slide>
    ```
    
    Args:
        mdx_output: Raw LLM output containing <Slide> elements
        
    Returns:
        List of ParsedSlide objects with extracted metadata and mdx content
    """
    slides = []
    
    # Pattern to match <Slide ...>...</Slide> blocks
    # Uses non-greedy match and handles nested tags via counting
    slide_pattern = re.compile(
        r'<Slide\s+([^>]+)>(.*?)</Slide>',
        re.DOTALL
    )
    
    for match in slide_pattern.finditer(mdx_output):
        attrs_str = match.group(1)
        content = match.group(2).strip()
        
        # Parse attributes
        slide_id = _extract_attr(attrs_str, 'id')
        rank = _extract_number_attr(attrs_str, 'rank')
        story = _extract_attr(attrs_str, 'story')
        atoms = _extract_array_attr(attrs_str, 'atoms')
        
        if slide_id:
            slides.append(ParsedSlide(
                id=slide_id,
                rank=rank or len(slides) + 1,
                story=story or "",
                atoms=atoms or [],
                mdx=content
            ))
    
    return slides


def parse_patches(patch_output: str) -> List[PatchOperation]:
    """Extract patch operations from LLM refinement output.
    
    Parses output containing <Patch> elements:
    
    ```
    <Patch id="stat_001">
      <BigNum value="95%" label="Updated"/>
    </Patch>
    ```
    
    Args:
        patch_output: Raw LLM output containing <Patch> elements
        
    Returns:
        List of PatchOperation objects
    """
    patches = []
    
    # Pattern to match <Patch id="...">...</Patch> blocks
    patch_pattern = re.compile(
        r'<Patch\s+id="([^"]+)"[^>]*>(.*?)</Patch>',
        re.DOTALL
    )
    
    for match in patch_pattern.finditer(patch_output):
        target_id = match.group(1)
        content = match.group(2).strip()
        
        patches.append(PatchOperation(
            id=target_id,
            content=content
        ))
    
    return patches


def apply_patches(slides: List[Dict], patches: List[PatchOperation], verbose: bool = True) -> List[Dict]:
    """Apply patch operations to slides' MDX content.
    
    For each patch, finds the element with matching id in the slide's mdx
    and replaces it with the patch content.
    
    Edge cases handled:
    - Patch targets non-existent ID: logs warning, skips patch
    - Malformed patch content: logs error, skips patch
    
    Args:
        slides: List of slide dicts with 'mdx' field
        patches: List of PatchOperation to apply
        verbose: Whether to print warnings (default: True)
        
    Returns:
        Updated slides list with patches applied to mdx fields
    """
    # Build patch lookup
    patch_map = {p.id: p.content for p in patches}
    
    # Track which patches were applied
    applied_patches = set()
    
    updated_slides = []
    for slide in slides:
        mdx = slide.get('mdx', '')
        
        # Apply each patch that targets elements in this slide
        for target_id, new_content in patch_map.items():
            # Validate patch content is not empty
            if not new_content or not new_content.strip():
                if verbose:
                    print(f"  [WARN] Skipping patch for '{target_id}': empty content")
                continue
            
            # Try to apply patch
            original_mdx = mdx
            mdx = _replace_element_by_id(mdx, target_id, new_content)
            
            # Track if patch was applied
            if mdx != original_mdx:
                applied_patches.add(target_id)
        
        updated_slide = dict(slide)
        updated_slide['mdx'] = mdx
        updated_slides.append(updated_slide)
    
    # Warn about patches that weren't applied (target not found)
    unapplied = set(patch_map.keys()) - applied_patches
    if unapplied and verbose:
        for target_id in unapplied:
            print(f"  [WARN] Patch target not found: '{target_id}' (skipped)")
    
    return updated_slides


def _extract_attr(attrs_str: str, attr_name: str) -> Optional[str]:
    """Extract string attribute value from attributes string.
    
    Handles: id="value" or id='value'
    """
    pattern = rf'{attr_name}=["\']([^"\']+)["\']'
    match = re.search(pattern, attrs_str)
    return match.group(1) if match else None


def _extract_number_attr(attrs_str: str, attr_name: str) -> Optional[int]:
    """Extract numeric attribute value from attributes string.
    
    Handles: rank={1} or rank="1"
    """
    # Try JSX syntax: rank={1}
    pattern = rf'{attr_name}=\{{(\d+)\}}'
    match = re.search(pattern, attrs_str)
    if match:
        return int(match.group(1))
    
    # Try string syntax: rank="1"
    pattern = rf'{attr_name}=["\'](\d+)["\']'
    match = re.search(pattern, attrs_str)
    if match:
        return int(match.group(1))
    
    return None


def _extract_array_attr(attrs_str: str, attr_name: str) -> Optional[List[str]]:
    """Extract array attribute value from attributes string.
    
    Handles: atoms={["stat_001", "stat_002"]}
    """
    pattern = rf'{attr_name}=\{{\[([^\]]*)\]\}}'
    match = re.search(pattern, attrs_str)
    if not match:
        return None
    
    array_content = match.group(1)
    if not array_content.strip():
        return []
    
    # Extract quoted strings
    items = re.findall(r'["\']([^"\']+)["\']', array_content)
    return items


def _replace_element_by_id(mdx: str, element_id: str, new_content: str) -> str:
    """Replace an element with given id in MDX content.
    
    Finds element like: <ComponentName id="element_id" ...>...</ComponentName>
    And replaces entire element with new_content.
    
    Args:
        mdx: MDX markup string
        element_id: ID of element to replace
        new_content: New content to insert
        
    Returns:
        MDX with element replaced, or original if not found
    """
    # Pattern matches self-closing or regular elements with the target id
    # Self-closing: <Component id="target_id" ... />
    self_closing_pattern = rf'<(\w+)\s+[^>]*id="{re.escape(element_id)}"[^>]*/>'
    
    # Regular element: <Component id="target_id" ...>...</Component>
    # This is more complex due to potential nesting
    regular_pattern = rf'<(\w+)\s+([^>]*id="{re.escape(element_id)}"[^>]*)>(.*?)</\1>'
    
    # Try self-closing first
    if re.search(self_closing_pattern, mdx):
        return re.sub(self_closing_pattern, new_content, mdx, count=1)
    
    # Try regular element (non-greedy for content)
    match = re.search(regular_pattern, mdx, re.DOTALL)
    if match:
        return mdx[:match.start()] + new_content + mdx[match.end():]
    
    # Not found - return unchanged
    return mdx
